import { VOICE_TAKES, VOICE_WORDS } from './voiceWords'

/**
 * Banc d'essai de la reconnaissance par le son : une liste de choses à dire, enregistrée d'un seul tenant et envoyée
 * pour être rejouée hors du téléphone (voir tools/soundBench.ts).
 * - « voix » : les mêmes mots que « Ma voix » (ils servent d'enregistrements de référence) ;
 * - « test » : chaque note, plusieurs fois, dans un ordre mélangé ;
 * - « enchaine » : des notes dites à la suite, sans s'arrêter ;
 * - « bruit » : ce qui ne doit pas compter comme une note.
 */

export type BenchKind = 'voix' | 'test' | 'enchaine' | 'bruit'

export interface BenchPrompt {
  kind: BenchKind
  /** Ce qui est affiché. */
  text: string
  /** Temps laissé pour le dire, en ms. */
  ms: number
}

/** Une consigne du fichier envoyé : ce qu'il fallait dire, et quand (en secondes depuis le début de l'enregistrement). */
export interface BenchLabel {
  kind: BenchKind
  text: string
  start: number
  end: number
}

export interface BenchFile {
  date: string
  build: string
  rate: number
  labels: BenchLabel[]
}

const NOTES = ['do', 'ré', 'mi', 'fa', 'sol', 'la', 'si']

/** Mélange toujours dans le même ordre : d'un enregistrement à l'autre, la liste est la même. */
function shuffled<T>(list: T[]): T[] {
  const out = [...list]
  let seed = 12345
  for (let i = out.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) % 2147483648
    const j = seed % (i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export const BENCH_PROMPTS: BenchPrompt[] = [
  ...VOICE_WORDS.flatMap((p) => Array.from({ length: VOICE_TAKES }, (): BenchPrompt => ({ kind: 'voix', text: p.label, ms: 2500 }))),
  ...shuffled([...NOTES, ...NOTES, ...NOTES, ...NOTES, ...NOTES]).map((text): BenchPrompt => ({ kind: 'test', text, ms: 2200 })),
  ...['do ré mi fa', 'sol la si do', 'fa sol la si', 'mi fa sol la', 'do sol ré la', 'mi si fa do'].map((text): BenchPrompt => ({ kind: 'enchaine', text, ms: 4000 })),
  { kind: 'bruit', text: 'Tousse', ms: 3000 },
  { kind: 'bruit', text: 'Souffle fort', ms: 3000 },
  { kind: 'bruit', text: 'Dis « oula ! »', ms: 3000 },
]

/** Silence demandé au début (mesure du bruit ambiant). */
export const BENCH_LEAD_MS = 2000

export const benchDurationMs = () => BENCH_LEAD_MS + BENCH_PROMPTS.reduce((sum, p) => sum + p.ms, 0)
