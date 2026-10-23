import { detectPitch, type Pitch } from './pitch'

/**
 * Écoute du micro (jeu « Chante la note ») : environ 20 mesures de hauteur par seconde.
 * Le navigateur (ou Android) demande l'autorisation au premier appel.
 */

export interface Listening {
  stop: () => void
}

const READ_EVERY_MS = 50

export async function listenToMicrophone(onPitch: (pitch: Pitch | null) => void): Promise<Listening> {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('Micro indisponible')
  const stream = await navigator.mediaDevices.getUserMedia({
    // Ni annulation d'écho ni réduction de bruit : elles déforment une voix tenue.
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  })
  const ctx = new AudioContext()
  if (ctx.state === 'suspended') await ctx.resume()
  const source = ctx.createMediaStreamSource(stream)
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 2048
  source.connect(analyser)
  const samples = new Float32Array(analyser.fftSize)
  const timer = setInterval(() => {
    analyser.getFloatTimeDomainData(samples)
    onPitch(detectPitch(samples, ctx.sampleRate))
  }, READ_EVERY_MS)
  return {
    stop() {
      clearInterval(timer)
      source.disconnect()
      stream.getTracks().forEach((t) => t.stop())
      void ctx.close()
    },
  }
}
