import type { GameId } from './highScores'

/**
 * Icônes des jeux (cartes de l'accueil, en-tête de leurs réglages), dessinées pour l'appli : des motifs
 * musicaux au trait, d'une seule couleur (celle du texte). SVG en 512 × 512, avec les classes d'Ionicons
 * pour avoir la même épaisseur de trait que ses icônes.
 */

/** Trait épais (32 px) sans remplissage, bouts arrondis. */
const S = 'class="ionicon-fill-none ionicon-stroke-width" stroke-linecap="round" stroke-linejoin="round"'
/** Lignes de portée, plus fines. */
const STAFF = [136, 196, 256, 316, 376].map((y) => `<line x1="32" y1="${y}" x2="480" y2="${y}" class="ionicon-fill-none" stroke-width="12"/>`).join('')
/** Tête de note pleine, penchée comme sur une partition. */
const head = (cx: number, cy: number, rx = 56, ry = 40) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(-20 ${cx} ${cy})"/>`
/** Micro, en petit à gauche (jeux chantés). */
const MIC =
  `<rect x="70" y="56" width="110" height="190" rx="55" ${S}/>` +
  `<path d="M30 220a95 95 0 0 0 190 0" ${S}/>` +
  `<path d="M125 315v125M70 440h110" ${S}/>`

const SVGS: Record<GameId, string> = {
  // Une note, plus grave ou plus aiguë : flèches vers le haut et vers le bas.
  'grave-ou-aigu':
    head(190, 340) + `<path d="M244 322V90" ${S}/>` +
    `<path d="M400 230V60M350 110l50-50 50 50" ${S}/>` +
    `<path d="M400 282v170M350 402l50 50 50-50" ${S}/>`,
  // Une note et un point d'interrogation.
  'quelle-note':
    head(130, 390) + `<path d="M184 372V90c0 44 50 54 50 104" ${S}/>` +
    `<path d="M326 190a76 76 0 1 1 112 66c-32 20-46 42-46 80" ${S}/><circle cx="392" cy="432" r="22"/>`,
  // Trois notes ensemble sur la portée : un accord.
  accords: STAFF + head(230, 376, 44, 31) + head(230, 256, 44, 31) + head(230, 136, 44, 31) + `<path d="M272 366V40" ${S}/>`,
  // Deux notes l'une après l'autre, reliées par un arc : l'intervalle.
  harmonies:
    head(130, 404) + `<path d="M182 388V210" ${S}/>` +
    head(372, 300) + `<path d="M424 284V106" ${S}/>` +
    `<path d="M120 150q100-110 210-40M296 82l34 28-40 22" ${S}/>`,
  // Une gamme qui monte, marche après marche.
  modalite:
    `<path d="M40 456h96v-80h96v-80h96v-80h96v-80h48" ${S}/>` +
    head(88, 404, 34, 26) + head(184, 324, 34, 26) + head(280, 244, 34, 26) + head(376, 164, 34, 26),
  // Un micro et une note.
  'chante-note': MIC + head(350, 380) + `<path d="M404 362V110c0 56 60 66 60 130" ${S}/>`,
  // Un micro et deux notes : un intervalle à chanter.
  'chante-harmonie': MIC + head(300, 412, 48, 34) + `<path d="M346 398V250" ${S}/>` + head(420, 300, 48, 34) + `<path d="M466 286V120" ${S}/>`,
  // Une ronde sur la portée, à lire.
  'lecture-note': STAFF + `<ellipse cx="256" cy="286" rx="74" ry="48" transform="rotate(-20 256 286)" ${S}/>`,
  // Une note écrite, une flèche, et la note à trouver (en pointillé) qui forme l'intervalle.
  'fais-harmonie':
    STAFF + head(110, 346, 46, 32) +
    `<path d="M196 330l84-74M240 252h44v44" ${S}/>` +
    `<ellipse cx="392" cy="226" rx="54" ry="38" transform="rotate(-20 392 226)" ${S} stroke-dasharray="30 22"/>`,
  // Une armure : deux dièses sur la portée.
  tonalite:
    STAFF +
    `<path d="M160 120v210M204 106v210M128 220l108-30M128 280l108-30" ${S} stroke-width="26"/>` +
    `<path d="M318 180v210M362 166v210M286 280l108-30M286 340l108-30" ${S} stroke-width="26"/>`,
}

// Comme les icônes d'Ionicons : le SVG tel quel après la virgule (ion-icon ne le décode pas).
const dataUrl = (content: string) =>
  `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' class='ionicon' viewBox='0 0 512 512'>${content.replaceAll('"', "'")}</svg>`

export const GAME_ICONS = Object.fromEntries(Object.entries(SVGS).map(([id, svg]) => [id, dataUrl(svg)])) as Record<GameId, string>
