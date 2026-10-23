import { describe, expect, it } from 'vitest'
import { afterSettings, readyGame } from './ready'

describe('Écran « Je suis prêt »', () => {
  it("passe par l'écran diapason seulement pour les jeux sans diapason", () => {
    expect(afterSettings('quelle-note', true, 'level=expert')).toBe('/games/quelle-note/pret?level=expert')
    expect(afterSettings('quelle-note', false, 'level=normal')).toBe('/games/quelle-note/jouer?level=normal')
    expect(afterSettings('chante-note', true, 'level=expert')).toBe('/games/chante-note/pret?level=expert')
  })

  it('ignore un jeu inconnu', () => {
    expect(readyGame('quelle-note').title).toBe('Quelle est la note ?')
    expect(readyGame('chante-note').title).toBe('Chante la note')
    expect(readyGame('harmonies').slug).toBe('quelle-note')
    expect(readyGame('toto').slug).toBe('quelle-note')
  })
})
