/**
 * Fichier audio du banc d'essai : un WAV 16 bits mono, avec un bloc « labl » qui contient en JSON ce que le joueur devait
 * dire et quand. Un seul fichier à envoyer ; les lecteurs audio ignorent ce bloc.
 */

const LABELS_ID = 'labl'

function writeId(view: DataView, at: number, id: string) {
  for (let i = 0; i < 4; i++) view.setUint8(at + i, id.charCodeAt(i))
}

function readId(view: DataView, at: number): string {
  return String.fromCharCode(view.getUint8(at), view.getUint8(at + 1), view.getUint8(at + 2), view.getUint8(at + 3))
}

export function encodeWav(samples: Float32Array, rate: number, labels: unknown): Uint8Array {
  const json = new TextEncoder().encode(JSON.stringify(labels))
  // Les blocs d'un WAV ont une taille paire.
  const labelsSize = json.length + (json.length % 2)
  const dataSize = samples.length * 2
  const out = new Uint8Array(44 + dataSize + 8 + labelsSize)
  const view = new DataView(out.buffer)
  writeId(view, 0, 'RIFF')
  view.setUint32(4, out.length - 8, true)
  writeId(view, 8, 'WAVE')
  writeId(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, rate, true)
  view.setUint32(28, rate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeId(view, 36, 'data')
  view.setUint32(40, dataSize, true)
  for (let i = 0; i < samples.length; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(44 + i * 2, Math.round(v * 32767), true)
  }
  const at = 44 + dataSize
  writeId(view, at, LABELS_ID)
  view.setUint32(at + 4, json.length, true)
  out.set(json, at + 8)
  return out
}

export function decodeWav<T>(bytes: Uint8Array): { samples: Float32Array; rate: number; labels: T | null } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (readId(view, 0) !== 'RIFF' || readId(view, 8) !== 'WAVE') throw new Error('Pas un fichier WAV')
  let rate = 0
  let samples = new Float32Array(0)
  let labels: T | null = null
  for (let at = 12; at + 8 <= bytes.length; ) {
    const id = readId(view, at)
    const size = view.getUint32(at + 4, true)
    const body = at + 8
    if (id === 'fmt ') rate = view.getUint32(body + 4, true)
    if (id === 'data') {
      samples = new Float32Array(size / 2)
      for (let i = 0; i < samples.length; i++) samples[i] = view.getInt16(body + i * 2, true) / 32767
    }
    if (id === LABELS_ID) labels = JSON.parse(new TextDecoder().decode(bytes.subarray(body, body + size))) as T
    at = body + size + (size % 2)
  }
  return { samples, rate, labels }
}
