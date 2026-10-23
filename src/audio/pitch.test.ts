import { describe, expect, it } from 'vitest'
import { centsFromPitchClass, detectPitch, midiOf } from './pitch'

const RATE = 48000

/** Une voix simplifiée : la fondamentale et quelques harmoniques, comme une voyelle chantée. */
function voice(frequency: number, harmonics = [1, 0.6, 0.4, 0.25], length = 2048): Float32Array {
  const out = new Float32Array(length)
  for (let i = 0; i < length; i++) {
    out[i] = harmonics.reduce((s, a, h) => s + 0.2 * a * Math.sin((2 * Math.PI * frequency * (h + 1) * i) / RATE), 0)
  }
  return out
}

describe('Détection de la note chantée', () => {
  it.each([82.41, 110, 196, 261.63, 440, 659.25, 987.77])('trouve %s Hz à quelques cents près', (f) => {
    const p = detectPitch(voice(f), RATE)!
    expect(Math.abs(1200 * Math.log2(p.frequency / f))).toBeLessThan(5)
    expect(p.clarity).toBeGreaterThan(0.9)
  })

  it('ne se trompe pas d’octave quand la deuxième harmonique domine', () => {
    const p = detectPitch(voice(220, [0.5, 1, 0.3]), RATE)!
    expect(Math.abs(1200 * Math.log2(p.frequency / 220))).toBeLessThan(5)
  })

  it('ne trouve rien dans le silence', () => {
    expect(detectPitch(new Float32Array(2048), RATE)).toBeNull()
  })

  it('le bruit n’est pas une note nette', () => {
    const noise = Float32Array.from({ length: 2048 }, () => Math.random() - 0.5)
    const p = detectPitch(noise, RATE)
    expect(p === null || p.clarity < 0.85).toBe(true)
  })

  it('mesure l’écart à une note, à l’octave près', () => {
    expect(midiOf(440)).toBeCloseTo(69)
    // La3 chanté, La demandé : juste, à n'importe quelle octave.
    expect(centsFromPitchClass(69, 9)).toBe(0)
    expect(centsFromPitchClass(57, 9)).toBe(0)
    // Un peu haut, un peu bas.
    expect(centsFromPitchClass(69.2, 9)).toBe(20)
    expect(centsFromPitchClass(68.7, 9)).toBe(-30)
    // Si chanté pour un Do : un demi-ton trop bas (et pas onze trop haut).
    expect(centsFromPitchClass(71, 0)).toBe(-100)
    expect(centsFromPitchClass(61, 0)).toBe(100)
  })
})
