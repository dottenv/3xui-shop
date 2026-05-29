#!/bin/bash
set -e

REPO_URL="https://github.com/dottenv/3xui-shop.git"
INSTALL_DIR="/root/3xui-shop"

echo "========================================="
echo "  CWIM - VPN Shop Setup"
echo "========================================="

# Проверка root
if [ "$EUID" -ne 0 ]; then
    echo "Запусти от root: sudo bash setup.sh"
    exit 1
fi

echo "[1/7] Обновление системы..."
apt-get update
apt-get upgrade -y

echo "[2/7] Установка зависимостей..."
apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git

echo "[3/7] Установка Docker..."
if ! command -v docker &> /dev/null; then
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null

    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

    systemctl enable docker
    systemctl start docker
    echo "Docker установлен"
else
    echo "Docker уже установлен"
fi

echo "[4/7] Клонирование репозитория..."
if [ -d "$INSTALL_DIR" ]; then
    echo "Папка $INSTALL_DIR уже существует, git pull..."
    cd "$INSTALL_DIR"
    git pull
else
    git clone "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

echo "[5/7] Настройка .env..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo ".env создан из шаблона"
else
    echo ".env уже существует, пропускаю"
fi

echo "[6/7] Очистка старых контейнеров..."
docker compose down --remove-orphans 2>/dev/null || true

echo "[7/7] Сборка и запуск..."
docker compose up -d --build

echo ""
echo "========================================="
echo "  Готово!"
echo "========================================="
echo ""
echo "Сервисы:"
echo "  - cwim.ru       → Лендинг"
echo "  - app.cwim.ru   → PWA приложение"
echo "  - crm.cwim.ru   → CRM"
echo ""
echo "Проверка статуса:"
echo "  docker compose ps"
echo ""
echo "Логи:"
echo "  docker compose logs -f"
echo ""
