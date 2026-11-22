# Installer « Accueil TV » sur votre TV Android

L'appli est compilée automatiquement par GitHub à chaque modification.
Lien de téléchargement (toujours la dernière version) :

- Adresse courte, à taper dans Downloader : **`7ra0re07-pixel.github.io/Assistante-/tv.apk`**
- Adresse de secours : `https://github.com/7ra0re07-pixel/Assistante-/releases/download/apk/AccueilTV.apk`

---

## Étape 1 : installer Downloader

1. Sur la TV, ouvrez le **Google Play Store**.
2. Recherchez **Downloader** (icône orange, éditeur « AFTVnews »).
3. Installez-le, puis ouvrez-le une première fois et acceptez ce qu'il demande
   (accès aux fichiers).

## Étape 2 : autoriser Downloader à installer des applis

Android bloque par défaut les applis qui ne viennent pas du Play Store.

**Sur Google TV** (Chromecast avec Google TV, TV Sony, TCL, Philips récentes…) :

1. **Paramètres → Système → À propos**.
2. Descendez jusqu'à **Build du système d'exploitation Android TV** et appuyez
   **7 fois** sur OK. Le message « Vous êtes maintenant développeur » s'affiche.
3. Revenez à **Paramètres → Applications → Sécurité et restrictions → Sources inconnues**.
4. Activez **Downloader**.

**Sur Android TV plus ancien** :
**Paramètres → Préférences de l'appareil → Sécurité et restrictions → Sources inconnues**,
puis activez **Downloader**.

Si vous sautez cette étape, Downloader vous enverra directement vers ce réglage
au moment d'installer : activez-le, puis appuyez sur Retour.

## Étape 3 : télécharger et installer l'appli

1. Ouvrez **Downloader**, onglet **Home**.
2. Sélectionnez la zone de saisie, tapez :
   `7ra0re07-pixel.github.io/Assistante-/tv.apk`
   puis appuyez sur **Go**.
3. Le téléchargement (environ 1 Mo) dure quelques secondes.
4. Une fenêtre demande « Voulez-vous installer cette application ? » :
   choisissez **Installer**.
   - Si **Play Protect** affiche « Appli non vérifiée », choisissez
     **Plus de détails → Installer quand même**. C'est normal pour une appli
     qui ne vient pas du Play Store.
5. Choisissez **Ouvrir** pour lancer « Accueil TV » tout de suite, ou **OK**.
6. Downloader propose ensuite de supprimer le fichier téléchargé :
   choisissez **Supprimer** (l'appli reste installée, le fichier ne sert plus).

L'appli apparaît maintenant dans la liste des applis de la TV, avec la bannière
« Accueil TV ».

## Étape 4 : en faire l'écran d'accueil

**Sur Android TV classique** (Sony, Philips, Nvidia Shield… anciennes versions) :
appuyez sur le bouton **Home** de la télécommande. La TV demande quelle appli
utiliser : choisissez **Accueil TV**, puis **Toujours**.

**Sur Google TV** : Google ne propose pas ce choix. Deux solutions :

- **Sans ordinateur** : installez l'appli **Button Mapper** depuis le Play Store
  et réglez l'appui sur le bouton **Home** pour ouvrir **Accueil TV**.
  Button Mapper vous guide pour activer l'autorisation dont il a besoin.
- **Avec un ordinateur** (désactive l'accueil Google, réversible) : voir
  l'étape 5 du fichier `tv-launcher/ANDROID_TV.md`.

## Utilisation

- Les tuiles ouvrent directement les applis installées sur la TV.
  Si une appli n'est pas installée, le Play Store s'ouvre sur sa page.
- **Paramètres (roue en haut à droite) → Ajouter une appli** affiche une section
  **Installées sur cette TV** : toutes vos applis, avec leur bannière officielle,
  prêtes à être ajoutées dans Favoris, Films & séries ou Musique.
- **Paramètres → Paramètres de la TV** ouvre les réglages Android (utile quand
  Accueil TV remplace l'accueil d'origine).
- Le bouton **Home** ramène toujours en haut de l'accueil.

## Mettre à jour

À chaque modification de l'interface, GitHub compile une nouvelle version
(quelques minutes). Pour l'installer, refaites l'**étape 3** avec la même
adresse : Downloader la garde dans son historique. La nouvelle version
s'installe par-dessus l'ancienne et **vos réglages sont conservés**
(favoris, applis ajoutées, ville de la météo…).

## Revenir à l'accueil d'origine

**Paramètres → Applications → Accueil TV → Désinstaller.**
Sur Google TV, si vous aviez utilisé Button Mapper, désactivez aussi son
réglage pour le bouton Home.
