@echo off
echo 🎁 Wishlist App - Установка и запуск
echo ====================================
echo.

where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker не установлен. Установите Docker Desktop с https://www.docker.com/products/docker-desktop
    exit /b 1
)

where docker-compose >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker Compose не установлен
    exit /b 1
)

echo ✅ Docker найден
echo.

REM Создание .env файла для backend если не существует
if not exist backend\.env (
    echo 📝 Создание backend\.env...
    copy backend\.env.example backend\.env
    echo ✅ backend\.env создан
) else (
    echo ✅ backend\.env уже существует
)

REM Создание .env.local файла для frontend если не существует
if not exist frontend\.env.local (
    echo 📝 Создание frontend\.env.local...
    copy frontend\.env.example frontend\.env.local
    echo ✅ frontend\.env.local создан
) else (
    echo ✅ frontend\.env.local уже существует
)

echo.
echo 🚀 Запуск Docker контейнеров...
echo.

docker-compose up -d

echo.
echo ✅ Приложение запущено!
echo.
echo 📱 Доступные ссылки:
echo    Frontend:  http://localhost:3000
echo    Backend:   http://localhost:8000
echo    API Docs:  http://localhost:8000/docs
echo.
echo Для остановки: docker-compose down
echo Для просмотра логов: docker-compose logs -f
echo.
