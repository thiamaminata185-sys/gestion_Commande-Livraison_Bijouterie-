#!/bin/sh
# Script de démarrage du conteneur sur Render
set -e
cd /var/www/html

# À chaque démarrage : création / mise à jour des tables
php artisan migrate --force

# Seulement si RUN_SEED=true : comptes et données de démonstration (à faire UNE fois)
if [ "$RUN_SEED" = "true" ]; then
  php artisan db:seed --force || echo "Seeders ignorés (déjà exécutés ?)"
fi

# Lien public/storage -> storage/app/public (photos téléversées)
php artisan storage:link 2>/dev/null || true

php artisan config:cache

# Les fichiers créés ci-dessus doivent rester lisibles / modifiables par Apache
chown -R www-data:www-data storage bootstrap/cache

exec apache2-foreground
