import { describe, expect, it } from 'vitest'
import type { Features, Syllable } from '@/audio/wordMatch'
import { SoundJudge, type SoundTarget } from './soundJudge'

/** Une syllabe de synthèse : la même valeur partout, ce qui donne des distances faciles à prévoir. */
const frames = (v: number): Features => Array.from({ length: 10 }, () => new Array(12).fill(v))
const syllable = (v: number, start: number): Syllable => ({ features: frames(v), voiced: 200, start, end: start + 200 })

/** do autour de 0, ré autour de 4 (deux enregistrements chacun : la distance habituelle est faible). */
const templates = () => ({ do: [frames(0), frames(1)], re: [frames(4), frames(5)], mi: [frames(40), frames(41)] })
const DO: SoundTarget = { pc: 0, letter: 0 }
const RE: SoundTarget = { pc: 2, letter: 1 }

function setup(wanted: SoundTarget[]) {
  const answers: number[] = []
  let index = 0
  const judge = new SoundJudge(templates(), {
    target: () => wanted[index] ?? null,
    early: () => false,
    lastPc: () => (index ? wanted[index - 1].pc : -1),
    onset: () => {},
    answer(pc) {
      answers.push(pc)
      if (pc === wanted[index]?.pc) index++
    },
    heard: () => {},
    log: () => {},
    label: String,
    where: () => '',
  })
  return { judge, answers }
}

describe('Lecture continue, jugement par le son', () => {
  it('prend une note nette', () => {
    const { judge, answers } = setup([RE])
    judge.syllable(syllable(4, 0))
    expect(answers).toEqual([2])
  })

  it('compte une note nettement différente de la note à lire', () => {
    const { judge, answers } = setup([RE])
    judge.syllable(syllable(0, 0))
    expect(answers).toEqual([0])
  })

  it('tranche une hésitation en faveur de la note à lire', () => {
    const { judge, answers } = setup([RE])
    // À mi-chemin entre do (1) et ré (4), un peu plus près de do : l'écart de distances reste sous le seuil.
    judge.syllable(syllable(2.4, 0))
    expect(answers).toEqual([2])
  })

  it('ne laisse pas une syllabe ratée emporter la note suivante, même collée', () => {
    const { judge, answers } = setup([DO])
    // Loin de tout, à égale distance de ré et de mi : pas une note.
    judge.syllable({ ...syllable(22.5, 0), end: 200 })
    expect(answers).toEqual([])
    // Collée, mais nettement la note à lire : prise.
    judge.syllable(syllable(0, 250))
    expect(answers).toEqual([0])
  })

  it('ignore une autre note collée à un mot qui n’en est pas une (« ou-la »)', () => {
    const { judge, answers } = setup([DO])
    judge.syllable({ ...syllable(22.5, 0), end: 200 })
    judge.syllable(syllable(40, 250))
    expect(answers).toEqual([])
  })
})
