FROM php:8.3-fpm

# 必要なツールと拡張機能のインストール
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    && docker-php-ext-install pdo_mysql
    
# Composerを公式イメージからコピー（これが一番安全で確実です）
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 作業ディレクトリの設定
WORKDIR /var/www/html