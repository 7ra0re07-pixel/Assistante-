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
- Favoris : Paramètres → Favoris. OK affiche ou masque une appli, Droite
  permet de la déplacer. Les choix sont enregistrés dans le navigateur.
- Météo détaillée : sélectionner la météo en haut à droite.
- Mode veille : après 3 minutes sans action (réglable). N'importe quelle
  touche ramène l'accueil. Pour l'essayer tout de suite : `?veille`.
- Prénom de l'écran de démarrage : `userName` dans `data.js`.
- Météo : Open-Meteo, sans clé. La ville se choisit dans les paramètres.
- Passage en lanceur Android TV : voir [ANDROID_TV.md](ANDROID_TV.md).
