#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR=~/projet-devops-cyber
SECRETS_DIR=~/secrets-test
ENV_TMP="$SECRETS_DIR/prod.env"      # généré par render-env.yml
ENV_FILE="$PROJECT_DIR/.env"
BACKUP_DIR="$PROJECT_DIR/backups"

mkdir -p "$BACKUP_DIR"

echo "��� Génération .env depuis Ansible Vault (render-env.yml)…"
cd "$SECRETS_DIR"
ansible-playbook render-env.yml --ask-vault-pass

# copie du .env à côté du compose
install -m 600 "$ENV_TMP" "$ENV_FILE"

# charge les variables pour les commandes qui suivent
set -a; source "$ENV_FILE"; set +a

# sauvegarde si la DB tourne
if docker ps -a --format '{{.Names}}' | grep -q '^devops-cyber-db$'; then
  echo "��� Sauvegarde MariaDB (mariadb-dump)…"
  TS=$(date +%F_%H-%M-%S)
  docker exec devops-cyber-db mariadb-dump -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" \
    > "$BACKUP_DIR/backup_$TS.sql" || echo "⚠️  Sauvegarde échouée (non bloquant)"
  echo "✅ Dump: $BACKUP_DIR/backup_$TS.sql"
fi

echo "��� docker-compose down…"
cd "$PROJECT_DIR"
docker-compose down || true

echo "��� docker-compose up -d --build…"
docker-compose up -d --build

echo "⏳ Attente init MariaDB…"
sleep 20

echo "��� Vérification du schéma…"
TABLES=$(docker exec devops-cyber-db sh -lc \
  "mariadb -u\"$MYSQL_USER\" -p\"$MYSQL_PASSWORD\" -N -e 'SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=\"$MYSQL_DATABASE\";' 2>/dev/null" || echo 0)

LATEST_BACKUP=$(ls -1t "$BACKUP_DIR"/backup_*.sql 2>/dev/null | head -n1 || true)

if [ "${TABLES:-0}" -eq 0 ] && [ -n "${LATEST_BACKUP:-}" ]; then
  echo "♻️  Base vide → restauration depuis: $LATEST_BACKUP"
  docker exec -i devops-cyber-db mariadb -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < "$LATEST_BACKUP" \
    && echo "✅ Restauration OK" || echo "⚠️  Restauration échouée"
else
  echo "✅ Base non vide ou aucun backup trouvé → pas de restauration."
fi

# sécurité : efface la version temporaire du .env côté secrets
shred -fu "$ENV_TMP" || true
echo "✔️  Déploiement terminé."

