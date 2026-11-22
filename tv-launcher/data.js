/* Contenu de l'accueil. Modifiez librement ce fichier. */
window.TV_DATA = {
  // package = identifiant Android TV (utilisé quand l'interface tourne comme lanceur)
  // url     = repli quand on est dans un simple navigateur
  apps: [
    { id: 'netflix', name: 'Netflix', package: 'com.netflix.ninja', url: 'https://www.netflix.com',
      colors: ['#E50914', '#5A0309', '#1A0204'], logoColor: '#E50914', logoStyle: 'condensed',
      desc: 'Séries, films et documentaires. Reprenez là où vous vous étiez arrêté.' },
    { id: 'youtube', name: 'YouTube', package: 'com.google.android.youtube.tv', url: 'https://www.youtube.com/tv',
      colors: ['#FF0033', '#3A0B12', '#141414'], logoColor: '#FFFFFF', logoStyle: 'play',
      desc: 'Vidéos, musique et chaînes que vous suivez.' },
    { id: 'prime', name: 'Prime Video', package: 'com.amazon.amazonvideo.livingroom', url: 'https://www.primevideo.com',
      colors: ['#1A98FF', '#0B3A66', '#06182B'], logoColor: '#FFFFFF', logoStyle: 'light',
      desc: 'Films, séries originales et sport en direct.' },
    { id: 'disney', name: 'Disney+', package: 'com.disney.disneyplus', url: 'https://www.disneyplus.com',
      colors: ['#1F80E0', '#13285C', '#070D24'], logoColor: '#FFFFFF', logoStyle: 'script',
      desc: 'Disney, Pixar, Marvel, Star Wars et National Geographic.' },
    { id: 'canal', name: 'Canal+', package: 'com.canal.android.canal', url: 'https://www.canalplus.com',
      colors: ['#F2F2F2', '#3B3B3B', '#0D0D0D'], logoColor: '#FFFFFF', logoStyle: 'bold',
      desc: 'Chaînes en direct, cinéma, sport et replay.' },
    { id: 'spotify', name: 'Spotify', package: 'com.spotify.tv.android', url: 'https://open.spotify.com',
      colors: ['#1ED760', '#0B4A24', '#08140D'], logoColor: '#1ED760', logoStyle: 'bold',
      desc: 'Musique et podcasts sur les enceintes de la TV.' },
    { id: 'deezer', name: 'Deezer', package: 'deezer.android.tv', url: 'https://www.deezer.com',
      colors: ['#A238FF', '#3C0F66', '#12061F'], logoColor: '#FFFFFF', logoStyle: 'bold',
      desc: 'Votre Flow, vos playlists et des millions de titres.' }
  ],

  continue: [
    { title: 'Les Rivages du Nord', sub: 'Saison 2, épisode 5', left: '18 min restantes', app: 'netflix', progress: 0.64,
      colors: ['#2E6F8E', '#0E2A3B', '#C7A46B'], desc: 'Sur une île balayée par les vents, une gardienne de phare découvre que les naufrages ne doivent rien au hasard.', tags: ['Thriller', '2026', '16+'] },
    { title: 'Cuisine des Volcans', sub: 'Épisode 3', left: '31 min restantes', app: 'prime', progress: 0.28,
      colors: ['#D9572B', '#4A1608', '#F2B33D'], desc: 'Un chef parcourt les terres volcaniques du monde et cuisine avec ce qu’elles offrent.', tags: ['Documentaire', '2025', 'Tous publics'] },
    { title: 'Orbite basse', sub: 'Film', left: '52 min restantes', app: 'disney', progress: 0.45,
      colors: ['#3B3FD9', '#0B0D3A', '#9AD0FF'], desc: 'Trois astronautes coincés dans une station en perdition ont dix heures pour rentrer.', tags: ['Science-fiction', '2026', '12+'] },
    { title: 'Le Grand Débrief', sub: 'Émission du dimanche', left: '9 min restantes', app: 'canal', progress: 0.82,
      colors: ['#8C8C8C', '#1E1E1E', '#E0C35A'], desc: 'Résumé et analyse de tous les matchs du week-end.', tags: ['Sport', 'Replay'] },
    { title: 'Ateliers lumière', sub: 'Tuto photo, partie 4', left: '12 min restantes', app: 'youtube', progress: 0.37,
      colors: ['#E8A33A', '#3A220A', '#FFE2A8'], desc: 'Maîtriser la lumière naturelle en intérieur avec un seul réflecteur.', tags: ['Vidéo', 'Photographie'] }
  ],

  recommendations: [
    { title: 'Marée haute', app: 'netflix', colors: ['#1B6E7A', '#062328', '#9BE3D9'], desc: 'Une enquête au long cours dans un port breton.', tags: ['Policier', '2026'] },
    { title: 'Les Derniers Glaciers', app: 'disney', colors: ['#7FB7E6', '#0D2238', '#E8F4FF'], desc: 'Un an au cœur des glaciers alpins avant leur disparition.', tags: ['Documentaire', '2025'] },
    { title: 'Midi pile', app: 'prime', colors: ['#E0B23A', '#3A2508', '#FFF1C2'], desc: 'Un western contemporain dans le désert d’Almería.', tags: ['Western', '2024'] },
    { title: 'Nuit de jazz', app: 'deezer', colors: ['#7A3FE0', '#1C0A3A', '#E7C2FF'], desc: 'Une sélection de standards pour une soirée calme.', tags: ['Playlist', 'Jazz'] },
    { title: 'Le Bureau des rêves', app: 'canal', colors: ['#D94A6A', '#3A0A18', '#FFC2CF'], desc: 'Une comédie dans une agence qui vend des rêves sur mesure.', tags: ['Comédie', '2026'] },
    { title: 'Course au large', app: 'youtube', colors: ['#2A8BD9', '#06213A', '#BFE4FF'], desc: 'Le tour du monde à la voile, filmé à bord.', tags: ['Sport', 'Série'] },
    { title: 'Focus du matin', app: 'spotify', colors: ['#2BBF6A', '#06301A', '#C9F5DA'], desc: 'Musique instrumentale pour se concentrer.', tags: ['Playlist'] },
    { title: 'L’Héritière', app: 'netflix', colors: ['#B0793A', '#2A1606', '#F4D9B0'], desc: 'Une saga familiale entre Lyon et Buenos Aires.', tags: ['Drame', '2025'] }
  ],

  featured: {
    title: 'Les Rivages du Nord', source: 'netflix',
    desc: 'Sur une île balayée par les vents, une gardienne de phare découvre que les naufrages ne doivent rien au hasard. Nouvelle saison disponible.',
    tags: ['Thriller', 'Saison 2', '16+'], action: 'Reprendre',
    colors: ['#2E6F8E', '#0E2A3B', '#C7A46B']
  },

  cities: [
    { name: 'Paris', lat: 48.8566, lon: 2.3522 },
    { name: 'Lyon', lat: 45.764, lon: 4.8357 },
    { name: 'Marseille', lat: 43.2965, lon: 5.3698 },
    { name: 'Bordeaux', lat: 44.8378, lon: -0.5792 },
    { name: 'Lille', lat: 50.6292, lon: 3.0573 },
    { name: 'Bruxelles', lat: 50.8503, lon: 4.3517 },
    { name: 'Genève', lat: 46.2044, lon: 6.1432 },
    { name: 'Montréal', lat: 45.5019, lon: -73.5674 },
    { name: 'Dakar', lat: 14.7167, lon: -17.4677 },
    { name: 'Abidjan', lat: 5.36, lon: -4.0083 },
    { name: 'Bamako', lat: 12.6392, lon: -8.0029 }
  ]
};
