# Image de l'API Laravel pour Render (PHP 8.3 + Apache)
FROM php:8.3-apache

# Render fournit la variable PORT (10000 par défaut)
ENV PORT=10000 \
    COMPOSER_ALLOW_SUPERUSER=1 \
    APP_ENV=production

# Extensions PHP : PostgreSQL, zip, gd (PDF), opcache. Apache : réécriture d'URL.
RUN apt-get update && apt-get install -y --no-install-recommends \
        git unzip libpq-dev libzip-dev libpng-dev libjpeg62-turbo-dev libfreetype6-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" pdo_pgsql zip gd opcache \
    && a2enmod rewrite headers \
    && sed -i 's/^Listen 80$/#Listen 80/' /etc/apache2/ports.conf \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY docker/apache.conf /etc/apache2/sites-available/000-default.conf

WORKDIR /var/www/html

# 1) Dépendances PHP (couche mise en cache tant que composer.lock ne change pas)
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

# 2) Code de l'application
COPY . .
RUN mkdir -p storage/app/public storage/framework/cache storage/framework/sessions storage/framework/views storage/logs storage/fonts bootstrap/cache \
    && composer dump-autoload --no-dev --optimize --no-interaction \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod +x docker/start.sh

EXPOSE 10000
CMD ["docker/start.sh"]
