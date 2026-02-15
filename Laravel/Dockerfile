FROM php:8.4-cli

# Instala dependências do sistema
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libpq-dev \
    libzip-dev \
    zip \
    curl

# Instala extensões PHP necessárias para Laravel + Supabase
RUN docker-php-ext-install pdo pdo_pgsql zip

# Instala Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Define diretório de trabalho
WORKDIR /var/www

# Copia arquivos do projeto
COPY . .

# Instala dependências Laravel
RUN composer install --no-dev --optimize-autoloader

# Permissões (CRÍTICO no Laravel)
RUN chmod -R 775 storage bootstrap/cache

# Porta Render
EXPOSE 10000

# Comando de inicialização
CMD php artisan serve --host 0.0.0.0 --port 10000
