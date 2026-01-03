@echo off
echo -----------------------------------
echo 🚀 NexTu - Build Completo Android
echo -----------------------------------

REM 1. Verifica se os arquivos de ícone e splash existem
IF NOT EXIST resources\icon.png (
    echo ❌ resources\icon.png não encontrado!
    echo Pressione Enter para sair...
    pause
    exit /b
)
IF NOT EXIST resources\splash.png (
    echo ❌ resources\splash.png não encontrado!
    echo Pressione Enter para sair...
    pause
    exit /b
)

REM 2. Gera ícone e splash
echo.
echo 🎨 [1/5] Gerando ícones e splash...
cordova-res android --skip-config --copy
IF %ERRORLEVEL% NEQ 0 (
    echo ⛔ Erro ao gerar recursos.
    pause
    exit /b
)

REM 3. Build de produção
echo.
echo ⚙️ [2/5] Fazendo build de produção...
ionic build --configuration=production
IF %ERRORLEVEL% NEQ 0 (
    echo ⛔ Erro ao fazer build de produção.
    pause
    exit /b
)

REM 4. Limpa assets antigos
echo.
echo 🧹 [3/5] Limpando assets antigos...
IF EXIST android\app\src\main\assets\public (
    rmdir /s /q android\app\src\main\assets\public
    echo ✅ Assets antigos removidos.
) ELSE (
    echo ℹ️ Nenhum asset antigo encontrado.
)

REM 5. Sync Capacitor
echo.
echo 🔄 [4/5] Sincronizando com Capacitor...
npx cap sync android
IF %ERRORLEVEL% NEQ 0 (
    echo ⛔ Erro ao sincronizar com Capacitor.
    pause
    exit /b
)

REM 6. Abrir Android Studio
echo.
echo 🚀 [5/5] Abrindo Android Studio...
npx cap open android
IF %ERRORLEVEL% NEQ 0 (
    echo ⛔ Falha ao abrir Android Studio.
    pause
    exit /b
)

echo.
echo ✅ Tudo pronto! Agora é só clicar em ▶️ 'Run app' no Android Studio.
pause
