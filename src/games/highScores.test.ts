import { describe, expect, it } from 'vitest'
import { cleanName, GAMES, insertScore, levelLabel, MAX_ENTRIES, parseBoard, playHref, qualifies, scoresHref, type ScoreEntry } from './highScores'

const entry = (points: number, name = 'Arno'): ScoreEntry => ({ name, points, correct: 10, date: '2026-10-15' })
const full = Array.from({ length: MAX_ENTRIES }, (_, i) => entry(1000 - i * 100))

describe('Meilleurs scores', () => {
  it('un score entre au classement tant qu’il reste de la place, puis s’il bat le dernier', () => {
    expect(qualifies([], 0)).toBe(false)
    expect(qualifies([], 1)).toBe(true)
    expect(qualifies(full, 100)).toBe(false)
    expect(qualifies(full, 101)).toBe(true)
  })

  it('classe par points décroissants, le plus ancien devant à égalité, 10 au plus', () => {
    const { entries, rank } = insertScore([entry(500, 'A'), entry(300, 'B')], entry(500, 'C'))
    expect(entries.map((e) => e.name)).toEqual(['A', 'C', 'B'])
    expect(rank).toBe(1)
    const top = insertScore(full, entry(2000, 'Top'))
    expect(top.rank).toBe(0)
    expect(top.entries).toHaveLength(MAX_ENTRIES)
    expect(top.entries[MAX_ENTRIES - 1].points).toBe(200)
    expect(insertScore(full, entry(50)).rank).toBe(-1)
  })

  it('nettoie le nom : 10 caractères au plus, sans espaces superflus', () => {
    expect(cleanName('  Jean   Pierre  ')).toBe('Jean Pierr')
    expect(cleanName('Zoé')).toBe('Zoé')
  })

  it('un classement par jeu, niveau et nombre de questions', () => {
    expect(GAMES['quelle-note'].levels.map((l) => l.id)).toEqual(['debutant', 'normal', 'expert'])
    expect(GAMES.harmonies.levels).toHaveLength(6)
    expect(levelLabel({ game: 'harmonies', level: 'expert-precise', questions: 20 })).toBe('Expert · Précise')
    expect(parseBoard('quelle-note', { level: 'toto', questions: '7' })).toEqual({ game: 'quelle-note', level: 'debutant', questions: 20 })
    expect(parseBoard('accords', {})).toEqual({ game: 'accords', level: 'unique', questions: 20 })
  })

  it('rejoue avec les mêmes réglages et ouvre la bonne page des scores', () => {
    expect(playHref({ game: 'harmonies', level: 'normal-simple', questions: 10 })).toBe('/games/harmonies/jouer?questions=10&level=normal&precision=simple')
    expect(playHref({ game: 'quelle-note', level: 'expert', questions: 30 })).toBe('/games/quelle-note/pret?questions=30&level=expert')
    expect(playHref({ game: 'accords', level: 'unique', questions: 20 })).toBe('/games/accords')
    expect(scoresHref({ game: 'accords', level: 'unique', questions: 20 }, 2)).toBe('/scores/accords?level=unique&questions=20&rang=2')
  })
})
