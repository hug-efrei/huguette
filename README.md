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
- [Mise à jour](#mise-à-jour)
- [Commandes utiles](#commandes-utiles)
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
