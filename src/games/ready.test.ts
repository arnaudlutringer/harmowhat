import { describe, expect, it } from 'vitest'
import { afterSettings, readyGame } from './ready'

describe('Écran « Je suis prêt »', () => {
  it("passe par l'écran diapason seulement pour les jeux sans diapason", () => {
    expect(afterSettings('quelle-note', true, 'level=expert')).toBe('/games/quelle-note/pret?level=expert')
    expect(afterSettings('quelle-note', false, 'level=normal')).toBe('/games/quelle-note/jouer?level=normal')
    expect(afterSettings('harmonies', true, 'q=1')).toBe('/games/harmonies/pret?q=1')
  })

  it('ignore un jeu inconnu', () => {
    expect(readyGame('harmonies').title).toBe('Les harmonies')
    expect(readyGame('toto').slug).toBe('quelle-note')
  })
})
