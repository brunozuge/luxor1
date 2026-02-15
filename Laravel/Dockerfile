FROM php:8.4-cli

# Dependências do sistema
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libpq-dev \
    libzip-dev \
    zip \
    curl

# Extensões PHP necessárias
RUN docker-php-ext-install pdo pdo_pgsql zip

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Diretório de trabalho
WORKDIR /var/www

# Copia projeto
COPY . .

# Instala dependências Laravel
RUN composer install --no-dev --optimize-autoloader

# Storage link (evita bug chato de upload/imagem)
RUN php artisan storage:link || true

# Permissões (CRÍTICO no Laravel)
RUN chmod -R 775 storage bootstrap/cache

# Porta Render
EXPOSE 10000

# Inicialização
CMD php artisan migrate --force && \
    php artisan serve --host 0.0.0.0 --port 10000
