import type { GameId } from './highScores'

/**
 * Présentation de chaque jeu, en tête de son écran de réglages : comment il fonctionne.
 * Le barème des points, commun à tous les jeux, est ajouté par GameIntro.
 */
export const INTROS: Record<GameId, string[]> = {
  'grave-ou-aigu': [
    'Une note est jouée : dis si elle est plus grave ou plus aiguë que le La3 du diapason (440 Hz).',
    'Le bouton diapason, en haut de l’écran, te fait réentendre le La3 pour comparer.',
  ],
  'quelle-note': [
    'Une note est jouée au hasard : retrouve son nom parmi les propositions (Do, Ré, Mi…).',
    'Le diapason t’aide à te repérer pendant les questions, sauf en expert : tu ne l’entends alors qu’avant la partie.',
  ],
  accords: [
    'Trois notes sont jouées ensemble, entre La2 et La4 : retrouve-les toutes les trois parmi les propositions, puis valide.',
    'En débutant, ce sont des accords parfaits majeurs ou mineurs ; ensuite, trois notes au hasard.',
  ],
  harmonies: [
    'Deux notes sont jouées l’une après l’autre : trouve l’intervalle qui les sépare (seconde, tierce, quarte, quinte…).',
    'En précision « Précise », il faut aussi sa qualité (tierce mineure, quarte augmentée…) ; en expert, son sens, ascendant ou descendant. Après ta réponse, la portée montre les deux notes.',
  ],
  modalite: [
    'Une gamme est jouée dans l’un des sept modes (ionien, dorien, phrygien, lydien, mixolydien, éolien, locrien) : reconnais lequel.',
    'Selon le niveau, la gamme est écrite sur la portée avec ses tons et demi-tons, sans eux, ou pas du tout : il faut alors tout faire à l’oreille.',
  ],
  'chante-note': [
    'Une note est demandée (« Chante un Mi ! ») : appuie sur le micro et chante-la, en la tenant un peu.',
    'L’accordeur montre l’écart avec la note demandée, à l’octave près : chacun chante dans sa voix. Le score est en pause pendant que tu chantes.',
  ],
  'chante-harmonie': [
    'Une note est jouée, avec un intervalle (« Chante la quinte juste ascendante ! ») : appuie sur le micro et chante la note qui forme cet intervalle.',
    'Après ta réponse, la portée montre la note jouée, la bonne note en vert et, en cas d’erreur, la tienne en rouge. Le score est en pause pendant que tu chantes.',
  ],
  'lecture-note': [
    'Une note est écrite sur une portée, en clé de sol, de fa ou d’ut : donne son nom parmi les 12 notes de la gamme.',
    'Pas de son ici : c’est un jeu de lecture.',
  ],
  'fais-harmonie': [
    'Une note est écrite sur une portée, avec un intervalle (« la quinte juste ascendante du Do ») : trouve la note qui forme cet intervalle.',
    'Pas de son ici : il faut connaître ses intervalles.',
  ],
  tonalite: [
    'Une portée montre une armure, c’est-à-dire des dièses, des bémols ou rien : trouve la tonalité, majeure ou mineure selon la question.',
    'Pas de son ici : tout se lit sur l’armure.',
  ],
}
