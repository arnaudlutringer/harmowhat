import { describe, expect, it, vi } from 'vitest'

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }))
vi.mock('@capacitor/local-notifications', () => ({ LocalNotifications: {} }))

const { plannedReminders } = await import('./reminders')

// Lundi 16 novembre 2026, 10 h (heure locale).
const now = new Date(2026, 10, 16, 10, 0, 0)
const hourOf = (n: { schedule?: { at?: Date } }) => n.schedule?.at?.getHours()
const dayOf = (n: { schedule?: { at?: Date } }) => n.schedule?.at?.getDate()

describe('Rappels', () => {
  it("programme le défi du jour sur 7 jours, avec un message d'absence au troisième", () => {
    const list = plannedReminders(now, 18, { lastDay: '', streak: 0 }, false)
    expect(list).toHaveLength(7)
    expect(list.every((n) => hourOf(n) === 18)).toBe(true)
    expect(list.map(dayOf)).toEqual([16, 17, 18, 19, 20, 21, 22])
    expect(list[0].title).toBe('🎯 Défi du jour')
    expect(list[3].body).toContain('Ça fait un moment')
  })

  it("ne rappelle pas le défi d'aujourd'hui s'il est relevé, ni à une heure déjà passée", () => {
    expect(plannedReminders(now, 18, { lastDay: '', streak: 0 }, true).map(dayOf)[0]).toBe(17)
    expect(plannedReminders(now, 8, { lastDay: '', streak: 0 }, false).map(dayOf)[0]).toBe(17)
  })

  it('prévient de la série en danger : ce soir si le joueur a joué hier, demain soir s’il a joué aujourd’hui', () => {
    const yesterday = new Date(2026, 10, 15, 12).toISOString().slice(0, 10)
    const today = new Date(2026, 10, 16, 12).toISOString().slice(0, 10)
    const tonight = plannedReminders(now, 18, { lastDay: yesterday, streak: 4 }, false).find((n) => n.title.includes('jours de suite'))
    expect(tonight && [dayOf(tonight), hourOf(tonight)]).toEqual([16, 20])
    const tomorrow = plannedReminders(now, 18, { lastDay: today, streak: 5 }, false).find((n) => n.title.includes('jours de suite'))
    expect(tomorrow && [dayOf(tomorrow), hourOf(tomorrow)]).toEqual([17, 20])
    expect(plannedReminders(now, 18, { lastDay: '2026-11-01', streak: 9 }, false).some((n) => n.title.includes('jours de suite'))).toBe(false)
  })
})
