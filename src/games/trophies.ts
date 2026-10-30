import { ref } from 'vue'
import type { InstrumentId } from '@/audio/instruments'
import { endingsFor } from '@/music/endings'
import type { QuestionResult } from './scoring'
import type { Board, GameId } from './highScores'

/**
 * Trophées : gagnés en fin de questionnaire (voir evaluateGame) ou au fil de certains gestes (voir trophyEvent),
 * mémorisés sur l'appareil avec les compteurs dont ils ont besoin. Les nouveaux sont annoncés en fin de partie.
 */

export type TrophyFamily = 'decouverte' | 'sans-faute' | 'rapidite' | 'goat' | 'perseverance' | 'voix' | 'oreille' | 'clins'

export const FAMILIES: Record<TrophyFamily, string> = {
  decouverte: 'Découverte',
  'sans-faute': 'Sans faute',
  rapidite: 'Rapidité',
  goat: 'GOAT',
  perseverance: 'Persévérance',
  voix: 'La voix',
  oreille: "L'oreille et le solfège",
  clins: "Clins d'œil",
}

export interface Trophy {
  id: string
  family: TrophyFamily
  title: string
  condition: string
  icon: string
  /** Trophées GOAT : un par jeu, gagné en débutant, normal ou expert (médaille bronze, argent ou or). */
  game?: GameId
}

/** GOAT : chaque réponse d'un questionnaire à 10 000 points, c'est-à-dire donnée pendant la marge avant le décompte. */
export const GOAT_POINTS = 10000
const ECLAIR_POINTS = 10000
/** Niveau Impossible : à débloquer par un sans faute en expert, plus de 9 000 points à chaque question. */
export const IMPOSSIBLE_POINTS = 9000

const GOAT_TITLES: Record<GameId, string> = {
  'grave-ou-aigu': 'Sismographe',
  'quelle-note': 'Oreille absolue',
  accords: 'Maître des accords',
  harmonies: 'Maître des intervalles',
  modalite: 'Mage des modes',
  'chante-note': "Voix d'or",
  'chante-harmonie': 'Chœur à lui tout seul',
  'lecture-note': 'Déchiffreur',
  'fais-harmonie': "Architecte de l'harmonie",
  tonalite: 'Maître des clés',
  'quel-rythme': 'Métronome humain',
  'joue-rythme': 'Batteur de génie',
}

const GAME_NAMES: Record<GameId, string> = {
  'grave-ou-aigu': 'Grave ou aigu ?',
  'quelle-note': 'Quelle est la note ?',
  accords: 'Les accords',
  harmonies: 'Les harmonies',
  modalite: 'La modalité',
  'chante-note': 'Chante la note',
  'chante-harmonie': "Chante l'harmonie",
  'lecture-note': 'Lecture de note',
  'fais-harmonie': "Fais l'harmonie",
  tonalite: 'La tonalité',
  'quel-rythme': 'Quel rythme ?',
  'joue-rythme': 'Joue le rythme',
}

const ALL_GAMES = Object.keys(GOAT_TITLES) as GameId[]
const CATEGORIES: GameId[][] = [
  ['grave-ou-aigu', 'quelle-note', 'accords', 'harmonies', 'modalite'],
  ['chante-note', 'chante-harmonie'],
  ['lecture-note', 'fais-harmonie', 'tonalite'],
  ['quel-rythme', 'joue-rythme'],
]

/** Catégorie d'un jeu, dans l'ordre de l'accueil : 0 l'oreille, 1 la voix, 2 le solfège, 3 le rythme. */
export const gameCategory = (game: GameId) => CATEGORIES.findIndex((games) => games.includes(game))

export const TROPHIES: Trophy[] = [
  { id: 'premiers-pas', family: 'decouverte', icon: '👣', title: 'Premiers pas', condition: 'Termine ton premier questionnaire' },
  { id: 'bien-prepare', family: 'decouverte', icon: '🎓', title: 'Bien préparé', condition: 'Termine le tutoriel' },
  { id: 'curieux', family: 'decouverte', icon: '🔍', title: 'Curieux', condition: 'Essaie une question dans le mode essai' },
  { id: 'touche-a-tout', family: 'decouverte', icon: '🧭', title: 'Touche-à-tout', condition: 'Termine un questionnaire dans chacune des 4 catégories' },
  { id: 'explorateur', family: 'decouverte', icon: '🗺️', title: 'Explorateur', condition: 'Termine un questionnaire dans les 12 jeux' },
  { id: 'homme-orchestre', family: 'decouverte', icon: '🎺', title: 'Homme-orchestre', condition: 'Joue un questionnaire avec 5 instruments différents' },

  { id: 'sans-faute', family: 'sans-faute', icon: '✅', title: 'Sans faute', condition: 'Termine un questionnaire sans aucune erreur' },
  { id: 'oreille-de-lynx', family: 'sans-faute', icon: '🐆', title: 'Oreille de lynx', condition: 'Termine un questionnaire sans faute en expert' },
  { id: 'sans-filet', family: 'sans-faute', icon: '🎪', title: 'Sans filet', condition: 'Termine un questionnaire sans faute sans toucher au diapason (quand il est proposé)' },
  { id: 'marathonien', family: 'sans-faute', icon: '🏃', title: 'Marathonien', condition: 'Termine un questionnaire de 50 questions sans faute' },
  { id: 'impossible', family: 'sans-faute', icon: '💎', title: "L'impossible n'existe pas", condition: 'Débloque un niveau Impossible : un questionnaire expert sans faute, à plus de 9 000 points par question' },
  { id: 'grand-chelem', family: 'sans-faute', icon: '👑', title: 'Grand chelem', condition: 'Fais au moins un sans faute dans chacun des 12 jeux' },

  { id: 'rapide', family: 'rapidite', icon: '🐇', title: 'Rapide', condition: "Donne toutes les réponses d'un questionnaire à 7 000 points ou plus" },
  { id: 'tres-rapide', family: 'rapidite', icon: '🚀', title: 'Très rapide', condition: "Donne toutes les réponses d'un questionnaire à 8 000 points ou plus" },
  { id: 'fulgurant', family: 'rapidite', icon: '☄️', title: 'Fulgurant', condition: "Donne toutes les réponses d'un questionnaire à 9 000 points ou plus" },
  { id: 'eclair', family: 'rapidite', icon: '⚡', title: 'Éclair', condition: `Donne une bonne réponse à ${ECLAIR_POINTS.toLocaleString('fr-FR')} points` },
  { id: 'reflexe', family: 'rapidite', icon: '🎯', title: 'Réflexe', condition: 'Enchaîne 10 bonnes réponses à 9 000 points ou plus' },

  ...ALL_GAMES.map((game): Trophy => ({
    id: `goat-${game}`,
    family: 'goat',
    icon: '🐐',
    title: GOAT_TITLES[game],
    condition: `${GAME_NAMES[game]} : donne chaque réponse d'un questionnaire à ${GOAT_POINTS.toLocaleString('fr-FR')} points`,
    game,
  })),

  { id: 'habitue', family: 'perseverance', icon: '🎵', title: 'Habitué', condition: 'Termine 10 questionnaires' },
  { id: 'passionne', family: 'perseverance', icon: '🎶', title: 'Passionné', condition: 'Termine 50 questionnaires' },
  { id: 'accro', family: 'perseverance', icon: '🎧', title: 'Accro', condition: 'Termine 100 questionnaires' },
  { id: 'legende', family: 'perseverance', icon: '🌟', title: 'Légende', condition: 'Termine 500 questionnaires' },
  { id: 'mille-bravos', family: 'perseverance', icon: '👏', title: 'Mille bravos', condition: 'Donne 1 000 bonnes réponses au total' },
  { id: 'regulier', family: 'perseverance', icon: '📅', title: 'Régulier', condition: 'Joue 7 jours de suite' },
  { id: 'fidele', family: 'perseverance', icon: '💜', title: 'Fidèle', condition: 'Joue 30 jours de suite' },

  { id: 'juste', family: 'voix', icon: '🎤', title: 'Juste', condition: 'Chante une note à 5 cents près' },
  { id: 'diapason-humain', family: 'voix', icon: '🔔', title: 'Diapason humain', condition: 'Chante un La à 2 cents près' },
  { id: 'chef-de-choeur', family: 'voix', icon: '🎼', title: 'Chef de chœur', condition: 'Chante juste 10 harmonies au total' },
  { id: 'grand-ecart', family: 'voix', icon: '🤸', title: 'Grand écart', condition: "Chante juste une octave dans « Chante l'harmonie »" },
  { id: 'gamme-complete', family: 'voix', icon: '🌈', title: 'Gamme complète', condition: 'Chante juste les 12 notes dans « Chante la note » (au total)' },

  { id: 'diable-en-musique', family: 'oreille', icon: '😈', title: 'Diable en musique', condition: 'Trouve une quarte augmentée (le triton) dans « Les harmonies »' },
  { id: 'sept-modes', family: 'oreille', icon: '🎭', title: 'Les sept modes', condition: 'Reconnais les 7 modes au moins une fois chacun' },
  { id: 'toutes-les-cles', family: 'oreille', icon: '🗝️', title: 'Toutes les clés', condition: "Lis juste une note en clé de sol, de fa et d'ut" },
  { id: 'armures', family: 'oreille', icon: '🛡️', title: 'Armures au complet', condition: 'Trouve les 15 tonalités majeures au moins une fois chacune' },
  { id: 'accords-parfaits', family: 'oreille', icon: '🎹', title: 'Accords parfaits', condition: 'Trouve 10 accords en entier au total' },
  { id: 'lecteur-aguerri', family: 'oreille', icon: '📖', title: 'Lecteur aguerri', condition: 'Lis juste 100 notes au total' },

  { id: 'virtuose', family: 'clins', icon: '🎻', title: 'Virtuose', condition: 'Fais jouer ta musique de fin sans aucune fausse note' },
  { id: 'catastrophe', family: 'clins', icon: '🙈', title: 'La catastrophe', condition: 'Termine un questionnaire sans aucune bonne réponse' },
  { id: 'melomane', family: 'clins', icon: '🎧', title: 'Mélomane', condition: 'Écoute tous les morceaux de fin de ton instrument dans les paramètres' },
]

export const TROPHY_BY_ID = Object.fromEntries(TROPHIES.map((t) => [t.id, t])) as Record<string, Trophy>

export type Tier = 'debutant' | 'normal' | 'expert' | 'impossible'
const TIER_ORDER: Tier[] = ['debutant', 'normal', 'expert', 'impossible']

export interface Earned {
  date: string
  /** GOAT : meilleur niveau atteint. */
  tier?: Tier
}

interface Stats {
  games: number
  correct: number
  lastDay: string
  streak: number
  played: GameId[]
  instruments: InstrumentId[]
  perfect: GameId[]
  harmoniesSung: number
  pitchClassesSung: number[]
  modes: string[]
  majorKeys: string[]
  clefs: string[]
  chords: number
  notesRead: number
  endingsHeard: string[]
  /** Jeux dont le niveau Impossible est débloqué. */
  impossible: GameId[]
}

interface State {
  earned: Record<string, Earned>
  /** Gagnés mais pas encore annoncés (annonce à la prochaine fin de partie). */
  pending: { id: string; tier?: Tier }[]
  stats: Stats
}

const STORAGE_KEY = 'harmowhat.trophies'

const emptyStats = (): Stats => ({
  games: 0, correct: 0, lastDay: '', streak: 0, played: [], instruments: [], perfect: [], harmoniesSung: 0,
  pitchClassesSung: [], modes: [], majorKeys: [], clefs: [], chords: 0, notesRead: 0, endingsHeard: [], impossible: [],
})

function load(): State {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    return { earned: raw.earned ?? {}, pending: raw.pending ?? [], stats: { ...emptyStats(), ...raw.stats } }
  } catch {
    return { earned: {}, pending: [], stats: emptyStats() }
  }
}

/** Trophées gagnés (réactif, pour la page « Mes trophées »). */
export const earnedTrophies = ref<Record<string, Earned>>(load().earned)
/** Nombre de trophées gagnés pas encore annoncés (réactif : l'annonce les affiche dès que possible). */
export const pendingTrophyCount = ref(load().pending.length)
/** Jeux dont le niveau Impossible est débloqué (réactif, pour les réglages). */
export const impossibleUnlocked = ref<GameId[]>(load().stats.impossible)

/**
 * Tests en local (npm run dev seulement, jamais dans l'APK) : ajouter ?impossible=1 à l'adresse d'un écran
 * montre les niveaux Impossible de tous les jeux, ?impossible=0 revient à la normale. Le choix est mémorisé.
 */
const DEV_KEY = 'harmowhat.dev.impossible'
function devShowAll(): boolean {
  if (!import.meta.env?.DEV || typeof location === 'undefined') return false
  try {
    const flag = new URLSearchParams(location.search).get('impossible')
    if (flag === '1') localStorage.setItem(DEV_KEY, '1')
    if (flag === '0') localStorage.removeItem(DEV_KEY)
    return localStorage.getItem(DEV_KEY) === '1'
  } catch {
    return false
  }
}

/** Le niveau Impossible de ce jeu est proposé : débloqué, ou montré pour les tests en local. */
export const impossibleShown = (game: GameId) => impossibleUnlocked.value.includes(game) || devShowAll()

function save(state: State) {
  earnedTrophies.value = { ...state.earned }
  pendingTrophyCount.value = state.pending.length
  impossibleUnlocked.value = [...state.stats.impossible]
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Stockage indisponible : les trophées valent pour cette session.
  }
}

const addUnique = <T>(list: T[], item: T) => (list.includes(item) ? list : [...list, item])

/** Donne un trophée s'il ne l'est pas déjà (ou un meilleur niveau de GOAT) ; renvoie vrai s'il est nouveau. */
function award(state: State, id: string, tier?: Tier): boolean {
  const had = state.earned[id]
  if (had && (!tier || TIER_ORDER.indexOf(had.tier ?? 'debutant') >= TIER_ORDER.indexOf(tier))) return false
  state.earned[id] = { date: new Date().toISOString(), ...(tier ? { tier } : {}) }
  state.pending.push({ id, ...(tier ? { tier } : {}) })
  return true
}

function checkCounters(state: State) {
  const s = state.stats
  const rules: [string, boolean][] = [
    ['premiers-pas', s.games >= 1],
    ['touche-a-tout', CATEGORIES.every((c) => c.some((g) => s.played.includes(g)))],
    ['explorateur', ALL_GAMES.every((g) => s.played.includes(g))],
    ['homme-orchestre', s.instruments.length >= 5],
    ['grand-chelem', ALL_GAMES.every((g) => s.perfect.includes(g))],
    ['habitue', s.games >= 10],
    ['passionne', s.games >= 50],
    ['accro', s.games >= 100],
    ['legende', s.games >= 500],
    ['mille-bravos', s.correct >= 1000],
    ['regulier', s.streak >= 7],
    ['fidele', s.streak >= 30],
    ['chef-de-choeur', s.harmoniesSung >= 10],
    ['gamme-complete', s.pitchClassesSung.length >= 12],
    ['sept-modes', s.modes.length >= 7],
    ['toutes-les-cles', s.clefs.includes('sol') && s.clefs.includes('fa') && s.clefs.some((c) => c.startsWith('ut'))],
    ['armures', s.majorKeys.length >= 15],
    ['accords-parfaits', s.chords >= 10],
    ['lecteur-aguerri', s.notesRead >= 100],
  ]
  for (const [id, ok] of rules) if (ok) award(state, id)
}

const dayOf = (d: Date) => d.toISOString().slice(0, 10)

export interface GameContext {
  board: Board
  results: QuestionResult[]
  instrument: InstrumentId
  /** Le diapason était proposé pendant les questions, et a servi. */
  forkAvailable: boolean
  forkUsed: boolean
  now?: Date
}

/** Fin d'un questionnaire : met à jour les compteurs et donne les trophées mérités. */
export function evaluateGame(ctx: GameContext): void {
  const state = load()
  const s = state.stats
  const { board, results } = ctx
  const correct = results.filter((r) => r.correct).length
  const allCorrect = results.length > 0 && correct === results.length
  const level = board.level.split('-')[0] as Tier

  s.games++
  s.correct += correct
  s.played = addUnique(s.played, board.game)
  s.instruments = addUnique(s.instruments, ctx.instrument)
  if (allCorrect) s.perfect = addUnique(s.perfect, board.game)
  // Jours de suite : hier prolonge la série, aujourd'hui ne change rien, sinon elle repart à 1.
  const today = dayOf(ctx.now ?? new Date())
  const yesterday = dayOf(new Date(new Date(today).getTime() - 86400000))
  if (s.lastDay !== today) s.streak = s.lastDay === yesterday ? s.streak + 1 : 1
  s.lastDay = today

  // Compteurs d'abord : « Premiers pas » s'annonce avant les exploits de la partie.
  checkCounters(state)
  const atLeast = (points: number) => results.length > 0 && results.every((r) => r.correct && r.points >= points)
  let run = 0
  let bestRun = 0
  for (const r of results) {
    run = r.correct && r.points >= 9000 ? run + 1 : 0
    bestRun = Math.max(bestRun, run)
  }
  const rules: [string, boolean][] = [
    ['sans-faute', allCorrect],
    ['virtuose', allCorrect],
    ['oreille-de-lynx', allCorrect && level === 'expert'],
    ['sans-filet', allCorrect && ctx.forkAvailable && !ctx.forkUsed],
    ['marathonien', allCorrect && board.questions >= 50],
    ['rapide', atLeast(7000)],
    ['tres-rapide', atLeast(8000)],
    ['fulgurant', atLeast(9000)],
    ['eclair', results.some((r) => r.correct && r.points >= ECLAIR_POINTS)],
    ['reflexe', bestRun >= 10],
    ['catastrophe', results.length > 0 && correct === 0],
  ]
  for (const [id, ok] of rules) if (ok) award(state, id)
  if (atLeast(GOAT_POINTS) && TIER_ORDER.includes(level)) award(state, `goat-${board.game}`, level)
  // Exploit en expert (questionnaire complet, sans faute, plus de 9 000 points à chaque question) : le niveau Impossible se débloque.
  const exploit = level === 'expert' && results.length >= board.questions && results.every((r) => r.correct && r.points > IMPOSSIBLE_POINTS)
  if (exploit && !s.impossible.includes(board.game)) {
    s.impossible = [...s.impossible, board.game]
    state.pending.push({ id: `impossible-${board.game}` })
    award(state, 'impossible')
  }
  // Puis ceux qui dépendent des sans faute de cette partie (Grand chelem).
  checkCounters(state)
  save(state)
}

export type TrophyEvent =
  | { type: 'tutorial' }
  | { type: 'trial' }
  /** Note juste dans « Chante la note » : classe (0 = Do) et écart en cents. */
  | { type: 'sung'; pitchClass: number; cents: number }
  /** Harmonie juste dans « Chante l'harmonie ». */
  | { type: 'harmony-sung'; semitones: number }
  /** Intervalle trouvé dans « Les harmonies ». */
  | { type: 'interval'; semitones: number }
  | { type: 'mode'; id: string }
  | { type: 'key'; id: string; major: boolean }
  | { type: 'clef'; clef: string }
  | { type: 'chord' }
  | { type: 'ending'; instrument: InstrumentId; id: string }

/** Un geste qui compte pour les trophées (bonne réponse particulière, tutoriel, écoute…). */
export function trophyEvent(e: TrophyEvent): void {
  const state = load()
  const s = state.stats
  switch (e.type) {
    case 'tutorial':
      award(state, 'bien-prepare')
      break
    case 'trial':
      award(state, 'curieux')
      break
    case 'sung':
      s.pitchClassesSung = addUnique(s.pitchClassesSung, e.pitchClass)
      if (Math.abs(e.cents) <= 5) award(state, 'juste')
      if (e.pitchClass === 9 && Math.abs(e.cents) <= 2) award(state, 'diapason-humain')
      break
    case 'harmony-sung':
      s.harmoniesSung++
      if (e.semitones === 12) award(state, 'grand-ecart')
      break
    case 'interval':
      if (e.semitones === 6) award(state, 'diable-en-musique')
      break
    case 'mode':
      s.modes = addUnique(s.modes, e.id)
      break
    case 'key':
      if (e.major) s.majorKeys = addUnique(s.majorKeys, e.id)
      break
    case 'clef':
      s.clefs = addUnique(s.clefs, e.clef)
      s.notesRead++
      break
    case 'chord':
      s.chords++
      break
    case 'ending': {
      s.endingsHeard = addUnique(s.endingsHeard, `${e.instrument}/${e.id}`)
      if (endingsFor(e.instrument).every((x) => s.endingsHeard.includes(`${e.instrument}/${x.id}`))) award(state, 'melomane')
      break
    }
  }
  checkCounters(state)
  save(state)
}

/** Le joueur a déjà terminé au moins un questionnaire de ce jeu (sa présentation s'affiche alors repliée). */
export function hasPlayed(game: GameId): boolean {
  return load().stats.played.includes(game)
}

/** Trophées gagnés depuis la dernière annonce : à annoncer maintenant (la liste est vidée). */
export function takePendingTrophies(): { trophy: Trophy; tier?: Tier }[] {
  const state = load()
  const pending = state.pending
  state.pending = []
  save(state)
  return pending.flatMap((p) => {
    const trophy = TROPHY_BY_ID[p.id] ?? unlockNotice(p.id)
    return trophy ? [{ trophy, tier: p.tier }] : []
  })
}

export const TIER_LABELS: Record<Tier, { label: string; medal: string }> = {
  debutant: { label: 'Débutant', medal: '🥉' },
  normal: { label: 'Normal', medal: '🥈' },
  expert: { label: 'Expert', medal: '🥇' },
  impossible: { label: 'Impossible', medal: '💎' },
}

/** Annonce d'un niveau Impossible débloqué, dans la popin des trophées (ce n'est pas un trophée de la liste). */
function unlockNotice(id: string): Trophy | null {
  const game = id.replace(/^impossible-/, '') as GameId
  if (!id.startsWith('impossible-') || !GAME_NAMES[game]) return null
  return { id, family: 'sans-faute', icon: '🔓', title: 'Niveau Impossible débloqué', condition: `« ${GAME_NAMES[game]} » : un nouveau niveau t'attend dans les réglages du jeu` }
}

/** Niveaux d'un jeu à proposer : « Impossible » seulement une fois débloqué. */
export function visibleLevels<K extends string, T>(game: GameId, levels: Record<K, T>): Record<K, T> {
  if (impossibleShown(game)) return levels
  return Object.fromEntries(Object.entries(levels).filter(([id]) => id !== 'impossible')) as Record<K, T>
}
