import { earOutline, micOutline, musicalNotesOutline } from 'ionicons/icons'
import { GAME_ICONS } from './icons'

/**
 * Symbole de chaque catégorie, dans l'ordre de gameCategory (l'oreille, la voix, le solfège, le rythme, le tempo) :
 * en filigrane dans le bandeau des réglages et sur les tuiles de l'accueil. Le rythme et le tempo partagent le métronome.
 */
export const CATEGORY_ICONS = [earOutline, micOutline, musicalNotesOutline, GAME_ICONS['garde-tempo'], GAME_ICONS['garde-tempo']]
