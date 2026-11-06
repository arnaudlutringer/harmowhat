# Trophées : proposition

59 trophées, en 9 familles (pas de trophée de classement pour le lancement). Les trophées GOAT existent en quatre niveaux (Débutant, Normal, Expert, et Impossible une fois débloqué) : avec eux, on arrive à 89 médailles à collectionner.

Un « questionnaire » est une partie complète (hors mode essai). Tout est calculé sur l'appareil.

## 1. Découverte (6)

| Trophée | Condition |
|---|---|
| Premiers pas | Termine ton premier questionnaire |
| Bien préparé | Terminer le tutoriel |
| Curieux | Essaie une question dans le mode essai |
| Touche-à-tout | Termine un questionnaire dans chacune des 5 catégories (L'oreille, La voix, Le solfège, Le rythme, Le tempo) |
| Explorateur | Termine un questionnaire dans les 16 jeux |
| Homme-orchestre | Joue un questionnaire avec 5 instruments différents |

## 2. Sans faute (5)

| Trophée | Condition |
|---|---|
| Sans faute | Un questionnaire sans aucune erreur |
| Oreille de lynx | Un questionnaire sans faute en expert |
| Sans filet | Un questionnaire sans faute sans toucher au diapason |
| Marathonien | Un questionnaire de 30 questions sans faute |
| L'impossible n'existe pas | Débloque un niveau Impossible : un questionnaire expert d'au moins 10 questions sans faute, à plus de 9 000 points par question |
| Grand chelem | Au moins un sans faute dans chacun des 16 jeux |

## 3. Rapidité (5)

| Trophée | Condition |
|---|---|
| Rapide | Toutes les réponses d'un questionnaire à 7 000 points ou plus |
| Très rapide | Toutes les réponses d'un questionnaire à 8 000 points ou plus |
| Fulgurant | Toutes les réponses d'un questionnaire à 9 000 points ou plus |
| Éclair | Une bonne réponse à 10 000 points |
| Réflexe | 10 bonnes réponses de suite à 9 000 points ou plus |

## 4. GOAT, 10 000 points à chaque question d'un questionnaire d'au moins 10 questions (16 jeux, 💎 en impossible quand le jeu en a un)

Les 10 000 points s'obtiennent en répondant pendant la marge de 0,3 s qui précède le décompte des points (GRACE_MS dans src/games/scoring.ts).

Un titre par jeu, avec une médaille bronze (Débutant), argent (Normal) ou or (Expert).

| Jeu | Titre |
|---|---|
| Grave ou aigu ? | Sismographe |
| Quelle est la note ? | Oreille absolue |
| Les accords | Maître des accords |
| Les harmonies | Maître des intervalles |
| La modalité | Mage des modes |
| Chante la note | Voix d'or |
| Chante l'harmonie | Chœur à lui tout seul |
| Lecture de note | Déchiffreur |
| Fais l'harmonie | Architecte de l'harmonie |
| La tonalité | Maître des clés |
| Quel rythme ? | Métronome humain |
| Joue le rythme | Batteur de génie |
| Garde le tempo | Horloge atomique |
| Trouve le tempo | Métronome dans la tête |
| Chante en continu | Chanteur à vue (30 000 points en une partie) |
| Lecture continue | Lecteur éclair (30 000 points en une partie) |

## 5. Persévérance (7)

| Trophée | Condition |
|---|---|
| Habitué | 10 questionnaires terminés |
| Passionné | 50 questionnaires terminés |
| Accro | 100 questionnaires terminés |
| Légende | 500 questionnaires terminés |
| Mille bravos | 1 000 bonnes réponses au total |
| Régulier | Jouer 7 jours de suite |
| Fidèle | Jouer 30 jours de suite |

## 6. La voix (5)

| Trophée | Condition |
|---|---|
| Juste | Chanter une note à 5 cents près |
| Diapason humain | Chanter un La à 2 cents près |
| Chef de chœur | 10 harmonies chantées justes au total |
| Grand écart | Chanter juste une octave dans « Chante l'harmonie » |
| Gamme complète | Chanter juste les 12 notes (au total, dans « Chante la note ») |

## 7. L'oreille et le solfège (6)

| Trophée | Condition |
|---|---|
| Diable en musique | Trouver une quarte augmentée (le triton) dans « Les harmonies » |
| Les sept modes | Reconnaître les 7 modes au moins une fois chacun |
| Toutes les clés | Lire juste une note en clé de sol, de fa et d'ut |
| Armures au complet | Trouver les 15 tonalités majeures au moins une fois chacune |
| Accords parfaits | 10 accords trouvés en entier au total |
| Lecteur aguerri | 100 notes lues justes au total |

## 8. Clins d'œil (3)

| Trophée | Condition |
|---|---|
| Virtuose | Entendre sa musique de fin jouée sans aucune fausse note (un sans faute) |
| La catastrophe | Terminer un questionnaire sans aucune bonne réponse |
| Mélomane | Écouter les morceaux de fin de son instrument dans les paramètres |

## Pour la mise en place

- Une page « Mes trophées », depuis l'accueil et l'écran de résultat : les trophées gagnés en couleur, les autres grisés avec leur condition, et un compteur (par exemple « 12 / 47 »).
- En fin de questionnaire, chaque nouveau trophée s'annonce dans une popin blanche, qui s'envole au bout de 2 s vers « Mes trophées » en haut à droite.
- Les scores enregistrés ne gardent que les 10 meilleurs de chaque classement. Il faudra donc tenir à part, sur l'appareil, les compteurs dont certains trophées ont besoin : questionnaires joués, jours de suite, bonnes réponses, notes chantées, modes, tonalités…

## Le tempo

| Trophée | Condition |
|---|---|
| Comme une horloge | Tiens 2 minutes de suite dans « Garde le tempo » |
| Infatigable | Tiens 5 minutes de suite dans « Garde le tempo » |
| Grand huit | Dans une même partie de « Garde le tempo », tiens un palier sous 60 et un autre au-dessus de 140 |
| Tempo giusto | Trouve un tempo pile, sans un battement d'écart, au curseur de « Trouve le tempo » |
| Chef d'orchestre | Trouve 20 tempos au total dans « Trouve le tempo » |

## La lecture en défilement

« Chante en continu » et « Lecture continue » (interrupteurs lectureChantee et lectureParlee dans src/config/features.ts) : une partie dure jusqu'à la première erreur. Leur médaille de niveau (et leur « sans faute ») vient d'une partie à 10 000 points, leur GOAT d'une partie à 30 000 points.

| Trophée | Condition |
|---|---|
| Lecture à vue | Lis 20 notes d'affilée dans « Chante en continu » ou « Lecture continue » |
| Prima vista | Lis une note à 100 à la noire ou plus dans « Chante en continu » ou « Lecture continue » |

## Défi du jour

| Trophée | Condition |
|---|---|
| Défi relevé | Relève un défi du jour : au moins 80 % de bonnes réponses |
| Abonné aux défis | Relève 7 défis du jour |

## Médailles de niveau (hors trophées)

Chaque jeu a une médaille par niveau, affichée sur sa carte de l'accueil et sur les tuiles de ses réglages : 🥉 pour un questionnaire complet d'au moins 10 questions sans faute en débutant, 🥈 en normal (ou intermédiaire), 🥇 en expert, 👑 en impossible. La médaille du GOAT, elle, est le diamant 💎, avec le niveau le plus haut où il a été gagné.
