import { closest, MIN_MARGIN, MIN_VOICED_MS, noiseLimit, ranked, type Features, type Syllable, type Templates } from '@/audio/wordMatch'

/**
 * « Lecture continue » par le son : de chaque syllabe entendue à une réponse. Comparaison aux enregistrements du joueur,
 * hésitations, bruits. Ne dépend ni de l'écran ni de l'horloge : le banc d'essai (tools/soundBench.ts) y rejoue un enregistrement.
 */

/** Une syllabe entendue et le mot qu'elle était : apprise si la réponse est juste. */
export interface Learned {
  key: string
  features: Features
}

/** La note à lire. */
export interface SoundTarget {
  /** Classe de la note : 0 = Do ... 11 = Si. */
  pc: number
  /** Nom écrit : 0 = do ... 6 = si. */
  letter: number
}

/** Ce que le jeu fournit au juge. */
export interface SoundJudgeHost {
  target(): SoundTarget | null
  /** Réponse fausse dite si tôt que ce n'en est sans doute pas une (« oula ! »). */
  early(pc: number, at: number): boolean
  /** Dernière note jugée (une note redite n'est pas une réponse pour la suivante). */
  lastPc(): number
  /** Le joueur a commencé à dire sa réponse à l'instant `at`. */
  onset(at: number): void
  answer(pc: number, syllables: Learned[]): void
  heard(text: string): void
  /** Le joueur a parlé, mais sa réponse n'a pas été comprise : il peut la redire. */
  notUnderstood(): void
  log(line: string, at?: number): void
  label(pc: number): string
  where(at: number): string
}

export const LETTER_KEYS = ['do', 're', 'mi', 'fa', 'sol', 'la', 'si']
const SOUND_PCS: Record<string, number> = { do: 0, re: 2, mi: 4, fa: 5, sol: 7, la: 9, si: 11 }
const SOUND_LABELS: Record<string, string> = { do: 'do', re: 'ré', mi: 'mi', fa: 'fa', sol: 'sol', la: 'la', si: 'si' }

/** Enregistrements gardés par mot : ceux de « Ma voix », plus les derniers appris en jeu. */
const RECORDED = 2
const LEARNED = 4

export const SOUND_RULES = {
  /** Pour compter une erreur, la note entendue doit être plus proche que la note à lire d'au moins cet écart. */
  wrongMargin: 4,
  /** Note à lire plus loin que la plus proche de moins de cet écart : hésitation, on retient la note à lire. */
  tieMargin: 2,
  /** Au-delà de ce multiple de la limite de bruit, la note à lire est trop loin pour être retenue, même à égalité. */
  tieLimit: 1.2,
  /** Écart à partir duquel une syllabe est nettement une note. */
  clearMargin: 2,
  /** Une syllabe qui commence moins de 150 ms après un son qui n'était pas une note en est la suite (même mot). */
  wordGapMs: 150,
}

export class SoundJudge {
  private notes: Templates = {}
  /** Fin de la dernière syllabe avec de la voix qui n'a pas été prise comme note (exclamation, mot incertain). */
  private otherEnd = -Infinity

  constructor(
    private templates: Templates,
    private host: SoundJudgeHost,
    /** Enregistre les syllabes apprises en jeu. */
    private save: (t: Templates) => void = () => {},
  ) {
    this.rebuild()
  }

  private rebuild() {
    this.notes = Object.fromEntries(Object.entries(this.templates).filter(([k]) => k in SOUND_PCS))
  }

  reset() {
    this.otherEnd = -Infinity
  }

  /** Ajoute aux enregistrements les syllabes d'une réponse juste (en remplaçant les plus anciennes apprises en jeu). */
  learn(list: Learned[]) {
    if (!list.length) return
    for (const { key, features } of list) {
      const kept = [...(this.templates[key] ?? []), features]
      if (kept.length > RECORDED + LEARNED) kept.splice(RECORDED, 1)
      this.templates[key] = kept
    }
    this.save(this.templates)
    this.rebuild()
  }

  syllable(s: Syllable) {
    const { host } = this
    const head = `syllabe ${Math.round(s.end - s.start)} ms, voix ${s.voiced} ms · ${host.where(s.start)}`
    // Souffle, toux : ignorés.
    if (s.voiced < MIN_VOICED_MS) return host.log(`${head} · souffle ou bruit : ignoré`, s.start)
    // Collée à une syllabe qui n'était pas une note (« ou-la ! ») : la suite d'un autre mot, pas une réponse.
    // Sauf si c'est nettement la note à lire : des notes enchaînées se suivent de près, et une syllabe ratée ne doit pas
    // emporter les suivantes.
    if (s.start - this.otherEnd < SOUND_RULES.wordGapMs) {
      const clear = closest(s.features, this.notes)
      if (!clear || clear.key !== LETTER_KEYS[host.target()?.letter ?? -1] || clear.margin < SOUND_RULES.clearMargin) {
        this.otherEnd = s.end
        return host.log(`${head} · suite d'un mot qui n'est pas une note : ignoré`, s.start)
      }
    }

    let best = closest(s.features, this.notes)
    // Hésitation entre la note la plus proche et la note à lire (presque à égalité) : on retient la note à lire.
    const expected = LETTER_KEYS[host.target()?.letter ?? -1]
    const list = ranked(s.features, this.notes)
    const exp = expected ? list.find((r) => r.key === expected) : undefined
    const scores = best
      ? ` · proche : ${best.key} (distance ${best.distance.toFixed(1)}, écart ${best.margin.toFixed(1)})` +
        (expected && expected !== best.key && exp ? ` · ${expected} à ${exp.distance.toFixed(1)}` : '')
      : ''
    let tieBreak = ''
    if (best && expected && expected !== best.key) {
      if (exp && exp.distance - list[0].distance < SOUND_RULES.tieMargin && exp.distance <= noiseLimit(this.notes) * SOUND_RULES.tieLimit) {
        tieBreak = ` · hésitation avec ${expected} (distance ${exp.distance.toFixed(1)}) : ${expected} retenu`
        best = { key: expected, distance: exp.distance, margin: MIN_MARGIN, noise: false }
      }
    }
    // Bruit, ou deux notes presque à égalité : pas de réponse (le joueur peut redire la note).
    if (!best || best.noise || best.margin < MIN_MARGIN) {
      if (best && !best.noise) host.heard(`${SOUND_LABELS[best.key] ?? '?'} ?`)
      this.otherEnd = s.end
      host.notUnderstood()
      return host.log(`${head}${scores} · ${best?.noise ? 'trop loin de tes mots' : 'pas sûr'} : ignoré`, s.start)
    }
    // Une autre note que celle à lire, mais pas nettement plus proche qu'elle : pas assez sûr pour compter une erreur ;
    // ignorée, le joueur peut redire la note.
    if (expected && best.key !== expected && exp && exp.distance - best.distance < SOUND_RULES.wrongMargin) {
      host.heard(`${SOUND_LABELS[best.key] ?? '?'} ?`)
      this.otherEnd = s.end
      host.notUnderstood()
      return host.log(`${head}${scores} · ${expected} à ${exp.distance.toFixed(1)} : pas assez net pour une erreur, ignoré`, s.start)
    }
    host.log(`${head}${scores}${tieBreak}`, s.start)
    host.heard(SOUND_LABELS[best.key] ?? '')
    const pc = SOUND_PCS[best.key]
    // La note redite (déjà validée) n'est pas une réponse pour la suivante : pas d'attaque à dater.
    if (pc === host.lastPc()) return host.log(`  ${host.label(pc)} redit : ignoré`)
    if (host.early(pc, s.start)) {
      this.otherEnd = s.end
      return host.log('  réponse fausse dite tôt : ignorée (une exclamation ?)')
    }
    // La réponse est datée du début de la syllabe.
    host.onset(s.start)
    // Seule une syllabe sans ambiguïté enrichit les enregistrements : apprendre d'une hésitation tranchée mélangerait les notes.
    host.answer(pc, !tieBreak && best.margin >= SOUND_RULES.clearMargin ? [{ key: best.key, features: s.features }] : [])
  }
}
