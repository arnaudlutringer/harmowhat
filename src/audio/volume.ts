import { Capacitor, registerPlugin } from '@capacitor/core'
import { alertController } from '@ionic/vue'

/**
 * Volume « média » du téléphone, lu par le petit module natif de l'appli (plugins/volume) :
 * avant une partie, on prévient le joueur si le son est coupé.
 */
interface VolumePlugin {
  getVolume(): Promise<{ volume: number; muted?: boolean }>
}

const Volume = registerPlugin<VolumePlugin>('Volume')

/** Le son du téléphone est-il à zéro ? Toujours non dans un navigateur, où on ne peut pas le savoir. */
export async function isSoundOff(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  try {
    const { volume } = await Volume.getVolume()
    return volume <= 0
  } catch {
    return false
  }
}

/**
 * Avant une partie : si le son est coupé, une popin le dit. Renvoie vrai pour jouer (son remis, ou « Jouer quand
 * même »), faux si le joueur préfère rester sur les réglages.
 */
export async function confirmSoundOn(): Promise<boolean> {
  if (!(await isSoundOff())) return true
  const alert = await alertController.create({
    header: '🔇 Le son est coupé',
    message: 'Monte le volume de ton téléphone pour entendre les notes, puis lance la partie.',
    buttons: [
      { text: 'Annuler', role: 'cancel' },
      { text: 'Jouer quand même', role: 'confirm' },
    ],
  })
  await alert.present()
  const { role } = await alert.onDidDismiss()
  return role === 'confirm' || !(await isSoundOff())
}
