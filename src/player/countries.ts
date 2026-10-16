/**
 * Pays du joueur : codes ISO 3166-1 alpha-2, noms en français (donnés par le navigateur)
 * et drapeaux en émojis (deux lettres « indicateur régional »).
 */

// prettier-ignore
export const COUNTRY_CODES = [
  'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AW', 'AX', 'AZ',
  'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS', 'BT', 'BV', 'BW', 'BY', 'BZ',
  'CA', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN', 'CO', 'CR', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ',
  'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ', 'EC', 'EE', 'EG', 'EH', 'ER', 'ES', 'ET', 'FI', 'FJ', 'FK', 'FM', 'FO', 'FR',
  'GA', 'GB', 'GD', 'GE', 'GF', 'GG', 'GH', 'GI', 'GL', 'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY',
  'HK', 'HM', 'HN', 'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IR', 'IS', 'IT', 'JE', 'JM', 'JO', 'JP',
  'KE', 'KG', 'KH', 'KI', 'KM', 'KN', 'KP', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY',
  'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK', 'ML', 'MM', 'MN', 'MO', 'MP', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ',
  'NA', 'NC', 'NE', 'NF', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ', 'OM',
  'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL', 'PM', 'PN', 'PR', 'PS', 'PT', 'PW', 'PY', 'QA', 'RE', 'RO', 'RS', 'RU', 'RW',
  'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS', 'ST', 'SV', 'SX', 'SY', 'SZ',
  'TC', 'TD', 'TF', 'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW', 'TZ',
  'UA', 'UG', 'UM', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VG', 'VI', 'VN', 'VU', 'WF', 'WS', 'YE', 'YT', 'ZA', 'ZM', 'ZW',
] as const

export type CountryCode = (typeof COUNTRY_CODES)[number]

export interface Country {
  code: CountryCode
  name: string
  flag: string
}

export function isCountryCode(raw: unknown): raw is CountryCode {
  return typeof raw === 'string' && (COUNTRY_CODES as readonly string[]).includes(raw)
}

/** Drapeau d'un pays : chaque lettre du code devient un « indicateur régional » (🇫 + 🇷 = 🇫🇷). */
export function flag(code: string): string {
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}

let names: Intl.DisplayNames | null | undefined
function countryName(code: string): string {
  if (names === undefined) {
    try {
      names = new Intl.DisplayNames(['fr'], { type: 'region' })
    } catch {
      names = null
    }
  }
  return names?.of(code) ?? code
}

/** Tous les pays, triés par nom (en français, sans tenir compte des accents). */
export const COUNTRIES: Country[] = COUNTRY_CODES.map((code) => ({ code, name: countryName(code), flag: flag(code) })).sort(
  (a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }),
)

export function countryByCode(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code)
}

/** Pays proposé par défaut : celui de la langue de l'appareil (fr-BE → Belgique), sinon la France. */
export function defaultCountry(languages: readonly string[] = typeof navigator === 'undefined' ? [] : navigator.languages ?? []): CountryCode {
  for (const lang of languages) {
    const region = lang.split(/[-_]/)[1]?.toUpperCase()
    if (isCountryCode(region)) return region
  }
  return 'FR'
}

/** Recherche dans la liste : nom ou code, sans tenir compte des majuscules ni des accents. */
export function searchCountries(query: string): Country[] {
  const fold = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
  const q = fold(query.trim())
  if (!q) return COUNTRIES
  return COUNTRIES.filter((c) => fold(c.name).includes(q) || c.code.toLowerCase() === q)
}
