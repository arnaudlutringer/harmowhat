import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { gameIconSvg } from '@/games/icons'
import type { GameId } from '@/games/highScores'
import { gameCategory } from '@/games/trophies'

/**
 * Images de partage, dessinées sur un canevas au format portrait 4:5 (WhatsApp, Instagram) :
 * A, le score d'une partie ; B, un trophée débloqué ; C, une place dans un classement.
 * Toutes ont le logo en haut et l'accroche de l'accueil en bas.
 */

const W = 1080
const H = 1350
const VIOLET = '#6c5ce7'
const INK = '#2d3047'
const MEDIUM = '#8a8aa0'
const CREAM = '#fff7ec'
const SANS = '"Fredoka Variable", system-ui, sans-serif'
const SCRIPT = '"Dancing Script", cursive'
/** Teintes des catégories de l'accueil (thème clair), dans l'ordre de gameCategory. */
const CATEGORY_COLORS = ['#f6dccc', '#e7ddf3', '#d9ebe4', '#f3e7c4']
/** Tuile d'un trophée qui n'est pas lié à un jeu. */
const TROPHY_TILE = '#f6e7b8'

export interface ScoreShare {
  kind: 'score'
  game: string
  level: string
  points: number
  correct: number
  total: number
  /** Image de fin de partie (oreille en or, argent ou fer). */
  tierImage: string
}

export interface TrophyShare {
  kind: 'trophy'
  title: string
  condition: string
  /** Emoji du trophée, ou l'icône du jeu pour un GOAT. */
  icon: string
  game?: GameId
  /** Médaille et niveau d'un GOAT (« 🥇 Expert »). */
  tier?: string
}

export interface RankShare {
  kind: 'rank'
  game: string
  gameId: GameId
  rank: number
  /** Classement : « au monde », « en France », « sur mon téléphone »… */
  where: string
  name: string
  points: number
}

export type ShareContent = ScoreShare | TrophyShare | RankShare

const fmt = (n: number) => n.toLocaleString('fr-FR').replace(/ | /g, ' ')
const ordinal = (n: number) => (n === 1 ? '1er' : `${n}e`)

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

const svgImage = (svg: string) => loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`)

/** Texte centré, coupé en lignes de `maxWidth` au plus ; renvoie l'ordonnée sous la dernière ligne. */
function wrapCentered(ctx: CanvasRenderingContext2D, text: string, y: number, maxWidth: number, lineHeight: number): number {
  const words = text.split(' ')
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, W / 2, y)
      y += lineHeight
      line = word
    } else line = test
  }
  if (line) ctx.fillText(line, W / 2, y)
  return y + lineHeight
}

async function header(ctx: CanvasRenderingContext2D, color: string) {
  const logo = await loadImage(`${import.meta.env.BASE_URL}logo.svg`).catch(() => null)
  ctx.font = `700 76px ${SCRIPT}`
  const label = "L'oreille"
  const textW = ctx.measureText(label).width
  const size = 96
  const x = (W - (size + 24 + textW)) / 2
  if (logo) ctx.drawImage(logo, x, 70, size, size)
  ctx.fillStyle = color
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, x + size + 24, 122)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
}

function footer(ctx: CanvasRenderingContext2D, color: string) {
  ctx.fillStyle = color
  ctx.font = `700 50px ${SCRIPT}`
  ctx.fillText("Tu penses avoir l'oreille absolue ?", W / 2, H - 150)
  ctx.fillText('Prouve-le !', W / 2, H - 88)
}

async function drawScore(ctx: CanvasRenderingContext2D, s: ScoreShare) {
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#6f5ff0')
  bg.addColorStop(1, '#4a3ccf')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
  await header(ctx, '#ffffff')
  const ear = await loadImage(s.tierImage).catch(() => null)
  if (ear) ctx.drawImage(ear, (W - 420) / 2, 210, 420, 420)
  ctx.fillStyle = '#ffffff'
  ctx.font = `500 50px ${SANS}`
  ctx.fillText(`${s.game} · Niveau ${s.level}`, W / 2, 710)
  ctx.font = `700 210px ${SANS}`
  ctx.fillText(fmt(s.points), W / 2, 900)
  ctx.font = `500 48px ${SANS}`
  ctx.fillText('points', W / 2, 975)
  ctx.fillText(`${s.correct} / ${s.total} bonne${s.correct > 1 ? 's' : ''} réponse${s.correct > 1 ? 's' : ''}`, W / 2, 1040)
  footer(ctx, 'rgba(255, 255, 255, 0.85)')
}

async function drawTrophy(ctx: CanvasRenderingContext2D, s: TrophyShare) {
  ctx.fillStyle = CREAM
  ctx.fillRect(0, 0, W, H)
  await header(ctx, VIOLET)
  ctx.fillStyle = VIOLET
  ctx.font = `700 44px ${SANS}`
  ctx.letterSpacing = '4px'
  ctx.fillText('TROPHÉE DÉBLOQUÉ', W / 2, 290)
  ctx.letterSpacing = '0px'
  // Tuile carrée comme sur l'accueil : la teinte de la catégorie du jeu et son icône (GOAT), sinon l'emoji du trophée.
  const size = 380
  const cx = W / 2
  const cy = 360 + size / 2
  ctx.shadowColor = 'rgba(45, 48, 71, 0.18)'
  ctx.shadowBlur = 36
  ctx.shadowOffsetY = 14
  ctx.fillStyle = s.game ? CATEGORY_COLORS[gameCategory(s.game)] : TROPHY_TILE
  ctx.fillRect(cx - size / 2, cy - size / 2, size, size)
  ctx.shadowColor = 'transparent'
  if (s.game) {
    const icon = await svgImage(gameIconSvg(s.game, INK)).catch(() => null)
    if (icon) ctx.drawImage(icon, cx - 130, cy - 130, 260, 260)
  } else {
    ctx.font = `200px ${SANS}`
    ctx.textBaseline = 'middle'
    ctx.fillText(s.icon, cx, cy + 10)
    ctx.textBaseline = 'alphabetic'
  }
  ctx.fillStyle = INK
  ctx.font = `700 92px ${SANS}`
  ctx.fillText(s.title, W / 2, 860)
  let y = 940
  if (s.tier) {
    ctx.font = `500 48px ${SANS}`
    ctx.fillText(s.tier, W / 2, y)
    y += 74
  }
  ctx.fillStyle = MEDIUM
  ctx.font = `400 42px ${SANS}`
  wrapCentered(ctx, s.condition, y, 880, 56)
  footer(ctx, MEDIUM)
}

async function drawRank(ctx: CanvasRenderingContext2D, s: RankShare) {
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#e7ddf3')
  bg.addColorStop(1, CREAM)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
  await header(ctx, VIOLET)
  // Le jeu : son icône et son nom.
  ctx.font = `700 50px ${SANS}`
  const tw = ctx.measureText(s.game).width
  const iconSize = 72
  const x = (W - (iconSize + 20 + tw)) / 2
  const icon = await svgImage(gameIconSvg(s.gameId, INK)).catch(() => null)
  if (icon) ctx.drawImage(icon, x, 250, iconSize, iconSize)
  ctx.fillStyle = INK
  ctx.textAlign = 'left'
  ctx.fillText(s.game, x + iconSize + 20, 304)
  ctx.textAlign = 'center'
  // Podium : 2, 1, 3 ; la marche du joueur est mise en avant.
  const base = 840
  const steps = [
    { place: 2, x: 170, h: 250, color: '#c9c7d8' },
    { place: 1, x: 410, h: 400, color: '#f3c64e' },
    { place: 3, x: 650, h: 190, color: '#dca06a' },
  ]
  for (const step of steps) {
    const mine = step.place === s.rank
    ctx.globalAlpha = s.rank <= 3 && !mine ? 0.55 : 1
    ctx.fillStyle = step.color
    ctx.fillRect(step.x, base - step.h, 260, step.h)
    if (mine) {
      ctx.strokeStyle = VIOLET
      ctx.lineWidth = 10
      ctx.strokeRect(step.x + 5, base - step.h + 5, 250, step.h - 10)
    }
    ctx.fillStyle = INK
    ctx.font = `700 ${step.place === 1 ? 120 : 80}px ${SANS}`
    ctx.fillText(String(step.place), step.x + 130, base - step.h / 2 + 36)
    ctx.globalAlpha = 1
  }
  ctx.fillStyle = INK
  // Le rang, avec son « er » ou « e » en exposant.
  const big = `700 84px ${SANS}`
  const sup = `700 48px ${SANS}`
  const suffix = s.rank === 1 ? 'er' : 'e'
  const rest = ` ${s.where}`
  ctx.font = big
  const numW = ctx.measureText(String(s.rank)).width
  const restW = ctx.measureText(rest).width
  ctx.font = sup
  const supW = ctx.measureText(suffix).width
  let rx = (W - (numW + supW + restW)) / 2
  ctx.textAlign = 'left'
  ctx.font = big
  ctx.fillText(String(s.rank), rx, 980)
  rx += numW
  ctx.font = sup
  ctx.fillText(suffix, rx, 980 - 34)
  rx += supW
  ctx.font = big
  ctx.fillText(rest, rx, 980)
  ctx.textAlign = 'center'
  ctx.font = `500 50px ${SANS}`
  ctx.fillText(`${s.name} · ${fmt(s.points)} pts`, W / 2, 1060)
  footer(ctx, MEDIUM)
}

/** Dessine l'image de partage ; renvoie un PNG. */
export async function renderShareImage(content: ShareContent): Promise<Blob> {
  await Promise.all([
    document.fonts.load(`700 76px ${SCRIPT}`),
    document.fonts.load(`700 92px ${SANS}`),
    document.fonts.load(`500 48px ${SANS}`),
  ]).catch(() => {})
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  ctx.textAlign = 'center'
  if (content.kind === 'score') await drawScore(ctx, content)
  else if (content.kind === 'trophy') await drawTrophy(ctx, content)
  else await drawRank(ctx, content)
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('canvas'))), 'image/png'))
}

const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })

/** Texte qui accompagne l'image. */
function caption(content: ShareContent): string {
  if (content.kind === 'score') return `${fmt(content.points)} points à « ${content.game} » sur L'oreille. Tu fais mieux ?`
  if (content.kind === 'trophy') return `Trophée « ${content.title} » débloqué sur L'oreille !`
  return `${ordinal(content.rank)} ${content.where} à « ${content.game} » sur L'oreille. Tu fais mieux ?`
}

/**
 * Ouvre le partage du téléphone avec l'image. Dans l'appli : fichier temporaire puis partage natif ;
 * dans un navigateur : partage web si possible, sinon l'image est téléchargée.
 */
export async function shareImage(content: ShareContent): Promise<void> {
  const blob = await renderShareImage(content)
  const text = caption(content)
  const filename = `oreille-${content.kind}.png`
  if (Capacitor.isNativePlatform()) {
    const { uri } = await Filesystem.writeFile({ path: filename, data: await blobToBase64(blob), directory: Directory.Cache })
    await Share.share({ text, files: [uri], dialogTitle: 'Partager' })
    return
  }
  const file = new File([blob], filename, { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], text }).catch(() => {})
    return
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
