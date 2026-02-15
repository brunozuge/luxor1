FROM dunglas/frankenphp:php8.4-bookworm

# Dependências do sistema (Debian é mais compatível com o Render)
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    zip \
    curl \
    libpq-dev \
    libcap2-bin \
    && rm -rf /var/lib/apt/lists/*

# Extensões PHP necessárias
RUN docker-php-ext-install pdo pdo_pgsql zip opcache

# --- CORREÇÃO PARA O RENDER (IMPORTANTE) ---
# Removemos os recursos (capabilities) do binário que causam o erro 'Operation not permitted'
# Isso é necessário porque o Render não permite certas permissões de baixo nível no Kernel.
RUN setcap -r /usr/local/bin/frankenphp || true

# Otimização de PHP para Produção
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

# Configuração customizada do Opcache
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

# Copia apenas o necessário primeiro
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader

# Copia o resto do projeto
COPY . .

# Finaliza instalação do Composer com otimização
RUN composer install --no-dev --optimize-autoloader

# --- CACHE DO LARAVEL (OTIMIZAÇÃO) ---
RUN php artisan route:cache && \
    php artisan view:cache

# Permissões
RUN chown -R www-data:www-data storage bootstrap/cache

# Variáveis de ambiente para o FrankenPHP
ENV SERVER_NAME=:10000
ENV PORT=10000

# Porta do Render
EXPOSE 10000

# Comando de inicialização
CMD php artisan migrate --force && \
    frankenphp run --config /app/Caddyfile


