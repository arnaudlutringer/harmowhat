// Télécharge les échantillons des instruments (sauf le piano, déjà dans public/samples/piano) :
// Musyng Kite SoundFont, rendu MP3 du projet MIDI.js Soundfonts (CC BY-SA 3.0) ;
// guitare électrique : tonejs-instruments de Nicholaus Brosowsky (CC BY 3.0).
// Usage : npm run samples   (Node 18 ou plus, accès Internet)
//         node scripts/fetch-samples.mjs guitar   (seulement les instruments nommés)
import { mkdir, readdir, unlink, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const MUSYNG = 'https://raw.githubusercontent.com/gleitz/midi-js-soundfonts/gh-pages/MusyngKite'
const TONEJS = 'https://raw.githubusercontent.com/nbrosowsky/tonejs-instruments/master/samples'
const NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
const TONEJS_NAMES = ['C', 'Cs', 'D', 'Ds', 'E', 'F', 'Fs', 'G', 'Gs', 'A', 'As', 'B']

/** Tessitures (MIDI), identiques à src/audio/instruments.ts. */
export const RANGES = {
  violin: [55, 100],
  cello: [36, 81],
  clarinet: [50, 91],
  trumpet: [52, 82],
  accordion: [53, 93],
  guitar: [40, 83],
  flute: [60, 96],
  'electric-guitar': [40, 86],
}

/** Nom de l'instrument dans Musyng Kite, quand il diffère de notre identifiant. */
const SOUNDFONT_NAMES = { guitar: 'acoustic_guitar_nylon' }

/** Notes enregistrées dans tonejs-instruments (comme dans src/audio/instruments.ts). */
const TONEJS_SAMPLES = { 'electric-guitar': [40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84] }
const TONEJS_FOLDERS = { 'electric-guitar': 'guitar-electric' }

/** Une note toutes les tierces mineures, plus la plus aiguë (comme sampleMidis). */
export function sampleMidis([low, high]) {
  const midis = []
  for (let m = low; m <= high; m += 3) midis.push(m)
  if (midis[midis.length - 1] < high) midis.push(high)
  return midis
}

/** Notes téléchargées pour un instrument. */
export function samplesFor(inst) {
  return TONEJS_SAMPLES[inst] ?? sampleMidis(RANGES[inst])
}

function urlFor(inst, midi) {
  const octave = Math.floor(midi / 12) - 1
  if (TONEJS_SAMPLES[inst]) return `${TONEJS}/${TONEJS_FOLDERS[inst]}/${TONEJS_NAMES[midi % 12]}${octave}.mp3`
  return `${MUSYNG}/${SOUNDFONT_NAMES[inst] ?? inst}-mp3/${NAMES[midi % 12]}${octave}.mp3`
}

async function main() {
  const root = fileURLToPath(new URL('../public/samples/', import.meta.url))
  const only = process.argv.slice(2)
  for (const inst of Object.keys(RANGES)) {
    if (only.length && !only.includes(inst)) continue
    const dir = `${root}${inst}/`
    await mkdir(dir, { recursive: true })
    // Les anciens échantillons (autre grille de notes) sont remplacés.
    for (const f of await readdir(dir)) if (f.endsWith('.mp3')) await unlink(dir + f)
    for (const midi of samplesFor(inst)) {
      const url = urlFor(inst, midi)
      const res = await fetch(url)
      if (!res.ok) throw new Error(`${url} : ${res.status}`)
      await writeFile(`${dir}${midi}.mp3`, Buffer.from(await res.arrayBuffer()))
    }
    console.log(`${inst} : ${samplesFor(inst).length} échantillons`)
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main()
