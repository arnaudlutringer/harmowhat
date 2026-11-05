import { describe, expect, it } from 'vitest'
import { closest, distance, downsample, features, voicedMs } from './wordMatch'

/** Son de synthèse à 16 kHz : une voyelle grossière (fondamentale et deux formants), sur `ms` millisecondes. */
function vowel(f1: number, f2: number, ms: number, pitch = 120): Float32Array {
  const out = new Float32Array(Math.round(16 * ms))
  for (let i = 0; i < out.length; i++) {
    const t = i / 16000
    out[i] = 0.3 * Math.sin(2 * Math.PI * pitch * t) + 0.4 * Math.sin(2 * Math.PI * f1 * t) + 0.3 * Math.sin(2 * Math.PI * f2 * t)
  }
  return out
}

describe('Reconnaissance par le son', () => {
  it('rapproche une syllabe de l’enregistrement qui lui ressemble, même dite plus vite et plus haut', () => {
    const templates = { a: [features(vowel(750, 1200, 300))], i: [features(vowel(300, 2300, 300))] }
    expect(closest(features(vowel(760, 1180, 200, 150)), templates)?.key).toBe('a')
    expect(closest(features(vowel(290, 2350, 250, 100)), templates)?.key).toBe('i')
  })

  it('mesure l’écart avec le plus proche d’un autre sens (les deux syllabes de « dièse » ne se concurrencent pas)', () => {
    const a = features(vowel(750, 1200, 300))
    const templates = { diese: [a], diese2: [features(vowel(740, 1210, 300))], mi: [features(vowel(300, 2300, 300))] }
    expect(closest(a, templates)?.margin).toBeLessThan(closest(a, templates, (k) => k.replace(/2$/, ''))?.margin ?? 0)
  })

  it('mesure une distance nulle entre deux syllabes identiques', () => {
    const f = features(vowel(500, 1500, 200))
    expect(distance(f, f)).toBe(0)
    expect(distance(f, [])).toBe(Infinity)
  })

  it('distingue une voix (son régulier) d’un souffle (bruit)', () => {
    const breath = Float32Array.from({ length: 16 * 300 }, () => (Math.random() - 0.5) * 0.5)
    expect(voicedMs(vowel(500, 1500, 300))).toBeGreaterThanOrEqual(200)
    expect(voicedMs(breath)).toBeLessThan(80)
  })

  it('rééchantillonne à 16 kHz', () => {
    expect(downsample(new Float32Array(48000), 48000).length).toBe(16000)
  })
})
