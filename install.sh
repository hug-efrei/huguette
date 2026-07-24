#!/usr/bin/env bash
# Installation native de Huguette dans un LXC Debian/Ubuntu dédié (sans Docker).
#
# Usage (à lancer en root, dans le LXC) :
#   PROWLARR_URL=http://192.168.1.25:9696 \
#   PROWLARR_API_KEY=xxxxx \
#   QBIT_URL=http://192.168.1.20:8080 \
#   QBIT_USERNAME=admin \
#   QBIT_PASSWORD=xxxxx \
#   ./install.sh
#
# Sans variables d'environnement, le script les demande de façon interactive.
# Relancer ce script met à jour une installation existante (git pull +
# réinstallation des dépendances + restart) au lieu de repartir de zéro.

set -euo pipefail
export LC_ALL=C DEBIAN_FRONTEND=noninteractive

HUGUETTE_REPO="${HUGUETTE_REPO:-https://github.com/hug-efrei/huguette.git}"
HUGUETTE_REF="${HUGUETTE_REF:-main}"
HUGUETTE_DIR="/opt/huguette"
HUGUETTE_USER="huguette"
ENV_FILE="$HUGUETTE_DIR/.env"
SERVICE_FILE="/etc/systemd/system/huguette.service"

if [[ $EUID -ne 0 ]]; then
  echo "Ce script doit être exécuté en root (dans le LXC)." >&2
  exit 1
fi

prompt_if_empty() {
  local var_name="$1" prompt_text="$2" secret="${3:-}"
  local current="${!var_name:-}"
  if [[ -n "$current" ]]; then
    return
  fi
  if [[ "$secret" == "secret" ]]; then
    read -rsp "$prompt_text: " value
    echo
  else
    read -rp "$prompt_text: " value
  fi
  printf -v "$var_name" '%s' "$value"
}

echo "=== Huguette — installation LXC native ==="

prompt_if_empty PROWLARR_URL "URL de Prowlarr (ex: http://192.168.1.25:9696)"
prompt_if_empty PROWLARR_API_KEY "Clé API Prowlarr" secret
prompt_if_empty QBIT_URL "URL de qBittorrent (ex: http://192.168.1.20:8080)"
prompt_if_empty QBIT_USERNAME "Utilisateur qBittorrent"
prompt_if_empty QBIT_PASSWORD "Mot de passe qBittorrent" secret
LIBRARY_URL="${LIBRARY_URL:-}"

echo "--- Dépendances système ---"
apt-get update -qq
apt-get install -y -qq git python3 python3-venv python3-pip >/dev/null

if ! id "$HUGUETTE_USER" >/dev/null 2>&1; then
  echo "--- Création de l'utilisateur système $HUGUETTE_USER ---"
  useradd --system --home-dir "$HUGUETTE_DIR" --shell /usr/sbin/nologin "$HUGUETTE_USER"
fi

if systemctl is-active --quiet huguette 2>/dev/null; then
  echo "--- Service existant détecté, arrêt avant mise à jour ---"
  systemctl stop huguette
fi

if [[ -d "$HUGUETTE_DIR/.git" ]]; then
  echo "--- Mise à jour du dépôt existant ---"
  # Le dépôt appartient à $HUGUETTE_USER (chown fait en fin d'installation
  # précédente) : on exécute git en tant que cet utilisateur plutôt qu'en
  # root, sinon git refuse l'opération ("detected dubious ownership").
  runuser -u "$HUGUETTE_USER" -- git -C "$HUGUETTE_DIR" fetch --depth 1 origin "$HUGUETTE_REF"
  runuser -u "$HUGUETTE_USER" -- git -C "$HUGUETTE_DIR" checkout -q "$HUGUETTE_REF"
  runuser -u "$HUGUETTE_USER" -- git -C "$HUGUETTE_DIR" reset --hard "origin/$HUGUETTE_REF" 2>/dev/null || runuser -u "$HUGUETTE_USER" -- git -C "$HUGUETTE_DIR" reset --hard FETCH_HEAD
else
  echo "--- Clonage du dépôt (ref: $HUGUETTE_REF) ---"
  rm -rf "$HUGUETTE_DIR"
  git clone --branch "$HUGUETTE_REF" --depth 1 "$HUGUETTE_REPO" "$HUGUETTE_DIR"
fi

echo "--- Environnement virtuel Python ---"
python3 -m venv "$HUGUETTE_DIR/.venv"
"$HUGUETTE_DIR/.venv/bin/pip" install --quiet --upgrade pip
"$HUGUETTE_DIR/.venv/bin/pip" install --quiet -r "$HUGUETTE_DIR/requirements.txt"

chown -R "$HUGUETTE_USER":"$HUGUETTE_USER" "$HUGUETTE_DIR"

echo "--- Fichier d'environnement ---"
# Le fichier contient des secrets (clé Prowlarr, mot de passe qBittorrent) :
# on le crée avec des permissions restrictives *avant* d'y écrire, pour qu'il
# ne soit jamais lisible par d'autres utilisateurs même un court instant.
install -m 600 -o "$HUGUETTE_USER" -g "$HUGUETTE_USER" /dev/null "$ENV_FILE"
cat > "$ENV_FILE" <<EOF
PROWLARR_URL=$PROWLARR_URL
PROWLARR_API_KEY=$PROWLARR_API_KEY
QBIT_URL=$QBIT_URL
QBIT_USERNAME=$QBIT_USERNAME
QBIT_PASSWORD=$QBIT_PASSWORD
LIBRARY_URL=$LIBRARY_URL
EOF

echo "--- Service systemd ---"
cp "$HUGUETTE_DIR/deploy/huguette.service" "$SERVICE_FILE"

systemctl daemon-reload
systemctl enable --now huguette

echo
echo "=== Terminé ==="
echo "Huguette écoute sur le port 8000."
echo "Logs : journalctl -u huguette -f"
echo "Config : $ENV_FILE"
echo
echo "N'oublie pas le script scripts/post-download.sh à déployer sur la"
echo "machine qBittorrent (voir README, section 'Script post-téléchargement')."
echo
echo "Astuce hve : ajoute les tags dns_huguette;port_8000 sur ce LXC dans Proxmox"
echo "pour une exposition automatique via Caddy (voir proxmox-caddy-sync)."
