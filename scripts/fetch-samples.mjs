// Télécharge les échantillons des instruments (sauf le piano, déjà dans public/samples/piano) :
// Musyng Kite SoundFont, rendu MP3 du projet MIDI.js Soundfonts (CC BY-SA 3.0).
// Usage : npm run samples   (Node 18 ou plus, accès Internet)
//         node scripts/fetch-samples.mjs guitar   (seulement les instruments nommés)
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const BASE = 'https://raw.githubusercontent.com/gleitz/midi-js-soundfonts/gh-pages/MusyngKite'
const NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

/** Tessitures (MIDI), identiques à src/audio/instruments.ts. */
export const RANGES = {
  violin: [55, 100],
  cello: [36, 81],
  clarinet: [50, 91],
  trumpet: [52, 82],
  accordion: [53, 93],
  guitar: [40, 83],
}

/** Nom de l'instrument dans Musyng Kite, quand il diffère de notre identifiant. */
const SOUNDFONT_NAMES = { guitar: 'acoustic_guitar_nylon' }

/** Une note toutes les tierces mineures, plus la plus aiguë (comme sampleMidis). */
export function sampleMidis([low, high]) {
  const midis = []
  for (let m = low; m <= high; m += 3) midis.push(m)
  if (midis[midis.length - 1] < high) midis.push(high)
  return midis
}

async function main() {
  const root = fileURLToPath(new URL('../public/samples/', import.meta.url))
  const only = process.argv.slice(2)
  for (const [inst, range] of Object.entries(RANGES)) {
    if (only.length && !only.includes(inst)) continue
    await mkdir(`${root}${inst}`, { recursive: true })
    for (const midi of sampleMidis(range)) {
      const url = `${BASE}/${SOUNDFONT_NAMES[inst] ?? inst}-mp3/${NAMES[midi % 12]}${Math.floor(midi / 12) - 1}.mp3`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`${url} : ${res.status}`)
      await writeFile(`${root}${inst}/${midi}.mp3`, Buffer.from(await res.arrayBuffer()))
    }
    console.log(`${inst} : ${sampleMidis(range).length} échantillons`)
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main()
