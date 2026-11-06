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
  const learned: string[] = []
  const notUnderstood = { count: 0 }
  const late = { beats: -2 }
  let index = 0
  const judge = new SoundJudge(templates(), {
    target: () => wanted[index] ?? null,
    early: () => false,
    lateness: () => late.beats,
    lastPc: () => (index ? wanted[index - 1].pc : -1),
    onset: () => {},
    answer(pc, syllables) {
      answers.push(pc)
      learned.push(...syllables.map((s) => s.key))
      if (pc === wanted[index]?.pc) index++
    },
    heard: () => {},
    notUnderstood: () => notUnderstood.count++,
    log: () => {},
    label: String,
    where: () => '',
  })
  return { judge, answers, learned, notUnderstood, late }
}

describe('Lecture continue, jugement par le son', () => {
  it('prend une note nette, et l’apprend', () => {
    const { judge, answers, learned } = setup([RE])
    judge.syllable(syllable(4, 0))
    expect(answers).toEqual([2])
    expect(learned).toEqual(['re'])
  })

  it('compte une note nettement différente de la note à lire', () => {
    const { judge, answers } = setup([RE])
    judge.syllable(syllable(40, 0))
    expect(answers).toEqual([4])
  })

  it('ignore une autre note, si elle n’est pas assez nettement plus proche que la note à lire', () => {
    const { judge, answers, notUnderstood } = setup([RE])
    judge.syllable(syllable(1.5, 0))
    expect(answers).toEqual([])
    // Le joueur est invité à redire la note.
    expect(notUnderstood.count).toBe(1)
  })

  it('tranche une hésitation en faveur de la note à lire', () => {
    const { judge, answers, learned } = setup([RE])
    // À mi-chemin entre do (1) et ré (4), un peu plus près de do : l'écart de distances reste sous le seuil.
    judge.syllable(syllable(2.4, 0))
    expect(answers).toEqual([2])
    // Une hésitation tranchée n'est pas apprise.
    expect(learned).toEqual([])
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

  it('retient la note à lire quand elle est la plus proche, même presque à égalité', () => {
    const { judge, answers, learned } = setup([DO])
    // Un peu plus près de do que de ré : l'écart est faible, mais c'est la note à lire.
    judge.syllable(syllable(2.4, 0))
    expect(answers).toEqual([0])
    expect(learned).toEqual([])
  })

  it('ne prend pas la fin d’un mot pour la note suivante', () => {
    const { judge, answers, notUnderstood } = setup([DO, RE])
    judge.syllable(syllable(0, 0))
    expect(answers).toEqual([0])
    // Collé à « do », à mi-chemin entre do et ré : ni réponse, ni demande de redire.
    judge.syllable(syllable(2.4, 200))
    expect(answers).toEqual([0])
    expect(notUnderstood.count).toBe(0)
    // Un vrai « ré », même enchaîné, compte.
    judge.syllable(syllable(4, 400))
    expect(answers).toEqual([0, 2])
  })

  it('accepte une note enchaînée, même hésitante, quand elle approche de la barre', () => {
    const { judge, answers, late } = setup([DO, RE])
    late.beats = -0.5
    judge.syllable(syllable(0, 0))
    judge.syllable(syllable(2.4, 200))
    expect(answers).toEqual([0, 2])
  })

  it('ignore une autre note collée à un mot qui n’en est pas une (« ou-la »)', () => {
    const { judge, answers } = setup([DO])
    judge.syllable({ ...syllable(22.5, 0), end: 200 })
    judge.syllable(syllable(40, 250))
    expect(answers).toEqual([])
  })
})
