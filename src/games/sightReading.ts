import { randomInt } from '@/music/notes'
import { spelledName, spelledPitchName, type SpelledNote } from '@/music/spelling'
import { CLEFS, noteAt, randomAlter, stepRange, type ClefId } from './readNote'

/**
 * Lecture en défilement : les notes passent sur une portée, de droite à gauche, au rythme du tempo
 * (une note par temps). Le joueur lit chaque note avant qu'elle ne franchisse la barre de lecture :
 * - « Lis et chante » : il la chante (à n'importe quelle octave) ;
 * - « Lecture continue » : il dit son nom au micro (« do », « fa dièse », « si bémol »…).
 * Chaque bonne réponse accélère le tempo ; la partie s'arrête à la première erreur ou à la première note oubliée.
 */

export type Level = 'debutant' | 'normal' | 'expert'

export interface SightLevel {
  label: string
  description: string
  clefs: ClefId[]
  /** Lignes supplémentaires au plus, au-dessus ou au-dessous de la portée. */
  ledgerLines: number
  /** Notes altérées (dièses et bémols). */
  accidentals: boolean
  /** Tempo de départ, à la noire (une note par temps). */
  start: number
  /** Accélération à chaque bonne réponse, en battements par minute. */
  step: number
}

export const SIGHT_LEVELS: Record<Level, SightLevel> = {
  debutant: {
    label: 'Débutant',
    description: 'Clé de sol, sans dièse ni bémol. On part à 30 à la noire, +2 à chaque note lue.',
    clefs: ['sol'],
    ledgerLines: 1,
    accidentals: false,
    start: 30,
    step: 2,
  },
  normal: {
    label: 'Normal',
    description: 'Clés de sol et de fa, avec des dièses et des bémols. On part à 36, +2 à chaque note lue.',
    clefs: ['sol', 'fa'],
    ledgerLines: 2,
    accidentals: true,
    start: 36,
    step: 2,
  },
  expert: {
    label: 'Expert',
    description: 'Toutes les clés (sol, fa, ut 1re, 3e et 4e ligne), avec altérations. On part à 44, +3 à chaque note lue.',
    clefs: ['sol', 'fa', 'ut1', 'ut3', 'ut4'],
    ledgerLines: 2,
    accidentals: true,
    start: 44,
    step: 3,
  },
}

/** Pas de nombre de questions : la partie dure tant que le joueur lit juste. */
export const SIGHT_QUESTION_COUNTS = [1] as const
/** Tempo le plus rapide. */
export const MAX_TEMPO = 200

export interface SightSettings {
  questions: number
  level: Level
}

export const DEFAULT_SIGHT_SETTINGS: SightSettings = { questions: 1, level: 'debutant' }

/** Lit des réglages depuis une source non fiable (URL, stockage), avec repli sur les valeurs par défaut. */
export function parseSightSettings(raw: { questions?: unknown; level?: unknown }): SightSettings {
  const level = String(raw.level) as Level
  return { questions: 1, level: level in SIGHT_LEVELS ? level : DEFAULT_SIGHT_SETTINGS.level }
}

/** Tempo après `read` notes lues. */
export const tempoAfter = (level: Level, read: number) => Math.min(MAX_TEMPO, SIGHT_LEVELS[level].start + read * SIGHT_LEVELS[level].step)

/** Points d'une note lue : dix fois le tempo auquel elle passait (300 à 30 à la noire, 1 000 à 100). */
export const notePoints = (tempo: number) => Math.round(tempo * 10)

/** Médaille du niveau : 10 000 points en une partie ; GOAT : 30 000. */
export const SIGHT_MEDAL_POINTS = 10000
export const SIGHT_GOAT_POINTS = 30000

export interface SightNote {
  clef: ClefId
  note: SpelledNote
  /** Classe de la note : 0 = Do ... 11 = Si. */
  pc: number
  /** Nom complet, ex. « Si♭3 ». */
  fullName: string
}

/** Nombre de notes écrites avec la même clé avant qu'elle puisse changer. */
const CLEF_RUN = [6, 10] as const

/**
 * Suite de notes de la partie, tirée au fur et à mesure : la clé change de temps en temps (pas à chaque note),
 * et deux notes de suite n'ont jamais le même nom (une note chantée tenue ne compte qu'une fois).
 */
export class NoteStream {
  private clef: ClefId
  private left = 0
  private lastPc = -1

  constructor(private level: Level) {
    this.clef = SIGHT_LEVELS[level].clefs[0]
  }

  next(): SightNote {
    const cfg = SIGHT_LEVELS[this.level]
    if (this.left <= 0) {
      this.clef = cfg.clefs[randomInt(0, cfg.clefs.length - 1)]
      this.left = randomInt(CLEF_RUN[0], CLEF_RUN[1])
    }
    this.left--
    const { low, high } = stepRange(this.clef, cfg.ledgerLines)
    for (;;) {
      const step = randomInt(low, high)
      const letter = ((step % 7) + 7) % 7
      const note = noteAt(step, cfg.accidentals ? randomAlter(letter) : 0)
      const pc = ((note.midi % 12) + 12) % 12
      if (pc === this.lastPc) continue
      this.lastPc = pc
      return { clef: this.clef, note, pc, fullName: spelledName(note) }
    }
  }
}

export const clefLabel = (clef: ClefId) => CLEFS[clef].label
export const noteName = (n: SightNote) => spelledPitchName(n.note)

// ——— Reconnaissance des noms de notes dans ce que le joueur a dit ———

/** Ce que la reconnaissance vocale écrit pour chaque nom de note (sans accents, en minuscules), homophones compris. */
const SPOKEN_LETTERS: [number, string[]][] = [
  [0, ['do', 'dos', 'doh', 'dot', 'deau', 'domino']],
  [2, ['re', 'rai', 'raie', 'rais', 'ray', 'rez', 'ret', 'rey']],
  [4, ['mi', 'mie', 'mis', 'mit', 'mii', 'my', 'me']],
  [5, ['fa', 'fas', 'far', 'fat', 'fah']],
  [7, ['sol', 'sole', 'sols', 'saule', 'sel', 'seul', 'soul', 'sold', 'sal']],
  [9, ['la', 'las', 'lat', 'lah']],
  [11, ['si', 'scie', 'six', 'ci', 'sis', 'sy', 'see', '6']],
]
const LETTER_OF = new Map<string, number>(SPOKEN_LETTERS.flatMap(([pc, words]) => words.map((w) => [w, pc] as [string, number])))
const SHARP = new Set(['diese', 'dieses', 'dieze', 'diez', 'yes', 'dies', '#'])
const FLAT = new Set(['bemol', 'bemols', 'bemolle', 'b'])

/** Une note dite : sa classe (0 = Do), et si une altération la suit (jugement possible tout de suite). */
export interface SpokenNote {
  pc: number
  /** Une altération a été dite après la lettre. */
  altered: boolean
}

/** Retire les accents et la ponctuation, sépare en mots (« Ré bémol, mi ! » → ['re', 'bemol', 'mi']). */
function words(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9#]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
}

/** Les noms de notes reconnus dans une phrase, dans l'ordre (« do dièse ré » → Do♯, Ré). */
export function parseSpokenNotes(text: string): SpokenNote[] {
  const out: SpokenNote[] = []
  for (const w of words(text)) {
    const pc = LETTER_OF.get(w)
    if (pc !== undefined) {
      out.push({ pc, altered: false })
      continue
    }
    const last = out[out.length - 1]
    if (!last || last.altered) continue
    if (SHARP.has(w)) out[out.length - 1] = { pc: (last.pc + 1) % 12, altered: true }
    else if (FLAT.has(w)) out[out.length - 1] = { pc: (last.pc + 11) % 12, altered: true }
  }
  return out
}

// ——— Notes chantées ———

/** Mesures du micro d'affilée (une toutes les 50 ms) sur le même demi-ton pour retenir une note chantée. */
export const SUNG_READINGS = 5
/** Écart toléré avec le demi-ton le plus proche, en cents (au-delà, la note chantée est entre deux). */
export const SUNG_TOLERANCE_CENTS = 50

/**
 * Note chantée : retenue quand plusieurs mesures d'affilée tombent sur le même demi-ton ; ensuite, il faut
 * changer de note ou se taire avant qu'une nouvelle soit retenue (une note tenue ne compte qu'une fois).
 */
export class SungNotes {
  private run: number[] = []
  private held: number | null = null

  /** Une mesure du micro (en demi-tons MIDI, null si rien de net) ; renvoie la note retenue, s'il y en a une. */
  push(midi: number | null): number | null {
    if (midi === null) {
      this.run = []
      this.held = null
      return null
    }
    const nearest = Math.round(midi)
    if (this.held !== null && nearest === this.held) return null
    this.held = null
    if (this.run.length && Math.round(this.run[0]) !== nearest) this.run = []
    this.run.push(midi)
    if (this.run.length < SUNG_READINGS) return null
    this.run = []
    this.held = nearest
    return nearest
  }

  /** Avancement vers une note retenue, de 0 à 1 (pour l'affichage). */
  get progress(): number {
    return this.run.length / SUNG_READINGS
  }

  reset(): void {
    this.run = []
    this.held = null
  }
}
