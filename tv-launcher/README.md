# Accueil TV

Écran d'accueil pour TV Android, inspiré d'Apple TV et Google TV, piloté
entièrement à la télécommande.

- Ouvrir `index.html` dans un navigateur (ou servir le dossier :
  `python3 -m http.server 8080`).
- Contenu modifiable dans `data.js` : applis, « Continuer à regarder »,
  recommandations, contenu mis en avant, villes pour la météo.
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
