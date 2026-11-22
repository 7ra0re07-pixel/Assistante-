/* Contenu de l'accueil. Modifiez librement ce fichier. */
window.TV_DATA = {
  // Prénom affiché sur l'écran de démarrage (« Bonsoir Mambi »)
  userName: 'Mambi',

  // package  = identifiant de l'appli Android TV
  // deeplink = lien profond ouvert via intent:// dans le navigateur de la TV
  // url      = site web de secours si l'appli n'est pas installée
  apps: [
    { id: 'netflix', kind: 'video', deeplink: { scheme: 'https', path: 'www.netflix.com/browse' }, icon: 'icons/netflix.png', name: 'Netflix', package: 'com.netflix.ninja', url: 'https://www.netflix.com',
      colors: ['#E50914', '#5A0309', '#1A0204'], logoColor: '#E50914', logoStyle: 'condensed',
      desc: 'Séries, films et documentaires. Reprenez là où vous vous étiez arrêté.' },
    { id: 'youtube', kind: 'video', deeplink: { scheme: 'https', path: 'www.youtube.com/' }, icon: 'icons/youtube.png', name: 'YouTube', package: 'com.google.android.youtube.tv', url: 'https://www.youtube.com/tv',
      colors: ['#FF0033', '#3A0B12', '#141414'], logoColor: '#FFFFFF', logoStyle: 'play',
      desc: 'Vidéos, musique et chaînes que vous suivez.' },
    { id: 'prime', kind: 'video', deeplink: { scheme: 'https', path: 'www.primevideo.com/' }, icon: 'icons/prime.png', logo: 'logos/prime.svg', name: 'Prime Video', package: 'com.amazon.amazonvideo.livingroom', url: 'https://www.primevideo.com',
      colors: ['#1A98FF', '#1A8CFF', '#0A4FB8'], logoColor: '#FFFFFF', logoStyle: 'light',
      desc: 'Films, séries originales et sport en direct.' },
    { id: 'disney', kind: 'video', deeplink: { scheme: 'https', path: 'www.disneyplus.com/' }, icon: 'icons/disney.png', logo: 'logos/disney.svg', name: 'Disney+', package: 'com.disney.disneyplus', url: 'https://www.disneyplus.com',
      colors: ['#1F80E0', '#13285C', '#070D24'], logoColor: '#FFFFFF', logoStyle: 'script',
      desc: 'Disney, Pixar, Marvel, Star Wars et National Geographic.' },
    { id: 'canal', kind: 'video', deeplink: { scheme: 'https', path: 'www.canalplus.com/' }, icon: 'icons/canal.png', logo: 'logos/canal.svg', name: 'Canal+', package: 'com.canal.android.canal', url: 'https://www.canalplus.com',
      colors: ['#F2F2F2', '#4A4A4A', '#1C1C1C'], logoColor: '#FFFFFF', logoStyle: 'bold',
      desc: 'Chaînes en direct, cinéma, sport et replay.' },
    { id: 'spotify', kind: 'music', deeplink: { scheme: 'spotify', path: 'home' }, icon: 'icons/spotify.png', logo: 'logos/spotify.svg', name: 'Spotify', package: 'com.spotify.tv.android', url: 'https://open.spotify.com',
      colors: ['#1ED760', '#0B4A24', '#08140D'], logoColor: '#1ED760', logoStyle: 'bold',
      desc: 'Musique et podcasts sur les enceintes de la TV.' },
    { id: 'deezer', kind: 'music', deeplink: { scheme: 'deezer', path: 'www.deezer.com/' }, icon: 'icons/deezer.png', logo: 'logos/deezer.svg', name: 'Deezer', package: 'deezer.android.tv', url: 'https://www.deezer.com',
      colors: ['#A238FF', '#3C0F66', '#12061F'], logoColor: '#FFFFFF', logoStyle: 'bold',
      desc: 'Votre Flow, vos playlists et des millions de titres.' }
  ],

  // Applis prêtes à ajouter depuis Paramètres → Ajouter une appli.
  // kind = 'video' (suggérée dans Films & séries) ou 'music' (suggérée dans Musique)
  catalog: [
    { id: 'twitch', kind: 'video', name: 'Twitch', logo: 'logos/twitch.svg', package: 'tv.twitch.android.app', url: 'https://www.twitch.tv',
      deeplink: { scheme: 'https', path: 'www.twitch.tv/' }, colors: ['#9146FF', '#7B3BE8', '#2B1155'],
      desc: 'Streams en direct, jeux vidéo et discussions.' },
    { id: 'molotov', kind: 'video', name: 'Molotov', logoStyle: 'bold', logoColor: '#FFFFFF', package: 'tv.molotov.app', url: 'https://www.molotov.tv',
      deeplink: { scheme: 'https', path: 'www.molotov.tv/' }, colors: ['#F2F2F2', '#2A2A2A', '#0E0E0E'],
      desc: 'Les chaînes de la TNT en direct et en replay.' },
    { id: 'tf1plus', kind: 'video', name: 'TF1+', logo: 'logos/tf1plus.svg', package: 'fr.tf1.mytf1', url: 'https://www.tf1.fr',
      deeplink: { scheme: 'https', path: 'www.tf1.fr/' }, colors: ['#2F6BFF', '#123A9E', '#07163F'],
      desc: 'Les programmes de TF1, TMC, TFX et LCI en direct et en replay.' },
    { id: 'francetv', kind: 'video', name: 'France.tv', logo: 'logos/francetv.svg', package: 'fr.francetv.pluzz', url: 'https://www.france.tv',
      deeplink: { scheme: 'https', path: 'www.france.tv/' }, colors: ['#4C6FFF', '#1C2E7A', '#0A1233'],
      desc: 'Les chaînes de France Télévisions en direct et en replay.' },
    { id: 'arte', kind: 'video', name: 'Arte', logo: 'logos/arte.svg', package: 'tv.arte.plus7', url: 'https://www.arte.tv',
      deeplink: { scheme: 'https', path: 'www.arte.tv/' }, colors: ['#FA481C', '#4A1A0E', '#160A06'],
      desc: 'Documentaires, cinéma et séries européennes.' },
    { id: 'm6plus', kind: 'video', name: 'M6+', logo: 'logos/m6plus.svg', package: 'fr.m6.m6replay', url: 'https://www.6play.fr',
      deeplink: { scheme: 'https', path: 'www.6play.fr/' }, colors: ['#F7F700', '#F4F4F6', '#C9CAD1'],
      desc: 'Les programmes de M6, W9, 6ter et Gulli en direct et en replay.' },
    { id: 'appletv', kind: 'video', name: 'Apple TV+', logo: 'logos/appletv.svg', package: 'com.apple.atve.androidtv.appletv', url: 'https://tv.apple.com',
      deeplink: { scheme: 'https', path: 'tv.apple.com/' }, colors: ['#9AA4B2', '#2A2D33', '#0B0C0E'],
      desc: 'Séries et films originaux Apple.' },
    { id: 'crunchyroll', kind: 'video', name: 'Crunchyroll', logo: 'logos/crunchyroll.svg', package: 'com.crunchyroll.crunchyroid', url: 'https://www.crunchyroll.com',
      deeplink: { scheme: 'https', path: 'www.crunchyroll.com/' }, colors: ['#F47521', '#F47521', '#B84A0C'],
      desc: 'Le plus grand catalogue d’animes en streaming.' },
    { id: 'plex', kind: 'video', name: 'Plex', logo: 'logos/plex.svg', package: 'com.plexapp.android', url: 'https://app.plex.tv',
      deeplink: { scheme: 'https', path: 'app.plex.tv/' }, colors: ['#EBAF00', '#2B2410', '#0F0D07'],
      desc: 'Vos films et séries personnels, et des chaînes gratuites.' },
    { id: 'plutotv', kind: 'video', name: 'Pluto TV', logo: 'logos/plutotv.svg', package: 'tv.pluto.android', url: 'https://pluto.tv',
      deeplink: { scheme: 'https', path: 'pluto.tv/' }, colors: ['#FFF200', '#2E2C10', '#0E0D05'],
      desc: 'Des chaînes gratuites qui tournent en continu.' },
    { id: 'amazonmusic', kind: 'music', name: 'Amazon Music', logo: 'logos/amazonmusic.svg', package: 'com.amazon.music.tv', url: 'https://music.amazon.fr',
      deeplink: { scheme: 'https', path: 'music.amazon.fr/' }, colors: ['#25D1DA', '#0D3A4A', '#06161D'],
      desc: 'Des millions de titres et de podcasts.' },
    { id: 'applemusic', kind: 'music', name: 'Apple Music', logo: 'logos/applemusic.svg', package: 'com.apple.android.music', url: 'https://music.apple.com',
      deeplink: { scheme: 'https', path: 'music.apple.com/' }, colors: ['#FA2D48', '#5A0F1A', '#1A0508'],
      desc: 'Plus de 100 millions de titres et des radios en direct.' },
    { id: 'soundcloud', kind: 'music', name: 'SoundCloud', logo: 'logos/soundcloud.svg', package: 'com.soundcloud.android', url: 'https://soundcloud.com',
      deeplink: { scheme: 'https', path: 'soundcloud.com/' }, colors: ['#FF5500', '#3D1704', '#140803'],
      desc: 'Les sons des artistes et de la communauté.' },
    { id: 'tidal', kind: 'music', name: 'Tidal', logo: 'logos/tidal.svg', package: 'com.aspiro.tidal', url: 'https://tidal.com',
      deeplink: { scheme: 'https', path: 'tidal.com/' }, colors: ['#33FFEE', '#10302E', '#050C0C'],
      desc: 'Musique en haute fidélité.' }
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
