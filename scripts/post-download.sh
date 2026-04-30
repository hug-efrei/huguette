#!/bin/bash

# ==========================================
# CONFIGURATION
# ==========================================
WATCH_FOLDER="/data/cwa-book-ingest"
LOG_FILE="/tmp/huguette_script.log"

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

# 2. Fonction de copie simple
traiter_fichier() {
    local f="$1"
    local nom=$(basename "$f")

    # On ne copie que les formats de livres
    if echo "$nom" | grep -iqE '\.(epub|pdf|mobi|cbz|cbr|azw3)$'; then
        echo "Cible détectée : $nom" >> "$LOG_FILE"

        # Copie simple vers le dossier Calibre
        cp "$f" "$WATCH_FOLDER/$nom" >> "$LOG_FILE" 2>&1

        if [ $? -eq 0 ]; then
            echo "-> Succès : Copié dans le watchfolder." >> "$LOG_FILE"
        else
            echo "-> ERREUR : Échec de la copie." >> "$LOG_FILE"
        fi
    fi
}

# ==========================================
# EXÉCUTION
# ==========================================
if [ -d "$CHEMIN_SOURCE" ]; then
    # Si c'est un dossier, on cherche les fichiers dedans
    find "$CHEMIN_SOURCE" -type f | while read -r file; do
        traiter_fichier "$file"
    done
elif [ -f "$CHEMIN_SOURCE" ]; then
    # Si c'est un fichier unique
    traiter_fichier "$CHEMIN_SOURCE"
fi

echo "Traitement terminé." >> "$LOG_FILE"
