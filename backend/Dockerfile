FROM php:8.2-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    nginx \
    netcat-openbsd \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY docker/php/stf.ini /usr/local/etc/php/conf.d/zz-stf.ini
RUN sed -i \
    -e 's/^pm.max_children = .*/pm.max_children = 25/' \
    -e 's/^pm.start_servers = .*/pm.start_servers = 5/' \
    -e 's/^pm.min_spare_servers = .*/pm.min_spare_servers = 3/' \
    -e 's/^pm.max_spare_servers = .*/pm.max_spare_servers = 10/' \
    -e 's/^;pm.max_requests = .*/pm.max_requests = 500/' \
    -e 's/^;clear_env = no/clear_env = no/' \
    /usr/local/etc/php-fpm.d/www.conf

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy existing application directory contents
COPY . /var/www/html

# Install PHP dependencies (si composer.json existe)
RUN if [ -f composer.json ]; then \
    composer install --no-interaction || true; \
    fi

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html \
    && chmod -R 777 /var/www/html/var

# Configure Nginx
COPY docker/nginx.conf /etc/nginx/sites-available/default
RUN ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

# Copy start script to working directory
COPY start-server.sh ./start-server.sh
RUN chmod +x ./start-server.sh

# Expose port 80
EXPOSE 80

# Start server
CMD ["./start-server.sh"]
