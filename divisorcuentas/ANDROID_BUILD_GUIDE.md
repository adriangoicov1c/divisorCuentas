# Compilación de Aplicación Android - Guía de Configuración

## Problema Resuelto ✅

El error `"gradlew" no se reconoce como un comando interno o externo` ha sido completamente solucionado.

## Requisitos Previos

Para compilar la aplicación Android, necesitas tener instalado:

1. **Java Development Kit (JDK)** - versión 20 o superior
   - Descargar de: https://www.oracle.com/java/technologies/downloads/
   - Instalado en: `C:\Program Files\Java\jdk-21` (o tu versión instalada)

2. **Android SDK**
   - Incluido con Android Studio
   - Instalado en: `C:\Users\[TuUsuario]\AppData\Local\Android\Sdk`

## Configuración de Variables de Entorno

Las variables de entorno ya están configuradas automáticamente en el script `build-android.bat`. Sin embargo, si necesitas hacerlo manualmente:

### Windows (PowerShell):
```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
$env:ANDROID_HOME = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
```

### Permanente (Variables de Sistema):
1. Abre "Variables de entorno" desde el Panel de Control
2. Añade/Edita:
   - `JAVA_HOME` = `C:\Program Files\Java\jdk-21`
   - `ANDROID_HOME` = `C:\Users\[TuUsuario]\AppData\Local\Android\Sdk`

## Compilación de la Aplicación

### Opción 1: Usar el Script (Recomendado)
```bash
.\build-android.bat
```

### Opción 2: Compilación Manual con Gradle
```bash
cd android
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
$env:ANDROID_HOME = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
.\gradlew.bat assembleRelease
```

### Opción 3: Debug APK
```bash
cd android
.\gradlew.bat assembleDebug
```

## Ubicación de los APK Generados

- **Release APK**: `android/app/build/outputs/apk/release/app-release-unsigned.apk`
- **Debug APK**: `android/app/build/outputs/apk/debug/app-debug.apk`

## Desplegar en Dispositivo

```bash
# Conecta tu dispositivo Android via USB y habilita "Depuración USB"

# Opción 1: Con adb
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# Opción 2: Con Capacitor
npx cap run android
```

## Solución de Problemas

### Error: "JAVA_HOME is set to an invalid directory"
- Verifica que la ruta de JAVA_HOME existe y contiene los binarios de Java
- Ejecuta: `java -version` para confirmar

### Error: "SDK location not found"
- Verifica que `android/local.properties` contiene:
  ```
  sdk.dir=C:\\Users\\[TuUsuario]\\AppData\\Local\\Android\\Sdk
  ```

### Error: "gradle" no se encuentra
- Los archivos `gradlew.bat` y `gradlew` deben estar en `android/`
- Si faltan, ejecuta: `npx cap add android`

## Variables de Entorno Configuradas

El archivo `local.properties` ya está configurado con:
```
sdk.dir=C:\\Users\\adria\\AppData\\Local\\Android\\Sdk
```

## Próximos Pasos

1. ✅ Compilación de Android funcionando
2. ✅ Variables de entorno configuradas
3. 📱 Conecta tu dispositivo Android
4. 🚀 Ejecuta: `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`
5. 📲 Abre la app en tu dispositivo
