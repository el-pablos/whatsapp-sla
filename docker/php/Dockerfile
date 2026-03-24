# PHP 8.2 + Laravel Dockerfile
# Multi-stage build untuk development dan production

FROM php:8.2-fpm-alpine AS base
WORKDIR /var/www/html

# Install system dependencies
RUN apk add --no-cache \
    bash \
    curl \
    libpng-dev \
    oniguruma-dev \
    libxml2-dev \
    zip \
    unzip \
    icu-dev \
    && docker-php-ext-install \
        pdo_mysql \
        mbstring \
        exif \
        pcntl \
        bcmath \
        gd \
        intl \
        opcache \
    && rm -rf /var/cache/apk/*

# Install Redis extension
RUN apk add --no-cache --virtual .build-deps $PHPIZE_DEPS \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del .build-deps

# Install Composer
COPY --from=composer:2.6 /usr/bin/composer /usr/bin/composer

# Development stage
FROM base AS development

# Install Xdebug untuk development
RUN apk add --no-cache --virtual .build-deps $PHPIZE_DEPS \
    && pecl install xdebug \
    && docker-php-ext-enable xdebug \
    && apk del .build-deps

# PHP config untuk development
RUN { \
    echo 'display_errors=On'; \
    echo 'error_reporting=E_ALL'; \
    echo 'memory_limit=256M'; \
    echo 'upload_max_filesize=50M'; \
    echo 'post_max_size=50M'; \
} > /usr/local/etc/php/conf.d/custom.ini

# Xdebug config
RUN { \
    echo 'xdebug.mode=develop,debug'; \
    echo 'xdebug.client_host=host.docker.internal'; \
    echo 'xdebug.client_port=9003'; \
    echo 'xdebug.start_with_request=yes'; \
} > /usr/local/etc/php/conf.d/xdebug.ini

EXPOSE 9000
CMD ["php-fpm"]

# Production stage
FROM base AS production

# Create non-root user
RUN addgroup -g 1000 -S appgroup \
    && adduser -u 1000 -S appuser -G appgroup

# OPcache config untuk production
RUN { \
    echo 'opcache.memory_consumption=128'; \
    echo 'opcache.interned_strings_buffer=8'; \
    echo 'opcache.max_accelerated_files=4000'; \
    echo 'opcache.revalidate_freq=60'; \
    echo 'opcache.fast_shutdown=1'; \
    echo 'opcache.enable_cli=1'; \
} > /usr/local/etc/php/conf.d/opcache.ini

# PHP config untuk production
RUN { \
    echo 'display_errors=Off'; \
    echo 'log_errors=On'; \
    echo 'error_reporting=E_ALL & ~E_DEPRECATED & ~E_STRICT'; \
    echo 'memory_limit=256M'; \
    echo 'upload_max_filesize=50M'; \
    echo 'post_max_size=50M'; \
} > /usr/local/etc/php/conf.d/custom.ini

COPY --chown=appuser:appgroup . .

RUN composer install --no-dev --optimize-autoloader --no-interaction \
    && php artisan config:cache \
    && php artisan route:cache \
    && php artisan view:cache \
    && chown -R appuser:appgroup /var/www/html/storage \
    && chmod -R 775 /var/www/html/storage

USER appuser
EXPOSE 9000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD php-fpm -t || exit 1

CMD ["php-fpm"]
