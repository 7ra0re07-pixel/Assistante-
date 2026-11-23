# Accueil TV

Écran d'accueil pour TV Android, inspiré d'Apple TV et Google TV, piloté
entièrement à la télécommande.

- Ouvrir `index.html` dans un navigateur (ou servir le dossier :
  `python3 -m http.server 8080`).
- Contenu modifiable dans `data.js` : applis par défaut, catalogue d'applis,
  villes pour la météo.
- Rangées : Favoris, Films & séries, Musique (vos choix), Applis récentes
  (les dernières ouvertes depuis l'accueil) et, dans l'appli Android,
  Installées sur cette TV.
- Touches : flèches, OK/Entrée, Retour/Échap.
- Bannière : met en avant une appli favorite toutes les 10 secondes
  (Gauche/Droite sur les boutons de la bannière pour changer).
- Applis : Paramètres → Ajouter une appli (liste d'applis populaires avec leur
  logo officiel, ou « Appli personnalisée » : nom, lien ou paquet Android,
  couleur). Chaque appli va dans la rangée Favoris, Films & séries ou Musique.
- Paramètres → Mes applis : OK ouvre les options (changer de rangée, changer
  l'ordre, retirer), Droite déplace directement l'appli dans sa rangée.
- Tous ces choix sont enregistrés dans le navigateur de la TV.
- Catalogue des applis proposées : `catalog` dans `data.js`. Logos SVG issus
  de Wikimedia Commons, dans `logos/`.
- Météo détaillée : sélectionner la météo en haut à droite.
- Mode veille : après 3 minutes sans action (réglable). N'importe quelle
  touche ramène l'accueil. Pour l'essayer tout de suite : `?veille`.
- Prénom de l'écran de démarrage : `userName` dans `data.js`.
- Météo : Open-Meteo, sans clé. La ville se choisit dans les paramètres.
- Appli Android TV (APK) : voir [ANDROID_TV.md](ANDROID_TV.md) et le guide d'installation `INSTALLATION_TV.md`.

## Paramètres (roue en haut à droite)

Menu des rubriques à gauche, réglages à droite. Tout se pilote à la télécommande
et tous les choix sont enregistrés.

- **Accueil** : rangées affichées et leur ordre, bannière (activée ou non, vitesse), fond d'écran.
- **Applis** : ajouter, retirer, réordonner, voir les applis installées.
- **Maison** : clé Voice Monkey et appareils (voir le guide ci-dessous).
- **Météo** : ville (par nom ou code postal, Sedan par défaut), °C ou °F, afficher ou masquer.
- **Affichage** : thème (Nuit bleue, Noir profond, Aurore, Forêt, Coucher de soleil,
  Clair, Automatique, avec aperçu en direct), fond d'écran photo, taille du texte,
  mode performance, marge de l'écran.
- **Veille** : délai, style (photos, paysages dessinés, horloge sur fond noir).
- **Date et heure**, **Son**, **À propos** (version, recherche de mise à jour).

Fonds d'écran : 40 photos Unsplash (licence libre) dans `wallpapers/`, crédits dans
`wallpapers/CREDITS.md`. Pour l'essayer : `?veille` (écran de veille), `?nosplash`.

## Télécommande sur téléphone

Dans l'appli Android TV, **Paramètres › Télécommande** affiche un QR code et un code
d'appairage à 4 chiffres.

1. Connecte ton téléphone au **même Wi-Fi** que la TV et scanne le QR code
   (ou ouvre l'adresse affichée, par exemple `http://192.168.1.20:8080`).
2. Saisis le code à 4 chiffres : le téléphone est appairé et le reste.
3. La page propose le pavé (Haut, Bas, Gauche, Droite, OK), **Retour** et **Accueil**,
   tes applis, les tuiles **Maison**, et **Écrire sur la TV** : sélectionne un champ sur
   la TV (clé Voice Monkey, ville…), tape ou colle le texte, puis **Envoyer**.

Sur la TV, un petit badge en haut de l'écran signale chaque commande reçue du téléphone.

Sécurité :
- le serveur tourne tant que la télécommande est activée (service avec notification),
  et répond seulement sur le réseau local (les adresses Internet sont refusées) ;
- sans le code d'appairage, aucune commande n'est acceptée ; après 5 codes faux, blocage
  de 30 s, et après 20, un nouveau code est créé ;
- **Tout oublier** dans Paramètres › Télécommande déconnecte tous les téléphones ;
  l'interrupteur coupe complètement la télécommande.
- La page n'est pas chiffrée (HTTP) : utilise-la uniquement sur le Wi-Fi de la maison.

### Accueil et Retour dans toutes les applis

La télécommande reste active quand une autre appli est ouverte (Netflix, YouTube…) :
une notification « Télécommande téléphone active » le signale sur la TV.

Pour que **Accueil** et **Retour** du téléphone marchent aussi dans ces applis, active une fois
le service d'accessibilité :

1. Sur la TV, **Paramètres › Télécommande › Service d'accessibilité** (OK) : le réglage
   **Accessibilité** de la TV s'ouvre.
2. Choisis **Accueil TV : télécommande téléphone**, active-le et confirme.
3. Reviens avec Retour : la ligne indique **Activé**.

Si l'option est grisée (« paramètre restreint », Android 13 et plus) : Paramètres de la TV ›
Applis › Accueil TV › menu (⋮) › **Autoriser les paramètres restreints**, puis recommence.
Ce service ne sert qu'à appuyer sur Accueil et Retour ; il ne lit pas le contenu de l'écran.

Sans lui, la page du téléphone affiche un message : Accueil et Retour ne fonctionnent alors
que dans Accueil TV. Dans les autres applis, les flèches et OK du téléphone ne peuvent pas
piloter l'appli ouverte (Android ne le permet pas) : utilise Accueil pour revenir.

## Maison : piloter tes appareils avec Voice Monkey

La rangée **Maison** affiche une tuile interrupteur par appareil : **OK** allume
si c'est éteint, éteint si c'est allumé (ampoule jaune « Allumée », ampoule grise
« Éteinte », petite roue pendant l'envoi). Le dernier état connu est gardé sur la TV.
Si l'état affiché n'est plus le bon (lampe changée à la voix ou depuis l'appli Tapo),
**maintiens OK** : un menu propose **Allumer** et **Éteindre** séparément.
En cas d'échec, la tuile revient à son état précédent et un message explique pourquoi.
Chaque commande lance une routine Alexa par l'intermédiaire de
[Voice Monkey](https://voicemonkey.io). L'appli ne contient aucun identifiant :
tout se règle sur la TV, dans **Paramètres › Maison**.

### 1. Créer le compte et la clé

1. Crée un compte sur [voicemonkey.io](https://voicemonkey.io) et active la skill
   **Voice Monkey** dans l'appli Alexa (elle relie ton compte Alexa à Voice Monkey).
2. Dans la console Voice Monkey, ouvre **API Tokens**
   ([app.voicemonkey.io/tokens](https://app.voicemonkey.io/tokens)), clique sur
   **Create New Token**, donne-lui un nom (par exemple « TV ») puis **Create Token**.
   Copie la clé obtenue.

### 2. Créer les routines (une pour allumer, une pour éteindre)

1. Dans la console Voice Monkey, ajoute un appareil de type **Routine Trigger**
   (déclencheur de routine), par exemple `lampe-salon-on`, puis un second,
   `lampe-salon-off`. Note leur **identifiant** : c'est lui que demande l'appli.
2. Dans l'appli Alexa, crée une routine pour chacun : déclencheur
   **Maison connectée › lampe-salon-on**, action **allumer la lampe** ; puis la
   même chose avec `lampe-salon-off` pour l'éteindre.

### 3. Configurer la TV

1. **Paramètres › Maison** : appuie sur **OK** sur le champ **Clé Voice Monkey**,
   tape ta clé avec le clavier de la TV, puis **Entrée** (ou OK) pour valider.
   **Retour** ferme le clavier sans quitter la page. Choisis ensuite **Vérifier la clé**.
   - Plus simple : **Saisir depuis mon téléphone**. Un QR code s'affiche ; scanne-le
     avec ton téléphone (connecté au même Wi-Fi que la TV), colle la clé et touche
     **Envoyer à la TV**. La même option existe dans la fiche d'un appareil et pour la ville de la météo.
2. **Ajouter un appareil** : un nom (« Lampe salon »), la routine pour allumer,
   la routine pour éteindre. Les boutons **Tester** lancent chaque routine tout de suite.
3. Sur un appareil : **OK** pour le modifier ou le retirer, **Droite** pour le
   déplacer avec Haut et Bas.

### Sécurité

- La clé est enregistrée **uniquement sur la TV** (stockage local de l'appli).
  Elle n'est jamais écrite dans le code ni envoyée sur GitHub.
- Dans l'appli Android, la clé part dans l'en-tête de la requête vers
  `api-v3.voicemonkey.io`, pas dans l'adresse.
- **Saisir depuis mon téléphone** : la page est servie par la TV elle-même, sur ton
  Wi-Fi (aucun site extérieur). Son adresse contient un code aléatoire, elle ne sert
  qu'une fois et s'arrête au bout de 10 minutes ou dès que tu fais Retour. Utilise-la
  uniquement sur le Wi-Fi de la maison.
- Pour l'effacer : vide le champ **Clé Voice Monkey**. Pour la révoquer
  complètement : **Delete** sur la ligne du token dans la console Voice Monkey.

Documentation officielle : [déclencher une routine](https://voicemonkey.io/docs/api/trigger),
[authentification](https://voicemonkey.io/docs/api/authentication).
