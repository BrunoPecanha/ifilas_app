@echo off
echo ====================================================
echo ===  Gerador automatico de AAB - iFilas (Windows) ==
echo ====================================================

set KEYSTORE_PATH=android\app\ifilas-release-key.jks
set ALIAS=ifilas-key
set STORE_PASS=Ifilas@2024
set KEY_PASS=IfilasKey@2024

REM 1️⃣ Gera o keystore se ainda nao existir
if not exist %KEYSTORE_PATH% (
    echo Criando keystore...
    keytool -genkey -v -keystore %KEYSTORE_PATH% -keyalg RSA -keysize 2048 -validity 10000 -alias %ALIAS% -storepass %STORE_PASS% -keypass %KEY_PASS% -dname "CN=Bruno Martins, OU=iFilas, O=BMP Labs, L=Rio de Janeiro, ST=RJ, C=BR"
)

REM 2️⃣ Build do app Ionic
echo Fazendo build do app Ionic...
ionic build

REM 3️⃣ Sincroniza com Android
echo Sincronizando com Capacitor...
npx cap sync android

REM 4️⃣ Gera o bundle assinado
echo Gerando AAB assinado...
cd android
gradlew bundleRelease -Pandroid.injected.signing.store.file=app/%KEYSTORE_PATH% -Pandroid.injected.signing.store.password=%STORE_PASS% -Pandroid.injected.signing.key.alias=%ALIAS% -Pandroid.injected.signing.key.password=%KEY_PASS%
cd ..

echo ====================================================
echo ✅  AAB gerado com sucesso!
echo 📁 Local: android\app\build\outputs\bundle\release\app-release.aab
echo ====================================================
echo.
echo Pressione qualquer tecla para sair...
pause >nul
