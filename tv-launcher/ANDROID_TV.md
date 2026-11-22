# Transformer l'accueil web en lanceur Android TV

L'idée : une petite appli Android qui affiche cette interface en plein écran dans
une **WebView**, se déclare comme **écran d'accueil**, et fournit à la page un
« pont » JavaScript pour ouvrir les vraies applis installées (Netflix, YouTube…).

La page est déjà prête pour ça : dans `app.js`, si `window.AndroidTV.launchApp`
existe, elle l'utilise. Sinon, elle ouvre le site web de l'appli.

---

## Étape 0 : tester dans le navigateur de la TV

1. Hébergez le dossier `tv-launcher/` quelque part. Le plus simple est
   **GitHub Pages** (Settings → Pages → branche + dossier), ou un serveur sur
   votre réseau local : `python3 -m http.server 8080` depuis ce dossier, puis
   ouvrez `http://IP-DE-VOTRE-PC:8080` sur la TV.
2. Les flèches et le bouton OK de la télécommande fonctionnent directement.
   Le bouton Retour ferme les panneaux ouverts.

### Ouverture des applis depuis le navigateur

Sur une TV Android, chaque tuile essaie d'abord d'ouvrir l'appli installée
avec un lien `intent://` (défini par `deeplink` et `package` dans `data.js`).
Si l'appli n'est pas installée, ou si le navigateur ne gère pas ce type de lien,
la page ouvre le site web de l'appli au bout de 2,5 secondes.

- Chrome gère les liens `intent://`. Certains navigateurs pour TV les ignorent :
  dans ce cas, c'est le site web qui s'ouvre.
- Le réglage **Paramètres → Ouvrir les applis installées** permet de toujours
  ouvrir le site web à la place.
- Si une appli précise ne s'ouvre pas, ajustez son `deeplink` dans `data.js`.

L'appli Android décrite ci-dessous reste la solution la plus fiable : elle ouvre
les applis directement, sans passer par le navigateur.

---

## Étape 1 : créer le projet

Dans **Android Studio**, créez un projet « No Activity » en Kotlin,
avec **Minimum SDK 21** (Android 5.0, couvre presque toutes les TV).

Copiez les fichiers web dans les *assets* :

```
app/src/main/assets/www/index.html
app/src/main/assets/www/style.css
app/src/main/assets/www/app.js
app/src/main/assets/www/data.js
```

Ajoutez une bannière 320×180 px : `app/src/main/res/drawable/banner.png`.
C'est l'image qu'Android TV affiche dans la liste des applis.

---

## Étape 2 : `AndroidManifest.xml`

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />

    <!-- TV : pas d'écran tactile requis, Leanback facultatif -->
    <uses-feature android:name="android.hardware.touchscreen" android:required="false" />
    <uses-feature android:name="android.software.leanback" android:required="false" />

    <!-- Android 11+ : permet de « voir » les autres applis pour les lancer -->
    <queries>
        <intent>
            <action android:name="android.intent.action.MAIN" />
            <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
        </intent>
    </queries>

    <application
        android:label="Accueil TV"
        android:banner="@drawable/banner"
        android:icon="@mipmap/ic_launcher"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTask"
            android:stateNotNeeded="true"
            android:screenOrientation="landscape"
            android:configChanges="keyboard|keyboardHidden|navigation|orientation|screenSize">

            <!-- Apparaît dans la liste des applis de la TV -->
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <!-- Se déclare comme écran d'accueil (bouton Home) -->
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.HOME" />
                <category android:name="android.intent.category.DEFAULT" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

---

## Étape 3 : `MainActivity.kt`

```kotlin
package com.example.accueiltv

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.view.KeyEvent
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient

class MainActivity : Activity() {

    private lateinit var web: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        web = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true          // préférences (ville, 24 h…)
            settings.mediaPlaybackRequiresUserGesture = false
            setBackgroundColor(0xFF0A0E1A.toInt())     // évite un flash blanc au démarrage
            webViewClient = WebViewClient()
            addJavascriptInterface(TvBridge(), "AndroidTV")
            isFocusable = true
            requestFocus()
            loadUrl("file:///android_asset/www/index.html")
        }
        setContentView(web)
    }

    /** Fonctions appelables depuis la page : window.AndroidTV.launchApp("com.netflix.ninja") */
    inner class TvBridge {
        @JavascriptInterface
        fun launchApp(packageName: String): Boolean {
            val pm = packageManager
            val intent = pm.getLeanbackLaunchIntentForPackage(packageName)
                ?: pm.getLaunchIntentForPackage(packageName)
                ?: return false
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            runOnUiThread { startActivity(intent) }
            return true
        }

        @JavascriptInterface
        fun openSystemSettings() {
            runOnUiThread { startActivity(Intent(android.provider.Settings.ACTION_SETTINGS)) }
        }
    }

    // Un écran d'accueil ne se ferme jamais : Retour est confié à la page.
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        web.evaluateJavascript("window.tvHandleKey && tvHandleKey('back')", null)
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        // Certaines télécommandes envoient DPAD_CENTER : on le traduit en Entrée.
        if (event.keyCode == KeyEvent.KEYCODE_DPAD_CENTER) {
            if (event.action == KeyEvent.ACTION_DOWN) {
                web.evaluateJavascript("window.tvHandleKey && tvHandleKey('ok')", null)
            }
            return true
        }
        return super.dispatchKeyEvent(event)
    }

    // Appui sur Home alors qu'on est déjà sur l'accueil : on revient en haut.
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        web.evaluateJavascript("location.reload()", null)
    }
}
```

---

## Étape 4 : installer sur la TV

1. Sur la TV : **Paramètres → Système → À propos**, appuyez 7 fois sur
   « Build Android TV » pour activer les **options pour les développeurs**,
   puis activez le **débogage USB** et le **débogage réseau** (ADB).
2. Notez l'adresse IP de la TV (Paramètres → Réseau).
3. Sur votre ordinateur :

```bash
adb connect 192.168.1.50:5555
```

Acceptez l'autorisation qui s'affiche sur la TV, puis dans Android Studio
cliquez sur **Run** avec la TV sélectionnée. Vous pouvez aussi lancer :

```bash
./gradlew installDebug
```

L'appli « Accueil TV » apparaît dans la liste des applis.

---

## Étape 5 : en faire l'écran d'accueil par défaut

Ça dépend du modèle :

- **Android TV classique** (Sony, Philips, Nvidia Shield…) : en appuyant sur
  Home, la TV propose souvent de choisir l'écran d'accueil. Choisissez
  « Accueil TV », puis « Toujours ».
- **Google TV** (Chromecast avec Google TV, TV récentes) : Google ne propose pas
  de choix. Il faut désactiver le lanceur d'origine via ADB :

```bash
adb shell pm disable-user --user 0 com.google.android.apps.tv.launcherx
```

```bash
adb shell pm disable-user --user 0 com.google.android.tungsten.setupwraith
```

  C'est **réversible** à tout moment :

```bash
adb shell pm enable com.google.android.apps.tv.launcherx
```

```bash
adb shell pm enable com.google.android.tungsten.setupwraith
```

  Sur Google TV, désactiver le lanceur d'origine retire aussi l'accès aux
  recommandations Google et au profil. Gardez la commande `pm enable` sous la
  main avant de commencer.

---

## Ajuster les applis

Les identifiants des applis sont dans `data.js` (champ `package`). Si une appli
ne s'ouvre pas, son identifiant diffère sur votre TV. Pour lister ceux qui sont
installés :

```bash
adb shell pm list packages | grep -i -E "netflix|youtube|amazon|disney|canal|spotify|deezer"
```

## Pistes pour la suite

- **Liste d'applis automatique** : ajouter au pont une fonction `getApps()` qui
  renvoie les applis LEANBACK installées (nom, package, bannière en base64),
  et construire la rangée « Mes applis » à partir de là.
- **Vraies vignettes « Continuer à regarder »** : Android TV expose les
  programmes via `TvContractCompat.WatchNextPrograms`. C'est lisible seulement
  par une appli système, donc les vignettes restent configurées à la main dans
  `data.js`, sauf sur un appareil rooté.
- **Fonctionnement hors ligne** : les polices viennent de Google Fonts.
  Embarquez-les dans `assets/www/fonts/` pour un rendu identique sans réseau.
