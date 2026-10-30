# Trophées : proposition

47 trophées, en 8 familles (pas de trophée de classement pour le lancement). Les trophées GOAT existent en trois niveaux (Débutant, Normal, Expert) : avec eux, on arrive à 67 médailles à collectionner.

Un « questionnaire » est une partie complète (hors mode essai). Tout est calculé sur l'appareil.

## 1. Découverte (6)

| Trophée | Condition |
|---|---|
| Premiers pas | Termine ton premier questionnaire |
| Bien préparé | Terminer le tutoriel |
| Curieux | Essaie une question dans le mode essai |
| Touche-à-tout | Termine un questionnaire dans chacune des 4 catégories (L'oreille, La voix, Le solfège, Le rythme) |
| Explorateur | Termine un questionnaire dans les 12 jeux |
| Homme-orchestre | Joue un questionnaire avec 5 instruments différents |

## 2. Sans faute (5)

| Trophée | Condition |
|---|---|
| Sans faute | Un questionnaire sans aucune erreur |
| Oreille de lynx | Un questionnaire sans faute en expert |
| Sans filet | Un questionnaire sans faute sans toucher au diapason |
| Marathonien | Un questionnaire de 50 questions sans faute |
| Grand chelem | Au moins un sans faute dans chacun des 12 jeux |

## 3. Rapidité (5)

| Trophée | Condition |
|---|---|
| Rapide | Toutes les réponses d'un questionnaire à 7 000 points ou plus |
| Très rapide | Toutes les réponses d'un questionnaire à 8 000 points ou plus |
| Fulgurant | Toutes les réponses d'un questionnaire à 9 000 points ou plus |
| Éclair | Une bonne réponse à 10 000 points |
| Réflexe | 10 bonnes réponses de suite à 9 000 points ou plus |

## 4. GOAT, 10 000 points à chaque question d'un questionnaire (10 × 3 niveaux)

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
