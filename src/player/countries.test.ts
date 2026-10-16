import { describe, expect, it } from 'vitest'
import { COUNTRIES, COUNTRY_CODES, countryByCode, defaultCountry, flag, searchCountries } from './countries'

describe('Pays', () => {
  it('donne le drapeau et le nom français de chaque pays', () => {
    expect(flag('FR')).toBe('🇫🇷')
    expect(countryByCode('FR')?.name).toBe('France')
    expect(countryByCode('DE')?.name).toBe('Allemagne')
    expect(COUNTRIES).toHaveLength(COUNTRY_CODES.length)
    expect(new Set(COUNTRY_CODES).size).toBe(COUNTRY_CODES.length)
  })

  it('trie les pays par nom, sans tenir compte des accents', () => {
    const names = COUNTRIES.map((c) => c.name)
    expect(names.indexOf('Égypte')).toBeGreaterThan(names.indexOf('Danemark'))
    expect(names.indexOf('Égypte')).toBeLessThan(names.indexOf('France'))
  })

  it('cherche par nom (sans accents ni majuscules) ou par code', () => {
    // Les États-Unis d'abord, puis les îles qui portent leur nom.
    expect(searchCountries('etats-unis')[0].code).toBe('US')
    expect(searchCountries('allemagne').map((c) => c.code)).toEqual(['DE'])
    expect(searchCountries('be').map((c) => c.code)).toContain('BE')
    expect(searchCountries('  ')).toHaveLength(COUNTRIES.length)
  })

  it('propose le pays de la langue de l’appareil, sinon la France', () => {
    expect(defaultCountry(['fr-BE', 'fr'])).toBe('BE')
    expect(defaultCountry(['fr', 'en-CA'])).toBe('CA')
    expect(defaultCountry(['fr'])).toBe('FR')
    expect(defaultCountry(['xx-ZZ'])).toBe('FR')
  })
})
