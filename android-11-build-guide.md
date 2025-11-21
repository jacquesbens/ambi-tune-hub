# Guide de Build APK pour Android 11

Ce guide vous aide à créer un APK de MusicTV compatible avec Android 11 (API level 30).

## Prérequis

- Android Studio installé
- Compte GitHub
- JDK 11 ou supérieur

## Étape 1: Exporter et Préparer le Projet

1. Dans Lovable, cliquez sur "Export to Github" pour transférer le projet
2. Sur votre machine locale, clonez le projet:
```bash
git clone [votre-repo-url]
cd [nom-du-projet]
```

3. Installez les dépendances:
```bash
npm install
```

4. Ajoutez la plateforme Android:
```bash
npx cap add android
```

5. Construisez le projet:
```bash
npm run build
```

6. Synchronisez avec Capacitor:
```bash
npx cap sync android
```

## Étape 2: Configuration Android 11

### 2.1 Modifier build.gradle (Module: app)

Ouvrez `android/app/build.gradle` et assurez-vous d'avoir:

```gradle
android {
    compileSdkVersion 34
    
    defaultConfig {
        applicationId "app.lovable.d09c7eebe3774f76b23987e869857653"
        minSdkVersion 30  // Android 11
        targetSdkVersion 34
        versionCode 1
        versionName "1.0"
    }
}
```

### 2.2 Modifier AndroidManifest.xml

Ouvrez `android/app/src/main/AndroidManifest.xml` et ajoutez les permissions nécessaires:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="app.lovable.d09c7eebe3774f76b23987e869857653">

    <!-- Permissions pour l'accès aux fichiers audio -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
        android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
    <uses-permission android:name="android.permission.INTERNET" />
    
    <!-- Permission pour Android 11+ (Scoped Storage) -->
    <uses-permission android:name="android.permission.MANAGE_EXTERNAL_STORAGE"
        android:minSdkVersion="30" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:requestLegacyExternalStorage="true">

        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:label="@string/title_activity_main"
            android:launchMode="singleTask"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:exported="true">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

### 2.3 Configuration pour Android TV (Optionnel)

Si vous voulez aussi supporter Android TV, ajoutez dans `AndroidManifest.xml`:

```xml
<uses-feature
    android:name="android.software.leanback"
    android:required="false" />
<uses-feature
    android:name="android.hardware.touchscreen"
    android:required="false" />

<activity
    android:name=".MainActivity"
    android:banner="@drawable/banner">
    
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
    </intent-filter>
</activity>
```

## Étape 3: Build de l'APK

### 3.1 Ouvrir dans Android Studio

```bash
npx cap open android
```

### 3.2 Build Debug APK

1. Dans Android Studio: `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
2. L'APK sera créé dans: `android/app/build/outputs/apk/debug/app-debug.apk`

### 3.3 Build Release APK (Signé)

Pour une version de production:

1. Créez un keystore:
```bash
keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
```

2. Dans Android Studio:
   - `Build` → `Generate Signed Bundle / APK`
   - Sélectionnez `APK`
   - Sélectionnez votre keystore
   - Choisissez `release`

3. L'APK signé sera dans: `android/app/build/outputs/apk/release/app-release.apk`

## Étape 4: Test sur Android 11

### Test sur émulateur:
```bash
# Créer un AVD Android 11
npx cap run android
```

### Test sur appareil physique:
1. Activez le mode développeur sur votre appareil Android 11
2. Connectez via USB
3. Installez l'APK:
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## Notes Importantes

### Scoped Storage (Android 11+)
Android 11 utilise Scoped Storage. L'application devra:
- Utiliser le Storage Access Framework pour accéder aux fichiers
- Demander `MANAGE_EXTERNAL_STORAGE` pour un accès complet (nécessite justification pour le Play Store)

### Taille de l'APK
Pour réduire la taille:
1. Activez ProGuard dans `build.gradle`:
```gradle
buildTypes {
    release {
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

### Mises à jour
Après chaque modification dans Lovable:
1. `git pull` sur votre machine locale
2. `npm run build`
3. `npx cap sync android`
4. Rebuild l'APK

## Dépannage

### Erreur de permission
Si l'app crash au démarrage, vérifiez que toutes les permissions sont dans `AndroidManifest.xml`

### Fichiers audio non accessibles
Assurez-vous que l'utilisateur a accordé les permissions de stockage au runtime

### Build échoue
Vérifiez que:
- JDK 11+ est installé
- Android SDK est à jour
- Gradle sync a réussi dans Android Studio
