# Sport Community — Cahier des charges (référence)

Prototype mobile **front-end uniquement (sans backend)** — SAÉ Mini-entreprise, BUT TC2, présenté à un jury.
Code de l'app : dossier [`sport-community/`](sport-community/).

## Principe
**La CARTE d'abord, la COMMUNAUTÉ ensuite.**

## Pitch
> « Une seule carte pour les avantages sportifs locaux + une communauté de particuliers pour trouver partenaires, groupes et bons plans. »

## Cible
- **Utilisateurs** : sportifs amateurs, occasionnels, étudiants, vacanciers, résidents locaux.
- **Réseau** : associations, salles, organisateurs, sponsors locaux.

## Stack
Vite + React + Tailwind CSS + react-router-dom + lucide-react + qrcode.react.

## Contraintes techniques
- **Mobile-first** : sur desktop, l'app s'affiche dans un cadre de téléphone centré (~390×844) sur fond neutre.
- **Données** dans `/src/data/*.json`, **état** dans React Context.
- **Créations** (annonces, groupes, messages) persistées en **localStorage**.

## Contenu
- Interface **100 % en français**.
- Villes : **Castelsarrasin, Montauban, Toulouse, Figeac, Rodez**.
- Lieux, associations et événements = données RÉELLES et sourcées (source_url + date_collecte, null si introuvable). Utilisateurs, messages, annonces, groupes, offres sponsors, réservations = FICTIFS, assumés comme tels dans l'UI.
- **Pas de lorem ipsum.**

## Accessibilité
Contrastes corrects, boutons ≥ 44 px, `aria-label` sur les éléments interactifs.

## Charte graphique
Moderne, minimaliste, **mode clair ET sombre**.

| Rôle | Couleur |
|---|---|
| Primaire | Vert émeraude `#10B981` |
| Structure / fond sombre | Bleu nuit `#0F172A` |
| CTA (réserver, s'inscrire, promos) | Orange `#F97316` |
| Fond clair | `#F8FAFC` |

## Navigation
Barre basse à 4 onglets :
1. **Ma Carte** (accueil par défaut)
2. **Communauté**
3. **Événements**
4. **Explorer & Réserver**

Le **profil** s'ouvre via l'avatar en haut à droite.

## Modèle économique à refléter dans l'UI
- Offres sponsors natives marquées **« Sponsorisé »**.
- **« Frais de service »** affichés dans les réservations.
- Page vitrine **« Espace Associations & Pros »**.
- **« Annonce mise en avant »** affichée **« Bientôt disponible »**.
