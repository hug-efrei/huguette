# Huguette — Bibliothécaire Numérique

Interface web pixel art (style Pokémon FireRed) pour rechercher et acquérir des ebooks. Relie **Prowlarr** (indexeurs torrents) à **qBittorrent** et déverse les ouvrages dans le watchfolder de **Calibre**.

![Stack](https://img.shields.io/badge/stack-FastAPI%20%2B%20vanilla%20JS-c63a3a)
![Docker](https://img.shields.io/badge/deploy-Docker-2496ed)

---

## Sommaire

- [Prérequis](#prérequis)
- [Configuration](#configuration)
- [Installation — image Docker pré-construite](#installation--image-docker-pré-construite-recommandée)
- [Installation — Docker depuis le repo](#installation--docker-depuis-le-repo)
- [Installation — Python local](#installation--python-local-sans-docker)
- [Installation — systemd](#installation--systemd-production-sans-docker)
- [Script post-téléchargement (Calibre-Web-Automated)](#script-post-téléchargement-calibre-web-automated)
- [Mise à jour](#mise-à-jour)
- [Commandes utiles](#commandes-utiles)
- [Workflow de développement](#workflow-de-développement)
- [Architecture](#architecture)

---

## Prérequis

- Une instance **Prowlarr** accessible avec une clé API et au moins un indexeur ebook
- Une instance **qBittorrent** (Web UI activée)
- Un dossier de watchfolder pour Calibre (ou tout autre outil qui ingère les téléchargements)
- Pour Docker : `docker` ≥ 24 et `docker compose` v2
- Pour le local : Python ≥ 3.11

---

## Configuration

Le projet se configure via un fichier `.env`. Copier le modèle :

```bash
cp .env.example .env
```

Variables disponibles :

| Variable | Description | Défaut |
|---|---|---|
| `PROWLARR_URL` | URL de Prowlarr | `http://192.168.1.203:9696` |
| `PROWLARR_API_KEY` | Clé API Prowlarr | _(vide — obligatoire)_ |
| `QBIT_URL` | URL de qBittorrent | `http://192.168.1.202:8080` |
| `QBIT_USERNAME` | Login qBittorrent | `admin` |
| `QBIT_PASSWORD` | Mot de passe qBittorrent | `adminadmin` |
| `LIBRARY_URL` | URL vers l'interface Calibre (optionnel) | _(vide — bouton masqué)_ |

---

## Installation — image Docker pré-construite (recommandée)

Aucun clone nécessaire. L'image est publiée publiquement sur GHCR (`ghcr.io/hug-efrei/huguette`).

```bash
# 1. Récupérer le compose et le .env d'exemple
mkdir -p ~/huguette && cd ~/huguette
curl -fsSLO https://raw.githubusercontent.com/hug-efrei/huguette/main/docker-compose.yml
curl -fsSL  https://raw.githubusercontent.com/hug-efrei/huguette/main/.env.example -o .env

# 2. Éditer .env avec tes vraies valeurs
$EDITOR .env

# 3. Lancer
docker compose pull
docker compose up -d
```

L'interface sera accessible sur **http://\<host\>:8000**.

---

## Installation — Docker depuis le repo

```bash
git clone https://github.com/hug-efrei/huguette.git
cd huguette
cp .env.example .env
$EDITOR .env

# Build local + lancement
docker compose up -d --build
```

---

## Installation — Python local (sans Docker)

```bash
git clone https://github.com/hug-efrei/huguette.git
cd huguette
cp .env.example .env
$EDITOR .env

python -m venv .venv
source .venv/bin/activate          # bash/zsh
# source .venv/bin/activate.fish   # fish

pip install -r requirements.txt

uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## Installation — systemd (production sans Docker)

Idéal pour un déploiement natif dans un LXC dédié.

```bash
# 1. Cloner et préparer
sudo git clone https://github.com/hug-efrei/huguette.git /opt/huguette
sudo useradd --system --home /opt/huguette --shell /usr/sbin/nologin huguette
sudo chown -R huguette:huguette /opt/huguette

# 2. Créer le venv et installer les deps
sudo -u huguette python -m venv /opt/huguette/.venv
sudo -u huguette /opt/huguette/.venv/bin/pip install -r /opt/huguette/requirements.txt

# 3. Configurer
sudo -u huguette cp /opt/huguette/.env.example /opt/huguette/.env
sudo -u huguette $EDITOR /opt/huguette/.env

# 4. Installer le service
sudo cp /opt/huguette/deploy/huguette.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now huguette
sudo systemctl status huguette
```

---

## Script post-téléchargement (Calibre-Web-Automated)

Le script `scripts/post-download.sh` est appelé automatiquement par qBittorrent à la fin de chaque téléchargement. Il copie les fichiers ebooks (epub, pdf, mobi, cbz, cbr, azw3) de la catégorie `huguette` vers le watchfolder de **Calibre-Web-Automated**, tout en laissant le torrent en seed.

### 1. Configurer le script

Éditer `scripts/post-download.sh` et adapter les deux variables en haut :

```bash
WATCH_FOLDER="/data/cwa-book-ingest"   # chemin vers le watchfolder CWA
LOG_FILE="/tmp/huguette_script.log"    # fichier de log
```

### 2. Déployer le script sur la machine qBittorrent

```bash
# Copier le script sur la machine qui héberge qBittorrent
scp scripts/post-download.sh user@<ip-qbittorrent>:/opt/huguette-post-download.sh

# Le rendre exécutable
ssh user@<ip-qbittorrent> chmod +x /opt/huguette-post-download.sh
```

### 3. Configurer qBittorrent

Dans **qBittorrent → Outils → Options → Téléchargements**, activer :

> ☑ Exécuter un programme externe à la fin d'un torrent

Renseigner la commande suivante :

```
/opt/huguette-post-download.sh "%L" "%F" "%N"
```

| Paramètre qBit | Signification |
|---|---|
| `%L` | Catégorie du torrent (doit être `huguette`) |
| `%F` | Chemin complet vers le fichier ou dossier téléchargé |
| `%N` | Nom du torrent |

### 4. Vérifier le fonctionnement

Après le prochain téléchargement via Huguette :

```bash
# Sur la machine qBittorrent
cat /tmp/huguette_script.log
```

Un log réussi ressemble à :
```
--- 2026-04-30 12:00:00 ---
Analyse : Mon.Livre.epub (Catégorie détectée : huguette)
Cible détectée : Mon.Livre.epub
-> Succès : Copié dans le watchfolder.
Traitement terminé.
```

---

## Mise à jour

**Image pré-construite :**
```bash
cd ~/huguette
docker compose pull
docker compose up -d
```

**Depuis le repo (Docker) :**
```bash
cd huguette
git pull
docker compose up -d --build
```

**Depuis le repo (Python) :**
```bash
cd huguette
git pull
.venv/bin/pip install -r requirements.txt
# puis relancer uvicorn / systemctl restart huguette
```

---

## Commandes utiles

```bash
# Logs Docker
docker compose logs -f

# Redémarrer
docker compose restart

# Stopper
docker compose down

# Logs systemd
sudo journalctl -u huguette -f

# Healthcheck
curl http://localhost:8000/api/health
```

---

## Workflow de développement

> `main` est protégé — tout changement passe par une **Pull Request** dont la CI doit être verte.

### Faire une modification

```bash
# 1. Toujours partir d'un main à jour
git checkout main
git pull

# 2. Créer une branche (choisir un nom explicite)
git checkout -b feat/ma-nouvelle-fonctionnalite
# ou : fix/description-du-bug
# ou : docs/ce-que-je-documente

# 3. Coder, puis committer
git add nom-du-fichier.py          # ajouter des fichiers précis
git add frontend/app.js style.css  # ou plusieurs à la fois
git commit -m "Description courte de ce qui change"

# 4. Pousser la branche sur GitHub
git push -u origin feat/ma-nouvelle-fonctionnalite
# (la prochaine fois sur la même branche : git push suffit)

# 5. Ouvrir une Pull Request
gh pr create --title "Titre de la PR" --body "Description des changements"
# → la CI se lance automatiquement (lint + smoke test)
# → si tout est vert, merger sur GitHub

# 6. Après le merge, nettoyer en local
git checkout main
git pull
git branch -d feat/ma-nouvelle-fonctionnalite
```

### Corriger une erreur après un commit (avant le push)

```bash
# Modifier les fichiers, puis :
git add fichier-corrigé.py
git commit --amend --no-edit   # écrase le dernier commit
```

### Voir ce qui a changé

```bash
git status                  # fichiers modifiés / non suivis
git diff                    # changements non committés
git log --oneline -10       # 10 derniers commits
gh pr list                  # PRs ouvertes
gh run list                 # runs CI récents
```

### Déployer après merge

```bash
# Sur le LXC (ou toute machine avec Docker)
docker compose pull && docker compose up -d

# Vérifier
docker compose logs -f
curl http://localhost:8000/api/health
```

### Nommer ses branches

| Préfixe | Usage |
|---|---|
| `feat/` | Nouvelle fonctionnalité |
| `fix/` | Correction de bug |
| `docs/` | Documentation uniquement |
| `chore/` | Maintenance (deps, CI, config) |
| `refactor/` | Refactoring sans changement de comportement |

---

## Architecture

```
huguette/
├── main.py              FastAPI app + endpoints (/api/search, /api/download, /api/status)
├── prowlarr.py          Client Prowlarr (recherche ebooks)
├── qbittorrent.py       Client qBittorrent (ajout torrent + statut)
├── config.py            Settings via pydantic-settings (lit .env)
├── frontend/
│   ├── index.html       UI pixel art FireRed
│   ├── style.css        Thème Pokémon (avatar canvas, dialogue box, fiches)
│   └── app.js           Recherche, téléchargements, tri tri-état
├── Dockerfile           Image Python 3.12-slim, user non-root, healthcheck
├── docker-compose.yml   Service `huguette` (image GHCR + build local)
├── deploy/
│   └── huguette.service Unité systemd pour install native
└── .github/workflows/
    └── docker.yml       CI : build & push multi-arch sur GHCR
```

Endpoints :
- `GET  /api/health` — ping
- `GET  /api/search?q=…` — recherche d'ebooks via Prowlarr
- `POST /api/download` — envoie un magnet à qBittorrent
- `GET  /api/status` — état des torrents en cours
