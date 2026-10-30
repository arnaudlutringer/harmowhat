// Produit les PNG sources de assets/ (lus par `npx capacitor-assets generate`)
// à partir du dessin de public/logo.svg : l'oreille au trait blanche sur le violet de l'appli, une croche en exposant.
import { mkdirSync } from 'node:fs'
import sharp from 'sharp'

const OUT = 'assets'
mkdirSync(OUT, { recursive: true })

// Fond violet en 160×160 (même repère que public/logo.svg).
const background = `<rect x="0" y="0" width="160" height="160" fill="#6c5ce7" />`

// Oreille et croche blanches, dans le repère 160×160.
const art = `
  <g transform="translate(22 32) scale(0.19)" fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="34">
    <path d="M335.72 330.76C381.73 299.5 416 251.34 416 192a160 160 0 0 0-320 0v206.57c0 44.26 35.74 81.43 80 81.43c44.26 0 66.83-25.94 77.29-40 14.77-19.81 41.71-81.56 82.43-109.24" />
    <path d="M160 304V184c0-48.4 43.2-88 96-88c52.8 0 96 39.6 96 88" />
    <path d="M160 239c25-18 79.82-15 79.82-15 26 0 41.17 29.42 26 50.6 0 0-36.86 42.4-41.86 61.4" />
  </g>
  <ellipse cx="122" cy="50" rx="9" ry="6.5" transform="rotate(-20 122 50)" fill="#ffffff" />
  <path d="M130 48V18c0 10 12 12 12 24" fill="none" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />`

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
// Le dessin un peu réduit dans les icônes : la croche, en haut à droite, reste dans les masques ronds d'Android.
const ART_SCALE = 0.8

// Icône pleine (iOS, Android ancien format) : carré plein, l'OS arrondit lui-même.
await render('icon-only.png', svg(ICON, centered(ICON, ICON / 160, background) + centered(ICON, (ICON / 160) * ART_SCALE, art)))

// Icône adaptative Android : le violet en fond, l'oreille et la croche au premier plan.
// capacitor-assets pose ces images avec un retrait de 16,7 % : le canevas source correspond
// donc aux 72 dp visibles (66 % des 108 dp).
await render('icon-background.png', svg(ICON, centered(ICON, ICON / 160, background)))
await render('icon-foreground.png', svg(ICON, centered(ICON, (ICON / 160) * ART_SCALE, art)))

// Écrans de démarrage : le logo arrondi au centre.
const roundedLogo = `
  <defs><clipPath id="tile"><rect width="160" height="160" rx="36" /></clipPath></defs>
  <g clip-path="url(#tile)">${background}</g>${art}`
for (const [name, bg] of [['splash.png', '#ffffff'], ['splash-dark.png', '#121212']]) {
  await render(name, svg(SPLASH, `<rect width="${SPLASH}" height="${SPLASH}" fill="${bg}" />` +
    centered(SPLASH, LOGO_ON_SPLASH / 160, roundedLogo)))
}
