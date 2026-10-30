import { A440 } from '@/music/notes'

/**
 * Détection de la hauteur d'un son (voix chantée) : méthode de McLeod (fonction d'autocorrélation
 * normalisée), qui trouve la période fondamentale sans se tromper d'octave sur une voix riche en
 * harmoniques. Pure, pour être testée sans micro.
 */

export interface Pitch {
  /** Fréquence fondamentale, en Hz. */
  frequency: number
  /** Netteté du son, de 0 (bruit) à 1 (son pur et tenu). */
  clarity: number
}

/** Voix humaine, de la basse la plus grave à la soprano la plus aiguë. */
export const VOICE_LOW_HZ = 60
export const VOICE_HIGH_HZ = 1400
/** En dessous, c'est du silence. */
const MIN_RMS = 0.01
/** Seuil de choix du pic, relatif au plus haut (méthode de McLeod). */
const PEAK_THRESHOLD = 0.9

export function detectPitch(samples: Float32Array, sampleRate: number): Pitch | null {
  const n = samples.length
  let energy = 0
  for (let i = 0; i < n; i++) energy += samples[i] * samples[i]
  if (Math.sqrt(energy / n) < MIN_RMS) return null

  const minLag = Math.floor(sampleRate / VOICE_HIGH_HZ)
  const maxLag = Math.min(Math.ceil(sampleRate / VOICE_LOW_HZ), Math.floor(n / 2))
  // NSDF(τ) = 2 Σ x(i)x(i+τ) / Σ (x(i)² + x(i+τ)²), entre -1 et 1.
  const nsdf = new Float32Array(maxLag + 2)
  for (let tau = 0; tau <= maxLag + 1; tau++) {
    let acf = 0
    let m = 0
    for (let i = 0; i < n - tau; i++) {
      acf += samples[i] * samples[i + tau]
      m += samples[i] * samples[i] + samples[i + tau] * samples[i + tau]
    }
    nsdf[tau] = m > 0 ? (2 * acf) / m : 0
  }

  // Pics positifs entre deux passages par zéro ; on garde le premier assez proche du plus haut.
  const peaks: number[] = []
  let tau = 1
  while (tau < maxLag && nsdf[tau] > 0) tau++
  for (; tau <= maxLag; tau++) {
    if (nsdf[tau] <= 0) continue
    let best = tau
    while (tau <= maxLag && nsdf[tau] > 0) {
      if (nsdf[tau] > nsdf[best]) best = tau
      tau++
    }
    if (best >= minLag) peaks.push(best)
  }
  if (!peaks.length) return null
  const highest = Math.max(...peaks.map((p) => nsdf[p]))
  const peak = peaks.find((p) => nsdf[p] >= PEAK_THRESHOLD * highest)!

  // Interpolation parabolique autour du pic, pour une précision meilleure qu'un échantillon.
  const [a, b, c] = [nsdf[peak - 1], nsdf[peak], nsdf[peak + 1]]
  const shift = a - 2 * b + c === 0 ? 0 : (a - c) / (2 * (a - 2 * b + c))
  const period = peak + shift
  return { frequency: sampleRate / period, clarity: Math.min(1, b) }
}

/** Hauteur en demi-tons MIDI (non arrondie) d'une fréquence : 69 pour 440 Hz. */
export function midiOf(frequency: number): number {
  return A440 + 12 * Math.log2(frequency / 440)
}

/**
 * Écart, en cents, entre une hauteur chantée et une classe de note (0 = Do … 11 = Si), à l'octave près :
 * entre -600 et +600, positif si c'est trop haut.
 */
export function centsFromPitchClass(midi: number, pitchClass: number): number {
  const cents = Math.round((midi - pitchClass) * 100) % 1200
  const wrapped = ((cents % 1200) + 1200) % 1200
  return wrapped > 600 ? wrapped - 1200 : wrapped
}
