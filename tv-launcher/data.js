/* Contenu de l'accueil. Modifiez librement ce fichier. */
window.TV_DATA = {
  // Prénom affiché sur l'écran de démarrage (« Bonsoir Mambi »)
  userName: 'Mambi',

  // package  = identifiant de l'appli Android TV
  // deeplink = lien profond ouvert via intent:// dans le navigateur de la TV
  // packages = autres identifiants possibles selon le modèle de TV (l'appli Android essaie chacun)
  // url      = site web de secours si l'appli n'est pas installée
  apps: [
    { id: 'netflix', packages: ['com.netflix.ninja', 'com.netflix.mediaclient'], kind: 'video', deeplink: { scheme: 'https', path: 'www.netflix.com/browse' }, icon: 'icons/netflix.png', name: 'Netflix', package: 'com.netflix.ninja', url: 'https://www.netflix.com',
      colors: ['#E50914', '#5A0309', '#1A0204'], logoColor: '#E50914', logoStyle: 'condensed',
      desc: 'Séries, films et documentaires. Reprenez là où vous vous étiez arrêté.' },
    { id: 'youtube', packages: ['com.google.android.youtube.tv', 'com.google.android.youtube.googletv', 'com.amazon.firetv.youtube', 'com.google.android.youtube'], kind: 'video', deeplink: { scheme: 'https', path: 'www.youtube.com/' }, icon: 'icons/youtube.png', name: 'YouTube', package: 'com.google.android.youtube.tv', url: 'https://www.youtube.com/tv',
      colors: ['#FF0033', '#3A0B12', '#141414'], logoColor: '#FFFFFF', logoStyle: 'play',
      desc: 'Vidéos, musique et chaînes que vous suivez.' },
    { id: 'prime', packages: ['com.amazon.amazonvideo.livingroom', 'com.amazon.avod.thirdpartyclient', 'com.amazon.avod'], kind: 'video', deeplink: { scheme: 'https', path: 'www.primevideo.com/' }, icon: 'icons/prime.png', logo: 'logos/prime.svg', name: 'Prime Video', package: 'com.amazon.amazonvideo.livingroom', url: 'https://www.primevideo.com',
      colors: ['#1A98FF', '#1A8CFF', '#0A4FB8'], logoColor: '#FFFFFF', logoStyle: 'light',
      desc: 'Films, séries originales et sport en direct.' },
    { id: 'disney', packages: ['com.disney.disneyplus'], kind: 'video', deeplink: { scheme: 'https', path: 'www.disneyplus.com/' }, icon: 'icons/disney.png', logo: 'logos/disney.svg', name: 'Disney+', package: 'com.disney.disneyplus', url: 'https://www.disneyplus.com',
      colors: ['#1F80E0', '#13285C', '#070D24'], logoColor: '#FFFFFF', logoStyle: 'script',
      desc: 'Disney, Pixar, Marvel, Star Wars et National Geographic.' },
    { id: 'canal', packages: ['com.canal.android.canal', 'com.canalplus.canalplus'], kind: 'video', deeplink: { scheme: 'https', path: 'www.canalplus.com/' }, icon: 'icons/canal.png', logo: 'logos/canal.svg', name: 'Canal+', package: 'com.canal.android.canal', url: 'https://www.canalplus.com',
      colors: ['#F2F2F2', '#4A4A4A', '#1C1C1C'], logoColor: '#FFFFFF', logoStyle: 'bold',
      desc: 'Chaînes en direct, cinéma, sport et replay.' },
    { id: 'spotify', packages: ['com.spotify.tv.android', 'com.spotify.music'], kind: 'music', deeplink: { scheme: 'spotify', path: 'home' }, icon: 'icons/spotify.png', logo: 'logos/spotify.svg', name: 'Spotify', package: 'com.spotify.tv.android', url: 'https://open.spotify.com',
      colors: ['#1ED760', '#0B4A24', '#08140D'], logoColor: '#1ED760', logoStyle: 'bold',
      desc: 'Musique et podcasts sur les enceintes de la TV.' },
    { id: 'deezer', packages: ['deezer.android.tv', 'deezer.android.app'], kind: 'music', deeplink: { scheme: 'deezer', path: 'www.deezer.com/' }, icon: 'icons/deezer.png', logo: 'logos/deezer.svg', name: 'Deezer', package: 'deezer.android.tv', url: 'https://www.deezer.com',
      colors: ['#A238FF', '#3C0F66', '#12061F'], logoColor: '#FFFFFF', logoStyle: 'bold',
      desc: 'Votre Flow, vos playlists et des millions de titres.' },
    { id: 'googleplay', kind: 'video', packages: ['com.android.vending'], deeplink: { scheme: 'https', path: 'play.google.com/store' },
      logo: 'logos/googleplay.svg', name: 'Google Play', package: 'com.android.vending', url: 'https://play.google.com/store',
      colors: ['#34A853', '#FFFFFF', '#E8EAED'], ambient: ['#34A853', '#1A3D6B', '#FBBC04'],
      desc: 'Applis, jeux, films et séries pour votre TV.' }
  ],

  // Applis prêtes à ajouter depuis Paramètres → Ajouter une appli.
  // kind = 'video' (suggérée dans Films & séries) ou 'music' (suggérée dans Musique)
  catalog: [
    { id: 'twitch', packages: ['tv.twitch.android.app', 'tv.twitch.android.viewer'], kind: 'video', name: 'Twitch', logo: 'logos/twitch.svg', package: 'tv.twitch.android.app', url: 'https://www.twitch.tv',
      deeplink: { scheme: 'https', path: 'www.twitch.tv/' }, colors: ['#9146FF', '#7B3BE8', '#2B1155'],
      desc: 'Streams en direct, jeux vidéo et discussions.' },
    { id: 'molotov', packages: ['tv.molotov.app'], kind: 'video', name: 'Molotov', logoStyle: 'bold', logoColor: '#FFFFFF', package: 'tv.molotov.app', url: 'https://www.molotov.tv',
      deeplink: { scheme: 'https', path: 'www.molotov.tv/' }, colors: ['#F2F2F2', '#2A2A2A', '#0E0E0E'],
      desc: 'Les chaînes de la TNT en direct et en replay.' },
    { id: 'tf1plus', packages: ['fr.tf1.mytf1'], kind: 'video', name: 'TF1+', logo: 'logos/tf1plus.svg', package: 'fr.tf1.mytf1', url: 'https://www.tf1.fr',
      deeplink: { scheme: 'https', path: 'www.tf1.fr/' }, colors: ['#2F6BFF', '#123A9E', '#07163F'],
      desc: 'Les programmes de TF1, TMC, TFX et LCI en direct et en replay.' },
    { id: 'francetv', packages: ['fr.francetv.pluzz'], kind: 'video', name: 'France.tv', logo: 'logos/francetv.svg', package: 'fr.francetv.pluzz', url: 'https://www.france.tv',
      deeplink: { scheme: 'https', path: 'www.france.tv/' }, colors: ['#4C6FFF', '#1C2E7A', '#0A1233'],
      desc: 'Les chaînes de France Télévisions en direct et en replay.' },
    { id: 'arte', packages: ['tv.arte.plus7'], kind: 'video', name: 'Arte', logo: 'logos/arte.svg', package: 'tv.arte.plus7', url: 'https://www.arte.tv',
      deeplink: { scheme: 'https', path: 'www.arte.tv/' }, colors: ['#FA481C', '#4A1A0E', '#160A06'],
      desc: 'Documentaires, cinéma et séries européennes.' },
    { id: 'm6plus', packages: ['fr.m6.m6replay', 'fr.m6.m6replay.by'], kind: 'video', name: 'M6+', logo: 'logos/m6plus.svg', package: 'fr.m6.m6replay', url: 'https://www.6play.fr',
      deeplink: { scheme: 'https', path: 'www.6play.fr/' }, colors: ['#F7F700', '#F4F4F6', '#C9CAD1'], ambient: ['#F7F700', '#4A0F24', '#0082E6'],
      desc: 'Les programmes de M6, W9, 6ter et Gulli en direct et en replay.' },
    { id: 'appletv', packages: ['com.apple.atve.androidtv.appletv', 'com.apple.atve.amazon.appletv', 'com.apple.atve.sony.appletv'], kind: 'video', name: 'Apple TV+', logo: 'logos/appletv.svg', package: 'com.apple.atve.androidtv.appletv', url: 'https://tv.apple.com',
      deeplink: { scheme: 'https', path: 'tv.apple.com/' }, colors: ['#9AA4B2', '#2A2D33', '#0B0C0E'],
      desc: 'Séries et films originaux Apple.' },
    { id: 'crunchyroll', packages: ['com.crunchyroll.crunchyroid'], kind: 'video', name: 'Crunchyroll', logo: 'logos/crunchyroll.svg', package: 'com.crunchyroll.crunchyroid', url: 'https://www.crunchyroll.com',
      deeplink: { scheme: 'https', path: 'www.crunchyroll.com/' }, colors: ['#F47521', '#F47521', '#B84A0C'],
      desc: 'Le plus grand catalogue d’animes en streaming.' },
    { id: 'plex', packages: ['com.plexapp.android'], kind: 'video', name: 'Plex', logo: 'logos/plex.svg', package: 'com.plexapp.android', url: 'https://app.plex.tv',
      deeplink: { scheme: 'https', path: 'app.plex.tv/' }, colors: ['#EBAF00', '#2B2410', '#0F0D07'],
      desc: 'Vos films et séries personnels, et des chaînes gratuites.' },
    { id: 'plutotv', packages: ['tv.pluto.android'], kind: 'video', name: 'Pluto TV', logo: 'logos/plutotv.svg', package: 'tv.pluto.android', url: 'https://pluto.tv',
      deeplink: { scheme: 'https', path: 'pluto.tv/' }, colors: ['#FFF200', '#2E2C10', '#0E0D05'],
      desc: 'Des chaînes gratuites qui tournent en continu.' },
    { id: 'amazonmusic', packages: ['com.amazon.music.tv', 'com.amazon.mp3'], kind: 'music', name: 'Amazon Music', logo: 'logos/amazonmusic.svg', package: 'com.amazon.music.tv', url: 'https://music.amazon.fr',
      deeplink: { scheme: 'https', path: 'music.amazon.fr/' }, colors: ['#25D1DA', '#0D3A4A', '#06161D'],
      desc: 'Des millions de titres et de podcasts.' },
    { id: 'applemusic', packages: ['com.apple.android.music'], kind: 'music', name: 'Apple Music', logo: 'logos/applemusic.svg', package: 'com.apple.android.music', url: 'https://music.apple.com',
      deeplink: { scheme: 'https', path: 'music.apple.com/' }, colors: ['#FA2D48', '#5A0F1A', '#1A0508'],
      desc: 'Plus de 100 millions de titres et des radios en direct.' },
    { id: 'soundcloud', packages: ['com.soundcloud.android'], kind: 'music', name: 'SoundCloud', logo: 'logos/soundcloud.svg', package: 'com.soundcloud.android', url: 'https://soundcloud.com',
      deeplink: { scheme: 'https', path: 'soundcloud.com/' }, colors: ['#FF5500', '#3D1704', '#140803'],
      desc: 'Les sons des artistes et de la communauté.' },
    { id: 'tidal', packages: ['com.aspiro.tidal'], kind: 'music', name: 'Tidal', logo: 'logos/tidal.svg', package: 'com.aspiro.tidal', url: 'https://tidal.com',
      deeplink: { scheme: 'https', path: 'tidal.com/' }, colors: ['#33FFEE', '#10302E', '#050C0C'],
      desc: 'Musique en haute fidélité.' }
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
