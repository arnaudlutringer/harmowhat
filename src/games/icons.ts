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
/** Micro, à gauche (jeux chantés) ; les notes viennent en exposant, en haut à droite. */
const MIC =
  `<rect x="110" y="64" width="140" height="230" rx="70" ${S}/>` +
  `<path d="M50 250a130 130 0 0 0 260 0" ${S}/>` +
  `<path d="M180 380v80M110 460h140" ${S}/>`

const SVGS: Record<GameId, string> = {
  // Une note, plus grave ou plus aiguë : flèche vers le bas à sa gauche, vers le haut à sa droite.
  'grave-ou-aigu':
    // Les deux flèches partent de la mi-hauteur de la note (y = 256).
    `<path d="M80 256v190M36 402l44 44 44-44" ${S}/>` +
    head(244, 360) + `<path d="M298 342V110" ${S}/>` +
    `<path d="M432 256V66M388 110l44-44 44 44" ${S}/>`,
  // Une note, et un petit point d'interrogation en exposant à sa droite.
  'quelle-note':
    head(190, 380, 66, 48) + `<path d="M252 358V96" ${S}/>` +
    `<path d="M340 92a54 54 0 1 1 80 48c-24 14-34 30-34 58" ${S}/><circle cx="386" cy="262" r="18"/>`,
  // Trois notes ensemble sur la portée : un accord.
  accords: STAFF + head(230, 376, 44, 31) + head(230, 256, 44, 31) + head(230, 136, 44, 31) + `<path d="M272 366V40" ${S}/>`,
  // Deux notes l'une après l'autre, reliées par un arc : l'intervalle.
  harmonies:
    head(130, 404) + `<path d="M182 388V210" ${S}/>` +
    head(372, 300) + `<path d="M424 284V106" ${S}/>` +
    `<path d="M120 150q100-110 210-40M296 82l34 28-40 22" ${S}/>`,
  // Trois notes qui montent, un arc entre chacune : les intervalles (tons et demi-tons) qui font le mode.
  modalite:
    head(96, 340, 58, 42) + head(256, 260, 58, 42) + head(416, 180, 58, 42) +
    `<path d="M96 410q100 70 160-80M256 330q100 70 160-80" ${S}/>`,
  // Un micro et une note.
  'chante-note': MIC + head(392, 196, 42, 30) + `<path d="M432 184V48" ${S}/>`,
  // Un micro et deux notes : un intervalle à chanter.
  'chante-harmonie': MIC + head(338, 222, 38, 27) + `<path d="M374 212V96" ${S}/>` + head(440, 166, 38, 27) + `<path d="M476 156V40" ${S}/>`,
  // Une ronde sur la portée, à lire.
  'lecture-note': STAFF + `<ellipse cx="256" cy="286" rx="74" ry="48" transform="rotate(-20 256 286)" ${S}/>`,
  // Une note écrite, une flèche, et la note à trouver (en pointillé) qui forme l'intervalle.
  'fais-harmonie':
    STAFF + head(110, 346, 46, 32) +
    `<path d="M196 330l84-74M240 252h44v44" ${S}/>` +
    `<ellipse cx="392" cy="226" rx="54" ry="38" transform="rotate(-20 392 226)" ${S} stroke-dasharray="30 22"/>`,
  // Deux croches liées, et un petit point d'interrogation en exposant : quel rythme ?
  'quel-rythme':
    head(100, 400, 54, 38) + head(280, 400, 54, 38) + `<path d="M150 384V150M330 384V150M150 150h180" ${S} stroke-width="40"/>` +
    `<path d="M376 92a48 48 0 1 1 72 42c-22 12-30 26-30 52" ${S}/><circle cx="418" cy="240" r="17"/>`,
  // Un tambour et ses deux baguettes : joue le rythme.
  'joue-rythme':
    `<ellipse cx="256" cy="270" rx="176" ry="56" ${S}/>` +
    `<path d="M80 270v120c0 31 79 56 176 56s176-25 176-56V270" ${S}/>` +
    `<path d="M80 330l88 108M432 330l-88 108M256 326v120" ${S}/>` +
    `<path d="M120 60l116 184M392 60L276 244" ${S}/><circle cx="114" cy="50" r="22"/><circle cx="398" cy="50" r="22"/>`,
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
