# Velours — casino virtuel

Casino de démonstration en HTML/CSS/JS pur (aucune dépendance, aucun build).
Crédits **100 % virtuels**, stockés dans le navigateur — aucun argent réel.

## Jeux

### Roulette européenne (`roulette.html`)
- Roue dessinée sur canvas : jante en bois, piste, losanges, cylindre en laiton, frettes chromées, tourelle.
- Bille simulée physiquement : lancée sur la piste, elle ralentit, descend en spirale, peut heurter
  les losanges, rebondit et saute par-dessus les frettes avant de se poser. Le numéro gagnant est
  la case où elle s'arrête réellement.
- Vue 3D inclinée ou vue de dessus, mode turbo, sons synthétisés (WebAudio).
- Tapis complet : pleins, chevaux, transversales, carrés, sixains, 0-1-2-3, douzaines, colonnes, chances simples.
- Racetrack : voisins (±1/±2/±3), Tiers du cylindre, Orphelins, Voisins du zéro, Jeu zéro.
- Annuler, effacer, rejouer, doubler ; historique, statistiques, numéros chauds/froids.

### Blackjack (`blackjack.html`)
- Sabot de 6 jeux, mélange à ~75 %, le croupier reste sur tous les 17, BJ payé 3:2.
- Tirer, rester, doubler (y compris après séparation), séparer jusqu'à 4 mains, assurance, abandon tardif.
- Side bets : Perfect Pairs, 21+3, Lucky Ladies, Bust It.
- Conseils de stratégie de base (optionnels), raccourcis clavier, statistiques de session.

## Lancer en local

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```
