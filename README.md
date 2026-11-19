# Garage Atlas Auto

Projet en deux dossiers :

| Dossier | Contenu | Port |
|---|---|---|
| `garage-api` | Back-end Spring Boot 3 (Java 17+) | 8080 |
| `garage-web` | Front-end Angular 22 | 4200 |

## Prérequis (back-end)

- Java 17 ou plus
- Maven 3.9+ (ou le wrapper si vous en ajoutez un)
- MySQL 8 uniquement pour le profil `prod`

## Lancer le back-end en développement (H2)

```bash
cd garage-api
mvn spring-boot:run
```

Le profil `dev` est actif par défaut :

- base **H2 en mémoire** : elle repart à zéro à chaque démarrage, avec les données de départ (5 clients, 8 véhicules, 10 pièces, 6 interventions, 10 lignes) ;
- console H2 : <http://localhost:8080/h2-console> — JDBC URL `jdbc:h2:mem:garage`, utilisateur `sa`, mot de passe vide ;
- test rapide : <http://localhost:8080/api/ping> ;
- documentation interactive (bonus) : <http://localhost:8080/swagger-ui.html>.

## Lancer avec MySQL (profil `prod`)

1. Créer la base et un utilisateur dédié (pas de `root` dans l'application) :

```sql
CREATE DATABASE garage_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'garage_user'@'localhost' IDENTIFIED BY 'choisissez-un-mot-de-passe';
GRANT ALL PRIVILEGES ON garage_db.* TO 'garage_user'@'localhost';
FLUSH PRIVILEGES;
```

2. Définir les variables d'environnement (aucun secret n'est écrit dans le dépôt) :

| Variable | Rôle | Obligatoire |
|---|---|---|
| `DB_USER` | utilisateur MySQL | oui |
| `DB_PASSWORD` | mot de passe MySQL | oui |
| `DB_URL` | URL JDBC (défaut : `jdbc:mysql://localhost:3306/garage_db?...`) | non |
| `CORS_ORIGIN` | origine du front autorisée (défaut : `http://localhost:4200`) | non |

3. Lancer :

```bash
# Linux / macOS
export DB_USER=garage_user DB_PASSWORD=...
mvn spring-boot:run -Dspring-boot.run.profiles=prod

# Windows (PowerShell)
$env:DB_USER="garage_user"; $env:DB_PASSWORD="..."
mvn spring-boot:run "-Dspring-boot.run.profiles=prod"
```

Le schéma est créé avec `ddl-auto: update` (il n'efface jamais les données). Les données de départ ne sont chargées que si la table des clients est vide.

## Tests

```bash
cd garage-api
mvn test
```

Les tests utilisent H2 et ne chargent pas les données de départ (`app.seed.enabled=false`).

## Format des erreurs (toutes les erreurs de l'API)

```json
{
  "horodatage": "2026-11-16T10:15:30.123",
  "code": 400,
  "message": "Les données envoyées sont invalides",
  "erreurs": { "immatriculation": "Format attendu : AB-123-CD" }
}
```

`erreurs` (champ → message) est rempli pour une validation (400) ou un doublon (409) ; sinon il est vide.


## Points d'accès de l'API

Les listes (`GET` sans identifiant) renvoient une page : `contenu`, `page`, `taille`, `totalElements`, `totalPages`. Paramètres : `page` (défaut 0), `taille` (défaut 10) et, selon la ressource, `recherche`, `statut`, `categorie` ou `clientId`.

| Ressource | Points d'accès | Codes |
|---|---|---|
| Ping | `GET /api/ping` | 200 |
| Clients | `GET /api/clients`, `GET /api/clients/{id}`, `GET /api/clients/{id}/vehicules`, `POST`, `PUT /{id}`, `DELETE /{id}` | 200, 201, 204, 400, 404, 409 (client avec véhicules) |
| Véhicules | `GET /api/vehicules`, `GET /{id}`, `GET /{id}/interventions`, `GET /statistiques`, `POST`, `PUT /{id}`, `PATCH /{id}/statut`, `DELETE /{id}` | 200, 201, 204, 400, 404, 409 (immatriculation en double, transition interdite, interventions existantes) |
| Pièces | `GET /api/pieces`, `GET /{id}`, `GET /alertes`, `GET /statistiques`, `POST`, `PUT /{id}`, `PATCH /{id}/stock`, `DELETE /{id}` | 200, 201, 204, 400, 404, 409 (stock insuffisant, pièce utilisée) |
| Interventions | `GET /api/interventions/{id}`, `GET /statistiques`, `POST`, `PUT /{id}`, `DELETE /{id}`, `POST /{id}/lignes`, `DELETE /{id}/lignes/{ligneId}` | 200, 201, 204, 400, 404, 409 (stock insuffisant) |

Statuts d'un véhicule : `EN_ATTENTE` → `EN_REPARATION` → `TERMINE` → `LIVRE` (et `TERMINE` → `EN_REPARATION`). Toute autre transition renvoie 409.

## MySQL avec XAMPP : dépannage

| Erreur dans le log | Cause | Solution |
|---|---|---|
| `Communications link failure` / `Connection refused` | MySQL n'est pas démarré | Démarrer MySQL dans XAMPP (port 3306), puis relancer |
| `Access denied for user '${DB_USER}'` | Variables d'environnement absentes | Les définir dans la configuration de lancement (`DB_USER=garage_user;DB_PASSWORD=...`) |
| `Access denied for user 'garage_user'` | Utilisateur absent ou mauvais mot de passe | Le recréer avec les commandes SQL ci-dessus (`DROP USER IF EXISTS`, puis `CREATE USER` et `GRANT`) |
| `HHH000511 ... 5.5.5` | XAMPP utilise MariaDB, qui annonce la version 5.5.5 | Sans gravité (avertissement) |

Au deuxième démarrage, le log affiche `Base non vide : données de départ ignorées` : les données ont été conservées.

## Documentation interactive

Swagger UI : <http://localhost:8080/swagger-ui.html> (définition OpenAPI : `/v3/api-docs`).
