import {
  chatbubblesOutline, contrastOutline, earOutline, eyeOutline, gitMergeOutline, keyOutline, layersOutline, micOutline,
  musicalNotesOutline, swapVerticalOutline,
} from 'ionicons/icons'
import type { GameId } from './highScores'

/** Icône au trait de chaque jeu (cartes de l'accueil, en-tête de ses réglages). */
export const GAME_ICONS: Record<GameId, string> = {
  'grave-ou-aigu': swapVerticalOutline,
  'quelle-note': earOutline,
  accords: layersOutline,
  harmonies: musicalNotesOutline,
  modalite: contrastOutline,
  'chante-note': micOutline,
  'chante-harmonie': chatbubblesOutline,
  'lecture-note': eyeOutline,
  'fais-harmonie': gitMergeOutline,
  tonalite: keyOutline,
}
