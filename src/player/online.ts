import { ref } from 'vue'
import { Network } from '@capacitor/network'

/**
 * Connexion à Internet, suivie en direct : les écrans qui en ont besoin (reconnaissance vocale de « Lecture continue »,
 * classements monde et pays) se bloquent sans elle et se réactivent dès qu'elle revient.
 */
export const online = ref(typeof navigator === 'undefined' ? true : navigator.onLine)

void Network.getStatus()
  .then((status) => (online.value = status.connected))
  .catch(() => {})
void Network.addListener('networkStatusChange', (status) => (online.value = status.connected)).catch(() => {
  // Module indisponible : on suit le navigateur.
  window.addEventListener('online', () => (online.value = true))
  window.addEventListener('offline', () => (online.value = false))
})
