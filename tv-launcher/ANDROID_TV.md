# Accueil TV : l'appli Android TV

L'interface web de ce dossier est aussi livrée comme une vraie appli Android TV
(fichier APK). **Pour l'installer, suivez `INSTALLATION_TV.md` à la racine du dépôt.**

## Comment c'est construit

- Le projet Android est dans le dossier `android/` (Java, une seule activité).
- L'activité affiche cette interface en plein écran dans une **WebView**.
  Les fichiers du dossier `tv-launcher/` sont copiés dans l'appli à chaque
  compilation : l'accueil fonctionne même sans Internet (sauf la météo).
- Elle est déclarée à la fois comme appli TV (`LEANBACK_LAUNCHER`) et comme
  **écran d'accueil** (`HOME`).
- La page parle à Android via l'objet JavaScript `window.AndroidTV` :

| Fonction | Rôle |
|---|---|
| `launchApp("paquet1,paquet2")` | ouvre la première appli installée de la liste |
| `getInstalledApps()` | liste des applis installées (nom, paquet, bannière TV, icône, couleur) |
| `openStore(paquet)` | ouvre la page Play Store d'une appli absente |
| `openUrl(adresse)` | ouvre un lien hors du lanceur (navigateur ou appli) |
| `openSystemSettings()` | ouvre les paramètres de la TV |
| `showKeyboard()` | affiche le clavier pour un champ de saisie |

  En retour, l'appli appelle `tvHandleKey('back')` (bouton Retour),
  `tvGoHome()` (bouton Home) et `tvOnResume()` (retour dans le lanceur).

## Compilation automatique

Le fichier `.github/workflows/build.yml` compile l'APK à chaque modification
de `tv-launcher/` ou `android/` sur la branche `main`, puis :

- le publie dans la release GitHub **apk** :
  `https://github.com/7ra0re07-pixel/Assistante-/releases/download/apk/AccueilTV.apk`
- le place sur le site, à l'adresse courte
  `https://7ra0re07-pixel.github.io/Assistante-/tv.apk`

L'APK est signé avec une clé fixe (`android/signing/accueiltv.keystore`) pour que
chaque nouvelle version s'installe par-dessus la précédente sans perdre les
réglages. Cette clé est publique dans le dépôt : elle ne protège rien et sert
seulement à garder la même signature d'une version à l'autre.

Pour compiler à la main : `gradle -p android assembleRelease`
(Android SDK et Java 17 ou plus requis).

## Remplacer l'accueil Google TV avec un ordinateur

Google TV ne propose pas de choisir un autre écran d'accueil. Avec un ordinateur
et les outils `adb` :

1. Sur la TV : **Paramètres → Système → À propos**, appuyez 7 fois sur
   « Build du système d'exploitation Android TV », puis activez le
   **débogage USB** dans **Options pour les développeurs**.
2. Notez l'adresse IP de la TV (**Paramètres → Réseau**), puis sur l'ordinateur :

```bash
adb connect 192.168.1.50:5555
```

3. Désactivez l'accueil Google (acceptez l'autorisation affichée sur la TV) :

```bash
adb shell pm disable-user --user 0 com.google.android.apps.tv.launcherx
```

```bash
adb shell pm disable-user --user 0 com.google.android.tungsten.setupwraith
```

Le bouton Home ouvre alors Accueil TV. Pour revenir en arrière :

```bash
adb shell pm enable com.google.android.apps.tv.launcherx
```

```bash
adb shell pm enable com.google.android.tungsten.setupwraith
```

Désactiver l'accueil Google retire aussi ses recommandations et l'accès au profil
Google depuis l'accueil.
