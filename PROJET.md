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

## État d'avancement (22/10/2026)

**Fait hors ligne** : l'app complète (4 onglets, fiches, formulaires, messagerie, réservation et pass simulés, profil, À propos, Espace Associations & Pros), l'état global (`AppContext`, persistance localStorage) et le validateur `sport-community/scripts/validate.mjs` (`npm run validate`).

**Données** : toutes les données « réelles » sont pour l'instant des **gabarits de démonstration** (`"demo": true`, nom préfixé `[DÉMO]`, champs réels à `null`, affichés « Non renseigné »). Aucune donnée réelle n'a été collectée : l'accès réseau du conteneur est bloqué.

## Reste à collecter (dès que l'accès réseau fonctionne)

Remplacer les entrées `[DÉMO]` de `src/data/associations.json`, `equipements.json` et `events.json` par des données réelles (`"demo": false`, `source`, `source_url`, `date_collecte`), puis lancer `npm run validate` (0 erreur attendue) et le contrôle par échantillon.

| Fichier | Volume visé | Source principale | Champs probablement `null` |
|---|---|---|---|
| `equipements.json` | 5 à 10 par ville | Data ES – « Recensement des équipements sportifs, espaces et sites de pratiques » (ministère des Sports) : https://www.data.gouv.fr/datasets/recensement-des-equipements-sportifs-espaces-et-sites-de-pratiques-2 · API : equipements.sports.gouv.fr | — |
| `associations.json` | 6 à 10 par ville (Toulouse : 10 max, sports variés) | API recherche-entreprises (recherche-entreprises.api.gouv.fr, filtre associations, code NAF 93.12Z « Activités de clubs de sports ») ; à défaut, le RNA : https://www.data.gouv.fr/datasets/repertoire-national-des-associations · Compléments : OpenStreetMap via Overpass (`leisure=sports_centre`, `leisure=fitness_centre`, `leisure=pitch`) pour le site web et le téléphone | horaires, tarifs, téléphone, site web |
| `events.json` | Tous les événements réels trouvés, datés après le 20/10/2026, sans remplissage | Sites officiels des organisateurs, des mairies et des offices de tourisme (Montauban, Castelsarrasin, Toulouse, Figeac, Rodez), calendrier de la Fédération française d'athlétisme | tarif, lieu précis |

**Codes INSEE des 5 villes** : à confirmer via geo.api.gouv.fr avant la collecte (ne pas les saisir de mémoire).

**Domaines à autoriser** dans l'environnement : `www.data.gouv.fr`, `static.data.gouv.fr`, `equipements.sports.gouv.fr`, `recherche-entreprises.api.gouv.fr`, `geo.api.gouv.fr`, `overpass-api.de`, ainsi que les sites des clubs, mairies et organisateurs. Pour ces derniers, inconnus à l'avance, l'accès complet est plus simple.

**Règles de collecte** : scripts dans `/scripts`, réponses brutes dans `/data-raw`, User-Agent explicite et respect des limites d'usage d'Overpass. Aucune donnée personnelle (pas de dirigeants, pas d'adresses de particuliers). Les fiches gardent « Pas encore d'avis » : il n'y a pas de champ `avis`.

**Après la collecte** : supprimer les réservations de démo qui pointent vers des structures `demo-*` (ou les rattacher à des structures réelles avec la mention « Réservation simulée »), puis créer `SOURCES.md` (sources, dates, points non vérifiés, résultat du contrôle par échantillon).
