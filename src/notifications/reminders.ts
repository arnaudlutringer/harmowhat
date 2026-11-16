import { ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications, type LocalNotificationSchema } from '@capacitor/local-notifications'
import { dailyChallenge, dayNumber } from '@/games/dailyChallenge'
import { challengeDays, playStreak } from '@/games/trophies'

/**
 * Rappels pour revenir jouer : des notifications programmées sur le téléphone (aucun serveur), reprogrammées à
 * chaque ouverture de l'appli et après chaque partie :
 * - le défi du jour, chaque jour à l'heure choisie (sauf s'il est déjà relevé), sur les 7 prochains jours ;
 * - la série en danger, à 20 h, si le joueur a joué la veille et pas encore ce jour-là ;
 * - un seul message après 3 jours sans ouvrir l'appli (à la place du défi de ce jour-là).
 * Toucher une notification ouvre le défi du jour.
 */

export interface ReminderSettings {
  enabled: boolean
  /** Heure du rappel du défi du jour (0 à 23). */
  hour: number
}

const SETTINGS_KEY = 'harmowhat.notifications'
const ASKED_KEY = 'harmowhat.notificationsAsked'
/** Les rappels de l'appli ont des identifiants de 1000 à 1099 : ils sont tous annulés avant d'être reprogrammés. */
const FIRST_ID = 1000
const DAYS_AHEAD = 7
const STREAK_HOUR = 20
const ABSENCE_DAYS = 3

function loadSettings(): ReminderSettings {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}')
    return { enabled: raw.enabled !== false, hour: Number.isInteger(raw.hour) && raw.hour >= 0 && raw.hour < 24 ? raw.hour : 18 }
  } catch {
    return { enabled: true, hour: 18 }
  }
}

/** Réglages des rappels (réactif : l'écran Paramètres les affiche et les modifie). */
export const reminderSettings = ref<ReminderSettings>(loadSettings())

export function setReminderSettings(next: Partial<ReminderSettings>) {
  reminderSettings.value = { ...reminderSettings.value, ...next }
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(reminderSettings.value))
  } catch {
    // Stockage indisponible : valable pour cette session.
  }
  void rescheduleReminders()
}

const at = (day: Date, hour: number) => new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0, 0)
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
/** Date ISO d'un jour (prise à midi : le décalage horaire ne la fait pas changer de jour). */
const isoDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12).toISOString().slice(0, 10)

/**
 * Les rappels à programmer à partir de maintenant (sans rien envoyer : testable).
 * `streak` : jours de suite déjà joués, et le dernier jour joué (date ISO, comme dans les trophées).
 */
export function plannedReminders(
  now: Date,
  hour: number,
  streak: { lastDay: string; streak: number },
  challengeDoneToday: boolean,
): LocalNotificationSchema[] {
  const list: LocalNotificationSchema[] = []
  let id = FIRST_ID
  const absenceDay = dayNumber(addDays(now, ABSENCE_DAYS))
  for (let d = 0; d < DAYS_AHEAD; d++) {
    const day = addDays(now, d)
    const when = at(day, hour)
    if (when <= now || (d === 0 && challengeDoneToday)) continue
    if (dayNumber(day) === absenceDay) {
      list.push({ id: id++, title: 'Tes oreilles te réclament 🎵', body: 'Ça fait un moment ! Le défi du jour t’attend, quelques minutes suffisent.', schedule: { at: when } })
      continue
    }
    // Le jeu du défi est le même pour tout le monde ; son niveau dépend des progrès du joueur d'ici là : on ne l'annonce pas.
    const game = dailyChallenge(day).title
    list.push({ id: id++, title: '🎯 Défi du jour', body: `Aujourd’hui : « ${game} ». 80 % de bonnes réponses pour le relever !`, schedule: { at: when } })
  }
  // Série en danger : le soir même si le joueur a joué hier et pas encore aujourd'hui, ou demain soir s'il a joué aujourd'hui.
  const today = isoDay(now)
  const yesterday = isoDay(addDays(now, -1))
  const streakDay = streak.lastDay === today ? addDays(now, 1) : streak.lastDay === yesterday ? now : null
  if (streakDay && streak.streak >= 2) {
    const when = at(streakDay, STREAK_HOUR)
    const days = streak.streak
    if (when > now) list.push({ id: id++, title: `🔥 ${days} jours de suite`, body: 'Une partie pour ne pas casser ta série !', schedule: { at: when } })
  }
  return list
}

const native = () => Capacitor.isNativePlatform()

/** Annule les rappels de l'appli puis reprogramme ceux des prochains jours (si l'autorisation est donnée). */
export async function rescheduleReminders(): Promise<void> {
  if (!native()) return
  try {
    const pending = await LocalNotifications.getPending()
    const ours = pending.notifications.filter((n) => n.id >= FIRST_ID && n.id < FIRST_ID + 100)
    if (ours.length) await LocalNotifications.cancel({ notifications: ours.map((n) => ({ id: n.id })) })
    const { display } = await LocalNotifications.checkPermissions()
    if (!reminderSettings.value.enabled || display !== 'granted') return
    const notifications = plannedReminders(new Date(), reminderSettings.value.hour, playStreak(), challengeDays.value.includes(dayNumber()))
    if (notifications.length) await LocalNotifications.schedule({ notifications })
  } catch {
    // Notifications indisponibles : l'appli fonctionne sans.
  }
}

/** Après la première partie terminée : on demande l'autorisation une seule fois, puis on programme les rappels. */
export async function askNotificationsOnce(): Promise<void> {
  if (!native() || !reminderSettings.value.enabled) return
  try {
    if (localStorage.getItem(ASKED_KEY)) return void rescheduleReminders()
    localStorage.setItem(ASKED_KEY, '1')
    const { display } = await LocalNotifications.checkPermissions()
    if (display === 'prompt' || display === 'prompt-with-rationale') await LocalNotifications.requestPermissions()
  } catch {
    // Pas d'autorisation : pas de rappels.
  }
  await rescheduleReminders()
}

/** Toucher une notification : ouvre la page demandée (le défi du jour). */
export function onReminderTapped(open: () => void) {
  if (!native()) return
  void LocalNotifications.addListener('localNotificationActionPerformed', () => open()).catch(() => {})
}
