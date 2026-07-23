#!/bin/bash

# ==========================================
# CONFIGURATION
# ==========================================
# URL de l'instance BookOrbit et identifiants d'un compte de service dédié
# (créé avec la seule permission "Book Dock", pas le compte web principal).
BOOKORBIT_URL="${BOOKORBIT_URL:-http://192.168.1.24:3000}"
BOOKORBIT_USER="${BOOKORBIT_USER:-huguette}"
BOOKORBIT_PASSWORD="${BOOKORBIT_PASSWORD:?BOOKORBIT_PASSWORD manquant}"

LOG_FILE="$(dirname "$(readlink -f "$0")")/huguette_post_download.log"

# ==========================================
# RÉCUPÉRATION DES PARAMÈTRES
# ==========================================
CATEGORIE="$1"
CHEMIN_SOURCE="$2"
NOM_TORRENT="$3"

# On convertit la catégorie en minuscules pour éviter les erreurs de frappe
CATEGORIE_LOWER=$(echo "$CATEGORIE" | tr '[:upper:]' '[:lower:]')

echo "--- $(date "+%Y-%m-%d %H:%M:%S") ---" >> "$LOG_FILE"
echo "Analyse : $NOM_TORRENT (Catégorie détectée : $CATEGORIE)" >> "$LOG_FILE"

# 1. Vérification de la catégorie (insensible à la casse)
if [ "$CATEGORIE_LOWER" != "huguette" ]; then
    echo "Action : Ignoré (La catégorie n'est pas 'huguette')." >> "$LOG_FILE"
    exit 0
fi

# 2. Session BookOrbit (répertoire privé pour le cookie, jamais dans /tmp
# partagé sans protection — mktemp garantit des permissions restrictives).
COOKIE_JAR="$(mktemp)"
trap 'rm -f "$COOKIE_JAR"' EXIT

login_status=$(curl -s -o /dev/null -w '%{http_code}' -c "$COOKIE_JAR" \
    -X POST "$BOOKORBIT_URL/api/v1/auth/login" \
    -H 'Content-Type: application/json' \
    -d "{\"username\":\"$BOOKORBIT_USER\",\"password\":\"$BOOKORBIT_PASSWORD\"}")

if [ "$login_status" != "200" ]; then
    echo "-> ERREUR : authentification BookOrbit échouée (HTTP $login_status). Abandon." >> "$LOG_FILE"
    exit 1
fi

# 3. Fonction d'envoi vers le Book Dock de BookOrbit
traiter_fichier() {
    local f="$1"
    local nom
    nom=$(basename "$f")

    # On n'envoie que les formats de livres
    if echo "$nom" | grep -iqE '\.(epub|pdf|mobi|cbz|cbr|azw3)$'; then
        echo "Cible détectée : $nom" >> "$LOG_FILE"

        local resp_file
        resp_file="$(mktemp)"
        upload_status=$(curl -s -o "$resp_file" -w '%{http_code}' \
            -b "$COOKIE_JAR" \
            -X POST "$BOOKORBIT_URL/api/v1/book-dock/upload" \
            -F "file=@${f};filename=${nom}")

        if [ "$upload_status" = "201" ]; then
            echo "-> Succès : envoyé au Book Dock BookOrbit (en attente de validation/finalisation)." >> "$LOG_FILE"
        else
            echo "-> ERREUR : échec de l'envoi (HTTP $upload_status) : $(cat "$resp_file")" >> "$LOG_FILE"
        fi
        rm -f "$resp_file"
    fi
}

# ==========================================
# EXÉCUTION
# ==========================================
if [ -d "$CHEMIN_SOURCE" ]; then
    # Si c'est un dossier, on cherche les fichiers dedans (noms exotiques inclus)
    while IFS= read -r -d '' file; do
        traiter_fichier "$file"
    done < <(find "$CHEMIN_SOURCE" -type f -print0)
elif [ -f "$CHEMIN_SOURCE" ]; then
    # Si c'est un fichier unique
    traiter_fichier "$CHEMIN_SOURCE"
fi

echo "Traitement terminé." >> "$LOG_FILE"
