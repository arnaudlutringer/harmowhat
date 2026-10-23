// Produit les PNG sources de assets/ (lus par `npx capacitor-assets generate`)
// à partir du dessin de public/logo.svg : mosaïque des quatre jeux + croche violette.
import { mkdirSync } from 'node:fs'
import sharp from 'sharp'

const OUT = 'assets'
mkdirSync(OUT, { recursive: true })

// Mosaïque en 160×160 (même repère que public/logo.svg).
const mosaic = `
  <rect x="0" y="0" width="80" height="80" fill="#ff7675" />
  <rect x="80" y="0" width="80" height="80" fill="#0984e3" />
  <rect x="0" y="80" width="80" height="80" fill="#00a884" />
  <rect x="80" y="80" width="80" height="80" fill="#e17055" />`

// Cercle blanc + croche, centrés sur (80, 80).
const note = `
  <circle cx="80" cy="80" r="36" fill="#ffffff" />
  <ellipse cx="73" cy="94" rx="12" ry="9" transform="rotate(-20 73 94)" fill="#6c5ce7" />
  <path d="M84 92 V56 Q100 64 96 80" fill="none" stroke="#6c5ce7" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />`

const svg = (size, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${body}</svg>`

// Place un dessin du repère 160×160 au centre d'un canevas, à l'échelle donnée.
const centered = (size, scale, body) =>
  `<g transform="translate(${size / 2} ${size / 2}) scale(${scale}) translate(-80 -80)">${body}</g>`

const render = (name, source) =>
  sharp(Buffer.from(source)).png().toFile(`${OUT}/${name}`).then(() => console.log(`${OUT}/${name}`))

const ICON = 1024
const SPLASH = 2732
const LOGO_ON_SPLASH = 640

// Icône pleine (iOS, Android ancien format) : carré plein, l'OS arrondit lui-même.
await render('icon-only.png', svg(ICON, centered(ICON, ICON / 160, mosaic + note)))

// Icône adaptative Android : la mosaïque en fond, le cercle et la croche au premier plan.
// capacitor-assets pose ces images avec un retrait de 16,7 % : le canevas source correspond
// donc aux 72 dp visibles (66 % des 108 dp). Le cercle garde la taille du logo (45 % du
// visible, soit ~30 % du canevas complet) et reste bien dans la zone sûre centrale.
await render('icon-background.png', svg(ICON, centered(ICON, ICON / 160, mosaic)))
await render('icon-foreground.png', svg(ICON, centered(ICON, ICON / 160, note)))

// Écrans de démarrage : le logo arrondi au centre.
const roundedLogo = `
  <defs><clipPath id="tile"><rect width="160" height="160" rx="36" /></clipPath></defs>
  <g clip-path="url(#tile)">${mosaic}</g>${note}`
for (const [name, bg] of [['splash.png', '#ffffff'], ['splash-dark.png', '#121212']]) {
  await render(name, svg(SPLASH, `<rect width="${SPLASH}" height="${SPLASH}" fill="${bg}" />` +
    centered(SPLASH, LOGO_ON_SPLASH / 160, roundedLogo)))
}
