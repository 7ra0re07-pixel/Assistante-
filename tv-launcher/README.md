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
- **Météo** : ville (par nom ou code postal, Sedan par défaut), °C ou °F, afficher ou masquer.
- **Affichage** : thème (Nuit bleue, Noir profond, Aurore, Forêt, Coucher de soleil,
  Clair, Automatique, avec aperçu en direct), fond d'écran photo, taille du texte,
  mode performance, marge de l'écran.
- **Veille** : délai, style (photos, paysages dessinés, horloge sur fond noir).
- **Date et heure**, **Son**, **À propos** (version, recherche de mise à jour).

Fonds d'écran : 40 photos Unsplash (licence libre) dans `wallpapers/`, crédits dans
`wallpapers/CREDITS.md`. Pour l'essayer : `?veille` (écran de veille), `?nosplash`.
