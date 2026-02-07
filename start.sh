#!/bin/bash

echo "🎁 Wishlist App - Установка и запуск"
echo "===================================="
echo ""

# Проверка Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Установите Docker Desktop с https://www.docker.com/products/docker-desktop"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не установлен"
    exit 1
fi

echo "✅ Docker найден"
echo ""

# Создание .env файла для backend если не существует
if [ ! -f backend/.env ]; then
    echo "📝 Создание backend/.env..."
    cp backend/.env.example backend/.env
    echo "✅ backend/.env создан"
else
    echo "✅ backend/.env уже существует"
fi

# Создание .env.local файла для frontend если не существует
if [ ! -f frontend/.env.local ]; then
    echo "📝 Создание frontend/.env.local..."
    cp frontend/.env.example frontend/.env.local
    echo "✅ frontend/.env.local создан"
else
    echo "✅ frontend/.env.local уже существует"
fi

echo ""
echo "🚀 Запуск Docker контейнеров..."
echo ""

docker-compose up -d

echo ""
echo "✅ Приложение запущено!"
echo ""
echo "📱 Доступные ссылки:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:8000"
echo "   API Docs:  http://localhost:8000/docs"
echo ""
echo "Для остановки: docker-compose down"
echo "Для просмотра логов: docker-compose logs -f"
echo ""
