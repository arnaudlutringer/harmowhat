# HarmoWhat

App Ionic + Capacitor + Vue 3 pour tester son oreille (absolue et harmonique) à travers des mini-jeux.

## Démarrer

```bash
npm install
npm run samples      # télécharge les sons des instruments (hors piano)
npm run dev          # navigateur, http://localhost:5173
npm test             # tests unitaires (vitest)
npm run build        # build web dans dist/
```

Mobile (Capacitor) :

```bash
npm run build
npx cap add android   # ou ios, une seule fois
npx cap sync
npx cap open android  # ou ios
```

## Mini-jeux

| Route | Jeu |
|---|---|
| `/games/grave-ou-aigu` | « Grave ou aigu ? » : une touche de piano au hasard (La0 → Do8, hors La3), plus grave ou plus aiguë que le La3 ? |
| `/games/quelle-note` | « Quelle est la note ? » : écran de réglages (10, 20, 30 ou 50 questions ; niveau débutant, normal ou expert), puis une touche au hasard à retrouver parmi plusieurs noms de note (sans octave). Les niveaux sont définis dans `src/games/nameTheNote.ts`. |
| `/games/harmonies` | « Les harmonies » : réglages (10 à 50 questions ; difficulté débutant, normal ou expert ; précision simple ou précise), puis deux notes jouées l'une après l'autre : on nomme l'intervalle (tierce mineure, quarte augmentée…). Plus le niveau monte, plus il y a de propositions ; en expert, il faut aussi dire si l'intervalle est ascendant ou descendant. À la réponse, les deux notes s'affichent sur une portée. Pas de diapason. Logique dans `src/games/intervals.ts`. |
| `/games/accords` | « Les accords » : 3 notes au hasard entre La2 et La4 jouées ensemble ; on coche les 3 notes parmi 8 propositions (chacune avec son bouton d'écoute), on valide, la carte se retourne et montre l'accord sur une portée (clé de sol ou de fa selon le registre). Question suivante en glissant le doigt vers la gauche. |

Une partie compte 20 questions par défaut. La note ou l'accord de chaque question est joué automatiquement ; le bouton de lecture pulse et change de couleur tant que le son dure. Tous les sons s'arrêtent dès qu'on change d'écran (nouvelle question, fin de partie, retour). Les propositions de notes sont écrites en dièse ou en bémol, jamais deux fois la même note sous deux noms (`src/music/spelling.ts`).

Diapason (La3, 440 Hz, 2 s) : en haut à droite, uniquement pendant les questions. Les jeux sans diapason pendant les questions (« Quelle est la note ? » en expert, « Les harmonies ») passent, après les réglages, par un écran « Je suis prêt » où l'on peut l'écouter (`src/views/ReadyPage.vue`).

Bouton retour du téléphone (`src/App.vue`, plugin `@capacitor/app`) : coupe le son et revient à l'écran précédent ; pendant une partie, une popin propose de quitter (retour à l'accueil) ; sur l'accueil, l'appli passe en arrière-plan au lieu de se fermer. Pas de bouton Retour dans l'en-tête des jeux.

Points (`src/games/scoring.ts`) : chaque question part de 1000 points, affichés en haut à gauche. Le décompte commence à la fin de la première écoute, 1 point toutes les 10 ms (0 au bout de 10 s). Chaque réécoute et chaque coup de diapason coûte 100 points. Une bonne réponse rapporte les points restants, une mauvaise 0.

Écran de fin : total des points, nombre de bonnes réponses, une icône de note par question (verte si juste, rouge sinon), « Rejouer » avec les mêmes réglages. La musique de fin (`src/music/endings.ts`) est le début du « Printemps » de Vivaldi (partie de violon) si l'instrument choisi est le violon, sinon celui de « La Lettre à Élise » de Beethoven, avec autant de % de notes faussées d'un demi-ton que de % de mauvaises réponses.

Style « Partition pop » (`src/theme/variables.css`) : fond crème #FFF7EC, en-tête violet #6C5CE7 sur une ligne, une couleur vive par jeu sur l'accueil (2 colonnes, angles droits, texte blanc), boutons de réponse blancs à angles droits, bouton de lecture rond violet qui passe en corail pendant le son.

## Organisation

- `src/audio/engine.ts` : tout le son (notes, diapason, musiques de fin) joué en Web Audio à partir de vrais enregistrements de piano embarqués dans `public/samples/piano/` (fonctionne hors ligne).
- `src/music/notes.ts` : notes MIDI, fréquences, noms français (La3 = 440 Hz).
- `src/composables/useQuiz.ts` : déroulé commun (20 questions, score, message, fin de partie).
- `src/components/GameShell.vue` : écran de jeu commun (en-tête, diapason, bouton lecture, message, résultat).
- `src/components/ChordStaff.vue` : portée dessinée avec [VexFlow](https://www.vexflow.com/) (MIT, police Bravura embarquée).
- `src/views/` : l'accueil et un fichier par mini-jeu. Pour ajouter un jeu : une vue qui utilise `useQuiz` + `GameShell`, une route, une carte sur l'accueil.

## Notation

Convention française : l'octave 3 contient le La 440 Hz, donc Do3 = C4 (do central), La-1 = A0 (touche la plus grave), Do7 = C8 (la plus aiguë).

## Sons et licence

Les notes de piano viennent du [Salamander Grand Piano V3](https://archive.org/details/SalamanderGrandPianoV3) d'Alexander Holm, sous licence [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) (conversion MP3 du paquet npm `@audio-samples/piano-mp3-velocity8`). Un échantillon toutes les tierces mineures, de La0 à Do8, nommé par numéro MIDI ; les notes intermédiaires sont décalées d'un demi-ton au plus. Violon, violoncelle, clarinette, trompette et accordéon viennent du [Musyng Kite SoundFont](https://github.com/gleitz/midi-js-soundfonts) (rendu MP3 de Benjamin Gleitzman), sous licence [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/), téléchargés par `npm run samples` (volume équilibré dans `src/audio/instruments.ts`) ; détails dans `public/samples/<instrument>/LICENSE.txt`. La licence impose de créditer l'auteur : le crédit est affiché en bas de l'accueil et détaillé dans `public/samples/piano/LICENSE.txt`.
