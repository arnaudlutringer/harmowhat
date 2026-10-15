import { computed, getCurrentInstance, onBeforeUnmount, shallowRef } from 'vue'
import { onStopAll } from '@/audio/engine'

/**
 * Suit ce qui est en train de sonner, pour l'afficher (effet visuel) pendant la lecture
 * et revenir à l'état initial à la fin. `key` distingue plusieurs boutons d'un même écran.
 */
export function usePlaying<K = true>() {
  const current = shallowRef<K | null>(null)
  let token = 0
  let timer: ReturnType<typeof setTimeout> | undefined

  /** `sound` se résout quand le son démarre, avec sa durée en secondes. */
  function track(sound: Promise<number>, key: K = true as K): Promise<number> {
    const t = ++token
    sound.then(
      (seconds) => {
        if (t !== token) return
        clearTimeout(timer)
        current.value = key
        timer = setTimeout(() => t === token && (current.value = null), seconds * 1000)
      },
      () => t === token && (current.value = null),
    )
    return sound
  }

  function clear() {
    token++
    clearTimeout(timer)
    current.value = null
  }

  // Quand tous les sons sont coupés (changement d'écran), l'effet s'éteint aussi.
  const unsubscribe = onStopAll(clear)
  if (getCurrentInstance())
    onBeforeUnmount(() => {
      unsubscribe()
      clear()
    })

  return { current, playing: computed(() => current.value !== null), track, clear }
}
