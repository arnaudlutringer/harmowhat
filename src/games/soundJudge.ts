import { closest, MIN_MARGIN, MIN_VOICED_MS, noiseLimit, ranked, type Features, type Syllable, type Templates } from '@/audio/wordMatch'

/**
 * « Lecture continue » par le son : de chaque syllabe entendue à une réponse. Comparaison aux enregistrements du joueur,
 * hésitations, altérations, bruits. Ne dépend ni de l'écran ni de l'horloge : le banc d'essai (tools/soundBench.ts) y rejoue
 * un enregistrement.
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
  /** Altération écrite (0 : aucune). */
  alter: number
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
  log(line: string, at?: number): void
  /** Lance un minuteur ; renvoie de quoi l'annuler. */
  timer(run: () => void, ms: number): () => void
  label(pc: number): string
  where(at: number): string
}

export const LETTER_KEYS = ['do', 're', 'mi', 'fa', 'sol', 'la', 'si']
const SOUND_PCS: Record<string, number> = { do: 0, re: 2, mi: 4, fa: 5, sol: 7, la: 9, si: 11 }
const SOUND_LABELS: Record<string, string> = { do: 'do', re: 'ré', mi: 'mi', fa: 'fa', sol: 'sol', la: 'la', si: 'si', diese: 'dièse', bemol: 'bémol' }
/** Altération de chaque enregistrement : « dièse » et sa seconde syllabe (diese2) ont le même sens. */
const ACCIDENTAL: Record<string, 1 | 11> = { diese: 1, diese2: 1, bemol: 11, bemol2: 11 }
/** Sens d'un enregistrement (deux moitiés de « dièse » ne sont pas à égalité entre elles). */
const meaning = (key: string) => key.replace(/2$/, '')

/** Enregistrements gardés par mot : ceux de « Ma voix », plus les derniers appris en jeu. */
const RECORDED = 2
const LEARNED = 4

export const SOUND_RULES = {
  /** Temps laissé à l'altération après une note (ms). */
  holdMs: 900,
  /** Pour compter une erreur, la note entendue doit être plus proche que la note à lire d'au moins cet écart. */
  wrongMargin: 2.5,
  /** Note à lire plus loin que la plus proche de moins de cet écart : hésitation, on retient la note à lire. */
  tieMargin: 2,
  /** Au-delà de ce multiple de la limite de bruit, la note à lire est trop loin pour être retenue, même à égalité. */
  tieLimit: 1.2,
  /** Même règle pour un couple note + altération (somme de deux distances). */
  pairTie: MIN_MARGIN,
  /** Écart à partir duquel une syllabe est nettement une note. */
  clearMargin: 2,
  /** Syllabe qui suit la note de moins de 250 ms : elle fait partie de la même réponse (« do-dièse » dit d'un trait). */
  gluedMs: 250,
  /** Une coupe d'un son long en note + altération doit ressembler nettement mieux que le son entier. */
  splitGain: 0.85,
  /** Durée minimale (en trames de 10 ms) d'un son qui peut contenir une note et son altération. */
  splitFrames: 50,
  /** Une syllabe qui commence moins de 150 ms après un son qui n'était pas une note en est la suite (même mot). */
  wordGapMs: 150,
}

export class SoundJudge {
  private notes: Templates = {}
  private accidentalsT: Templates = {}
  /** Note dite, en attente d'un éventuel « dièse » ou « bémol » (niveaux avec altérations). */
  private held: { pc: number; cancel: () => void; learn: Learned[]; features: Features; start: number; end: number } | null = null
  /** Après « dièse » ou « bémol », ce qui suit de près (le reste du mot) n'est pas une note. */
  private skipUntil = 0
  /** Fin de la dernière syllabe avec de la voix qui n'a pas été prise comme note (exclamation, mot incertain). */
  private otherEnd = -Infinity

  constructor(
    private templates: Templates,
    private accidentals: boolean,
    private host: SoundJudgeHost,
    /** Enregistre les syllabes apprises en jeu. */
    private save: (t: Templates) => void = () => {},
  ) {
    this.rebuild()
  }

  private rebuild() {
    this.notes = Object.fromEntries(Object.entries(this.templates).filter(([k]) => k in SOUND_PCS))
    this.accidentalsT = Object.fromEntries(Object.entries(this.templates).filter(([k]) => k in ACCIDENTAL))
  }

  reset() {
    this.stop()
    this.skipUntil = 0
    this.otherEnd = -Infinity
  }

  stop() {
    this.held?.cancel()
    this.held = null
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

  private release = () => {
    if (!this.held) return
    this.held.cancel()
    const { pc, learn, start } = this.held
    this.held = null
    if (this.host.early(pc, start)) return this.host.log('  réponse fausse dite tôt : ignorée (une exclamation ?)')
    this.host.answer(pc, learn)
  }

  /**
   * Une note altérée dite en deux syllabes (« do » + « dièse ») : chaque couple note + altération est noté par la somme
   * de ses deux distances, et le meilleur retenu. À égalité (presque) avec la note à lire, c'est elle qui est retenue.
   */
  private decodePair(f1: Features, f2: Features) {
    const letters = ranked(f1, this.notes)
    const accs = ranked(f2, this.accidentalsT)
    const accDistance = (k: 'diese' | 'bemol') => Math.min(...accs.filter((a) => meaning(a.key) === k).map((a) => a.distance))
    const options = letters
      .flatMap((l) =>
        (['diese', 'bemol'] as const).map((accidental) => ({
          letter: l.key,
          accidental,
          pc: (SOUND_PCS[l.key] + ACCIDENTAL[accidental]) % 12,
          cost: l.distance + accDistance(accidental),
        })),
      )
      .filter((o) => Number.isFinite(o.cost))
      .sort((a, b) => a.cost - b.cost)
    let best = options[0]
    const second = options.find((o) => o.pc !== best?.pc)
    const target = this.host.target()?.pc
    const wanted = options.find((o) => o.pc === target)
    let tie = ''
    if (best && wanted && wanted.pc !== best.pc && wanted.cost - best.cost < SOUND_RULES.pairTie) {
      tie = ` · hésitation : ${SOUND_LABELS[wanted.letter]} ${SOUND_LABELS[wanted.accidental]} retenu`
      best = wanted
    }
    const label = (o?: (typeof options)[number]) => (o ? `${SOUND_LABELS[o.letter]} ${SOUND_LABELS[o.accidental]} (${o.cost.toFixed(1)})` : '—')
    return { best, f1, f2, cost: options[0]?.cost ?? Infinity, text: `meilleur ${label(options[0])}, puis ${label(second)}${tie}` }
  }

  /**
   * Note altérée dite d'un seul tenant : on essaie de couper le son à différents endroits (entre 30 et 70 %), chaque
   * moitié jugée comme note puis altération. Renvoie la meilleure coupe, ou null si le son est trop court.
   */
  private decodeSplit(f: Features) {
    if (f.length < SOUND_RULES.splitFrames) return null
    let best: ReturnType<SoundJudge['decodePair']> | null = null
    for (let cut = Math.round(f.length * 0.3); cut <= Math.round(f.length * 0.7); cut += 3) {
      const pair = this.decodePair(f.slice(0, cut), f.slice(cut))
      if (pair.best && (!best || pair.cost < best.cost)) best = pair
    }
    return best
  }

  syllable(s: Syllable) {
    const { host } = this
    const head = `syllabe ${Math.round(s.end - s.start)} ms, voix ${s.voiced} ms · ${host.where(s.start)}`
    // Souffle, toux, seconde moitié de « dièse » : ignorés.
    if (s.voiced < MIN_VOICED_MS) return host.log(`${head} · souffle ou bruit : ignoré`, s.start)
    if (s.start < this.skipUntil) return host.log(`${head} · fin de « dièse » / « bémol » : ignoré`, s.start)
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

    // Une note attend son altération : la syllabe qui suit ne peut être que « dièse » ou « bémol » (sinon, « di » se
    // confond avec « si »). Collée à la note (« do-dièse » d'un trait), ou clairement une altération, on juge les deux
    // syllabes ensemble : la note et l'altération qui, à elles deux, ressemblent le plus à ce qui a été dit.
    if (this.held) {
      const acc = closest(s.features, this.accidentalsT, meaning)
      const glued = s.start - this.held.end < SOUND_RULES.gluedMs
      if (acc && (glued || !acc.noise)) {
        const pair = this.decodePair(this.held.features, s.features)
        host.log(`${head} · avec la syllabe d'avant : ${pair.text}`, s.start)
        if (pair.best) {
          this.skipUntil = s.end + 300
          this.held.cancel()
          const { pc, letter, accidental } = pair.best
          this.held = null
          if (host.early(pc, s.start)) return host.log('  réponse fausse dite tôt : ignorée (une exclamation ?)')
          host.heard(`${SOUND_LABELS[letter]} ${SOUND_LABELS[accidental]}`)
          return host.answer(pc, [
            { key: letter, features: pair.f1 },
            { key: accidental, features: s.features },
          ])
        }
      } else host.log(`${head} · pas une altération${acc ? ` (${acc.key}, distance ${acc.distance.toFixed(1)})` : ''}`, s.start)
      // Pas une altération : c'est déjà la note suivante ; celle qui attendait est jugée telle quelle.
      this.release()
    }

    const goal = host.target()
    let best = closest(s.features, this.notes)
    // Hésitation entre la note la plus proche et la note à lire (presque à égalité) : on retient la note à lire.
    const expected = LETTER_KEYS[goal?.letter ?? -1]
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
    // Note à lire altérée : une note même incertaine est gardée, pour être jugée avec l'altération qui suit.
    const altered = this.accidentals && (goal?.alter ?? 0) !== 0
    // Note à lire altérée et son long : peut-être la note et son altération d'un seul tenant (« si-bémol »). Si une coupe
    // en note + altération ressemble mieux (en moyenne) que le son entier comme note seule, c'est elle qui est retenue.
    const split = altered ? this.decodeSplit(s.features) : null
    if (split?.best && split.cost / 2 < (best?.distance ?? Infinity) * SOUND_RULES.splitGain) {
      const { pc, letter, accidental } = split.best
      host.log(`${head}${scores} · coupé en deux : ${split.text}`, s.start)
      if (host.early(pc, s.start)) return host.log('  réponse fausse dite tôt : ignorée (une exclamation ?)')
      if (pc !== host.lastPc()) {
        host.onset(s.start)
        host.heard(`${SOUND_LABELS[letter]} ${SOUND_LABELS[accidental]}`)
        return host.answer(pc, [
          { key: letter, features: split.f1 },
          { key: accidental, features: split.f2 },
        ])
      }
    }
    // Bruit, ou deux notes presque à égalité : pas de réponse (le joueur peut redire la note).
    if (!best || best.noise || (best.margin < MIN_MARGIN && !altered)) {
      if (best && !best.noise) host.heard(`${SOUND_LABELS[best.key] ?? '?'} ?`)
      this.otherEnd = s.end
      return host.log(`${head}${scores} · ${best?.noise ? 'trop loin de tes mots' : 'pas sûr'} : ignoré`, s.start)
    }
    // Une autre note que celle à lire, mais pas nettement plus proche qu'elle : pas assez sûr pour compter une erreur ;
    // ignorée, le joueur peut redire la note.
    if (!altered && expected && best.key !== expected && exp && exp.distance - best.distance < SOUND_RULES.wrongMargin) {
      host.heard(`${SOUND_LABELS[best.key] ?? '?'} ?`)
      this.otherEnd = s.end
      return host.log(`${head}${scores} · ${expected} à ${exp.distance.toFixed(1)} : pas assez net pour une erreur, ignoré`, s.start)
    }
    host.log(`${head}${scores}${tieBreak}`, s.start)
    host.heard(SOUND_LABELS[best.key] ?? '')
    const pc = SOUND_PCS[best.key]
    // La note redite (déjà validée) n'est pas une réponse pour la suivante : pas d'attaque à dater.
    if (pc === host.lastPc()) return host.log(`  ${host.label(pc)} redit : ignoré`)
    if (!altered && host.early(pc, s.start)) {
      this.otherEnd = s.end
      return host.log('  réponse fausse dite tôt : ignorée (une exclamation ?)')
    }
    // La réponse est datée du début de la syllabe.
    host.onset(s.start)
    // On n'attend une altération que si elle peut donner la note à lire (« fa » quand c'est fa dièse) ; sinon la note est
    // jugée tout de suite (elle passe au vert sans délai). Note à lire altérée : on attend toujours (« do » peut être le
    // début de « do dièse » même mal reconnu).
    const target = goal?.pc
    const couldAlter = altered || (this.accidentals && target !== undefined && target !== pc && ((pc + 1) % 12 === target || (pc + 11) % 12 === target))
    const syllable: Learned = { key: best.key, features: s.features }
    if (!couldAlter) return host.answer(pc, [syllable])
    host.log(`  ${host.label(pc)} : attente d'un dièse ou d'un bémol (${SOUND_RULES.holdMs} ms)`)
    this.held = { pc, cancel: host.timer(this.release, SOUND_RULES.holdMs), learn: [syllable], features: s.features, start: s.start, end: s.end }
  }
}
