/**
 * Rejoue un fichier du banc d'essai (écran Test du micro › Banc d'essai) et mesure la reconnaissance par le son :
 *   npx vite-node tools/soundBench.ts chemin/du/fichier.wav
 * Les consignes « voix » servent d'enregistrements de référence, comme « Ma voix » ; les autres sont jugées avec.
 */
import { readFileSync } from 'node:fs'
import { decodeWav } from '../src/audio/wav'
import { closest, CUT_RULES, MIN_MARGIN, MIN_VOICED_MS, ranked, SyllableCutter, type Features, type Syllable, type Templates } from '../src/audio/wordMatch'
import type { BenchFile, BenchLabel } from '../src/games/soundBench'
import { SOUND_RULES, SoundJudge, type SoundTarget } from '../src/games/soundJudge'

const KEYS: Record<string, string> = { do: 'do', ré: 're', mi: 'mi', fa: 'fa', sol: 'sol', la: 'la', si: 'si', dièse: 'diese', bémol: 'bemol' }
const NOTE_KEYS = new Set(['do', 're', 'mi', 'fa', 'sol', 'la', 'si'])

/** Le joueur réagit après l'affichage : chaque consigne couvre les sons qui commencent un peu après elle, sans chevaucher la suivante. */
const REACTION_S = 0.15

// Essais de réglages : RULES='{"tieMargin":2}' CUT='{"dip":0.5}' npx vite-node tools/soundBench.ts fichier.wav
Object.assign(SOUND_RULES, JSON.parse(process.env.RULES ?? '{}'))
Object.assign(CUT_RULES, JSON.parse(process.env.CUT ?? '{}'))

const path = process.argv[2]
if (!path) throw new Error('Usage : npx vite-node tools/soundBench.ts fichier.wav')
const { samples, rate, labels: meta } = decodeWav<BenchFile>(readFileSync(path))
if (!meta) throw new Error('Pas de consignes dans ce fichier')
console.log(`${path} · ${(samples.length / rate).toFixed(0)} s à ${rate} Hz · version du ${meta.build}`)

const syllables: Syllable[] = []
const cutter = new SyllableCutter(rate, (s) => syllables.push(s))
for (let at = 0; at < samples.length; at += 1024) {
  const part = samples.subarray(at, at + 1024)
  cutter.push(part, ((at + part.length) / rate) * 1000)
}

const inLabel = (l: BenchLabel) => syllables.filter((s) => s.start / 1000 >= l.start + REACTION_S && s.start / 1000 < l.end + REACTION_S)
const words = (l: BenchLabel) => l.text.split(' ').map((w) => KEYS[w])

// Enregistrements de référence, découpés comme dans « Ma voix ». Avec --references=autre.wav, ils viennent d'un autre
// enregistrement : c'est le cas réel, « Ma voix » n'étant pas enregistré au même moment que la partie.
const templates: Templates = {}
const add = (key: string, f: Features) => (templates[key] ??= []).push(f)
const referencesArg = process.argv.find((a) => a.startsWith('--references='))?.split('=')[1]
const references = referencesArg ? decodeWav<BenchFile>(readFileSync(referencesArg)) : null
const refSyllables: Syllable[] = []
if (references) {
  const refCutter = new SyllableCutter(references.rate, (s) => refSyllables.push(s))
  for (let at = 0; at < references.samples.length; at += 1024) {
    const part = references.samples.subarray(at, at + 1024)
    refCutter.push(part, ((at + part.length) / references.rate) * 1000)
  }
}
const refLabels = references?.labels?.labels ?? meta.labels
const refInLabel = (l: BenchLabel) => (references ? refSyllables.filter((s) => s.start / 1000 >= l.start + REACTION_S && s.start / 1000 < l.end + REACTION_S) : inLabel(l))
for (const l of refLabels.filter((x) => x.kind === 'voix')) {
  const list = refInLabel(l).filter((s) => s.voiced >= MIN_VOICED_MS)
  const [note, accidental] = words(l)
  if (!list.length) console.log(`  référence sans son : ${l.text}`)
  else if (!accidental) add(note, list[0].features)
  else if (list.length >= 2) {
    if (list.length >= 3) add(note, list[0].features)
    for (const s of list.slice(1)) add(accidental, s.features)
  } else console.log(`  référence d'un seul tenant : ${l.text}`)
}
console.log(`Références : ${Object.entries(templates).map(([k, v]) => `${k} ${v.length}`).join(', ')}\n`)

const notes = Object.fromEntries(Object.entries(templates).filter(([k]) => NOTE_KEYS.has(k)))
const accidentals = Object.fromEntries(Object.entries(templates).filter(([k]) => !NOTE_KEYS.has(k)))

/** Ce que la syllabe (ou la suite de syllabes) donne : note, ou note + altération. */
function decode(list: Syllable[]): { said: string; sure: boolean } {
  if (!list.length) return { said: '(rien)', sure: false }
  const first = closest(list[0].features, notes)
  if (!first) return { said: '(rien)', sure: false }
  if (list.length === 1) return { said: first.key, sure: !first.noise && first.margin >= MIN_MARGIN }
  // Note + altération : le meilleur couple, comme dans le jeu.
  const letters = ranked(list[0].features, notes)
  const accs = ranked(list[1].features, accidentals)
  const pairs = letters.flatMap((l) => accs.map((a) => ({ said: `${l.key} ${a.key}`, cost: l.distance + a.distance }))).sort((a, b) => a.cost - b.cost)
  return { said: pairs[0]?.said ?? first.key, sure: true }
}

const expected = (l: BenchLabel) => words(l).join(' ')
const score = { total: 0, ok: 0, altered: 0, alteredOk: 0, letterOk: 0 }
const confusions = new Map<string, number>()

for (const l of meta.labels.filter((x) => x.kind === 'test')) {
  const list = inLabel(l).filter((s) => s.voiced >= MIN_VOICED_MS)
  const { said, sure } = decode(list)
  const want = expected(l)
  const ok = said === want
  const isAltered = want.includes(' ')
  score.total++
  if (ok) score.ok++
  if (isAltered) score.altered++
  if (isAltered && ok) score.alteredOk++
  if (said.split(' ')[0] === want.split(' ')[0]) score.letterOk++
  if (!ok) confusions.set(`${want} → ${said}`, (confusions.get(`${want} → ${said}`) ?? 0) + 1)
  console.log(`${ok ? '✓' : '✗'} ${want.padEnd(12)} ${said.padEnd(12)} ${sure ? '' : 'pas sûr '}· ${list.length} syllabe(s) : ${list.map((s) => Math.round(s.end - s.start)).join(', ')} ms`)
}

const pct = (a: number, b: number) => `${b ? Math.round((a / b) * 100) : 0} % (${a}/${b})`
const natural = score.total - score.altered
console.log(`\nJuste : ${pct(score.ok, score.total)}`)
console.log(`Notes seules : ${pct(score.ok - score.alteredOk, natural)}`)
console.log(`Notes altérées : ${pct(score.alteredOk, score.altered)}`)
console.log(`Bon nom de note, altération mise à part : ${pct(score.letterOk, score.total)}`)
if (confusions.size) console.log(`Confusions : ${[...confusions].map(([k, n]) => `${k} (${n})`).join(', ')}`)

console.log('\nEnchaînements :')
for (const l of meta.labels.filter((x) => x.kind === 'enchaine')) {
  const list = inLabel(l).filter((s) => s.voiced >= MIN_VOICED_MS)
  console.log(`  ${l.text.padEnd(18)} ${list.length} syllabe(s) : ${list.map((s) => closest(s.features, notes)?.key ?? '?').join(' ')}`)
}

console.log('\nCe qui ne doit pas compter :')
for (const l of meta.labels.filter((x) => x.kind === 'bruit')) {
  const all = inLabel(l)
  const taken = all.filter((s) => {
    if (s.voiced < MIN_VOICED_MS) return false
    const best = closest(s.features, notes)
    return best && !best.noise && best.margin >= MIN_MARGIN
  })
  console.log(`  ${l.text.padEnd(18)} ${all.length} son(s), ${taken.length} pris pour une note : ${taken.map((s) => closest(s.features, notes)?.key).join(' ')}`)
}

// ——— Le jeu rejoué : les mêmes règles que « Lecture continue », consigne par consigne ———

const PCS: Record<string, number> = { do: 0, re: 2, mi: 4, fa: 5, sol: 7, la: 9, si: 11 }
const LETTERS = ['do', 're', 'mi', 'fa', 'sol', 'la', 'si']

/** Les notes à lire d'une consigne (« fa dièse sol » → Fa♯, Sol). */
function targets(text: string): SoundTarget[] {
  const out: SoundTarget[] = []
  for (const key of text.split(' ').map((w) => KEYS[w])) {
    if (key in PCS) out.push({ pc: PCS[key], letter: LETTERS.indexOf(key), alter: 0 })
    else if (out.length) {
      const last = out[out.length - 1]
      last.alter = key === 'diese' ? 1 : -1
      last.pc = (last.pc + last.alter + 12) % 12
    }
  }
  return out
}

/** Rejoue une consigne ; renvoie les notes lues dans l'ordre, et la réponse fausse s'il y en a une. */
function play(label: BenchLabel, wanted: SoundTarget[], trace = false) {
  let at = 0
  let index = 0
  let lastPc = -1
  let wrong: number | null = null
  const timers: { due: number; run: () => void; off: boolean }[] = []
  const judge = new SoundJudge(structuredClone(templates), true, {
    target: () => (wrong === null ? (wanted[index] ?? null) : null),
    early: () => false,
    lastPc: () => lastPc,
    onset: () => {},
    answer(pc) {
      if (pc === lastPc) return
      lastPc = pc
      if (pc === wanted[index]?.pc) index++
      else if (wrong === null) wrong = pc
    },
    heard: () => {},
    log: (line) => trace && console.log(`      ${line}`),
    timer(run, ms) {
      const t = { due: at + ms, run, off: false }
      timers.push(t)
      return () => (t.off = true)
    },
    label: (pc) => String(pc),
    where: () => `à lire : ${wanted[index]?.pc ?? '—'}`,
  })
  const fire = (until: number) => {
    for (const t of timers) {
      if (t.off || t.due > until) continue
      t.off = true
      at = t.due
      t.run()
    }
  }
  for (const s of inLabel(label)) {
    fire(s.end)
    at = s.end
    if (wrong === null) judge.syllable(s)
  }
  fire(Infinity)
  return { read: index, wrong }
}

const trace = process.argv.includes('--detail')
let right = 0
let wrongs = 0
let silent = 0
const misses: string[] = []
const test = meta.labels.filter((x) => x.kind === 'test')
for (const l of test) {
  const wanted = targets(l.text)
  const { read, wrong } = play(l, wanted)
  if (read === wanted.length) right++
  else if (wrong !== null) {
    wrongs++
    misses.push(`${l.text} → faux (${wrong})`)
  } else {
    silent++
    misses.push(`${l.text} → rien`)
  }
  if (trace && read !== wanted.length) {
    console.log(`  ${l.text}`)
    play(l, wanted, true)
  }
}
console.log(`\nRègles du jeu, notes isolées : juste ${pct(right, test.length)}, faux ${pct(wrongs, test.length)}, rien ${pct(silent, test.length)}`)
if (misses.length) console.log(`  ${misses.join(' ; ')}`)

let chainRead = 0
let chainTotal = 0
for (const l of meta.labels.filter((x) => x.kind === 'enchaine')) {
  const wanted = targets(l.text)
  const { read, wrong } = play(l, wanted, trace)
  chainRead += read
  chainTotal += wanted.length
  console.log(`  ${l.text.padEnd(18)} ${read}/${wanted.length} lues${wrong !== null ? `, puis faux (${wrong})` : ''}`)
}
console.log(`Règles du jeu, notes enchaînées : ${pct(chainRead, chainTotal)}`)

let alarms = 0
const noises = meta.labels.filter((x) => x.kind === 'bruit')
for (const l of noises) {
  // Pour chaque note possible à lire : le bruit compte-t-il comme une réponse ?
  for (const letter of LETTERS) {
    const { read, wrong } = play(l, targets(letter))
    if (read || wrong !== null) alarms++
  }
}
console.log(`Bruits pris pour une réponse : ${pct(alarms, noises.length * LETTERS.length)}`)

// Erreurs de lecture : le joueur dit une note juste pour une autre note à lire. Le jeu doit le compter faux, ou au moins ne pas le valider.
let caught = 0
let accepted = 0
let ignored = 0
const naturals = test.filter((l) => !l.text.includes(' '))
for (const l of naturals) {
  const said = targets(l.text)[0]
  for (const shift of [1, 2, 3]) {
    const letter = (said.letter + shift) % 7
    const other = { pc: PCS[LETTERS[letter]], letter, alter: 0 }
    const { read, wrong } = play(l, [other])
    if (read) accepted++
    else if (wrong !== null) caught++
    else ignored++
  }
}
const asked = naturals.length * 3
console.log(`Fausses notes dites exprès : comptées fausses ${pct(caught, asked)}, ignorées ${pct(ignored, asked)}, validées à tort ${pct(accepted, asked)}`)

// Mauvaise altération : « fa dièse » dit pour Fa♭. Le jeu ne doit pas le valider.
let altCaught = 0
let altAccepted = 0
let altIgnored = 0
const altereds = test.filter((l) => l.text.includes(' '))
for (const l of altereds) {
  const said = targets(l.text)[0]
  const other = { pc: (said.pc - 2 * said.alter + 12) % 12, letter: said.letter, alter: -said.alter }
  const { read, wrong } = play(l, [other])
  if (read) altAccepted++
  else if (wrong !== null) altCaught++
  else altIgnored++
}
console.log(`Mauvaise altération dite exprès : comptée fausse ${pct(altCaught, altereds.length)}, ignorée ${pct(altIgnored, altereds.length)}, validée à tort ${pct(altAccepted, altereds.length)}`)
