import { describe, expect, it } from 'vitest'
import { spell, spelledName, spelledPitchName, spellWithLetter, vexKeyOf } from './spelling'

describe('Orthographe des notes', () => {
  it('écrit une touche noire en dièse ou en bémol', () => {
    expect(spelledName(spell(70, 'sharp'))).toBe('La♯3')
    expect(spelledName(spell(70, 'flat'))).toBe('Si♭3')
    expect(spelledName(spell(60, 'flat'))).toBe('Do3')
    expect(vexKeyOf(spell(70, 'flat'))).toBe('bb/4')
    expect(vexKeyOf(spell(61, 'sharp'))).toBe('c#/4')
  })

  it('impose une lettre quand c’est possible', () => {
    expect(spelledPitchName(spellWithLetter(65, 2)!)).toBe('Mi♯')
    expect(spelledName(spellWithLetter(59, 0)!)).toBe('Do♭3')
    expect(vexKeyOf(spellWithLetter(59, 0)!)).toBe('cb/4')
    expect(spellWithLetter(62, 0)).toBeNull()
  })
})
