/**
 * Rejoue un fichier du banc d'essai (écran Test du micro › Banc d'essai) et mesure la reconnaissance par le son :
 *   npx vite-node tools/soundBench.ts chemin/du/fichier.wav
 * Les consignes « voix » servent d'enregistrements de référence, comme « Ma voix » ; les autres sont jugées avec.
 */
import { readFileSync } from 'node:fs'
import { decodeWav } from '../src/audio/wav'
import { closest, MIN_MARGIN, MIN_VOICED_MS, ranked, SyllableCutter, type Features, type Syllable, type Templates } from '../src/audio/wordMatch'
import type { BenchFile, BenchLabel } from '../src/games/soundBench'

const KEYS: Record<string, string> = { do: 'do', ré: 're', mi: 'mi', fa: 'fa', sol: 'sol', la: 'la', si: 'si', dièse: 'diese', bémol: 'bemol' }
const NOTE_KEYS = new Set(['do', 're', 'mi', 'fa', 'sol', 'la', 'si'])

/** Le joueur réagit après l'affichage : chaque consigne couvre les sons qui commencent un peu après elle, sans chevaucher la suivante. */
const REACTION_S = 0.15

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

// Enregistrements de référence, découpés comme dans « Ma voix ».
const templates: Templates = {}
const add = (key: string, f: Features) => (templates[key] ??= []).push(f)
for (const l of meta.labels.filter((x) => x.kind === 'voix')) {
  const list = inLabel(l).filter((s) => s.voiced >= MIN_VOICED_MS)
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
