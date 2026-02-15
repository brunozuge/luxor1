FROM dunglas/frankenphp:php8.4-alpine

# Dependências do sistema (Alpine é mais leve e rápido)
RUN apk add --no-cache \
    git \
    unzip \
    libzip-dev \
    zip \
    curl \
    libpq-dev \
    postgresql-dev \
    bash

# Extensões PHP necessárias
RUN docker-php-ext-install pdo pdo_pgsql zip opcache

# Otimização de PHP para Produção
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

# Configuração customizada do Opcache (acelera MUITO o Laravel)
RUN { \
    echo 'opcache.memory_consumption=128'; \
    echo 'opcache.interned_strings_buffer=8'; \
    echo 'opcache.max_accelerated_files=10000'; \
    echo 'opcache.revalidate_freq=2'; \
    echo 'opcache.fast_shutdown=1'; \
    echo 'opcache.enable_cli=1'; \
    } > $PHP_INI_DIR/conf.d/opcache-recommended.ini

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copia apenas o necessário primeiro para aproveitar cache de camadas do Docker
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader

# Copia o resto do projeto
COPY . .

# Finaliza instalação do Composer com otimização
RUN composer install --no-dev --optimize-autoloader

# --- CACHE DO LARAVEL (CRÍTICO PARA PERFORMANCE) ---
# Geramos as chaves de cache para que o Laravel não precise ler arquivos de config/rotas em cada request
RUN php artisan config:cache && \
    php artisan route:cache && \
    php artisan view:cache

# Permissões corretas (O FrankenPHP roda como root por padrão no Alpine, mas o www-data é mais seguro)
RUN chown -R www-data:www-data storage bootstrap/cache

# Variáveis de ambiente para o FrankenPHP
ENV SERVER_NAME=:10000
ENV PORT=10000

# Porta que o Render usa (ele detecta automaticamente se estiver em 10000 ou 8080)
EXPOSE 10000

# Comando de inicialização: roda migrações e sobe o servidor
CMD php artisan migrate --force && \
    frankenphp php-server --listen :10000

