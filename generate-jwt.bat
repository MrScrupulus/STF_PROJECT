@echo on
echo Starting JWT key generation...

:: Définir le chemin complet du projet
set PROJECT_DIR=C:\STF_Project
cd /d %PROJECT_DIR%\backend
echo Current directory: %CD%

if not exist "config\jwt" (
    echo Creating jwt directory...
    mkdir config\jwt
)

echo Generating private key...
"C:\Program Files\OpenSSL-Win64\bin\openssl.exe" genrsa -out config/jwt/private.pem -aes256 -passout pass:^!Pl^@yT0W^!n 4096

echo Generating public key...
"C:\Program Files\OpenSSL-Win64\bin\openssl.exe" rsa -pubout -in config/jwt/private.pem -out config/jwt/public.pem -passin pass:^!Pl^@yT0W^!n

echo Done!
pause