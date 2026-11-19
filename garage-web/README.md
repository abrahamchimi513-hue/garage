# garage-web : interface Angular du Garage Atlas Auto

Front du devoir « CRUD complet Angular et Spring Boot ». Angular 22, composants standalone,
formulaires réactifs typés, `HttpClient`, syntaxe `@if` / `@for`, signaux pour l'état des écrans.

## Prérequis

- Node.js 20.19+ (ou 22+) et npm
- Le back `garage-api` démarré sur `http://localhost:8080` (profil `dev` ou `prod`)

## Lancement

```bash
npm install
npm start          # http://localhost:4200
```

Le back doit autoriser **uniquement** l'origine `http://localhost:4200` (CORS).
Si `npm install` refuse une version d'Angular, générez un projet avec `ng new garage-web`
puis recopiez le dossier `src/` à la place du sien.

## Où changer l'adresse de l'API

À un seul endroit : `src/environments/environment.ts` (`apiUrl`).

## Structure

```
src/app/
  models/       types TypeScript (miroir des DTO) et enums fermés
  services/     un service HttpClient par entité + notifications + ping
  components/   navbar, notification, badge, pagination, spinner, icônes, bar-list, carte d'intervention
  pages/        tableau de bord, clients, véhicules, fiche véhicule, pièces, 404
  utils/        validateurs, messages d'erreur, support de formulaire, formats
  app.config.ts, app.routes.ts
```

## Routes

`/` redirige vers `/tableau-de-bord` · `/vehicules` · `/vehicules/nouveau` · `/vehicules/:id/modifier` ·
`/vehicules/:id` (fiche) · `/pieces` · `/pieces/nouveau` · `/pieces/:id/modifier` ·
`/clients` · `/clients/nouveau` · `/clients/:id/modifier` · `**` (page 404).
Les routes d'une entité sont imbriquées pour que la navigation relative `..` ramène à la liste.

## Contrat avec l'API (à vérifier côté Spring)

| Sujet | Attendu par le front |
|---|---|
| Page | `{ contenu, page, taille, totalElements, totalPages }` |
| Paramètres de liste | `page` (à partir de 0), `taille`, `recherche`, `statut`, `categorie`, `clientId` |
| Véhicule | `id, immatriculation, marque, modele, annee, kilometrage, carburant, statut, dateEntree, coutEstime, panne, clientId, clientNom` |
| Intervention | `id, vehiculeId, type, description, dateDebut, dateFin, mainOeuvre, lignes[], total` |
| Ligne | `id, pieceId, pieceReference?, pieceDesignation, quantite, prixUnitaire` |
| `PATCH /vehicules/{id}/statut` | corps `{ "statut": "EN_REPARATION" }` |
| `PATCH /pieces/{id}/stock` | corps `{ "type": "ENTREE" \| "SORTIE", "quantite": 5 }`, renvoie la pièce |
| Erreur | `{ timestamp, code, message, erreurs }` où `erreurs` est `{ champ: message }` ou `[{ champ, message }]` |
| Statistiques | voir `src/app/models/stats.ts` |

Si vos noms diffèrent, adaptez les fichiers de `models/` (et `stats.ts` pour le tableau de bord).

## Choix de conception

- **Signaux** pour l'état des écrans : l'état local (chargement, erreur, page courante) est
  synchrone et lu directement dans le gabarit ; RxJS reste réservé aux flux (recherche avec
  `debounceTime(300)`, `switchMap` pour annuler une requête obsolète).
- **Spinner** unique (`app-spinner`) pour tous les chargements : pages, listes, formulaires,
  boutons en cours d'envoi, vérification de l'API.
- **Icônes** : jeu SVG intégré (`icon.component.ts`), aucun emoji.
- **Design** : aucune ombre ; relief obtenu par bordures et aplats. Thème clair et sombre
  automatique. Mobile : tableaux transformés en cartes, menu repliable.
- **Validation** : mêmes règles que le serveur, messages en français ; les erreurs 400 et 409
  du serveur s'affichent sous le champ concerné ou en bandeau.
- **Dashboard** : aucun agrégat calculé dans Angular ; seule la largeur des barres est
  déduite des totaux fournis par le serveur (protégée contre la division par zéro).
