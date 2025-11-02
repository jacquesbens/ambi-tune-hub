# Configuration Android TV pour MusicTV

## Prérequis
- Android Studio installé
- Java JDK 11 ou supérieur
- Git configuré

## Étapes d'installation

### 1. Cloner le projet
Depuis Lovable, cliquez sur "Export to Github" pour transférer le projet vers votre dépôt GitHub, puis :

```bash
git clone <VOTRE_URL_GITHUB>
cd <NOM_DU_PROJET>
npm install
```

### 2. Initialiser Capacitor
```bash
npx cap init
# Appuyez sur Entrée pour accepter les valeurs par défaut (déjà configurées)
```

### 3. Ajouter la plateforme Android
```bash
npx cap add android
```

### 4. Configuration Android TV

Après avoir ajouté Android, modifiez `android/app/src/main/AndroidManifest.xml` :

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application
        android:banner="@drawable/banner"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/AppTheme.NoActionBar">
        
        <!-- Configuration Android TV -->
        <uses-feature
            android:name="android.hardware.touchscreen"
            android:required="false" />
        <uses-feature
            android:name="android.software.leanback"
            android:required="true" />
        
        <activity
            android:name=".MainActivity"
            android:banner="@drawable/banner"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:label="@string/title_activity_main"
            android:launchMode="singleTask"
            android:screenOrientation="landscape"
            android:theme="@style/AppTheme.NoActionBarLaunch">
            
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
                <!-- Pour Android TV -->
                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

### 5. Créer une bannière pour Android TV

Créez une image 320x180px et placez-la dans `android/app/src/main/res/drawable/banner.png`

### 6. Build et synchronisation
```bash
npm run build
npx cap sync android
```

### 7. Ouvrir dans Android Studio
```bash
npx cap open android
```

### 8. Configuration de l'AVD (Android Virtual Device)

Dans Android Studio :
1. Allez dans Tools > AVD Manager
2. Créez un nouvel appareil virtuel
3. Choisissez "TV" dans la catégorie
4. Sélectionnez "Android TV (1080p)" ou "Android TV (4K)"
5. Choisissez une version Android (API 29+)
6. Lancez l'émulateur

### 9. Lancer l'application
```bash
npx cap run android
```

Ou depuis Android Studio : cliquez sur le bouton "Run" (▶)

## Test sur appareil physique

1. Activez le mode développeur sur votre Android TV
2. Activez le débogage USB
3. Connectez votre TV via USB ou réseau (ADB)
4. Lancez : `npx cap run android`

## Mise à jour après modifications

Chaque fois que vous modifiez le code dans Lovable :

```bash
git pull
npm install
npm run build
npx cap sync android
```

Puis relancez l'application depuis Android Studio ou avec `npx cap run android`

## Navigation télécommande

L'application est déjà configurée pour :
- ⬆️⬇️⬅️➡️ : Navigation
- Centre/OK : Sélection (Entrée)
- Retour : Retour arrière

## Ressources
- [Documentation Capacitor](https://capacitorjs.com/docs)
- [Guide Android TV](https://developer.android.com/training/tv)
- [Lovable + Capacitor](https://docs.lovable.dev/)
