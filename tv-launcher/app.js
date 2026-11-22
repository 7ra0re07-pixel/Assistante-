(() => {
  'use strict';
  const D = window.TV_DATA;
  const $ = (id) => document.getElementById(id);
  const appById = Object.fromEntries(D.apps.map(a => [a.id, a]));
  const SLEEP_CHOICES = [0, 1, 3, 5, 10, 15]; // minutes avant la veille (0 = jamais)
  const params = new URLSearchParams(location.search);
  const SITE = 'https://7ra0re07-pixel.github.io/Assistante-/'; // site publié (version.json, tv.apk)
  const root = document.documentElement;

  /* ---------- Préférences enregistrées ---------- */
  function load(k, def) { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* stockage indisponible */ } }
  const DEFAULT_CITY = { name: 'Sedan', postcode: '08200', region: 'Ardennes', lat: 49.70, lon: 4.94 };
  const ALL_ROWS = ['favoris', 'maison', 'films', 'musique', 'recent', 'installed'];
  const prefs = Object.assign({
    city: DEFAULT_CITY, unit: 'C', showWeather: true,
    h24: true, showDate: true, sounds: true, openApps: true, reduceMotion: false,
    sleepMin: 3, saverStyle: 'photos',
    displayScale: 100, textSize: 1, perf: false, theme: 'nuit',
    banner: true, bannerSec: 10,
    rowOrder: ALL_ROWS.slice(), rowHidden: [],
    wallCat: 'none', wallEvery: 15
  }, load('tv.prefs', {}));
  // Ville : Sedan par défaut (remplace l'ancien réglage par liste de villes)
  if (!prefs.city || typeof prefs.city.lat !== 'number') prefs.city = DEFAULT_CITY;
  delete prefs.cityIndex;
  if (Array.isArray(prefs.rowOrder) && !prefs.rowOrder.includes('maison')) prefs.rowOrder.splice(prefs.rowOrder.indexOf('favoris') + 1, 0, 'maison');
  prefs.rowOrder = [...(prefs.rowOrder || []).filter(k => ALL_ROWS.includes(k)), ...ALL_ROWS.filter(k => !(prefs.rowOrder || []).includes(k))];
  prefs.rowHidden = (prefs.rowHidden || []).filter(k => ALL_ROWS.includes(k));
  const savePrefs = () => save('tv.prefs', prefs);
  savePrefs();

  /* ---------- Thèmes ---------- */
  // Chaque thème définit le fond, les cartes, les textes et la couleur de sélection (dégradés légers, sans flou).
  const DARK_LINES = { line: 'rgba(255,255,255,.14)', 'line-2': 'rgba(255,255,255,.28)', glass: 'rgba(255,255,255,.07)', 'glass-2': 'rgba(255,255,255,.16)', field: 'rgba(0,0,0,.28)' };
  const THEMES = {
    nuit: { label: 'Nuit bleue', v: { ...DARK_LINES, bg: '#0A0E1A', card: '#121829', text: '#F2F4F8', 'text-2': '#D6DBE6', muted: '#A3ACBF',
      accent: '#F2F4F8', 'accent-ink': '#0A0E1A', 'accent-2': '#3A4256', panel: '#0E1322', modal: '#141A2C', splash: '#1C2B4C',
      grad: 'radial-gradient(120% 90% at 80% 0%, #16223F 0%, #0A0E1A 60%)' } },
    noir: { label: 'Noir profond', v: { ...DARK_LINES, bg: '#000000', card: '#0E0E10', text: '#FFFFFF', 'text-2': '#D9D9DE', muted: '#9A9AA3',
      accent: '#FFFFFF', 'accent-ink': '#000000', 'accent-2': '#44444C', panel: '#050506', modal: '#111114', splash: '#18181C',
      grad: 'radial-gradient(120% 90% at 80% 0%, #121214 0%, #000000 55%)' } },
    aurore: { label: 'Aurore', v: { ...DARK_LINES, bg: '#150B26', card: '#24133F', text: '#FBF4FF', 'text-2': '#E8D9F4', muted: '#C3AADA',
      accent: '#FF7AC6', 'accent-ink': '#2A0B28', 'accent-2': '#6B2350', panel: '#1A0E30', modal: '#24133F', splash: '#5B2A86',
      grad: 'radial-gradient(110% 80% at 85% 0%, #5B2A86 0%, transparent 60%), radial-gradient(90% 70% at 0% 100%, #7E2766 0%, transparent 60%), #150B26' } },
    foret: { label: 'Forêt', v: { ...DARK_LINES, bg: '#0B1A13', card: '#14291E', text: '#EFF6EE', 'text-2': '#D3E3D4', muted: '#9DB8A4',
      accent: '#B9E07B', 'accent-ink': '#10240F', 'accent-2': '#3D5A2A', panel: '#0E2018', modal: '#15291F', splash: '#1F4A33',
      grad: 'radial-gradient(110% 80% at 85% 0%, #1F4A33 0%, transparent 60%), radial-gradient(90% 70% at 0% 100%, #3B4A23 0%, transparent 60%), #0B1A13' } },
    coucher: { label: 'Coucher de soleil', v: { ...DARK_LINES, bg: '#1F0D08', card: '#311710', text: '#FFF5EC', 'text-2': '#F2DCCB', muted: '#DDB49A',
      accent: '#FFB547', 'accent-ink': '#2B1206', 'accent-2': '#7A4310', panel: '#26100A', modal: '#33180F', splash: '#8A2E14',
      grad: 'radial-gradient(110% 80% at 85% 0%, #8A2E14 0%, transparent 60%), radial-gradient(90% 70% at 0% 100%, #9A5A12 0%, transparent 60%), #1F0D08' } },
    clair: { label: 'Clair', light: true, v: { bg: '#EEF1F6', card: '#FFFFFF', text: '#121826', 'text-2': '#2C3445', muted: '#5B6578',
      line: 'rgba(0,0,0,.12)', 'line-2': 'rgba(0,0,0,.22)', glass: 'rgba(0,0,0,.05)', 'glass-2': 'rgba(0,0,0,.09)', field: '#FFFFFF',
      accent: '#1A56DB', 'accent-ink': '#FFFFFF', 'accent-2': '#DCE6FF', panel: '#F5F7FB', modal: '#FFFFFF', splash: '#D9E4F7',
      grad: 'radial-gradient(110% 80% at 85% 0%, #D9E4F7 0%, transparent 60%), #EEF1F6' } },
    auto: { label: 'Automatique', note: 'Clair de 7 h à 19 h, Nuit bleue le soir' }
  };
  const THEME_KEYS = Object.keys(THEMES);
  const hexRgb = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)).join(', ');
  const resolvedTheme = (key) => {
    if (key === 'auto') { const h = new Date().getHours(); return h >= 7 && h < 19 ? 'clair' : 'nuit'; }
    return THEMES[key] && THEMES[key].v ? key : 'nuit';
  };
  let appliedTheme = null, previewingTheme = false;
  function applyTheme(key) {
    const k = resolvedTheme(key), t = THEMES[k];
    Object.entries(t.v).forEach(([n, val]) => root.style.setProperty('--' + n, val));
    root.style.setProperty('--bg-rgb', hexRgb(t.v.bg));
    root.classList.toggle('theme-light', !!t.light);
    appliedTheme = k;
  }
  // Taille du texte, mode performance, animations
  const TEXT_SIZES = [[1, 'Normale'], [1.12, 'Grande'], [1.25, 'Très grande']];
  function applyDisplay() {
    root.style.setProperty('--ts', prefs.textSize || 1);
    root.classList.toggle('perf', !!prefs.perf);
    root.classList.toggle('reduce-motion', !!prefs.reduceMotion);
  }
  applyTheme(prefs.theme);
  applyDisplay();
  // Détection : flexbox avec « gap » (absent avant Chrome 84) → marges de repli en CSS
  (function detectFlexGap() {
    const d = document.createElement('div');
    d.style.cssText = 'display:flex;flex-direction:column;row-gap:1px;position:absolute;visibility:hidden';
    d.appendChild(document.createElement('div')); d.appendChild(document.createElement('div'));
    document.body.appendChild(d);
    const ok = d.scrollHeight === 1;
    d.remove();
    root.classList.toggle('no-flexgap', !ok);
  })();

  /* ---------- Applis installées sur la TV (appli Android uniquement) ---------- */
  const hasBridge = () => !!(window.AndroidTV && typeof window.AndroidTV.launchApp === 'function');
  let installed = [], installedMap = {}, installedSig = '';
  function refreshInstalled() {
    if (!hasBridge() || typeof window.AndroidTV.getInstalledApps !== 'function') return false;
    try {
      const list = JSON.parse(window.AndroidTV.getInstalledApps());
      const sig = list.map(x => x.package).join(',');
      const changed = sig !== installedSig;
      installed = list; installedSig = sig;
      installedMap = Object.fromEntries(list.map(x => [x.package, x]));
      return changed;
    } catch { return false; }
  }
  const pkgsOf = (a) => (a.packages && a.packages.length ? a.packages : [a.package]).filter(Boolean);
  const isInstalled = (a) => pkgsOf(a).some(p => installedMap[p]);
  refreshInstalled();
  // Appli de la TV présentée comme une tuile (bannière officielle ou icône)
  function installedAsApp(x) {
    return customApp({ id: 'inst-' + x.package, installed: true, name: x.name, package: x.package, color: x.color || '#2A3550' });
  }

  /* ---------- Bibliothèque d'applis (enregistrée) ---------- */
  // items  : applis présentes sur l'accueil, dans l'ordre, avec leur rangée
  // custom : applis personnalisées (nom, lien ou paquet, couleur)
  const ROW_DEFS = [
    { key: 'favoris', title: 'Favoris' },
    { key: 'films', title: 'Films & séries' },
    { key: 'musique', title: 'Musique' }
  ];
  const rowTitle = (k) => (ROW_DEFS.find(d => d.key === k) || ROW_DEFS[0]).title;
  const BUILTIN = [...D.apps, ...(D.catalog || [])];
  const builtinById = Object.fromEntries(BUILTIN.map(a => [a.id, a]));
  let lib = load('tv.library', null);

  function shade(hex, f) { // f < 0 : plus sombre
    const n = parseInt(hex.slice(1), 16), ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    return '#' + ch.map(v => Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f).toString(16).padStart(2, '0')).join('');
  }
  function luminance(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
      .reduce((acc, v, i) => acc + v * [0.2126, 0.7152, 0.0722][i], 0);
  }
  function customApp(c) {
    if (c.installed) return { id: c.id, custom: true, installed: true, name: c.name, package: c.package, url: '',
      color: c.color, kind: c.kind || 'video', colors: [c.color, shade(c.color, -0.35), shade(c.color, -0.7)],
      textColor: '#FFFFFF', desc: 'Appli installée sur cette TV.' };
    return { id: c.id, custom: true, name: c.name, url: c.url || '', package: c.package || '', color: c.color,
      kind: c.kind || 'video', colors: [c.color, c.color, shade(c.color, -0.55)],
      textColor: luminance(c.color) > 0.45 ? '#111111' : '#FFFFFF',
      desc: c.url ? `Ouvre ${c.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}` : `Appli Android ${c.package}` };
  }
  function getApp(id) {
    if (builtinById[id]) return builtinById[id];
    const c = lib.custom.find(x => x.id === id);
    if (c) return customApp(c);
    if (id.startsWith('inst-') && installedMap[id.slice(5)]) return installedAsApp(installedMap[id.slice(5)]);
    return null;
  }

  function normalizeLib() {
    if (!lib || !Array.isArray(lib.items)) {
      // première ouverture : on reprend les anciens favoris s'ils existent
      const old = load('tv.favs', null);
      const ids = old && Array.isArray(old.order) ? old.order.filter(id => !(old.hidden || []).includes(id)) : D.apps.map(a => a.id);
      lib = { items: ids.map(id => ({ id, row: 'favoris' })), custom: [] };
    }
    lib.custom = (lib.custom || []).filter(c => c && c.id && c.name && c.color);
    const keys = ROW_DEFS.map(d => d.key);
    const seen = new Set();
    lib.items = lib.items.filter(it => it && getApp(it.id) && !seen.has(it.id) && seen.add(it.id))
      .map(it => ({ id: it.id, row: keys.includes(it.row) ? it.row : 'favoris' }));
    if (!lib.items.length) lib.items = D.apps.map(a => ({ id: a.id, row: 'favoris' }));
    // Nouvelles applis par défaut : ajoutées une seule fois à la fin des Favoris
    // (si vous les retirez ensuite, elles ne reviennent pas).
    lib.added = Array.isArray(lib.added) ? lib.added : [];
    NEW_DEFAULTS.forEach(id => {
      if (lib.added.includes(id)) return;
      if (!lib.items.some(it => it.id === id)) {
        const lastFav = lib.items.map(it => it.row).lastIndexOf('favoris');
        lib.items.splice(lastFav + 1, 0, { id, row: 'favoris' });
      }
      lib.added.push(id);
    });
  }
  const NEW_DEFAULTS = ['googleplay'];
  normalizeLib();
  save('tv.library', lib);
  const saveLib = () => save('tv.library', lib);

  // Applis récentes : les dernières applis ouvertes depuis l'accueil (10 au plus)
  let recents = load('tv.recent', []), recentsDirty = false;
  if (!Array.isArray(recents)) recents = [];
  function pushRecent(id) {
    recents = [id, ...recents.filter(x => x !== id)].slice(0, 10);
    save('tv.recent', recents); recentsDirty = true;
  }
  const recentApps = () => recents.map(getApp).filter(Boolean);
  const appsInRow = (key) => lib.items.filter(it => it.row === key).map(it => getApp(it.id));

  /* ---------- Mise à l'échelle 16:9 ---------- */
  // La scène fait 1920×1080 ; on la réduit pour tenir entièrement dans l'écran, puis on la centre.
  // « Taille de l'affichage » (paramètres) la réduit encore si la TV rogne les bords (overscan).
  function fit() {
    const de = document.documentElement;
    const W = de.clientWidth || innerWidth, H = de.clientHeight || innerHeight;
    if (!W || !H) return;
    const s = Math.min(W / 1920, H / 1080) * (prefs.displayScale || 100) / 100;
    de.style.setProperty('--scale', s.toFixed(5));
    de.style.setProperty('--tx', ((W - 1920 * s) / 2).toFixed(1) + 'px');
    de.style.setProperty('--ty', ((H - 1080 * s) / 2).toFixed(1) + 'px');
  }
  addEventListener('resize', fit);
  if (window.visualViewport) visualViewport.addEventListener('resize', fit);
  addEventListener('load', fit);
  fit(); setTimeout(fit, 300); setTimeout(fit, 1500); // la TV peut donner sa taille définitive un peu après

  /* ---------- Sons de navigation (générés, aucun fichier) ---------- */
  let actx = null;
  function sound(type) {
    if (!prefs.sounds) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      const t0 = actx.currentTime;
      const tone = (freq, at, dur, vol, wave = 'sine', to) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = wave; o.frequency.setValueAtTime(freq, t0 + at);
        if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + at + dur);
        g.gain.setValueAtTime(0.0001, t0 + at);
        g.gain.exponentialRampToValueAtTime(vol, t0 + at + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dur);
        o.connect(g); g.connect(actx.destination);
        o.start(t0 + at); o.stop(t0 + at + dur + 0.03);
      };
      if (type === 'move') tone(1250, 0, 0.05, 0.03, 'sine', 1050);
      else if (type === 'select') { tone(660, 0, 0.09, 0.05); tone(990, 0.06, 0.16, 0.045); }
      else if (type === 'back') tone(720, 0, 0.11, 0.04, 'sine', 430);
      else if (type === 'edge') tone(200, 0, 0.07, 0.035, 'triangle');
      else if (type === 'wake') { tone(523, 0, 0.18, 0.035); tone(784, 0.09, 0.26, 0.03); }
    } catch { /* audio indisponible */ }
  }

  /* ---------- Heure et date ---------- */
  const fmtTime = (d) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: !prefs.h24 });
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const fmtDate = (d) => cap(d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));
  function tick() {
    const now = new Date();
    $('time').textContent = fmtTime(now);
    $('date').textContent = fmtDate(now);
    $('saverTime').textContent = fmtTime(now);
    $('saverDate').textContent = fmtDate(now);
    $('date').hidden = !prefs.showDate;
    $('saverDate').hidden = !prefs.showDate;
    // thème automatique : bascule clair / sombre selon l'heure
    if (prefs.theme === 'auto' && !previewingTheme && resolvedTheme('auto') !== appliedTheme) applyTheme('auto');
  }
  tick(); setInterval(tick, 5000);

  /* ---------- Météo (Open-Meteo, sans clé) ---------- */
  const ICONS = {
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="#FFD166" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.2" fill="#FFD166"/><path d="M12 2v2.2M12 19.8V22M2 12h2.2M19.8 12H22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6"/></svg>',
    moon: '<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" fill="#C9D4F2"/></svg>',
    partly: '<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round"><circle cx="9" cy="9" r="3.6" fill="#FFD166"/><path d="M9 2.5v1.6M2.5 9h1.6M4.4 4.4l1.1 1.1M13.6 4.4l-1.1 1.1" stroke="#FFD166" stroke-width="1.6"/><path d="M8 19h9.5a3.5 3.5 0 0 0 .3-7 5 5 0 0 0-9.6 1.2A3 3 0 0 0 8 19z" fill="#E6EAF2"/></svg>',
    cloud: '<svg viewBox="0 0 24 24"><path d="M7 19h10.5a4 4 0 0 0 .4-8 6 6 0 0 0-11.5 1.5A3.3 3.3 0 0 0 7 19z" fill="#D5DBE6"/></svg>',
    fog: '<svg viewBox="0 0 24 24" stroke="#D5DBE6" stroke-width="2" stroke-linecap="round"><path d="M4 9h16M3 13h18M5 17h14"/></svg>',
    rain: '<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round"><path d="M7 15h10.5a4 4 0 0 0 .4-8 6 6 0 0 0-11.5 1.5A3.3 3.3 0 0 0 7 15z" fill="#C3CBDA"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3" stroke="#6FB7FF" stroke-width="1.8"/></svg>',
    snow: '<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round"><path d="M7 15h10.5a4 4 0 0 0 .4-8 6 6 0 0 0-11.5 1.5A3.3 3.3 0 0 0 7 15z" fill="#D5DBE6"/><circle cx="8" cy="19" r="1.1" fill="#fff"/><circle cx="12" cy="21" r="1.1" fill="#fff"/><circle cx="16" cy="19" r="1.1" fill="#fff"/></svg>',
    storm: '<svg viewBox="0 0 24 24"><path d="M7 15h10.5a4 4 0 0 0 .4-8 6 6 0 0 0-11.5 1.5A3.3 3.3 0 0 0 7 15z" fill="#AEB7C8"/><path d="M12.5 14l-3 5h3l-1.5 4 4.5-6h-3l1.5-3z" fill="#FFD166"/></svg>'
  };
  function iconFor(code, day) {
    if (code === 0) return day ? 'sun' : 'moon';
    if (code <= 2) return day ? 'partly' : 'cloud';
    if (code === 3) return 'cloud';
    if (code === 45 || code === 48) return 'fog';
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
    if (code >= 95) return 'storm';
    return 'rain';
  }
  const CONDITIONS = {
    0: 'Ciel dégagé', 1: 'Plutôt dégagé', 2: 'Partiellement nuageux', 3: 'Couvert',
    45: 'Brouillard', 48: 'Brouillard givrant', 51: 'Bruine légère', 53: 'Bruine', 55: 'Bruine dense',
    56: 'Bruine verglaçante', 57: 'Bruine verglaçante', 61: 'Pluie faible', 63: 'Pluie', 65: 'Forte pluie',
    66: 'Pluie verglaçante', 67: 'Pluie verglaçante', 71: 'Neige faible', 73: 'Neige', 75: 'Forte neige',
    77: 'Grains de neige', 80: 'Averses faibles', 81: 'Averses', 82: 'Fortes averses',
    85: 'Averses de neige', 86: 'Fortes averses de neige', 95: 'Orage', 96: 'Orage avec grêle', 99: 'Orage avec grêle'
  };
  const condition = (code) => CONDITIONS[code] || 'Conditions variables';
  const city = () => prefs.city;
  const cityLabel = (c = city()) => c.name + (c.postcode ? ` (${c.postcode})` : '');
  const weatherKey = () => `${city().lat.toFixed(3)},${city().lon.toFixed(3)},${prefs.unit}`;
  let wx = null, wxOffline = false;

  function renderWeather() {
    $('weather').hidden = !prefs.showWeather;
    $('weatherCity').textContent = city().name;
    const ok = wx && wx.key === weatherKey();
    $('weatherTemp').textContent = ok ? Math.round(wx.t) + '°' : '--°';
    $('weatherIcon').innerHTML = ICONS[ok ? iconFor(wx.code, wx.day) : 'cloud'];
    $('saverWeather').hidden = !prefs.showWeather;
    $('saverWeather').innerHTML = ok
      ? `${ICONS[iconFor(wx.code, wx.day)]}<span>${Math.round(wx.t)}° ${condition(wx.code).toLowerCase()}, ${city().name}</span>`
      : `<span>${city().name}</span>`;
    if (layer === 'weather') renderWeatherPanel();
  }
  async function updateWeather() {
    // la dernière météo connue reste affichée, même hors connexion
    const cached = load('tv.weather', null);
    wx = cached && cached.key === weatherKey() && cached.days ? cached : null;
    renderWeather();
    try {
      const c = city(), key = weatherKey();
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}` +
        '&current=temperature_2m,apparent_temperature,weather_code,is_day,relative_humidity_2m,wind_speed_10m' +
        '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=5&timezone=auto' +
        (prefs.unit === 'F' ? '&temperature_unit=fahrenheit' : '');
      const r = await fetch(url);
      if (!r.ok) throw new Error(r.status);
      const j = await r.json();
      if (key !== weatherKey()) return; // la ville ou l'unité a changé pendant la requête
      wx = {
        key, city: c.name, at: Date.now(),
        t: j.current.temperature_2m, feel: j.current.apparent_temperature, code: j.current.weather_code,
        day: !!j.current.is_day, hum: j.current.relative_humidity_2m, wind: j.current.wind_speed_10m,
        days: j.daily.time.map((date, i) => ({
          date, code: j.daily.weather_code[i], max: j.daily.temperature_2m_max[i],
          min: j.daily.temperature_2m_min[i], rain: j.daily.precipitation_probability_max?.[i]
        }))
      };
      wxOffline = false;
      save('tv.weather', wx); renderWeather();
    } catch {
      wxOffline = true; // hors ligne : on garde la dernière météo connue
      if (layer === 'weather') renderWeatherPanel();
    }
  }

  function renderWeatherPanel() {
    const c = city();
    const ok = wx && wx.key === weatherKey() && wx.days;
    if (!ok) {
      $('weatherCard').innerHTML = `<div class="wx-head"><h2>Météo à ${esc(c.name)}</h2></div>
        <div class="wx-empty">La météo n'est pas disponible pour le moment. Vérifiez que la TV est connectée à Internet, puis réessayez dans quelques minutes.</div>
        <div class="details-hint">Appuyez sur Retour pour fermer.</div>`;
      return;
    }
    const at = new Date(wx.at);
    const when = at.toDateString() === new Date().toDateString() ? `à ${fmtTime(at)}` : `le ${at.toLocaleDateString('fr-FR')} à ${fmtTime(at)}`;
    const dayName = (iso, i) => i === 0 ? "Aujourd'hui" : i === 1 ? 'Demain'
      : cap(new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long' }));
    $('weatherCard').innerHTML = `
      <div class="wx-head"><h2>Météo à ${esc(c.name)}</h2><span class="wx-upd">${wxOffline ? `Hors ligne : dernière mise à jour ${when}` : `Mise à jour ${when}`}</span></div>
      <div class="wx-now">
        <div class="wx-icon">${ICONS[iconFor(wx.code, wx.day)]}</div>
        <div class="wx-temp">${Math.round(wx.t)}°</div>
        <div>
          <div class="wx-cond">${condition(wx.code)}</div>
          <div class="wx-meta"><span>Ressenti <b>${Math.round(wx.feel)}°</b></span><span>Humidité <b>${Math.round(wx.hum)} %</b></span><span>Vent <b>${Math.round(wx.wind)} km/h</b></span><span>Unité <b>°${prefs.unit}</b></span></div>
        </div>
      </div>
      <div class="wx-days">${wx.days.slice(0, 5).map((d, i) => `
        <div class="wx-day"><div class="d">${dayName(d.date, i)}</div>${ICONS[iconFor(d.code, true)]}
          <div><span class="hi">${Math.round(d.max)}°</span><span class="lo">${Math.round(d.min)}°</span></div>
          ${d.rain != null ? `<div class="rain">Pluie ${Math.round(d.rain)} %</div>` : ''}</div>`).join('')}
      </div>
      <div class="details-hint">Appuyez sur Retour pour fermer.</div>`;
  }

  // Recherche d'une ville par nom ou code postal (géocodage Open-Meteo)
  async function searchCities(q) {
    q = q.trim();
    const isPostcode = /^\d{4,5}$/.test(q);
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=10&language=fr&format=json${isPostcode ? '&countryCode=FR' : ''}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(r.status);
    const j = await r.json();
    return (j.results || []).map(x => {
      const pcs = x.postcodes || [];
      return { name: x.name, postcode: isPostcode && pcs.includes(q) ? q : (pcs[0] || ''),
        region: x.admin2 || x.admin1 || '', country: x.country || '', lat: x.latitude, lon: x.longitude };
    });
  }

  /* ---------- Tuiles ---------- */
  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  // Logo officiel (SVG) quand il existe, sinon logo dessiné en CSS (Netflix, YouTube)
  const esc = (t) => String(t).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  function logoHTML(a) {
    if (a.installed) {
      const info = installedMap[a.package];
      if (info && info.banner) return `<img class="app-banner" src="${info.banner}" alt="" draggable="false">`;
      if (info && info.icon) return `<span class="app-inst"><img src="${info.icon}" alt="" draggable="false"><span>${esc(a.name)}</span></span>`;
    }
    if (a.custom) return `<span class="app-logo custom" style="--logo:${a.textColor}">${esc(a.name)}</span>`;
    return a.logo
      ? `<img class="app-logo-img app-logo-${a.id}" src="${a.logo}" alt="" draggable="false" data-name="${esc(a.name)}" onerror="tvLogoFallback(this)">`
      : `<span class="app-logo ${a.logoStyle}${String(a.logoColor).toUpperCase() === '#FFFFFF' ? ' logo-white' : ''}" style="--logo:${a.logoColor}">${a.logoStyle === 'play' ? '<span class="play"></span>' : ''}${a.name}</span>`;
  }
  // logo introuvable : on affiche le nom de l'appli à la place
  window.tvLogoFallback = (img) => { const t = document.createElement('span'); t.className = 'app-logo bold'; t.style.setProperty('--logo', '#fff'); t.textContent = img.dataset.name; img.replaceWith(t); };
  const appItem = (a) => ({ kind: 'app', id: a.id, title: a.name, source: a.id, desc: a.desc, colors: a.ambient || a.colors, action: `Ouvrir ${a.name}` });

  function appTile(a) {
    const t = el('button', 'tile tile-app focusable', logoHTML(a));
    t.style.setProperty('--tc1', a.colors[0]); t.style.setProperty('--tc2', a.colors[1]); t.style.setProperty('--tc3', a.colors[2]);
    t.setAttribute('aria-label', a.name);
    if (a.custom) t.classList.add('tile-custom');
    t.classList.add('tile-' + a.id);
    t._item = appItem(a);
    return t;
  }
  /* ---------- Rangées et navigation ---------- */
  // NAV[0] = barre du haut, NAV[1] = boutons de la bannière (si elle est affichée), puis les rangées
  let ROWS = [], NAV = [], memory = [];
  let r = 1, c = 0, focusedEl = null;
  let layer = 'home'; // home | settings | details | weather | network
  const HERO = () => (prefs.banner ? 1 : -1);   // rangée de la bannière (-1 = pas de bannière)
  const FIRST = () => (prefs.banner ? 2 : 1);   // première rangée de tuiles
  const homeRow = () => (prefs.banner ? 1 : Math.min(1, NAV.length - 1));
  const ROW_TITLES = { favoris: 'Favoris', maison: 'Maison', films: 'Films & séries', musique: 'Musique', recent: 'Applis récentes', installed: 'Installées sur cette TV' };

  function rowSource(key) {
    if (key === 'maison') return homeTiles();
    if (key === 'recent') return recentApps();
    if (key === 'installed') return installed.map(installedAsApp);
    return appsInRow(key);
  }
  function buildRows() {
    const rowsEl = $('rows'); rowsEl.innerHTML = '';
    ROWS = prefs.rowOrder.filter(k => !prefs.rowHidden.includes(k))
      .map(k => ({ title: ROW_TITLES[k], key: k, items: k === 'maison' ? homeTiles() : rowSource(k).map(appTile) }))
      .filter(rw => rw.items.length);
    ROWS.forEach(row => {
      const sec = el('section', 'row');
      sec.appendChild(el('h2', 'row-title', row.title));
      const vp = el('div', 'row-viewport'), tr = el('div', 'track');
      row.items.forEach(i => { tr.appendChild(i); bindPointer(i); });
      vp.appendChild(tr); sec.appendChild(vp); rowsEl.appendChild(sec);
      row.el = sec; row.track = tr; row.offset = 0;
    });
    const top = [$('netBtn'), ...(prefs.showWeather ? [$('weather')] : []), $('settingsBtn')];
    NAV = [{ items: top }, ...(prefs.banner ? [{ items: [$('heroPlay'), $('heroMore')] }] : []), ...ROWS];
    memory = NAV.map((_, i) => (i === 0 ? top.length - 1 : 0));
    $('hero').hidden = !prefs.banner;
    $('scroller').classList.toggle('no-banner', !prefs.banner);
  }
  // Redessine l'accueil après un changement de réglage, en gardant une sélection valide
  function rebuildHome() {
    buildRows();
    heroItem = null;
    const n = slides().length; slideIdx = Math.max(0, Math.min(slideIdx, n - 1));
    if (n) showSlide(slideIdx, false);
    r = Math.min(r, NAV.length - 1); c = Math.min(c, NAV[r].items.length - 1);
  }

  /* ---------- Bannière dynamique ---------- */
  let heroItem = null, slideIdx = 0, rotTimer = 0, heroTimer = 0, swapToken = 0;
  const rotationMs = () => (prefs.bannerSec || 10) * 1000;
  const slides = () => { const f = appsInRow('favoris'); return (f.length ? f : lib.items.map(it => getApp(it.id))).filter(Boolean); };

  function setAmbient(col) {
    root.style.setProperty('--c1', col[0]); root.style.setProperty('--c2', col[1]); root.style.setProperty('--c3', col[2]);
  }
  function renderHero(item, animate) {
    if (heroItem && heroItem.kind === item.kind && heroItem.id === item.id) return;
    heroItem = item; setAmbient(item.colors);
    const token = ++swapToken;
    const apply = () => {
      if (token !== swapToken) return;
      const a = getApp(item.source);
      $('heroText').classList.add('is-app');
      $('heroLogo').innerHTML = a ? logoHTML(a) : '';
      $('heroTitle').textContent = item.title;
      $('heroDesc').textContent = item.desc;
      $('heroPlayLabel').textContent = item.action;
      $('heroDots').classList.remove('hidden');
      $('heroText').classList.remove('swap');
    };
    if (!animate || prefs.reduceMotion || prefs.perf) return apply();
    $('heroText').classList.add('swap');
    setTimeout(apply, 220);
  }
  function rotationActive() { return prefs.banner && layer === 'home' && r <= HERO() && !saverOn && !splashOn && !document.hidden; }
  function renderDots() {
    const list = slides();
    $('heroDots').style.setProperty('--rot', rotationMs() + 'ms');
    $('heroDots').innerHTML = list.map((_, i) => `<span class="dot-i${i === slideIdx ? ' on' : ''}"></span>`).join('');
    $('heroDots').classList.toggle('paused', !rotationActive());
  }
  // (re)lance le minuteur de la bannière et l'animation du point actif
  function restartRotation() {
    clearTimeout(rotTimer);
    renderDots();
    if (rotationActive()) rotTimer = setTimeout(() => showSlide(slideIdx + 1), rotationMs());
  }
  function showSlide(i, animate = true) {
    const list = slides();
    if (!list.length) return;
    slideIdx = ((i % list.length) + list.length) % list.length;
    renderHero(appItem(list[slideIdx]), animate);
    restartRotation();
  }

  /* ---------- Focus ---------- */
  function focus(nr, nc, fromKey = true) {
    const prevR = r, prevEl = focusedEl;
    r = Math.max(0, Math.min(NAV.length - 1, nr));
    const items = NAV[r].items;
    c = Math.max(0, Math.min(items.length - 1, nc));
    memory[r] = c;
    const target = items[c];
    if (focusedEl) focusedEl.classList.remove('focused');
    if (!target) return;
    target.classList.add('focused'); focusedEl = target;
    if (fromKey && prevEl !== target) sound('move');
    ROWS.forEach(row => row.el.classList.toggle('active', NAV[r] === row));

    clearTimeout(heroTimer);
    if (r >= FIRST() && target._item) {
      const item = target._item;
      if (item.kind === 'app') { const k = slides().findIndex(a => a.id === item.id); if (k >= 0) slideIdx = k; }
      heroTimer = setTimeout(() => renderHero(item, true), fromKey ? 160 : 0);
    } else if (prefs.banner && r <= HERO() && prevR >= FIRST()) {
      showSlide(slideIdx);
    }
    if (r <= HERO() || prevR <= HERO()) restartRotation();
    scrollTo();
  }

  // Défilement : l'élément sélectionné reste entièrement visible, avec une marge de 10 % en haut et en bas.
  // Tout est calculé à partir des positions des rangées (pas de scrollHeight, peu fiable sur certaines TV).
  const STAGE_W = 1920, STAGE_H = 1080, MARGIN_Y = 108, TOP_BAR = 170, SIDE = 96;
  let scrollY = 0;
  function scrollTo() {
    const row = NAV[r];
    if (row && row.track) { // horizontal : toute la tuile (agrandie et son halo) dans l'écran
      const t = row.items[c];
      const grow = Math.round(t.offsetWidth * 0.045) + 14;
      const left = t.offsetLeft - grow, right = t.offsetLeft + t.offsetWidth + grow;
      const last = row.items[row.items.length - 1];
      const max = Math.max(0, last.offsetLeft + last.offsetWidth + grow + SIDE - STAGE_W);
      if (right - row.offset > STAGE_W - SIDE) row.offset = right - (STAGE_W - SIDE);
      if (left - row.offset < SIDE) row.offset = left - SIDE;
      row.offset = Math.max(0, Math.min(max, row.offset));
      row.track.style.transform = `translateX(${-row.offset}px)`;
    }
    // vertical
    let y = scrollY;
    if (r <= HERO() || r === 0 || !row || !row.track) y = 0;
    else {
      const t = row.items[c];
      const growY = Math.round(t.offsetHeight * 0.045) + 14;
      const top = row.el.offsetTop;                                            // titre de la rangée compris
      const bottom = row.track.offsetTop + t.offsetTop + t.offsetHeight + growY + 30;
      const minTop = Math.max(TOP_BAR + 20, MARGIN_Y), maxBottom = STAGE_H - MARGIN_Y;
      if (bottom - y > maxBottom) y = bottom - maxBottom;
      if (top - y < minTop) y = top - minTop;
      const lastRow = ROWS[ROWS.length - 1];
      const contentH = lastRow ? lastRow.el.offsetTop + lastRow.el.offsetHeight + 140 : STAGE_H;
      y = Math.max(0, Math.min(y, Math.max(0, contentH - STAGE_H)));
      if (r === FIRST() && prefs.banner && bottom <= maxBottom) y = 0; // première rangée : la bannière reste visible
    }
    scrollY = y;
    $('scroller').style.transform = `translateY(${-y}px)`;
    // une rangée qui passe sous la barre du haut s'efface (pas de logos derrière l'horloge)
    ROWS.forEach(rw => { rw.el.style.opacity = y > 0 && rw.el.offsetTop - y < TOP_BAR - 20 ? 0 : 1; });
    const deep = y > 120;
    $('hero').style.opacity = deep ? 0 : 1;
    $('stage').classList.toggle('scrolled', y > 0);
  }

  function move(dir) {
    const n = NAV[r].items.length;
    const onHero = r === HERO() && heroItem && heroItem.kind === 'app';
    if (dir === 'left') {
      if (onHero && c === 0) { sound('move'); return showSlide(slideIdx - 1); }
      if (c === 0) return sound('edge');
      return focus(r, c - 1);
    }
    if (dir === 'right') {
      if (onHero && c === n - 1) { sound('move'); return showSlide(slideIdx + 1); }
      if (c === n - 1) return sound('edge');
      return focus(r, c + 1);
    }
    if (dir === 'up') { if (r === 0) return sound('edge'); return focus(r - 1, r - 1 === HERO() ? 0 : memory[r - 1]); }
    if (dir === 'down') { if (r === NAV.length - 1) return sound('edge'); return focus(r + 1, r + 1 === HERO() ? 0 : memory[r + 1]); }
  }

  function activate(target) {
    if (target === $('netBtn')) return openNetwork();
    if (target === $('weather')) return openWeather();
    if (target === $('settingsBtn')) return openSettings();
    if (target === $('heroMore')) return openDetails(heroItem);
    if (target._home) return homeAction(target);
    const item = target === $('heroPlay') ? heroItem : target._item;
    if (item && getApp(item.source)) launch(getApp(item.source), item);
  }

  /* ---------- Ouverture des applis ---------- */
  const isAndroid = /Android/i.test(navigator.userAgent);

  // Site de secours : le site de l'appli, sinon sa page sur le Play Store
  const webUrl = (a) => a.url || `https://play.google.com/store/apps/details?id=${encodeURIComponent(a.package)}`;
  // intent://… ouvre l'appli installée ; S.browser_fallback_url = site web si elle est absente
  function intentUrl(a) {
    const fallback = `S.browser_fallback_url=${encodeURIComponent(webUrl(a))};end`;
    if (a.deeplink) return `intent://${a.deeplink.path}#Intent;scheme=${a.deeplink.scheme};package=${a.package};${fallback}`;
    return `intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.LEANBACK_LAUNCHER;package=${a.package};${fallback}`;
  }
  function launch(a, item) {
    sound('select');
    if (item.kind === 'app') pushRecent(a.id);
    const what = item.kind === 'app' ? a.name : `${item.title} dans ${a.name}`;
    if (hasBridge()) { // appli Android : ouverture native
      const pkgs = pkgsOf(a);
      if (pkgs.length && window.AndroidTV.launchApp(pkgs.join(','))) return toast(`Ouverture de ${what}`);
      if (a.url && (a.custom || !pkgs.length)) { toast(`Ouverture de ${a.name}`); return window.AndroidTV.openUrl(a.url); }
      if (pkgs.length) { toast(`${a.name} n'est pas installée sur cette TV. Ouverture du Play Store.`); return window.AndroidTV.openStore(pkgs[0]); }
      return;
    }
    if (prefs.openApps && isAndroid && a.package) {
      toast(`Ouverture de ${what}`);
      let left = false;
      const mark = () => { left = true; };
      document.addEventListener('visibilitychange', mark, { once: true });
      addEventListener('pagehide', mark, { once: true });
      addEventListener('blur', mark, { once: true });
      location.href = intentUrl(a);
      // Navigateur qui ignore les liens intent:// : on bascule sur le site web
      setTimeout(() => {
        if (left || document.hidden) return;
        toast(`${a.name} ne s'ouvre pas depuis ce navigateur. Ouverture du site web.`);
        setTimeout(() => { location.href = webUrl(a); }, 1200);
      }, 2500);
      return;
    }
    toast(a.url ? `Ouverture de ${a.custom ? a.name : 'du site ' + a.name}` : `${a.name} est une appli Android : ouverture de sa page Play Store`);
    setTimeout(() => { location.href = webUrl(a); }, 700);
  }

  let toastTimer = 0;
  function toast(msg, isError) {
    const t = $('toast'); t.textContent = msg; t.classList.add('show'); t.classList.toggle('error', !!isError);
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), isError ? 5000 : 2600);
  }

  /* ---------- Maison : appareils pilotés par des routines Voice Monkey ---------- */
  // La clé et les appareils sont enregistrés uniquement sur cette TV (stockage local), jamais dans le code.
  const VM_API = 'https://api-v3.voicemonkey.io/';
  let home = load('tv.home', null);
  if (!home || typeof home !== 'object') home = {};
  home.key = typeof home.key === 'string' ? home.key : '';
  home.devices = Array.isArray(home.devices) ? home.devices.filter(d => d && d.id && d.name) : [];
  const saveHome = () => save('tv.home', home);
  const homeReady = () => !!home.key.trim() && home.devices.some(d => d.on || d.off);

  // Requête vers Voice Monkey : par l'appli Android (clé envoyée dans l'en-tête), sinon par le navigateur
  let httpSeq = 0; const httpWait = {};
  window.tvHttpResult = (id, status, body) => { const cb = httpWait[id]; delete httpWait[id]; if (cb) cb({ status: Number(status) || 0, body: body || '' }); };
  function vmRequest(path, params) {
    const query = Object.keys(params).map(k => `${k}=${encodeURIComponent(params[k])}`).join('&');
    if (hasBridge() && typeof window.AndroidTV.httpGet === 'function') {
      return new Promise(res => {
        const id = 'r' + (++httpSeq);
        httpWait[id] = res;
        setTimeout(() => { if (httpWait[id]) { delete httpWait[id]; res({ status: 0, body: '' }); } }, 20000);
        window.AndroidTV.httpGet(id, VM_API + path + (query ? '?' + query : ''), home.key.trim());
      });
    }
    const url = VM_API + path + '?' + [`token=${encodeURIComponent(home.key.trim())}`, query].filter(Boolean).join('&');
    return fetch(url).then(r => r.text().then(body => ({ status: r.status, body })))
      // navigateur qui bloque la lecture de la réponse : la commande part, sans confirmation possible
      .catch(() => fetch(url, { mode: 'no-cors' }).then(() => ({ status: -1, body: '' })).catch(() => ({ status: 0, body: '' })));
  }
  // Traduit la réponse de Voice Monkey en message clair
  function vmResult(res, routine) {
    let err = '';
    try { err = String(JSON.parse(res.body).error || ''); } catch { err = /^[A-Z_]+/.test(res.body) ? res.body : ''; }
    err = err.split(':')[0];
    if (res.status === 200 && !err) return { ok: true };
    if (res.status === -1) return { ok: true, unsure: true };
    if (res.status === 0) return { ok: false, msg: net.online ? 'Voice Monkey ne répond pas. Réessaie dans un instant.' : 'Pas de connexion Internet : la commande n’a pas été envoyée.' };
    const badKey = 'Clé Voice Monkey refusée : vérifie-la dans Paramètres > Maison.';
    const M = {
      UNAUTHORIZED: badKey, INVALID_TOKEN: badKey, USER_NOT_FOUND: badKey,
      DEVICE_NOT_FOUND: `Routine « ${routine} » introuvable sur ton compte Voice Monkey : vérifie son identifiant.`,
      MISSING_DEVICE: 'Aucune routine indiquée pour cette commande.',
      THROTTLED: 'Trop de commandes d’affilée : réessaie dans un instant.',
      MONTHLY_QUOTA_EXCEEDED: 'Quota mensuel Voice Monkey atteint : les commandes reprendront le mois prochain.',
      ALEXA_TRIGGER_FAILED: 'Alexa n’a pas pu lancer la routine : réessaie.'
    };
    if (M[err]) return { ok: false, msg: M[err] };
    if (res.status === 401 || res.status === 403) return { ok: false, msg: badKey };
    if (res.status === 404) return { ok: false, msg: M.DEVICE_NOT_FOUND };
    if (res.status === 429) return { ok: false, msg: M.THROTTLED };
    return { ok: false, msg: `La commande a échoué (erreur ${res.status}). Réessaie dans un instant.` };
  }
  async function triggerRoutine(routine) {
    routine = (routine || '').trim();
    if (!home.key.trim()) return { ok: false, msg: 'Ajoute ta clé Voice Monkey dans Paramètres > Maison.' };
    if (!routine) return { ok: false, msg: 'Aucune routine indiquée pour cette commande.' };
    if (!net.online) return { ok: false, msg: 'Pas de connexion Internet : la commande n’a pas été envoyée.' };
    return vmResult(await vmRequest('trigger', { device: routine }), routine);
  }

  // Tuiles de la rangée Maison : « Allumer » et « Éteindre » pour chaque appareil
  const H_ICONS = {
    on: '<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6M10 21h4" stroke="currentColor" stroke-width="1.8"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z" fill="currentColor"/><path d="M3.2 4.2l1.5 1.4M20.8 4.2l-1.5 1.4M1.5 10.5h2M20.5 10.5h2" stroke="currentColor" stroke-width="1.8"/></svg>',
    off: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/></svg>',
    setup: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M12 13v4M10 15h4"/></svg>'
  };
  function homeTile(kind, device) {
    const t = el('button', `tile tile-home ${kind} focusable`);
    const name = kind === 'setup' ? (home.key.trim() ? 'Ajoute tes appareils dans les paramètres' : 'Configure tes appareils dans les paramètres') : device.name;
    const act = kind === 'on' ? 'Allumer' : kind === 'off' ? 'Éteindre' : 'Paramètres › Maison';
    t.innerHTML = `<span class="h-icon">${H_ICONS[kind]}</span><span class="h-name">${esc(name)}</span><span class="h-act">${act}</span>`;
    t.style.setProperty('--tc1', kind === 'on' ? '#FFC94D' : kind === 'off' ? '#8A94A8' : '#6FA8FF');
    t.setAttribute('aria-label', kind === 'setup' ? name : `${act} ${device.name}`);
    t._home = { kind, device };
    return t;
  }
  function homeTiles() {
    if (!homeReady()) return [homeTile('setup')];
    return home.devices.flatMap(d => [...(d.on ? [homeTile('on', d)] : []), ...(d.off ? [homeTile('off', d)] : [])]);
  }
  async function homeAction(tile) {
    const { kind, device } = tile._home;
    if (kind === 'setup') return openSettingsAt('maison');
    if (tile.classList.contains('busy')) return;
    sound('select');
    tile.classList.add('busy');
    const res = await triggerRoutine(kind === 'on' ? device.on : device.off);
    tile.classList.remove('busy');
    if (res.ok) toast(`${device.name} : commande « ${kind === 'on' ? 'Allumer' : 'Éteindre'} » ${res.unsure ? 'envoyée' : 'exécutée'}`);
    else { sound('edge'); toast(`${device.name} : ${res.msg}`, true); }
  }

  /* ---------- Fenêtres : détail, météo, réseau ---------- */
  function openLayer(id, name) { $(id).classList.add('open'); $(id).setAttribute('aria-hidden', 'false'); layer = name; clearTimeout(rotTimer); renderDots(); }
  function closeLayer(id) { $(id).classList.remove('open'); $(id).setAttribute('aria-hidden', 'true'); layer = 'home'; sound('back'); restartRotation(); }
  function openDetails(item) {
    sound('select');
    $('detailsTitle').textContent = item.title; $('detailsDesc').textContent = item.desc;
    openLayer('details', 'details');
  }
  function openWeather() {
    sound('select'); openLayer('weatherPanel', 'weather'); renderWeatherPanel();
    if (!wx || Date.now() - wx.at > 30 * 60000) updateWeather(); // prévisions récentes (la fenêtre se met à jour)
  }

  // Réseau : nom du Wi-Fi, force du signal, état d'Internet et raccourci vers les réglages de la TV
  let netIdx = 0;
  function netActions() {
    const acts = [];
    if (hasBridge() && typeof window.AndroidTV.openNetworkSettings === 'function') {
      acts.push({ label: 'Ouvrir les réglages réseau de la TV', run: () => window.AndroidTV.openNetworkSettings() });
      if (net.type === 'wifi' && net.connected && !net.ssid && typeof window.AndroidTV.requestWifiName === 'function')
        acts.push({ label: 'Afficher le nom du réseau', run: () => window.AndroidTV.requestWifiName() });
    }
    acts.push({ label: 'Fermer', run: () => closeLayer('netPanel') });
    return acts;
  }
  function renderNetPanel() {
    const lines = [];
    if (!net.connected) lines.push('<span class="bad">Aucune connexion réseau</span>');
    else if (net.type === 'ethernet') lines.push('Connexion : <b>câble Ethernet</b>');
    else if (net.type === 'wifi') {
      lines.push(net.ssid ? `Réseau Wi-Fi : <b>${esc(net.ssid)}</b>`
        : net.fromApp ? 'Réseau Wi-Fi : <b>nom masqué par Android</b>' : 'Connexion : <b>Wi-Fi</b>');
      if (net.fromApp) lines.push(`Signal : <b>${SIGNAL[net.level] || 'Inconnu'}</b> (${net.level} barre${net.level > 1 ? 's' : ''} sur 4)`);
    } else lines.push(`Connexion : <b>${esc(net.type)}</b>`);
    lines.push(net.online ? 'Internet : <b>connecté</b>' : '<span class="bad">Pas de connexion Internet</span>');
    if (!net.online && wx) lines.push(`Météo : dernière mise à jour à ${fmtTime(new Date(wx.at))}`);
    if (!net.fromApp) lines.push('<span>Le nom du réseau et la force du signal sont visibles dans l’appli Android TV.</span>');
    const acts = netActions();
    netIdx = Math.min(netIdx, acts.length - 1);
    $('netCard').innerHTML = `<h2>Réseau</h2><div class="net-lines">${lines.map(l => `<div>${l}</div>`).join('')}</div>
      <ul class="net-actions">${acts.map((a, i) => `<li class="setting${i === netIdx ? ' focused' : ''}" data-i="${i}"><span>${a.label}</span></li>`).join('')}</ul>`;
  }
  function openNetwork() { sound('select'); netIdx = 0; readNetwork(); openLayer('netPanel', 'network'); renderNetPanel(); }
  function networkKey(k) {
    const acts = netActions();
    if (k === 'back') return closeLayer('netPanel');
    if (k === 'up' || k === 'down') { const n = Math.max(0, Math.min(acts.length - 1, netIdx + (k === 'up' ? -1 : 1))); sound(n === netIdx ? 'edge' : 'move'); netIdx = n; return renderNetPanel(); }
    if (k === 'ok') { sound('select'); acts[netIdx].run(); if (layer === 'network') renderNetPanel(); }
  }

  /* ---------- Paramètres (menu des rubriques à gauche, réglages à droite) ---------- */
  const SWATCHES = ['#E50914', '#FF6B00', '#F5C518', '#1DB954', '#00A3A3', '#1A73E8', '#6C3BFF', '#E0218A', '#5A5F6B', '#141414'];
  const ROW_KEYS = ROW_DEFS.map(d => d.key);
  const MARGINS = [0, 5, 10, 15, 20];
  const BANNER_SECS = [6, 10, 15, 20];
  const SAVER_STYLES = [['photos', 'Photos'], ['paysages', 'Paysages dessinés'], ['noir', 'Horloge sur fond noir']];
  const switchHTML = (on) => `<span class="switch ${on ? 'on' : ''}"></span>`;
  const mini = (a) => `<span class="mini" style="--tc2:${a.colors[1]};--tc3:${a.colors[2]}">${logoHTML(a)}</span>`;
  const cycle = (list, cur, d) => list[(list.indexOf(cur) + d + list.length) % list.length];
  const svg = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const CATS = [
    { key: 'accueil', label: 'Accueil', icon: svg('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>') },
    { key: 'applis', label: 'Applis', icon: svg('<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>') },
    { key: 'maison', label: 'Maison', icon: svg('<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>') },
    { key: 'meteo', label: 'Météo', icon: svg('<path d="M7 18h10a4 4 0 0 0 .4-8 6 6 0 0 0-11.5 1.5A3.3 3.3 0 0 0 7 18z"/>') },
    { key: 'affichage', label: 'Affichage', icon: svg('<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>') },
    { key: 'veille', label: 'Veille', icon: svg('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>') },
    { key: 'heure', label: 'Date et heure', icon: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>') },
    { key: 'son', label: 'Son', icon: svg('<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/>') },
    { key: 'apropos', label: 'À propos', icon: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>') }
  ];

  let pane = 'menu', catIdx = 0;
  const nav = { page: 'cat-accueil', idx: 0 };
  const stack = [];
  let target = null, grab = null, confirmRemove = false;
  const newDraft = () => ({ name: '', link: '', color: SWATCHES[5], row: 'favoris' });
  let draft = newDraft();
  const citySearch = { q: '', results: null, status: '' };
  let upd = { state: 'idle', remote: null, pct: 0 };

  // Lignes types : interrupteur, valeur à faire défiler (‹ ›), lien vers une sous-page
  const tog = (label, key, after) => {
    const flip = () => { prefs[key] = !prefs[key]; savePrefs(); after && after(); };
    return { label, value: switchHTML(prefs[key]), ok: flip, right: flip };
  };
  const cyc = (label, list, get, set, fmt) => ({
    label, value: `‹ ${fmt(get())} ›`,
    ok: () => set(cycle(list, get(), 1)), right: () => set(cycle(list, get(), 1)), left: () => set(cycle(list, get(), -1))
  });
  const lnk = (label, value, page, idx = 0) => ({ label, value: `${value ? esc(value) + ' ' : ''}›`, ok: () => go(page, idx), right: () => go(page, idx) });

  function enterCat(i) {
    const def = pageDef(); def.onLeave && def.onLeave();
    catIdx = i; stack.length = 0; grab = null; confirmRemove = false;
    Object.assign(nav, { page: 'cat-' + CATS[i].key, idx: 0 });
    $('settingsList').scrollTop = 0;
  }
  function go(page, idx = 0) {
    stack.push({ page: nav.page, idx: nav.idx });
    Object.assign(nav, { page, idx }); grab = null; confirmRemove = false;
    $('settingsList').scrollTop = 0; renderSettings();
    const def = pageDef(); def.onEnter && def.onEnter();
  }
  function goBack() {
    const def = pageDef(); def.onLeave && def.onLeave();
    document.activeElement?.blur?.();
    const prev = stack.pop();
    grab = null; confirmRemove = false; sound('back');
    if (!prev) { pane = 'menu'; return renderSettings(); }
    Object.assign(nav, prev);
    $('settingsList').scrollTop = 0; renderSettings();
  }
  function startGrab(id, moveFn) { grab = { id, move: moveFn }; sound('select'); }
  function libChanged() { saveLib(); rebuildHome(); }

  // Maison : édition des appareils (nom, routine pour allumer, routine pour éteindre)
  let devEdit = null, devForm = { hname: '', hon: '', hoff: '' }, devTest = {}, keyTest = '';
  function homeChanged() { saveHome(); rebuildHome(); }
  function openSettingsAt(catKey) {
    if (layer !== 'settings') openSettings();
    enterCat(Math.max(0, CATS.findIndex(ct => ct.key === catKey)));
    pane = 'content'; renderSettings();
  }
  function openDevEditor(d) {
    devEdit = d || null;
    devForm = d ? { hname: d.name, hon: d.on || '', hoff: d.off || '' } : { hname: '', hon: '', hoff: '' };
    devTest = {}; go('homeDevice');
  }
  function moveDevice(dir) {
    const i = home.devices.findIndex(d => d.id === grab.id), j = i + dir;
    if (j < 0 || j >= home.devices.length) return sound('edge');
    [home.devices[i], home.devices[j]] = [home.devices[j], home.devices[i]];
    sound('move'); homeChanged();
  }
  async function testKey() {
    if (!home.key.trim()) { sound('edge'); return toast('Tape d’abord ta clé Voice Monkey.', true); }
    keyTest = 'Vérification…'; renderSettings();
    const res = vmResult(await vmRequest('devices', {}), '');
    keyTest = res.ok ? (res.unsure ? 'Envoyée (réponse illisible ici)' : 'Clé valide') : 'Clé refusée';
    toast(res.ok ? 'Clé Voice Monkey valide' : res.msg, !res.ok);
    if (layer === 'settings') renderSettings();
  }
  async function testRoutine(which) {
    const routine = devForm[which === 'on' ? 'hon' : 'hoff'];
    if (!routine.trim()) { sound('edge'); return toast(`Indique d’abord la routine pour ${which === 'on' ? 'allumer' : 'éteindre'}.`, true); }
    devTest[which] = 'Test en cours…'; renderSettings();
    const res = await triggerRoutine(routine);
    devTest[which] = res.ok ? (res.unsure ? 'Envoyée (non confirmée)' : 'OK : routine lancée') : 'Échec';
    toast(res.ok ? `Routine « ${routine.trim()} » lancée` : res.msg, !res.ok);
    if (layer === 'settings' && nav.page === 'homeDevice') renderSettings();
  }
  function saveDevice() {
    const name = devForm.hname.trim(), on = devForm.hon.trim(), off = devForm.hoff.trim();
    if (!name) { nav.idx = 0; sound('edge'); return toast('Donne un nom à l’appareil (ex. Lampe salon).', true); }
    if (!on && !off) { nav.idx = 1; sound('edge'); return toast('Indique au moins une routine (allumer ou éteindre).', true); }
    if (devEdit) Object.assign(devEdit, { name: name.slice(0, 30), on, off });
    else home.devices.push({ id: 'dev-' + Date.now().toString(36), name: name.slice(0, 30), on, off });
    homeChanged(); toast(`${name} enregistré`); goBack();
  }
  function removeDevice() {
    if (!confirmRemove) { confirmRemove = true; return; }
    home.devices = home.devices.filter(d => d !== devEdit);
    homeChanged(); toast(`${devEdit.name} retiré`); goBack();
  }

  // Lien saisi : adresse web ou nom de paquet Android
  function parseLink(v) {
    v = v.trim();
    if (!v) return null;
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(v)) return { url: v };
    const parts = v.split('.');
    if (!v.includes('/') && !/^www\./i.test(v) && parts.length >= 3 && parts.every(x => /^[a-z_][a-z0-9_]*$/i.test(x)) &&
        !/^(com|fr|net|org|io|be|ch|ca|eu|co|uk|de|es|it)$/i.test(parts[parts.length - 1])) return { package: v };
    if (/^[^\s/]+\.[^\s/]+/.test(v)) return { url: 'https://' + v };
    return null;
  }
  const linkNote = () => {
    const l = parseLink(draft.link);
    if (!draft.link.trim()) return 'Exemple : https://www.exemple.fr ou com.exemple.app';
    if (!l) return 'Ce lien n’est pas reconnu.';
    return l.url ? `Sera ouvert comme site web : ${l.url}` : `Sera ouvert comme appli Android : ${l.package}`;
  };
  const draftApp = () => customApp({ id: 'apercu', name: draft.name.trim() || 'Mon appli', color: draft.color });
  function addApp(id, row) {
    lib.items.push({ id, row }); libChanged();
    toast(`${getApp(id).name} ajoutée à ${rowTitle(row)}`);
  }
  function moveGrabbed(dir) {
    const i = lib.items.findIndex(it => it.id === grab.id), row = lib.items[i].row;
    let j = i + dir;
    while (j >= 0 && j < lib.items.length && lib.items[j].row !== row) j += dir;
    if (j < 0 || j >= lib.items.length) return sound('edge');
    [lib.items[i], lib.items[j]] = [lib.items[j], lib.items[i]];
    sound('move'); libChanged();
  }
  function moveRow(dir) {
    const i = prefs.rowOrder.indexOf(grab.id), j = i + dir;
    if (j < 0 || j >= prefs.rowOrder.length) return sound('edge');
    [prefs.rowOrder[i], prefs.rowOrder[j]] = [prefs.rowOrder[j], prefs.rowOrder[i]];
    sound('move'); savePrefs(); rebuildHome();
  }
  function submitCustom() {
    const name = draft.name.trim(), link = parseLink(draft.link);
    if (!name) { nav.idx = 0; sound('edge'); return toast("Indiquez le nom de l'appli."); }
    if (!link) { nav.idx = 1; sound('edge'); return toast('Indiquez un lien (https://…) ou un nom de paquet Android (com.exemple.app).'); }
    const id = 'perso-' + Date.now().toString(36);
    lib.custom.push({ id, name: name.slice(0, 30), url: link.url || '', package: link.package || '', color: draft.color, kind: draft.row === 'musique' ? 'music' : 'video' });
    addApp(id, draft.row);
    draft = newDraft();
    goBack();
  }
  function screenInfo() {
    try {
      const d = JSON.parse(window.AndroidTV.displayInfo());
      return `${d.widthPx} × ${d.heightPx} px, densité ${String(Math.round(d.density * 100) / 100).replace('.', ',')}`;
    } catch { return ''; }
  }
  async function runCitySearch() {
    const q = citySearch.q.trim();
    if (q.length < 2) { citySearch.status = 'Tapez au moins 2 caractères.'; return renderSettings(); }
    citySearch.status = 'Recherche en cours…'; citySearch.results = null; renderSettings();
    try {
      citySearch.results = await searchCities(q);
      citySearch.status = citySearch.results.length ? `${citySearch.results.length} résultat${citySearch.results.length > 1 ? 's' : ''}`
        : 'Aucune ville trouvée. Vérifiez l’orthographe ou le code postal.';
    } catch {
      citySearch.status = net.online ? 'La recherche n’a pas abouti. Réessayez dans un instant.' : 'Pas de connexion Internet : recherche impossible pour le moment.';
    }
    if (layer === 'settings' && nav.page === 'city') {
      if (citySearch.results && citySearch.results.length) nav.idx = 2; // premier résultat
      renderSettings();
    }
  }
  function chooseCity(x) {
    prefs.city = { name: x.name, postcode: x.postcode, region: x.region, lat: x.lat, lon: x.lon };
    savePrefs(); wx = null; updateWeather();
    toast(`Météo : ${cityLabel()}`);
    citySearch.results = null; citySearch.status = '';
    goBack();
  }

  // Mise à jour de l'appli Android (À propos)
  const updLabel = () => ({
    idle: '›', checking: 'Recherche…', uptodate: 'Vous avez la dernière version',
    available: upd.remote ? `Version ${upd.remote.versionName} disponible` : '', error: 'Recherche impossible',
    downloading: `Téléchargement ${upd.pct} %`, installing: 'Installation…', needperm: 'Autorisation requise',
    web: upd.remote ? `Appli Android : version ${upd.remote.versionName}` : 'Version web à jour'
  }[upd.state] || '›');
  async function checkUpdate() {
    upd = { state: 'checking', remote: null, pct: 0 }; renderSettings();
    try {
      const res = await fetch(SITE + 'version.json?t=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) throw new Error(res.status);
      const remote = await res.json();
      const local = hasBridge() && typeof window.AndroidTV.versionCode === 'function' ? Number(window.AndroidTV.versionCode()) : null;
      upd = { state: local == null ? 'web' : remote.versionCode > local ? 'available' : 'uptodate', remote, pct: 0 };
    } catch { upd = { state: 'error', remote: null, pct: 0 }; }
    if (layer === 'settings') renderSettings();
  }
  function installUpdate() {
    if (!hasBridge() || typeof window.AndroidTV.installUpdate !== 'function') return toast('Mise à jour possible seulement depuis l’appli Android TV.');
    upd.state = 'downloading'; upd.pct = 0; renderSettings();
    window.AndroidTV.installUpdate((upd.remote && upd.remote.apk) || SITE + 'tv.apk');
  }
  window.tvUpdateProgress = (p) => {
    if (p >= 0 && p < 100) { upd.state = 'downloading'; upd.pct = Math.round(p); }
    else if (p >= 100) upd.state = 'installing';
    else if (p === -2) { upd.state = 'needperm'; toast('Autorisez « Accueil TV » à installer des applis dans la fenêtre ouverte, puis relancez l’installation.'); }
    else { upd.state = 'error'; toast('Le téléchargement de la mise à jour a échoué. Réessayez.'); }
    if (layer === 'settings' && nav.page === 'cat-apropos') renderSettings();
  };

  // Vignettes : thèmes et fonds d'écran
  function themeSwatch(k) {
    if (k === 'auto') {
      const a = THEMES.clair.v, b = THEMES.nuit.v;
      return `<span class="theme-sw" style="background:linear-gradient(90deg, ${a.bg} 50%, ${b.bg} 50%)"><i style="background:${a.card}"></i><b style="background:${b.accent}"></b></span>`;
    }
    const v = THEMES[k].v;
    return `<span class="theme-sw" style="background:${v.grad}"><i style="background:${v.card}"></i><b style="background:${v.accent}"></b></span>`;
  }
  const wallThumb = (k) => k === 'none' ? '<span class="wall-mini none"></span>'
    : `<img class="wall-mini" src="${wallPath(k === 'random' ? 'ciel' : k, 1, true)}" alt="">`;
  function wallPreview(k) {
    if (!k || k === 'none') return '<div class="pv-walls"><div class="pv-none">Dégradé du thème, sans photo</div></div>';
    const srcs = k === 'random' ? ['nature', 'ocean', 'ville'].map((c, i) => wallPath(c, i + 2, true)) : [1, 2, 3].map(n => wallPath(k, n, true));
    return `<div class="pv-walls">${srcs.map(s => `<img src="${s}" alt="">`).join('')}</div>`;
  }
  const homePreview = () => `<div class="pv-home"><div class="pv-top">20:30<span>${esc(city().name)}</span></div>
    <div class="pv-title">Favoris</div><div class="pv-row"><span class="pv-tile on"></span><span class="pv-tile"></span><span class="pv-tile"></span><span class="pv-tile"></span></div></div>`;

  // Chaque page : titre, aide et lignes ({ label, value, ok, left, right } ; header = titre de section)
  function pageDef() {
    switch (nav.page) {
      case 'cat-accueil': return {
        title: 'Accueil', hint: 'OK pour modifier, Gauche et Droite pour changer une valeur.',
        entries: [
          lnk('Rangées de l’accueil', `${prefs.rowOrder.filter(k => !prefs.rowHidden.includes(k)).length} affichées`, 'rows'),
          tog('Bannière qui met en avant les applis', 'banner', () => { rebuildHome(); }),
          cyc('Vitesse de la bannière', BANNER_SECS, () => prefs.bannerSec, v => { prefs.bannerSec = v; savePrefs(); restartRotation(); }, v => `une appli toutes les ${v} s`),
          lnk('Fond d’écran', wallLabel(prefs.wallCat), 'wallpaper', WALL_CHOICES.findIndex(w => w.key === prefs.wallCat))
        ]
      };
      case 'cat-applis': return {
        title: 'Applis', hint: 'OK pour ouvrir.',
        entries: [
          lnk('Ajouter une appli', '', 'add'),
          lnk('Mes applis : retirer, réordonner', `${lib.items.length}`, 'manage'),
          lnk('Applis installées sur la TV', hasBridge() ? `${installed.length}` : '', 'installedList'),
          ...(hasBridge() ? [] : [tog('Ouvrir les applis installées (navigateur)', 'openApps')])
        ]
      };
      case 'cat-maison': {
        const k = home.key.trim();
        const entries = [
          { field: 'key', store: home, inputType: 'password', maxlength: 200, caps: 'off',
            label: 'Clé Voice Monkey (enregistrée uniquement sur cette TV)', placeholder: 'Tape ou colle ta clé (token)',
            note: () => (home.key.trim() ? `Clé enregistrée sur cette TV (se termine par ${home.key.trim().slice(-4)})` : 'Aucune clé : la rangée Maison invite à configurer tes appareils.'),
            ok: () => focusField('key') },
          { label: 'Vérifier la clé', value: keyTest || '›', ok: testKey },
          { header: true, label: home.devices.length ? 'Appareils' : 'Aucun appareil pour l’instant.' },
          ...home.devices.map(d => {
            const grabbed = grab && grab.id === d.id;
            return { id: d.id, cls: grabbed ? 'grab' : '', label: `<span>${esc(d.name)}</span>`,
              value: grabbed ? 'Haut / Bas' : `${[d.on && 'Allumer', d.off && 'Éteindre'].filter(Boolean).join(' + ')} ›`,
              ok: () => openDevEditor(d), right: () => startGrab(d.id, moveDevice) };
          }),
          { label: 'Ajouter un appareil', value: 'Créer ›', cls: 'special', ok: () => openDevEditor(null) }
        ];
        return { title: 'Maison', entries,
          onInput: () => { keyTest = ''; homeChanged(); },
          hint: grab ? `Haut et Bas pour déplacer ${(home.devices.find(d => d.id === grab.id) || {}).name || ''}, OK pour le poser.`
            : k ? 'OK sur un appareil pour le modifier ou le tester, Droite pour le déplacer.' : 'Commence par ta clé Voice Monkey (voir le guide dans le README).' };
      }
      case 'homeDevice': return {
        title: devEdit ? (devEdit.name || 'Appareil') : 'Ajouter un appareil',
        hint: 'OK sur un champ pour écrire. « Tester » lance la routine tout de suite.',
        entries: [
          { field: 'hname', store: devForm, label: 'Nom (ex. Lampe salon)', maxlength: 30, caps: 'words', ok: () => focusField('hname') },
          { field: 'hon', store: devForm, label: 'Routine pour allumer (identifiant Voice Monkey)', maxlength: 120, placeholder: 'ex. lampe-salon-on', ok: () => focusField('hon') },
          { label: 'Tester « Allumer »', value: devTest.on || '›', ok: () => testRoutine('on') },
          { field: 'hoff', store: devForm, label: 'Routine pour éteindre', maxlength: 120, placeholder: 'ex. lampe-salon-off', ok: () => focusField('hoff') },
          { label: 'Tester « Éteindre »', value: devTest.off || '›', ok: () => testRoutine('off') },
          { label: devEdit ? 'Enregistrer' : 'Ajouter l’appareil', cls: 'primary', value: '', ok: saveDevice },
          ...(devEdit ? [{ label: confirmRemove ? 'Appuyez de nouveau sur OK pour retirer' : 'Retirer cet appareil', cls: 'danger', value: '', ok: removeDevice }] : [])
        ]
      };
      case 'cat-meteo': return {
        title: 'Météo', hint: 'OK pour modifier.',
        entries: [
          lnk('Ville', cityLabel(), 'city'),
          cyc('Unité', ['C', 'F'], () => prefs.unit, v => { prefs.unit = v; savePrefs(); wx = null; updateWeather(); }, v => (v === 'C' ? '°C (Celsius)' : '°F (Fahrenheit)')),
          tog('Afficher la météo', 'showWeather', () => { renderWeather(); rebuildHome(); })
        ]
      };
      case 'cat-affichage': return {
        title: 'Affichage', hint: 'Gauche et Droite pour changer une valeur, OK pour ouvrir.',
        entries: [
          lnk('Thème', THEMES[prefs.theme] ? THEMES[prefs.theme].label : '', 'theme', THEME_KEYS.indexOf(prefs.theme)),
          lnk('Fond d’écran', wallLabel(prefs.wallCat), 'wallpaper', WALL_CHOICES.findIndex(w => w.key === prefs.wallCat)),
          cyc('Taille du texte', TEXT_SIZES.map(t => t[0]), () => prefs.textSize, v => { prefs.textSize = v; savePrefs(); applyDisplay(); },
            v => (TEXT_SIZES.find(t => t[0] === v) || TEXT_SIZES[0])[1]),
          tog('Mode performance (moins d’effets)', 'perf', applyDisplay),
          cyc('Marge de l’écran (si les bords sont coupés)', MARGINS, () => 100 - (prefs.displayScale || 100),
            v => { prefs.displayScale = 100 - v; savePrefs(); fit(); }, v => (v ? `${v} %` : 'Aucune')),
          ...(hasBridge() && typeof window.AndroidTV.displayInfo === 'function' ? [{ label: 'Écran', value: screenInfo(), cls: 'info' }] : []),
          tog('Réduire les animations', 'reduceMotion', applyDisplay),
          ...(hasBridge() ? [] : [{ label: 'Plein écran', value: document.fullscreenElement ? 'Activé' : 'Désactivé', ok: () => {
            const pr = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.();
            Promise.resolve(pr).catch(() => toast('Plein écran indisponible dans ce navigateur')).finally(() => setTimeout(renderSettings, 300));
          } }])
        ]
      };
      case 'cat-veille': return {
        title: 'Veille', hint: 'Gauche et Droite pour changer une valeur.',
        entries: [
          cyc('Délai avant l’écran de veille', SLEEP_CHOICES, () => prefs.sleepMin, v => { prefs.sleepMin = v; savePrefs(); resetIdle(); }, v => (v ? `${v} min` : 'Jamais')),
          cyc('Style de l’écran de veille', SAVER_STYLES.map(s => s[0]), () => prefs.saverStyle, v => { prefs.saverStyle = v; savePrefs(); scenesFor = ''; },
            v => (SAVER_STYLES.find(s => s[0] === v) || SAVER_STYLES[0])[1]),
          { label: 'Voir l’écran de veille maintenant', value: '›', ok: () => { closeSettings(); setTimeout(startSaver, 350); } }
        ]
      };
      case 'cat-heure': return {
        title: 'Date et heure', hint: 'OK pour activer ou désactiver.',
        entries: [tog('Heure sur 24 h', 'h24', tick), tog('Afficher la date', 'showDate', tick)]
      };
      case 'cat-son': return {
        title: 'Son', hint: 'OK pour activer ou désactiver.',
        entries: [tog('Sons de navigation', 'sounds')]
      };
      case 'cat-apropos': {
        const ver = hasBridge() && typeof window.AndroidTV.version === 'function' ? window.AndroidTV.version() : '';
        const entries = [
          { label: 'Version', value: ver ? `Accueil TV ${esc(ver)}` : 'Version web (toujours à jour)', cls: 'info' },
          { label: 'Rechercher une mise à jour', value: updLabel(), ok: checkUpdate }
        ];
        if (hasBridge() && (upd.state === 'available' || upd.state === 'needperm' || upd.state === 'error' && upd.remote))
          entries.push({ label: `Installer la version ${upd.remote.versionName}`, cls: 'primary', value: '', ok: installUpdate });
        if (hasBridge()) entries.push({ label: 'Paramètres Android de la TV', value: '›', ok: () => window.AndroidTV.openSystemSettings() });
        const engine = (navigator.userAgent.match(/Chrome\/(\d+)/) || [])[1];
        if (engine) entries.push({ label: 'Moteur web de la TV', value: `Chrome ${engine}`, cls: 'info' });
        entries.push({ label: 'Photos des fonds d’écran', value: 'Unsplash, licence libre', cls: 'info' });
        return { title: 'À propos', hint: 'OK sur « Rechercher une mise à jour » pour vérifier la dernière version.', entries };
      }

      case 'rows': return {
        title: 'Rangées de l’accueil',
        hint: grab ? `Haut et Bas pour déplacer « ${ROW_TITLES[grab.id]} », OK pour la poser.` : 'OK : afficher ou masquer. Droite : changer l’ordre. Retour : terminer.',
        entries: prefs.rowOrder.map(k => {
          const grabbed = grab && grab.id === k, empty = !rowSource(k).length;
          return { id: k, cls: grabbed ? 'grab' : '', label: `<span>${ROW_TITLES[k]}${empty ? ' <small class="note">(vide pour l’instant)</small>' : ''}</span>`,
            value: grabbed ? 'Haut / Bas' : switchHTML(!prefs.rowHidden.includes(k)),
            ok: () => {
              if (prefs.rowHidden.includes(k)) prefs.rowHidden = prefs.rowHidden.filter(x => x !== k);
              else if (prefs.rowOrder.length - prefs.rowHidden.length <= 1) return toast('Gardez au moins une rangée affichée.');
              else prefs.rowHidden.push(k);
              savePrefs(); rebuildHome();
            },
            right: () => startGrab(k, moveRow) };
        })
      };
      case 'wallpaper': return {
        title: 'Fond d’écran', preview: (e) => wallPreview(e && e.wall !== undefined ? e.wall : prefs.wallCat),
        hint: 'OK pour choisir. Les mêmes photos servent à l’écran de veille.',
        entries: [
          ...WALL_CHOICES.map(w => ({ wall: w.key, cls: prefs.wallCat === w.key ? 'check' : '',
            label: `${wallThumb(w.key)}<span>${w.label}</span>`, value: prefs.wallCat === w.key ? 'Actif' : '',
            ok: () => { prefs.wallCat = w.key; savePrefs(); applyWallpaper(); scenesFor = ''; } })),
          cyc('Changement de photo', WALL_EVERY, () => prefs.wallEvery, v => { prefs.wallEvery = v; savePrefs(); applyWallpaper(); },
            v => (v ? `toutes les ${v} min` : 'fixe')),
          ...(prefs.wallCat !== 'none' ? [{ label: 'Photo suivante', value: '›', ok: () => { nextWallpaper(); toast('Nouvelle photo'); } }] : [])
        ]
      };
      case 'theme': return {
        title: 'Thème', preview: () => homePreview(),
        hint: 'Déplacez-vous pour voir chaque thème en direct. OK pour le garder, Retour pour annuler.',
        onMove: (e) => { if (e && e.themeKey) { previewingTheme = true; applyTheme(e.themeKey); } },
        onLeave: () => { previewingTheme = false; applyTheme(prefs.theme); },
        entries: THEME_KEYS.map(k => ({ themeKey: k, cls: prefs.theme === k ? 'check' : '',
          label: `${themeSwatch(k)}<span>${THEMES[k].label}${THEMES[k].note ? ` <small class="note">${THEMES[k].note}</small>` : ''}</span>`,
          value: prefs.theme === k ? 'Actif' : '',
          ok: () => { prefs.theme = k; savePrefs(); previewingTheme = false; applyTheme(k); toast(`Thème « ${THEMES[k].label} » appliqué`); } }))
      };
      case 'city': {
        const c = city();
        const entries = [
          { header: true, label: `Ville actuelle : ${esc(cityLabel())}${c.region ? ', ' + esc(c.region) : ''}` },
          { field: 'q', store: citySearch, label: 'Nom de ville ou code postal', placeholder: 'Exemple : Sedan ou 08200',
            ok: () => focusField('q'), onEnter: runCitySearch },
          { label: 'Rechercher', cls: 'primary', value: '', ok: runCitySearch }
        ];
        if (citySearch.status) entries.push({ header: true, label: esc(citySearch.status) });
        (citySearch.results || []).forEach(x => entries.push({ label: esc(x.name),
          value: esc([x.postcode, x.region, x.country && x.country !== 'France' ? x.country : ''].filter(Boolean).join(', ')),
          ok: () => chooseCity(x) }));
        return { title: 'Ville pour la météo', hint: 'OK sur le champ pour écrire, puis OK sur « Rechercher ». Choisissez ensuite la bonne ville.', entries };
      }
      case 'installedList': {
        if (!hasBridge()) return { title: 'Applis installées sur la TV', hint: '',
          entries: [{ header: true, label: 'La liste des applis installées est disponible dans l’appli Android TV.' }] };
        const homePkgs = new Set(lib.items.map(it => getApp(it.id)).filter(Boolean).flatMap(pkgsOf));
        return { title: 'Applis installées sur la TV', hint: 'OK pour ajouter une appli à l’accueil.',
          entries: installed.length ? installed.map(x => {
            const onHome = homePkgs.has(x.package);
            return { label: `${mini(installedAsApp(x))}<span>${esc(x.name)}</span>`, value: onHome ? 'Sur l’accueil' : 'Ajouter ›',
              ok: () => { if (onHome) return toast(`${x.name} est déjà sur l’accueil.`); target = 'inst:' + x.package; go('addRow', 0); } };
          }) : [{ header: true, label: 'Aucune appli trouvée.' }] };
      }
      case 'manage': {
        const entries = [];
        ROW_DEFS.forEach(d => {
          const items = lib.items.filter(it => it.row === d.key);
          if (!items.length) return;
          entries.push({ header: true, label: d.title });
          items.forEach(it => {
            const a = getApp(it.id), grabbed = grab && grab.id === it.id;
            entries.push({ id: it.id, cls: grabbed ? 'grab' : '', label: `${mini(a)}<span>${esc(a.name)}</span>`,
              value: grabbed ? 'Haut / Bas' : '›', ok: () => { target = it.id; go('actions'); },
              right: () => startGrab(it.id, moveGrabbed) });
          });
        });
        return { title: 'Mes applis', entries,
          hint: grab ? `Haut et Bas pour déplacer ${getApp(grab.id).name} dans sa rangée, OK pour la poser.`
            : 'OK : options de l’appli. Droite : déplacer. Retour : terminer.' };
      }
      case 'actions': {
        const a = getApp(target), it = lib.items.find(x => x.id === target);
        if (!a || !it) return { title: 'Mes applis', hint: '', entries: [] };
        const setRow = (d) => { it.row = cycle(ROW_KEYS, it.row, d); lib.items = [...lib.items.filter(x => x !== it), it]; sound('move'); libChanged(); };
        return { title: a.name, hint: 'Gauche et Droite pour changer de rangée. Retour pour revenir.',
          entries: [
            { label: 'Rangée', value: `‹ ${rowTitle(it.row)} ›`, ok: () => setRow(1), right: () => setRow(1), left: () => setRow(-1) },
            { label: 'Changer l’ordre', value: '›', ok: () => { goBack(); startGrab(target, moveGrabbed); renderSettings(); } },
            { label: confirmRemove ? 'Appuyez de nouveau sur OK pour retirer' : 'Retirer de l’accueil', cls: 'danger', value: '',
              ok: () => {
                if (!confirmRemove) { confirmRemove = true; return; }
                if (lib.items.length <= 1) { confirmRemove = false; return toast('Gardez au moins une appli sur l’accueil.'); }
                lib.items = lib.items.filter(x => x.id !== target);
                if (a.custom && !a.installed) lib.custom = lib.custom.filter(c => c.id !== target);
                libChanged(); toast(`${a.name} retirée de l’accueil`); goBack();
              } }
          ] };
      }
      case 'add': {
        const available = BUILTIN.filter(a => !lib.items.some(it => it.id === a.id))
          .sort((x, y) => isInstalled(y) - isInstalled(x)); // applis présentes sur la TV en premier
        const entries = [{ label: 'Appli personnalisée', value: 'Créer ›', cls: 'special', ok: () => go('custom') }];
        if (hasBridge()) {
          const known = new Set([...BUILTIN.flatMap(pkgsOf), ...lib.items.map(it => getApp(it.id)).filter(Boolean).flatMap(pkgsOf)]);
          const others = installed.filter(x => !known.has(x.package));
          entries.push({ header: true, label: others.length ? 'Installées sur cette TV' : 'Toutes les applis de la TV sont déjà sur l’accueil ou dans la liste ci-dessous.' });
          others.forEach(x => entries.push({ label: `${mini(installedAsApp(x))}<span>${esc(x.name)}</span>`, value: 'Installée',
            ok: () => { target = 'inst:' + x.package; go('addRow', 0); } }));
        }
        entries.push({ header: true, label: available.length ? 'Applis populaires' : 'Toutes les applis de la liste sont déjà sur l’accueil.' });
        available.forEach(a => entries.push({ label: `${mini(a)}<span>${esc(a.name)}</span>`,
          value: hasBridge() && isInstalled(a) ? 'Installée' : a.kind === 'music' ? 'Musique' : 'Films & séries',
          ok: () => { target = a.id; go('addRow', ROW_KEYS.indexOf(a.kind === 'music' ? 'musique' : 'films')); } }));
        return { title: 'Ajouter une appli', hint: 'OK pour ajouter, Retour pour revenir.', entries };
      }
      case 'addRow': {
        const inst = target.startsWith('inst:') ? installedMap[target.slice(5)] : null;
        const a = inst ? installedAsApp(inst) : getApp(target);
        if (!a) return { title: 'Ajouter une appli', hint: '', entries: [] };
        const suggested = inst ? 'favoris' : a.kind === 'music' ? 'musique' : 'films';
        const confirm = (row) => {
          let id = target;
          if (inst) { // appli de la TV : on la mémorise avec son nom et sa couleur
            id = 'inst-' + inst.package;
            if (!lib.custom.some(x => x.id === id)) lib.custom.push({ id, installed: true, name: inst.name, package: inst.package, color: inst.color || '#2A3550', kind: 'video' });
          }
          addApp(id, row); goBack();
        };
        return { title: `Ajouter ${a.name}`, hint: 'Choisissez la rangée où placer l’appli.',
          entries: ROW_DEFS.map(d => ({ label: d.title, value: d.key === suggested ? 'Suggérée' : '', ok: () => confirm(d.key) })) };
      }
      case 'custom': return {
        title: 'Appli personnalisée',
        preview: () => { const a = draftApp(); return `<div class="cust-preview" style="--tc2:${a.colors[1]};--tc3:${a.colors[2]}">${logoHTML(a)}</div>`; },
        onInput: () => { const a = draftApp(); $('settingsPreview').innerHTML = `<div class="cust-preview" style="--tc2:${a.colors[1]};--tc3:${a.colors[2]}">${logoHTML(a)}</div>`; },
        hint: 'OK pour écrire, Haut et Bas pour changer de champ, Retour pour annuler.',
        entries: [
          { field: 'name', store: draft, label: 'Nom', ok: () => focusField('name') },
          { field: 'link', store: draft, label: 'Lien ou paquet Android', note: linkNote, ok: () => focusField('link') },
          { label: 'Couleur de fond', value: `<span class="swatches">${SWATCHES.map(col => `<i class="sw${col === draft.color ? ' on' : ''}" style="background:${col}"></i>`).join('')}</span>`,
            ok: () => { draft.color = cycle(SWATCHES, draft.color, 1); }, right: () => { draft.color = cycle(SWATCHES, draft.color, 1); }, left: () => { draft.color = cycle(SWATCHES, draft.color, -1); } },
          { label: 'Rangée', value: `‹ ${rowTitle(draft.row)} ›`,
            ok: () => { draft.row = cycle(ROW_KEYS, draft.row, 1); }, right: () => { draft.row = cycle(ROW_KEYS, draft.row, 1); }, left: () => { draft.row = cycle(ROW_KEYS, draft.row, -1); } },
          { label: 'Ajouter l’appli', cls: 'primary', value: '', ok: submitCustom }
        ]
      };
    }
    return { title: '', hint: '', entries: [] };
  }

  const selectable = (def) => def.entries.filter(e => !e.header);
  const currentEntry = () => selectable(pageDef())[nav.idx];
  function focusField(f) {
    const inp = $('fld-' + f); if (!inp) return;
    inp.focus(); const n = inp.value.length; try { inp.setSelectionRange(n, n); } catch { /* ignoré */ }
    if (hasBridge() && typeof window.AndroidTV.showKeyboard === 'function') window.AndroidTV.showKeyboard();
  }

  function renderSettings() {
    const def = pageDef();
    const sel = selectable(def);
    nav.idx = Math.max(0, Math.min(sel.length - 1, nav.idx));
    if (grab) nav.idx = Math.max(0, sel.findIndex(e => e.id === grab.id));
    const inContent = pane === 'content';
    $('setMenu').innerHTML = CATS.map((ct, i) => `<li class="set-cat${i === catIdx ? (inContent ? ' current' : ' focused') : ''}" data-c="${i}">${ct.icon}<span>${ct.label}</span></li>`).join('');
    $('settings').classList.toggle('in-menu', !inContent);
    $('settingsTitle').textContent = def.title;
    $('settingsHint').textContent = inContent ? def.hint : 'Haut et Bas pour choisir une rubrique, Droite ou OK pour entrer, Retour pour fermer.';
    const pv = def.preview ? def.preview(sel[nav.idx]) : '';
    $('settingsPreview').hidden = !pv;
    if (pv) $('settingsPreview').innerHTML = pv;
    let k = -1;
    $('settingsList').innerHTML = def.entries.map(e => {
      if (e.header) return `<li class="setting-group">${e.label}</li>`;
      k++;
      const cls = ['setting', e.cls || '', inContent && k === nav.idx && !(e.cls || '').includes('grab') ? 'focused' : '', e.field ? 'field' : ''].join(' ');
      if (e.field) {
        const note = e.note ? `<span class="field-note" id="fld-note-${e.field}">${esc(e.note())}</span>` : '';
        return `<li class="${cls}" data-i="${k}"><span class="field-label">${e.label}</span>
          <input id="fld-${e.field}" type="${e.inputType || (e.field === 'link' ? 'url' : 'text')}" maxlength="${e.maxlength || (e.field === 'name' ? 30 : 300)}"
            value="${esc(e.store[e.field])}" placeholder="${esc(e.placeholder || '')}" autocomplete="off"
            autocapitalize="${e.caps || (e.field === 'name' ? 'words' : 'off')}" spellcheck="false">${note}</li>`;
      }
      return `<li class="${cls}" data-i="${k}"><span class="row-left">${e.label}</span><span class="val">${e.value ?? ''}</span></li>`;
    }).join('');
    def.entries.filter(e => e.field).forEach(e => {
      $('fld-' + e.field).addEventListener('input', (ev) => {
        e.store[e.field] = ev.target.value;
        if (e.note) $('fld-note-' + e.field).textContent = e.note();
        def.onInput && def.onInput();
      });
    });
    keepSettingVisible();
  }
  // Garde la ligne sélectionnée entièrement visible (10 % de marge), jusqu'au dernier élément
  function keepSettingVisible() {
    const ul = $('settingsList'), hint = $('settingsHint');
    // hauteur disponible : de la liste jusqu'au texte d'aide (sans dépendre de flexbox)
    const avail = Math.max(200, hint.offsetTop - ul.offsetTop - 16);
    ul.style.height = avail + 'px';
    const li = ul.querySelector('.focused, .grab');
    if (!li) return;
    const margin = Math.round(avail * 0.1);
    const top = li.offsetTop, bottom = top + li.offsetHeight; // position dans la liste (qui sert de repère)
    let st = ul.scrollTop;
    if (bottom + margin > st + avail) st = bottom + margin - avail;
    if (top - margin < st) st = top - margin;
    const maxSt = Math.max(0, ul.scrollHeight - avail);
    ul.scrollTop = Math.max(0, Math.min(maxSt, st));
  }

  function settingsKey(k) {
    if (pane === 'menu') {
      if (k === 'up' || k === 'down') {
        const n = Math.max(0, Math.min(CATS.length - 1, catIdx + (k === 'up' ? -1 : 1)));
        sound(n === catIdx ? 'edge' : 'move');
        if (n !== catIdx) enterCat(n);
        return renderSettings();
      }
      if (k === 'right' || k === 'ok') {
        if (!selectable(pageDef()).length) return sound('edge');
        pane = 'content'; sound('select'); return renderSettings();
      }
      if (k === 'back' || k === 'left') return closeSettings();
      return;
    }
    const def = pageDef();
    const sel = selectable(def);
    if (grab) { // déplacement d'une appli ou d'une rangée
      if (k === 'up' || k === 'down') grab.move(k === 'up' ? -1 : 1);
      else { grab = null; sound('select'); }
      return renderSettings();
    }
    if (k === 'back') return goBack();
    if (k === 'up' || k === 'down') {
      const n = Math.max(0, Math.min(sel.length - 1, nav.idx + (k === 'up' ? -1 : 1)));
      sound(n === nav.idx ? 'edge' : 'move'); nav.idx = n; confirmRemove = false;
      def.onMove && def.onMove(sel[n]);
      return renderSettings();
    }
    const e = sel[nav.idx];
    const fn = e && e[k];
    if (!fn) { if (k === 'left') return goBack(); return sound('edge'); } // Gauche sans valeur à changer : retour
    sound(k === 'ok' ? 'select' : 'move');
    const page = nav.page;
    fn();
    if (layer === 'settings' && nav.page === page && document.activeElement?.tagName !== 'INPUT') renderSettings();
  }
  function openSettings() {
    sound('select'); pane = 'menu'; enterCat(0);
    renderSettings();
    openLayer('settings', 'settings');
  }
  function closeSettings() {
    const def = pageDef(); def.onLeave && def.onLeave();
    document.activeElement?.blur?.();
    $('settings').classList.remove('open'); $('settings').setAttribute('aria-hidden', 'true');
    layer = 'home'; sound('back'); grab = null;
    r = Math.min(r, NAV.length - 1);
    if (r === 0) c = NAV[0].items.indexOf($('settingsBtn'));
    focus(r, Math.min(c, NAV[r].items.length - 1), false);
    restartRotation();
  }

  /* ---------- Fonds d'écran photo ---------- */
  // Photos libres de droits (Unsplash), compressées et incluses dans l'appli : elles restent disponibles hors ligne.
  const WALL_CATS = [
    { key: 'nature', label: 'Nature' }, { key: 'animaux', label: 'Animaux' }, { key: 'ocean', label: 'Océan' },
    { key: 'ciel', label: 'Ciel et espace' }, { key: 'ville', label: 'Villes la nuit' }
  ];
  const WALL_CHOICES = [{ key: 'none', label: 'Aucun (dégradé du thème)' }, ...WALL_CATS, { key: 'random', label: 'Aléatoire' }];
  const WALL_EVERY = [5, 15, 30, 0];
  const WALL_COUNT = 8;
  const wallLabel = (k) => (WALL_CHOICES.find(w => w.key === k) || WALL_CHOICES[0]).label.replace(' (dégradé du thème)', '');
  const wallPath = (cat, n, mini) => `wallpapers/${cat}/${String(n).padStart(2, '0')}${mini ? '-mini' : ''}.jpg`;
  function wallPool(cat) {
    if (!cat || cat === 'none') return [];
    const cats = cat === 'random' ? WALL_CATS.map(c => c.key) : [cat];
    return cats.flatMap(k => Array.from({ length: WALL_COUNT }, (_, i) => wallPath(k, i + 1)));
  }
  let wallLayer = 0, wallTimer = 0, wallCurrent = load('tv.wallCurrent', null);
  function showWallpaper(src) {
    const layers = [$('wall0'), $('wall1')];
    const img = new Image();
    img.onload = () => { // fondu doux une fois la photo prête
      const next = layers[1 - wallLayer];
      next.style.backgroundImage = `url("${src}")`;
      next.classList.add('show'); layers[wallLayer].classList.remove('show');
      wallLayer = 1 - wallLayer;
    };
    img.src = src;
    wallCurrent = src; save('tv.wallCurrent', src);
  }
  function nextWallpaper() {
    const pool = wallPool(prefs.wallCat);
    if (!pool.length) return;
    let src = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1 && src === wallCurrent) src = pool[(pool.indexOf(src) + 1) % pool.length];
    showWallpaper(src);
  }
  function applyWallpaper() {
    clearInterval(wallTimer);
    const on = prefs.wallCat !== 'none';
    $('ambient').classList.toggle('has-wall', on);
    if (!on) { $('wall0').classList.remove('show'); $('wall1').classList.remove('show'); return; }
    const pool = wallPool(prefs.wallCat);
    if (wallCurrent && pool.includes(wallCurrent)) showWallpaper(wallCurrent); else nextWallpaper();
    if (prefs.wallEvery > 0) wallTimer = setInterval(() => { if (!document.hidden && !saverOn) nextWallpaper(); }, prefs.wallEvery * 60000);
  }

  /* ---------- Réseau : Wi-Fi, câble, hors ligne ---------- */
  let net = { online: true, connected: true, internet: true, type: 'wifi', level: 4, ssid: null, fromApp: false };
  const SIGNAL = ['', 'Faible', 'Moyen', 'Bon', 'Excellent'];
  function wifiSVG(level, off) {
    const op = (i) => (!off && level >= i ? 1 : 0.28);
    return `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" aria-hidden="true">
      <path d="M2.5 9.2a14 14 0 0 1 19 0" stroke="currentColor" stroke-width="2.2" opacity="${op(4)}"/>
      <path d="M5.6 12.5a9.4 9.4 0 0 1 12.8 0" stroke="currentColor" stroke-width="2.2" opacity="${op(3)}"/>
      <path d="M8.7 15.7a4.9 4.9 0 0 1 6.6 0" stroke="currentColor" stroke-width="2.2" opacity="${op(2)}"/>
      <circle cx="12" cy="19.2" r="1.7" fill="currentColor" opacity="${op(1)}"/>
      ${off ? '<path d="M4 3.5l16 17" stroke="#FF4D4F" stroke-width="2.6"/>' : ''}</svg>`;
  }
  const ETH_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true">
    <rect x="4" y="5" width="16" height="11" rx="2"/><path d="M8 16v3h8v-3M9 9h1M12 9h1M15 9h1"/></svg>`;
  function readNetwork() {
    const before = net.online;
    if (hasBridge() && typeof window.AndroidTV.networkInfo === 'function') {
      try {
        const n = JSON.parse(window.AndroidTV.networkInfo());
        net = { connected: !!n.connected, internet: n.internet !== false, type: n.type || 'none',
          level: n.level || 0, ssid: n.ssid || null, fromApp: true };
        net.online = net.connected && net.internet;
      } catch { /* on garde l'état précédent */ }
    } else {
      // navigateur : seule la présence d'Internet est connue (pas la force du signal)
      const on = navigator.onLine !== false;
      const t = navigator.connection && navigator.connection.type;
      net = { online: on, connected: on, internet: on, type: on ? (t === 'ethernet' ? 'ethernet' : 'wifi') : 'none', level: on ? 4 : 0, ssid: null, fromApp: false };
    }
    renderNetwork();
    if (net.online && !before) updateWeather(); // la connexion revient : météo à jour
  }
  function renderNetwork() {
    const btn = $('netBtn');
    btn.innerHTML = !net.online ? wifiSVG(0, true) : net.type === 'ethernet' ? ETH_SVG : wifiSVG(net.level || 4);
    btn.classList.toggle('offline', !net.online);
    btn.setAttribute('aria-label', !net.online ? 'Pas de connexion Internet' : net.type === 'ethernet' ? 'Connecté par câble' : `Wi-Fi, signal ${SIGNAL[net.level] || ''}`.trim());
    $('netMsg').classList.toggle('show', !net.online);
    if (layer === 'network') renderNetPanel();
  }

  /* ---------- Mode veille ---------- */
  let saverOn = false, idleTimer = 0, sceneTimer = 0, sceneIdx = 0, scenesBuilt = false;

  function rng(seed) { let s = seed % 2147483647; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  function ridge(seed, base, amp, freq, rough) {
    const rand = rng(seed), p = [rand() * 6.3, rand() * 6.3, rand() * 6.3];
    let d = `M0 1080 L0 ${base}`;
    for (let x = 0; x <= 1920; x += 24) {
      const y = base - amp * (0.55 * Math.sin(x * freq + p[0]) + 0.3 * Math.sin(x * freq * 2.3 + p[1]) + rough * Math.sin(x * freq * 6.1 + p[2]));
      d += ` L${x} ${y.toFixed(1)}`;
    }
    return d + ' L1920 1080 Z';
  }
  function starField(seed, n, maxY) {
    const rand = rng(seed); let out = '';
    for (let i = 0; i < n; i++) out += `<circle cx="${(rand() * 1920).toFixed(0)}" cy="${(rand() * maxY).toFixed(0)}" r="${(0.6 + rand() * 1.4).toFixed(1)}" fill="#fff" opacity="${(0.25 + rand() * 0.6).toFixed(2)}"/>`;
    return out;
  }
  const SCENES = [
    { id: 'aurore', sky: ['#030817', '#0A1E3A', '#14405A'], stars: 140,
      glows: [[1250, 330, 980, 150, '#3DF5B0', 0.38], [640, 410, 760, 120, '#3BA8F5', 0.28], [1500, 250, 500, 90, '#A06CFF', 0.18]],
      ridges: [[11, 760, 130, 0.0042, 0.14, '#0C1D30'], [23, 850, 95, 0.006, 0.1, '#081423'], [37, 945, 60, 0.009, 0.08, '#040A14']] },
    { id: 'crepuscule', sky: ['#1E1238', '#7A2E5E', '#F2884A'], sun: [1280, 760, 110, '#FFD9A0'],
      ridges: [[5, 790, 120, 0.0035, 0.12, '#5A2552'], [17, 870, 90, 0.0052, 0.1, '#3B1840'], [29, 960, 55, 0.008, 0.06, '#1F0C26']] },
    { id: 'ocean', sky: ['#040B1E', '#0F2850', '#2E5488'], stars: 90, moon: [1440, 250, 64], sea: 700 },
    { id: 'dunes', sky: ['#2E1B48', '#B9506A', '#F7B46A'], sun: [620, 720, 140, '#FFE3B0'],
      ridges: [[3, 800, 70, 0.0021, 0, '#C2623F'], [41, 880, 60, 0.0028, 0, '#93402F'], [53, 975, 45, 0.0036, 0, '#5C2428']] },
    { id: 'brume', sky: ['#1D3647', '#6E9796', '#E4D2A6'], sun: [1500, 600, 90, '#FFF1CF'], fog: true,
      ridges: [[7, 690, 110, 0.004, 0.22, '#3D6066'], [19, 800, 100, 0.0055, 0.25, '#284549'], [31, 920, 80, 0.007, 0.3, '#132A2E']] }
  ];
  function sceneSVG(s) {
    const id = s.id;
    let defs = `<linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.sky[0]}"/><stop offset=".55" stop-color="${s.sky[1]}"/><stop offset="1" stop-color="${s.sky[2]}"/></linearGradient>`;
    let body = `<rect width="1920" height="1080" fill="url(#${id}-sky)"/>`;
    if (s.stars) body += starField(id.length * 97, s.stars, 620);
    (s.glows || []).forEach(([cx, cy, rx, ry, col, op], i) => {
      defs += `<radialGradient id="${id}-g${i}"><stop offset="0" stop-color="${col}" stop-opacity="${op}"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient>`;
      body += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${id}-g${i})" transform="rotate(-7 ${cx} ${cy})"/>`;
    });
    if (s.sun) {
      const [cx, cy, rad, col] = s.sun;
      defs += `<radialGradient id="${id}-sun"><stop offset="0" stop-color="${col}" stop-opacity=".9"/><stop offset=".25" stop-color="${col}" stop-opacity=".35"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient>`;
      body += `<circle cx="${cx}" cy="${cy}" r="${rad * 5}" fill="url(#${id}-sun)"/><circle cx="${cx}" cy="${cy}" r="${rad}" fill="${col}" opacity=".95"/>`;
    }
    if (s.moon) {
      const [cx, cy, rad] = s.moon;
      defs += `<radialGradient id="${id}-moon"><stop offset="0" stop-color="#DCE6FF" stop-opacity=".45"/><stop offset="1" stop-color="#DCE6FF" stop-opacity="0"/></radialGradient>`;
      body += `<circle cx="${cx}" cy="${cy}" r="${rad * 5}" fill="url(#${id}-moon)"/><circle cx="${cx}" cy="${cy}" r="${rad}" fill="#F3F6FF"/>`;
    }
    if (s.sea) {
      const h = s.sea;
      defs += `<linearGradient id="${id}-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1B3A66"/><stop offset="1" stop-color="#02060F"/></linearGradient>`;
      body += `<rect y="${h}" width="1920" height="${1080 - h}" fill="url(#${id}-sea)"/>`;
      const rand = rng(77);
      for (let y = h + 8; y < 1080; y += 14) {
        const w = 20 + (y - h) * 0.28 + rand() * 40;
        body += `<ellipse cx="${(1440 + (rand() - 0.5) * 30).toFixed(0)}" cy="${y}" rx="${w.toFixed(0)}" ry="2.2" fill="#E8EEFF" opacity="${(0.55 - (y - h) / 900).toFixed(2)}"/>`;
      }
    }
    (s.ridges || []).forEach(([seed, base, amp, freq, rough, col], i) => {
      if (s.fog && i > 0) {
        defs += `<linearGradient id="${id}-f${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EAF2EE" stop-opacity="0"/><stop offset=".6" stop-color="#EAF2EE" stop-opacity=".32"/><stop offset="1" stop-color="#EAF2EE" stop-opacity="0"/></linearGradient>`;
        body += `<rect y="${base - amp * 1.6}" width="1920" height="${amp * 2}" fill="url(#${id}-f${i})"/>`;
      }
      body += `<path d="${ridge(seed, base, amp, freq, rough)}" fill="${col}"/>`;
    });
    return `<svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${body}</svg>`;
  }
  // Écran de veille : photos (mêmes catégories que le fond d'écran), paysages dessinés ou fond noir
  let scenesFor = '';
  function buildScenes() {
    const style = prefs.saverStyle || 'photos';
    const key = style + ':' + prefs.wallCat;
    if (scenesFor === key) return;
    if (style === 'photos') {
      const pool = wallPool(prefs.wallCat === 'none' ? 'random' : prefs.wallCat).sort(() => Math.random() - 0.5).slice(0, 16);
      $('saverScenes').innerHTML = pool.map(src => `<div class="scene"><div class="scene-inner scene-photo" data-src="${src}"></div></div>`).join('');
    } else if (style === 'noir') {
      $('saverScenes').innerHTML = '<div class="scene noir"></div>';
    } else {
      $('saverScenes').innerHTML = SCENES.map(s => `<div class="scene"><div class="scene-inner">${sceneSVG(s)}</div></div>`).join('');
    }
    scenesFor = key;
  }
  function showScene(i) {
    const list = [...$('saverScenes').children];
    if (!list.length) return;
    sceneIdx = (i + list.length) % list.length;
    // photos chargées une par une (la suivante est préparée à l'avance)
    [sceneIdx, (sceneIdx + 1) % list.length].forEach(k => {
      const inner = list[k].querySelector('[data-src]');
      if (inner && !inner.style.backgroundImage) inner.style.backgroundImage = `url("${inner.dataset.src}")`;
    });
    list.forEach((s, k) => s.classList.toggle('show', k === sceneIdx));
  }
  function startSaver() {
    if (saverOn || splashOn) return;
    saverOn = true; buildScenes(); tick(); renderWeather();
    showScene(Math.floor(Math.random() * $('saverScenes').children.length));
    clearInterval(sceneTimer);
    if ($('saverScenes').children.length > 1) sceneTimer = setInterval(() => showScene(sceneIdx + 1), 45000);
    $('saver').classList.add('on'); $('saver').setAttribute('aria-hidden', 'false');
    clearTimeout(rotTimer); renderDots();
  }
  function stopSaver() {
    saverOn = false; clearInterval(sceneTimer);
    $('saver').classList.remove('on'); $('saver').setAttribute('aria-hidden', 'true');
    sound('wake'); resetIdle(); restartRotation();
  }
  function resetIdle() {
    clearTimeout(idleTimer);
    if (prefs.sleepMin > 0) idleTimer = setTimeout(startSaver, prefs.sleepMin * 60000);
  }

  /* ---------- Écran de démarrage ---------- */
  let splashOn = !params.has('nosplash');
  function endSplash() {
    if (!splashOn) return;
    splashOn = false;
    $('splash').classList.add('out'); $('stage').classList.remove('intro');
    resetIdle(); restartRotation();
    if (params.has('veille')) setTimeout(startSaver, 900);
  }
  function startSplash() {
    const h = new Date().getHours();
    $('splashGreeting').textContent = `${h >= 18 || h < 5 ? 'Bonsoir' : 'Bonjour'} ${D.userName}`;
    $('splashSub').textContent = `${fmtDate(new Date())}, ${fmtTime(new Date())}`;
    if (!splashOn) { $('splash').classList.add('out'); splashOn = true; return endSplash(); }
    $('stage').classList.add('intro');
    setTimeout(endSplash, prefs.reduceMotion ? 1400 : 2800);
  }

  /* ---------- Télécommande / clavier ---------- */
  const KEY = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    Enter: 'ok', ' ': 'ok', Select: 'ok', MediaPlayPause: 'ok',
    Escape: 'back', Backspace: 'back', BrowserBack: 'back', GoBack: 'back'
  };
  const CODE = { 37: 'left', 38: 'up', 39: 'right', 40: 'down', 13: 'ok', 23: 'ok', 4: 'back', 8: 'back', 27: 'back', 461: 'back', 10009: 'back' };
  let lastKey = 0;
  addEventListener('keydown', (e) => {
    const k = KEY[e.key] || CODE[e.keyCode];
    if (splashOn || saverOn) { e.preventDefault(); return wake(); } // n'importe quelle touche
    resetIdle();
    if (document.activeElement?.tagName === 'INPUT') { // saisie : on laisse le texte s'écrire
      const act = { ArrowUp: 'up', ArrowDown: 'down', Enter: 'enter', Escape: 'stay', GoBack: 'stay' }[e.key] || (e.keyCode === 4 ? 'stay' : null);
      if (!act) return;
      e.preventDefault(); document.activeElement.blur();
      if (act === 'stay') return renderSettings();
      if (act === 'enter') { const ce = currentEntry(); if (ce && ce.onEnter) { ce.onEnter(); return; } return settingsKey('down'); }
      return settingsKey(act);
    }
    if (!k) return;
    e.preventDefault();
    const now = performance.now();
    if (e.repeat && now - lastKey < 110) return; // appui long : défilement régulier
    lastKey = now;
    handle(k);
  });
  function wake() { if (splashOn) endSplash(); else if (saverOn) stopSaver(); }
  // Utilisé par le lanceur Android (touches Retour / OK transmises par l'appli)
  window.tvHandleKey = (k) => {
    if (splashOn || saverOn) return wake();
    resetIdle();
    if (document.activeElement?.tagName === 'INPUT') { document.activeElement.blur(); return renderSettings(); }
    handle(k);
  };

  function handle(k) {
    if (layer === 'details') { if (k === 'back' || k === 'ok') closeLayer('details'); return; }
    if (layer === 'weather') { if (k === 'back' || k === 'ok') closeLayer('weatherPanel'); return; }
    if (layer === 'network') return networkKey(k);
    if (layer === 'settings') return settingsKey(k);
    if (k === 'ok') return activate(focusedEl);
    if (k === 'back') { const h = homeRow(); if (r !== h || c !== 0) { sound('back'); focus(h, 0, false); } return; }
    move(k);
  }

  /* ---------- Souris / tactile (en bonus) ---------- */
  function posOf(it) { for (let i = 0; i < NAV.length; i++) { const j = NAV[i].items.indexOf(it); if (j >= 0) return [i, j]; } return null; }
  function bindPointer(it) {
    if (it._bound) return; it._bound = true;
    it.tabIndex = -1;
    it.addEventListener('mouseenter', () => { const p = posOf(it); if (p && layer === 'home') focus(p[0], p[1], false); });
    it.addEventListener('click', (e) => { e.preventDefault(); const p = posOf(it); if (p) { focus(p[0], p[1], false); activate(it); } });
  }
  ['netBtn', 'weather', 'settingsBtn', 'heroPlay', 'heroMore'].forEach(id => bindPointer($(id)));
  $('setMenu').addEventListener('click', (e) => {
    const li = e.target.closest('.set-cat'); if (!li) return;
    enterCat(+li.dataset.c); pane = 'content'; renderSettings();
  });
  $('settingsList').addEventListener('click', (e) => {
    const li = e.target.closest('.setting'); if (!li || e.target.tagName === 'INPUT') return;
    pane = 'content'; nav.idx = +li.dataset.i; settingsKey('ok');
  });
  $('settingsList').addEventListener('focusin', (e) => { // clic direct dans un champ
    const li = e.target.closest('.setting'); if (li && nav.idx !== +li.dataset.i) { pane = 'content'; nav.idx = +li.dataset.i; [...$('settingsList').children].forEach(x => x.classList.toggle('focused', x === li)); }
  });
  $('netCard').addEventListener('click', (e) => {
    const li = e.target.closest('.setting'); if (!li) return;
    netIdx = +li.dataset.i; networkKey('ok');
  });
  $('details').addEventListener('click', () => closeLayer('details'));
  $('weatherPanel').addEventListener('click', () => closeLayer('weatherPanel'));
  ['mousemove', 'mousedown', 'wheel', 'touchstart'].forEach(ev => addEventListener(ev, () => {
    if (saverOn && ev !== 'mousemove') return stopSaver();
    if (!saverOn) resetIdle();
  }, { passive: true }));
  $('saver').addEventListener('click', stopSaver);
  $('splash').addEventListener('click', endSplash);

  // Bouton Home de la télécommande : retour en haut de l'accueil
  window.tvGoHome = () => {
    if (saverOn) stopSaver();
    if (splashOn) endSplash();
    document.activeElement?.blur?.();
    if (layer === 'settings') closeSettings();
    else if (layer === 'details') closeLayer('details');
    else if (layer === 'weather') closeLayer('weatherPanel');
    else if (layer === 'network') closeLayer('netPanel');
    focus(homeRow(), 0, false);
  };
  // Retour dans le lanceur : rangées mises à jour sans perdre la sélection
  function rebuildKeepFocus() {
    recentsDirty = false;
    const title = NAV[r] && NAV[r].title, id = focusedEl && focusedEl._item && focusedEl._item.id;
    buildRows();
    let nr = Math.min(r, NAV.length - 1), nc = c;
    if (r >= FIRST()) {
      const i = NAV.findIndex(rw => rw.title === title);
      if (i >= 0) { nr = i; const j = NAV[i].items.findIndex(t => t._item && t._item.id === id); nc = j >= 0 ? j : c; }
    }
    nc = Math.max(0, Math.min(nc, NAV[nr].items.length - 1));
    if (layer === 'home') focus(nr, nc, false); else { r = nr; c = nc; }
  }
  window.tvOnResume = () => {
    const changed = refreshInstalled();
    if (layer === 'settings' && changed) renderSettings();
    if (changed || recentsDirty) rebuildKeepFocus();
    readNetwork();
    if (upd.state === 'installing' || upd.state === 'needperm') { upd.state = upd.remote ? 'available' : 'idle'; if (layer === 'settings') renderSettings(); }
  };
  window.tvToast = (msg) => toast(msg);
  // Changement de réseau signalé par l'appli Android, ou par le navigateur
  window.tvNetworkChanged = () => readNetwork();
  addEventListener('online', readNetwork);
  addEventListener('offline', readNetwork);
  setInterval(readNetwork, 8000);

  // Retour depuis une appli ouverte : on reprend la bannière et la veille
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { clearTimeout(rotTimer); clearTimeout(idleTimer); }
    else { resetIdle(); restartRotation(); readNetwork(); if (recentsDirty) rebuildKeepFocus(); }
  });

  /* ---------- Démarrage ---------- */
  buildRows();
  showSlide(0, false);
  focus(homeRow(), 0, false);
  applyWallpaper();
  readNetwork();
  updateWeather(); setInterval(updateWeather, 15 * 60 * 1000);
  startSplash();
})();
