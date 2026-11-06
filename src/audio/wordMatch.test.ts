import { describe, expect, it } from 'vitest'
import { decodeWav, encodeWav } from './wav'
import { closest, distance, downsample, features, MIN_VOICED_MS, SyllableCutter, voicedMs } from './wordMatch'

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
    const frames = (v: number) => Array.from({ length: 5 }, () => new Array(12).fill(v))
    const a = frames(0)
    const templates = { diese: [a], diese2: [frames(0.1)], mi: [frames(5)] }
    expect(closest(a, templates)?.margin).toBeCloseTo(Math.sqrt(12) * 0.1 / 2)
    expect(closest(a, templates, (k) => k.replace(/2$/, ''))?.margin).toBeCloseTo(Math.sqrt(12) * 5 / 2)
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

  it('découpe un son en syllabes, après la mesure du bruit ambiant', () => {
    const silence = (ms: number) => new Float32Array(16 * ms)
    const parts = [silence(1000), vowel(500, 1500, 300), silence(400), vowel(300, 2300, 300), silence(400)]
    const heard: { start: number; end: number; voiced: number }[] = []
    const cutter = new SyllableCutter(16000, (s) => heard.push(s))
    let time = 0
    for (const part of parts) {
      for (let at = 0; at < part.length; at += 1024) {
        const block = part.subarray(at, at + 1024)
        time += block.length / 16
        cutter.push(block, time)
      }
    }
    expect(heard).toHaveLength(2)
    expect(heard[0].start).toBeGreaterThan(900)
    expect(heard[0].start).toBeLessThan(1050)
    expect(heard[1].start).toBeGreaterThan(1650)
    expect(heard[0].voiced).toBeGreaterThanOrEqual(MIN_VOICED_MS)
  })

  it('garde le son et les consignes dans le fichier du banc d’essai', () => {
    const samples = Float32Array.from([0, 0.5, -0.5, 1])
    const out = decodeWav<{ text: string }>(encodeWav(samples, 48000, { text: 'fa dièse' }))
    expect(out.rate).toBe(48000)
    expect(out.labels).toEqual({ text: 'fa dièse' })
    expect(out.samples[1]).toBeCloseTo(0.5, 3)
    expect(out.samples[3]).toBeCloseTo(1, 3)
  })

  it('rééchantillonne à 16 kHz', () => {
    expect(downsample(new Float32Array(48000), 48000).length).toBe(16000)
  })
})
