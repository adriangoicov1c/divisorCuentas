@echo off
REM Script para compilar la aplicación Android con Capacitor
REM Configura las variables de entorno necesarias y ejecuta Gradle

setlocal enabledelayedexpansion

REM Configurar JAVA_HOME
set "JAVA_HOME=C:\Program Files\Java\jdk-21"

REM Configurar ANDROID_HOME
set "ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk"

REM Verificar que las variables estén configuradas
if not exist "%JAVA_HOME%" (
    echo Error: JAVA_HOME no está configurado correctamente
    echo Asegúrate de tener JDK instalado en: %JAVA_HOME%
    pause
    exit /b 1
)

if not exist "%ANDROID_HOME%" (
    echo Error: ANDROID_HOME no está configurado correctamente
    echo Asegúrate de tener Android SDK instalado en: %ANDROID_HOME%
    pause
    exit /b 1
)

echo Compilando aplicación Android...
echo JAVA_HOME=%JAVA_HOME%
echo ANDROID_HOME=%ANDROID_HOME%
echo.

REM Cambiar a directorio android
cd android

REM Ejecutar Gradle build
call gradlew.bat assembleRelease

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===== COMPILACIÓN EXITOSA =====
    echo APK generado en: android\app\build\outputs\apk\release\app-release-unsigned.apk
    echo Debug APK en: android\app\build\outputs\apk\debug\app-debug.apk
) else (
    echo.
    echo ===== ERROR EN LA COMPILACIÓN =====
    pause
    exit /b 1
)
