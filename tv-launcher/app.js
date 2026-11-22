(() => {
  'use strict';
  const D = window.TV_DATA;
  const $ = (id) => document.getElementById(id);
  const appById = Object.fromEntries(D.apps.map(a => [a.id, a]));
  const ROTATION_MS = 10000;               // bannière : une appli toutes les 10 s
  const SLEEP_CHOICES = [0, 1, 3, 5, 10, 15]; // minutes avant la veille (0 = jamais)
  const params = new URLSearchParams(location.search);

  /* ---------- Préférences enregistrées ---------- */
  function load(k, def) { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* stockage indisponible */ } }
  const prefs = Object.assign({ cityIndex: 0, h24: true, reduceMotion: false, sounds: true, openApps: true, sleepMin: 3, displayScale: 100 }, load('tv.prefs', {}));
  const savePrefs = () => save('tv.prefs', prefs);

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
  const getApp = (id) => builtinById[id] || (lib.custom.find(c => c.id === id) && customApp(lib.custom.find(c => c.id === id)));

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
  }
  normalizeLib();
  const saveLib = () => save('tv.library', lib);
  const appsInRow = (key) => lib.items.filter(it => it.row === key).map(it => getApp(it.id));

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

  /* ---------- Heure ---------- */
  const fmtTime = (d) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: !prefs.h24 });
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const fmtDate = (d) => cap(d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));
  function tick() {
    const now = new Date();
    $('time').textContent = fmtTime(now);
    $('date').textContent = fmtDate(now);
    $('saverTime').textContent = fmtTime(now);
    $('saverDate').textContent = fmtDate(now);
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
  const city = () => D.cities[prefs.cityIndex] || D.cities[0];
  let wx = null;

  function renderWeather() {
    $('weatherCity').textContent = city().name;
    const ok = wx && wx.city === city().name;
    $('weatherTemp').textContent = ok ? Math.round(wx.t) + '°' : '--°';
    $('weatherIcon').innerHTML = ICONS[ok ? iconFor(wx.code, wx.day) : 'cloud'];
    $('saverWeather').innerHTML = ok
      ? `${ICONS[iconFor(wx.code, wx.day)]}<span>${Math.round(wx.t)}° ${condition(wx.code).toLowerCase()}, ${city().name}</span>`
      : `<span>${city().name}</span>`;
    if (layer === 'weather') renderWeatherPanel();
  }
  async function updateWeather() {
    const cached = load('tv.weather', null);
    wx = cached && cached.city === city().name && cached.days ? cached : null;
    renderWeather();
    try {
      const c = city();
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}` +
        '&current=temperature_2m,apparent_temperature,weather_code,is_day,relative_humidity_2m,wind_speed_10m' +
        '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=5&timezone=auto';
      const r = await fetch(url);
      if (!r.ok) throw new Error(r.status);
      const j = await r.json();
      if (c !== city()) return; // la ville a changé pendant la requête
      wx = {
        city: c.name, at: Date.now(),
        t: j.current.temperature_2m, feel: j.current.apparent_temperature, code: j.current.weather_code,
        day: !!j.current.is_day, hum: j.current.relative_humidity_2m, wind: j.current.wind_speed_10m,
        days: j.daily.time.map((date, i) => ({
          date, code: j.daily.weather_code[i], max: j.daily.temperature_2m_max[i],
          min: j.daily.temperature_2m_min[i], rain: j.daily.precipitation_probability_max?.[i]
        }))
      };
      save('tv.weather', wx); renderWeather();
    } catch { /* hors ligne : on garde la dernière météo connue */ }
  }

  function renderWeatherPanel() {
    const c = city();
    const ok = wx && wx.city === c.name && wx.days;
    if (!ok) {
      $('weatherCard').innerHTML = `<div class="wx-head"><h2>Météo à ${c.name}</h2></div>
        <div class="wx-empty">La météo n'est pas disponible pour le moment. Vérifiez que la TV est connectée à Internet, puis réessayez dans quelques minutes.</div>
        <div class="details-hint">Appuyez sur Retour pour fermer.</div>`;
      return;
    }
    const dayName = (iso, i) => i === 0 ? "Aujourd'hui" : i === 1 ? 'Demain'
      : cap(new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long' }));
    $('weatherCard').innerHTML = `
      <div class="wx-head"><h2>Météo à ${c.name}</h2><span class="wx-upd">Mise à jour à ${fmtTime(new Date(wx.at))}</span></div>
      <div class="wx-now">
        <div class="wx-icon">${ICONS[iconFor(wx.code, wx.day)]}</div>
        <div class="wx-temp">${Math.round(wx.t)}°</div>
        <div>
          <div class="wx-cond">${condition(wx.code)}</div>
          <div class="wx-meta"><span>Ressenti <b>${Math.round(wx.feel)}°</b></span><span>Humidité <b>${Math.round(wx.hum)} %</b></span><span>Vent <b>${Math.round(wx.wind)} km/h</b></span></div>
        </div>
      </div>
      <div class="wx-days">${wx.days.slice(0, 5).map((d, i) => `
        <div class="wx-day"><div class="d">${dayName(d.date, i)}</div>${ICONS[iconFor(d.code, true)]}
          <div><span class="hi">${Math.round(d.max)}°</span><span class="lo">${Math.round(d.min)}°</span></div>
          ${d.rain != null ? `<div class="rain">Pluie ${Math.round(d.rain)} %</div>` : ''}</div>`).join('')}
      </div>
      <div class="details-hint">Appuyez sur Retour pour fermer.</div>`;
  }

  /* ---------- Tuiles ---------- */
  const art = (c) => `radial-gradient(circle at 78% 28%, ${c[2]} 0%, transparent 38%),
    radial-gradient(ellipse at 15% 100%, ${c[0]} 0%, transparent 60%),
    linear-gradient(160deg, ${c[0]} 0%, ${c[1]} 75%)`;
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
      : `<span class="app-logo ${a.logoStyle}" style="--logo:${a.logoColor}">${a.logoStyle === 'play' ? '<span class="play"></span>' : ''}${a.name}</span>`;
  }
  // logo introuvable : on affiche le nom de l'appli à la place
  window.tvLogoFallback = (img) => { const t = document.createElement('span'); t.className = 'app-logo bold'; t.style.setProperty('--logo', '#fff'); t.textContent = img.dataset.name; img.replaceWith(t); };
  const appItem = (a) => ({ kind: 'app', id: a.id, title: a.name, source: a.id, desc: a.desc, colors: a.colors, action: `Ouvrir ${a.name}` });

  function appTile(a) {
    const t = el('button', 'tile tile-app focusable', logoHTML(a));
    t.style.setProperty('--tc1', a.colors[0]); t.style.setProperty('--tc2', a.colors[1]); t.style.setProperty('--tc3', a.colors[2]);
    t.setAttribute('aria-label', a.name);
    if (a.custom) t.classList.add('tile-custom');
    t._item = appItem(a);
    return t;
  }
  function contentTile(it, wide) {
    const a = appById[it.app];
    const t = el('button', 'tile focusable ' + (wide ? 'tile-wide' : 'tile-poster'));
    t.style.setProperty('--tc1', it.colors[0]);
    t.innerHTML = `<div class="art" style="background:${art(it.colors)}"></div><div class="art-shade"></div>
      <span class="badge"><img src="${a.icon}" alt="">${a.name}</span>
      <div class="tile-info"><div class="tile-title">${it.title}</div>
      ${wide ? `<div class="tile-sub">${it.sub}</div><div class="progress"><i style="width:${Math.round(it.progress * 100)}%"></i></div>` : ''}</div>`;
    t.setAttribute('aria-label', `${it.title}, sur ${a.name}`);
    t._item = { kind: 'content', id: it.title, title: it.title, source: it.app, desc: it.desc,
      tags: wide ? [it.sub, it.left] : it.tags, colors: it.colors, action: wide ? 'Reprendre' : 'Regarder' };
    return t;
  }

  /* ---------- Rangées et navigation ---------- */
  let ROWS = [], NAV = [], memory = [];
  let r = 1, c = 0, focusedEl = null;
  let layer = 'home'; // home | settings | details | weather

  function buildRows() {
    const rowsEl = $('rows'); rowsEl.innerHTML = '';
    ROWS = [
      ...ROW_DEFS.map(d => ({ title: d.title, key: d.key, items: appsInRow(d.key).map(appTile) })).filter(rw => rw.items.length),
      { title: 'Continuer à regarder', items: D.continue.map(i => contentTile(i, true)) },
      { title: 'Recommandations', items: D.recommendations.map(i => contentTile(i, false)) }
    ];
    ROWS.forEach(row => {
      const sec = el('section', 'row');
      sec.appendChild(el('h2', 'row-title', row.title));
      const vp = el('div', 'row-viewport'), tr = el('div', 'track');
      row.items.forEach(i => { tr.appendChild(i); bindPointer(i); });
      vp.appendChild(tr); sec.appendChild(vp); rowsEl.appendChild(sec);
      row.el = sec; row.track = tr; row.offset = 0;
    });
    NAV = [{ items: [$('weather'), $('settingsBtn')] }, { items: [$('heroPlay'), $('heroMore')] }, ...ROWS];
    memory = NAV.map((_, i) => (i === 0 ? 1 : 0));
  }

  /* ---------- Bannière dynamique ---------- */
  let heroItem = null, slideIdx = 0, rotTimer = 0, heroTimer = 0, swapToken = 0;
  const slides = () => { const f = appsInRow('favoris'); return f.length ? f : lib.items.map(it => getApp(it.id)); };

  function setAmbient(col) {
    const s = document.documentElement.style;
    s.setProperty('--c1', col[0]); s.setProperty('--c2', col[1]); s.setProperty('--c3', col[2]);
  }
  function renderHero(item, animate) {
    if (heroItem && heroItem.kind === item.kind && heroItem.id === item.id) return;
    heroItem = item; setAmbient(item.colors);
    const token = ++swapToken;
    const apply = () => {
      if (token !== swapToken) return;
      const a = getApp(item.source);
      const isApp = item.kind === 'app';
      $('heroText').classList.toggle('is-app', isApp);
      $('heroLogo').innerHTML = isApp ? logoHTML(a) : '';
      $('heroSource').innerHTML = isApp ? '' : `<img class="src-icon" src="${a.icon}" alt="">Sur ${a.name}`;
      $('heroTags').innerHTML = (item.tags || []).filter(Boolean).map(t => `<span class="tag">${t}</span>`).join('');
      $('heroTitle').textContent = item.title;
      $('heroDesc').textContent = item.desc;
      $('heroPlayLabel').textContent = item.action;
      $('heroDots').classList.toggle('hidden', !isApp);
      $('heroText').classList.remove('swap');
    };
    if (!animate || prefs.reduceMotion) return apply();
    $('heroText').classList.add('swap');
    setTimeout(apply, 220);
  }
  function rotationActive() { return layer === 'home' && r <= 1 && !saverOn && !splashOn && !document.hidden; }
  function renderDots() {
    const list = slides();
    $('heroDots').style.setProperty('--rot', ROTATION_MS + 'ms');
    $('heroDots').innerHTML = list.map((_, i) => `<span class="dot-i${i === slideIdx ? ' on' : ''}"></span>`).join('');
    $('heroDots').classList.toggle('paused', !rotationActive());
  }
  // (re)lance le minuteur de 10 s et l'animation du point actif
  function restartRotation() {
    clearTimeout(rotTimer);
    renderDots();
    if (rotationActive()) rotTimer = setTimeout(() => showSlide(slideIdx + 1), ROTATION_MS);
  }
  function showSlide(i, animate = true) {
    const list = slides();
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
    target.classList.add('focused'); focusedEl = target;
    if (fromKey && prevEl !== target) sound('move');
    ROWS.forEach((row, i) => row.el.classList.toggle('active', NAV[r] === row));

    clearTimeout(heroTimer);
    if (r >= 2 && target._item) {
      const item = target._item;
      if (item.kind === 'app') { const k = slides().findIndex(a => a.id === item.id); if (k >= 0) slideIdx = k; }
      heroTimer = setTimeout(() => renderHero(item, true), fromKey ? 160 : 0);
    } else if (r <= 1 && prevR >= 2) {
      showSlide(slideIdx);
    }
    if (r <= 1 || prevR <= 1) restartRotation();
    scrollTo();
  }

  function scrollTo() {
    const row = NAV[r];
    if (row.track) { // horizontal : la tuile reste dans la zone de sécurité
      const t = row.items[c], SAFE = 96, W = 1920;
      const left = t.offsetLeft, right = left + t.offsetWidth;
      const last = row.items[row.items.length - 1];
      const max = Math.max(0, last.offsetLeft + last.offsetWidth + SAFE - W);
      if (right - row.offset > W - SAFE) row.offset = right - (W - SAFE);
      if (left - row.offset < SAFE) row.offset = left - SAFE;
      row.offset = Math.max(0, Math.min(max, row.offset));
      row.track.style.transform = `translateX(${-row.offset}px)`;
    }
    let y = 0; // vertical : la bannière s'efface sous la rangée Favoris
    if (r > 2) y = Math.min(row.el.offsetTop - 190, $('scroller').scrollHeight - 1080);
    $('scroller').style.transform = `translateY(${-y}px)`;
    ROWS.forEach(rw => { rw.el.style.opacity = rw.el.offsetTop + rw.el.offsetHeight - y < 260 ? 0 : 1; });
    $('hero').style.opacity = r > 2 ? 0 : 1;
    $('stage').classList.toggle('scrolled', r > 2);
  }

  function move(dir) {
    const n = NAV[r].items.length;
    const heroIsApp = heroItem && heroItem.kind === 'app';
    if (dir === 'left') {
      if (r === 1 && c === 0 && heroIsApp) { sound('move'); return showSlide(slideIdx - 1); }
      if (c === 0) return sound('edge');
      return focus(r, c - 1);
    }
    if (dir === 'right') {
      if (r === 1 && c === n - 1 && heroIsApp) { sound('move'); return showSlide(slideIdx + 1); }
      if (c === n - 1) return sound('edge');
      return focus(r, c + 1);
    }
    if (dir === 'up') { if (r === 0) return sound('edge'); return focus(r - 1, r - 1 === 1 ? 0 : memory[r - 1]); }
    if (dir === 'down') { if (r === NAV.length - 1) return sound('edge'); return focus(r + 1, r + 1 === 1 ? 0 : memory[r + 1]); }
  }

  function activate(target) {
    if (target === $('weather')) return openWeather();
    if (target === $('settingsBtn')) return openSettings();
    if (target === $('heroMore')) return openDetails(heroItem);
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
  function toast(msg) {
    const t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  /* ---------- Fenêtres : détail et météo ---------- */
  function openLayer(id, name) { $(id).classList.add('open'); $(id).setAttribute('aria-hidden', 'false'); layer = name; clearTimeout(rotTimer); renderDots(); }
  function closeLayer(id) { $(id).classList.remove('open'); $(id).setAttribute('aria-hidden', 'true'); layer = 'home'; sound('back'); restartRotation(); }
  function openDetails(item) {
    sound('select');
    $('detailsTitle').textContent = item.title; $('detailsDesc').textContent = item.desc;
    openLayer('details', 'details');
  }
  function openWeather() { sound('select'); openLayer('weatherPanel', 'weather'); renderWeatherPanel(); }

  /* ---------- Paramètres ---------- */
  const sleepLabel = () => prefs.sleepMin ? `${prefs.sleepMin} min` : 'Jamais';
  const SWATCHES = ['#E50914', '#FF6B00', '#F5C518', '#1DB954', '#00A3A3', '#1A73E8', '#6C3BFF', '#E0218A', '#5A5F6B', '#141414'];
  const ROW_KEYS = ROW_DEFS.map(d => d.key);
  const switchHTML = (on) => `<span class="switch ${on ? 'on' : ''}"></span>`;
  const mini = (a) => `<span class="mini" style="--tc2:${a.colors[1]};--tc3:${a.colors[2]}">${logoHTML(a)}</span>`;
  const cycle = (list, cur, d) => list[(list.indexOf(cur) + d + list.length) % list.length];

  const DISPLAY_SCALES = [80, 85, 90, 95, 100];
  function screenInfo() {
    try {
      const d = JSON.parse(window.AndroidTV.displayInfo());
      return `${d.widthPx} × ${d.heightPx} px, densité ${String(Math.round(d.density * 100) / 100).replace('.', ',')}`;
    } catch { return ''; }
  }
  const MAIN = [
    { label: 'Mes applis', value: () => `${lib.items.length} ›`, go: 'manage' },
    { label: 'Ajouter une appli', value: () => '›', go: 'add' },
    { label: 'Ville pour la météo', value: () => `‹ ${city().name} ›`,
      step: (d) => { prefs.cityIndex = (prefs.cityIndex + d + D.cities.length) % D.cities.length; updateWeather(); } },
    { label: 'Paramètres de la TV', value: () => '›', show: () => hasBridge(), act: () => window.AndroidTV.openSystemSettings() },
    { label: 'Ouvrir les applis installées', toggle: 'openApps', show: () => !hasBridge() },
    { label: 'Sons de navigation', toggle: 'sounds' },
    { label: 'Mise en veille', value: () => `‹ ${sleepLabel()} ›`,
      step: (d) => { prefs.sleepMin = cycle(SLEEP_CHOICES, prefs.sleepMin, d); resetIdle(); } },
    { label: 'Taille de l’affichage', value: () => `‹ ${prefs.displayScale || 100} % ›`,
      step: (d) => { prefs.displayScale = cycle(DISPLAY_SCALES, prefs.displayScale || 100, d); fit(); } },
    { label: 'Écran', show: () => hasBridge() && typeof window.AndroidTV.displayInfo === 'function', value: () => screenInfo(), act: () => {} },
    { label: 'Heure sur 24 h', toggle: 'h24', after: tick },
    { label: 'Réduire les animations', toggle: 'reduceMotion', after: applyMotion },
    { label: 'Plein écran', show: () => !hasBridge(), value: () => document.fullscreenElement ? 'Activé' : 'Désactivé',
      step: () => {
        const pr = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.();
        Promise.resolve(pr).catch(() => toast('Plein écran indisponible dans ce navigateur')).finally(() => setTimeout(renderSettings, 300));
      } }
  ];

  const nav = { page: 'main', idx: 0 };
  const stack = [];
  let target = null, grabId = null, confirmRemove = false;
  const newDraft = () => ({ name: '', link: '', color: SWATCHES[5], row: 'favoris' });
  let draft = newDraft();

  function go(page, idx = 0) {
    stack.push({ page: nav.page, idx: nav.idx });
    Object.assign(nav, { page, idx }); grabId = null; confirmRemove = false;
    $('settingsList').scrollTop = 0; renderSettings();
  }
  function goBack() {
    const prev = stack.pop();
    if (!prev) return closeSettings();
    Object.assign(nav, prev); grabId = null; confirmRemove = false;
    sound('back'); $('settingsList').scrollTop = 0; renderSettings();
  }
  function libChanged() { // enregistre et redessine l'accueil derrière le panneau
    saveLib(); buildRows();
    const n = slides().length; slideIdx = Math.min(slideIdx, n - 1); heroItem = null; showSlide(slideIdx, false);
    r = Math.min(r, NAV.length - 1);
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
    const i = lib.items.findIndex(it => it.id === grabId), row = lib.items[i].row;
    let j = i + dir;
    while (j >= 0 && j < lib.items.length && lib.items[j].row !== row) j += dir;
    if (j < 0 || j >= lib.items.length) return sound('edge');
    [lib.items[i], lib.items[j]] = [lib.items[j], lib.items[i]];
    sound('move'); libChanged();
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

  // Chaque page : titre, aide et lignes ({ label, value, ok, left, right } ; header = titre de section)
  function pageDef() {
    switch (nav.page) {
      case 'main': return {
        title: 'Paramètres', hint: 'Flèches pour choisir, OK pour modifier, Retour pour fermer.',
        entries: MAIN.filter(m => !m.show || m.show()).map(m => ({
          label: m.label, value: m.toggle ? switchHTML(prefs[m.toggle]) : m.value(),
          ok: () => m.act ? m.act() : m.go ? go(m.go) : mainStep(m, 1),
          right: m.act ? null : m.go ? () => go(m.go) : () => mainStep(m, 1),
          left: m.go || m.toggle || m.act ? null : () => mainStep(m, -1)
        }))
      };
      case 'manage': {
        const entries = [];
        ROW_DEFS.forEach(d => {
          const items = lib.items.filter(it => it.row === d.key);
          if (!items.length) return;
          entries.push({ header: true, label: d.title });
          items.forEach(it => {
            const a = getApp(it.id), grabbed = grabId === it.id;
            entries.push({ id: it.id, cls: grabbed ? 'grab' : '', label: `${mini(a)}<span>${esc(a.name)}</span>`,
              value: grabbed ? 'Haut / Bas' : '›', ok: () => { target = it.id; go('actions'); },
              right: () => { grabId = it.id; sound('select'); } });
          });
        });
        return { title: 'Mes applis', entries,
          hint: grabId ? `Haut et Bas pour déplacer ${getApp(grabId).name} dans sa rangée, OK pour la poser.`
            : 'OK : options de l’appli. Droite : déplacer. Retour : terminer.' };
      }
      case 'actions': {
        const a = getApp(target), it = lib.items.find(x => x.id === target);
        if (!a || !it) return { title: 'Mes applis', hint: '', entries: [] };
        const setRow = (d) => { it.row = cycle(ROW_KEYS, it.row, d); lib.items = [...lib.items.filter(x => x !== it), it]; sound('move'); libChanged(); };
        return { title: a.name, hint: 'Gauche et Droite pour changer de rangée. Retour pour revenir.',
          entries: [
            { label: 'Rangée', value: `‹ ${rowTitle(it.row)} ›`, ok: () => setRow(1), right: () => setRow(1), left: () => setRow(-1) },
            { label: 'Changer l’ordre', value: '›', ok: () => { goBack(); grabId = target; renderSettings(); } },
            { label: confirmRemove ? 'Appuyez de nouveau sur OK pour retirer' : 'Retirer de l’accueil', cls: 'danger', value: '',
              ok: () => {
                if (!confirmRemove) { confirmRemove = true; return; }
                if (lib.items.length <= 1) { confirmRemove = false; return toast('Gardez au moins une appli sur l’accueil.'); }
                lib.items = lib.items.filter(x => x.id !== target);
                if (a.custom) lib.custom = lib.custom.filter(c => c.id !== target);
                libChanged(); toast(`${a.name} retirée de l’accueil`); goBack();
              } }
          ] };
      }
      case 'add': {
        const available = BUILTIN.filter(a => !lib.items.some(it => it.id === a.id))
          .sort((x, y) => isInstalled(y) - isInstalled(x)); // applis présentes sur la TV en premier
        const entries = [{ label: 'Appli personnalisée', value: 'Créer ›', cls: 'special', ok: () => go('custom') }];
        if (hasBridge()) {
          // applis de la TV qui ne sont ni sur l'accueil ni dans la liste des applis populaires
          const known = new Set([...BUILTIN.flatMap(pkgsOf), ...lib.items.map(it => getApp(it.id)).flatMap(pkgsOf)]);
          const others = installed.filter(x => !known.has(x.package));
          entries.push({ header: true, label: others.length ? 'Installées sur cette TV' : 'Toutes les applis de la TV sont déjà sur l’accueil ou dans la liste ci-dessous.' });
          others.forEach(x => {
            const a = installedAsApp(x);
            entries.push({ label: `${mini(a)}<span>${esc(a.name)}</span>`, value: 'Installée',
              ok: () => { target = 'inst:' + x.package; go('addRow', 0); } });
          });
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
            if (!lib.custom.some(c => c.id === id)) lib.custom.push({ id, installed: true, name: inst.name, package: inst.package, color: inst.color || '#2A3550', kind: 'video' });
          }
          addApp(id, row); goBack();
        };
        return { title: `Ajouter ${a.name}`, hint: 'Choisissez la rangée où placer l’appli.',
          entries: ROW_DEFS.map(d => ({ label: d.title, value: d.key === suggested ? 'Suggérée' : '', ok: () => confirm(d.key) })) };
      }
      case 'custom': return {
        title: 'Appli personnalisée', preview: true,
        hint: 'OK pour écrire, Haut et Bas pour changer de champ, Retour pour annuler.',
        entries: [
          { field: 'name', label: 'Nom', ok: () => focusField('name') },
          { field: 'link', label: 'Lien ou paquet Android', ok: () => focusField('link') },
          { label: 'Couleur de fond', value: `<span class="swatches">${SWATCHES.map(c => `<i class="sw${c === draft.color ? ' on' : ''}" style="background:${c}"></i>`).join('')}</span>`,
            ok: () => { draft.color = cycle(SWATCHES, draft.color, 1); }, right: () => { draft.color = cycle(SWATCHES, draft.color, 1); }, left: () => { draft.color = cycle(SWATCHES, draft.color, -1); } },
          { label: 'Rangée', value: `‹ ${rowTitle(draft.row)} ›`,
            ok: () => { draft.row = cycle(ROW_KEYS, draft.row, 1); }, right: () => { draft.row = cycle(ROW_KEYS, draft.row, 1); }, left: () => { draft.row = cycle(ROW_KEYS, draft.row, -1); } },
          { label: 'Ajouter l’appli', cls: 'primary', value: '', ok: submitCustom }
        ]
      };
    }
  }
  const installedAsApp = (x) => customApp({ id: 'inst-' + x.package, installed: true, name: x.name, package: x.package, color: x.color || '#2A3550' });
  function mainStep(m, d) {
    if (m.toggle) { prefs[m.toggle] = !prefs[m.toggle]; m.after && m.after(); }
    else m.step(d);
    savePrefs();
  }
  function focusField(f) {
    const inp = $('cust-' + f); if (!inp) return;
    inp.focus(); const n = inp.value.length; try { inp.setSelectionRange(n, n); } catch { /* ignoré */ }
    if (hasBridge() && typeof window.AndroidTV.showKeyboard === 'function') window.AndroidTV.showKeyboard();
  }
  function updatePreview() {
    const pv = $('settingsPreview');
    const a = draftApp();
    pv.style.setProperty('--tc2', a.colors[1]); pv.style.setProperty('--tc3', a.colors[2]);
    pv.innerHTML = logoHTML(a);
    const note = $('cust-note'); if (note) note.textContent = linkNote();
  }

  function renderSettings() {
    const def = pageDef();
    const sel = def.entries.filter(e => !e.header);
    nav.idx = Math.max(0, Math.min(sel.length - 1, nav.idx));
    if (grabId) nav.idx = Math.max(0, sel.findIndex(e => e.id === grabId));
    $('settingsTitle').textContent = def.title;
    $('settingsHint').textContent = def.hint;
    $('settingsPreview').hidden = !def.preview;
    let k = -1;
    $('settingsList').innerHTML = def.entries.map(e => {
      if (e.header) return `<li class="setting-group">${e.label}</li>`;
      k++;
      const cls = ['setting', e.cls || '', k === nav.idx && !e.cls?.includes('grab') ? 'focused' : '', e.field ? 'field' : ''].join(' ');
      if (e.field) {
        const extra = e.field === 'link' ? `<span class="field-note" id="cust-note"></span>` : '';
        return `<li class="${cls}" data-i="${k}"><span class="field-label">${e.label}</span>
          <input id="cust-${e.field}" type="${e.field === 'link' ? 'url' : 'text'}" maxlength="${e.field === 'name' ? 30 : 300}"
            value="${esc(draft[e.field])}" autocomplete="off" autocapitalize="${e.field === 'name' ? 'words' : 'off'}" spellcheck="false">${extra}</li>`;
      }
      return `<li class="${cls}" data-i="${k}"><span class="row-left">${e.label}</span><span class="val">${e.value ?? ''}</span></li>`;
    }).join('');
    if (def.preview) {
      updatePreview();
      ['name', 'link'].forEach(f => $('cust-' + f).addEventListener('input', (ev) => { draft[f] = ev.target.value; updatePreview(); }));
    }
    // garde la ligne sélectionnée visible dans la liste
    const ul = $('settingsList'), li = ul.querySelector('.focused, .grab');
    if (li) {
      if (li.offsetTop - 60 < ul.scrollTop) ul.scrollTop = Math.max(0, li.offsetTop - 60);
      else if (li.offsetTop + li.offsetHeight + 12 > ul.scrollTop + ul.clientHeight) ul.scrollTop = li.offsetTop + li.offsetHeight + 12 - ul.clientHeight;
    }
  }

  function settingsKey(k) {
    const sel = pageDef().entries.filter(e => !e.header);
    if (grabId) { // déplacement d'une appli dans « Mes applis »
      if (k === 'up' || k === 'down') moveGrabbed(k === 'up' ? -1 : 1);
      else { grabId = null; sound('select'); }
      return renderSettings();
    }
    if (k === 'back') { if (nav.page === 'custom') document.activeElement.blur?.(); return goBack(); }
    if (k === 'up' || k === 'down') {
      const n = Math.max(0, Math.min(sel.length - 1, nav.idx + (k === 'up' ? -1 : 1)));
      sound(n === nav.idx ? 'edge' : 'move'); nav.idx = n; confirmRemove = false;
      return renderSettings();
    }
    const e = sel[nav.idx]; if (!e) return;
    const fn = e[k];
    if (!fn) return sound('edge');
    sound(k === 'ok' ? 'select' : 'move');
    const page = nav.page;
    fn();
    if (nav.page === page && document.activeElement?.tagName !== 'INPUT') renderSettings();
  }
  function openSettings() {
    sound('select'); stack.length = 0; Object.assign(nav, { page: 'main', idx: 0 }); grabId = null;
    $('settingsList').scrollTop = 0; renderSettings();
    openLayer('settings', 'settings');
  }
  function closeSettings() {
    document.activeElement?.blur?.();
    $('settings').classList.remove('open'); $('settings').setAttribute('aria-hidden', 'true');
    layer = 'home'; sound('back');
    r = Math.min(r, NAV.length - 1);
    focus(r, Math.min(c, NAV[r].items.length - 1), false);
    restartRotation();
  }
  function applyMotion() { document.documentElement.classList.toggle('reduce-motion', prefs.reduceMotion); }
  applyMotion();

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
  function buildScenes() {
    if (scenesBuilt) return;
    $('saverScenes').innerHTML = SCENES.map(s => `<div class="scene"><div class="scene-inner">${sceneSVG(s)}</div></div>`).join('');
    scenesBuilt = true;
  }
  function showScene(i) {
    const list = $('saverScenes').children;
    sceneIdx = (i + list.length) % list.length;
    [...list].forEach((s, k) => s.classList.toggle('show', k === sceneIdx));
  }
  function startSaver() {
    if (saverOn || splashOn) return;
    saverOn = true; buildScenes(); tick(); renderWeather();
    showScene(Math.floor(Math.random() * SCENES.length));
    clearInterval(sceneTimer); sceneTimer = setInterval(() => showScene(sceneIdx + 1), 45000);
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
      const nav2 = { ArrowUp: 'up', ArrowDown: 'down', Enter: 'down', Escape: 'stay', GoBack: 'stay' }[e.key] || (e.keyCode === 4 ? 'stay' : null);
      if (!nav2) return;
      e.preventDefault(); document.activeElement.blur();
      return nav2 === 'stay' ? renderSettings() : settingsKey(nav2);
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
  window.tvHandleKey = (k) => { if (splashOn || saverOn) return wake(); resetIdle(); handle(k); };

  function handle(k) {
    if (layer === 'details') { if (k === 'back' || k === 'ok') closeLayer('details'); return; }
    if (layer === 'weather') { if (k === 'back' || k === 'ok') closeLayer('weatherPanel'); return; }
    if (layer === 'settings') return settingsKey(k);
    if (k === 'ok') return activate(focusedEl);
    if (k === 'back') { if (r !== 1 || c !== 0) { sound('back'); focus(1, 0, false); } return; }
    move(k);
  }

  /* ---------- Souris / tactile (en bonus) ---------- */
  function posOf(it) { for (let i = 0; i < NAV.length; i++) { const j = NAV[i].items.indexOf(it); if (j >= 0) return [i, j]; } return null; }
  function bindPointer(it) {
    it.tabIndex = -1;
    it.addEventListener('mouseenter', () => { const p = posOf(it); if (p && layer === 'home') focus(p[0], p[1], false); });
    it.addEventListener('click', (e) => { e.preventDefault(); const p = posOf(it); if (p) { focus(p[0], p[1], false); activate(it); } });
  }
  ['weather', 'settingsBtn', 'heroPlay', 'heroMore'].forEach(id => bindPointer($(id)));
  $('settingsList').addEventListener('click', (e) => {
    const li = e.target.closest('.setting'); if (!li || e.target.tagName === 'INPUT') return;
    nav.idx = +li.dataset.i; settingsKey('ok');
  });
  $('settingsList').addEventListener('focusin', (e) => { // clic direct dans un champ
    const li = e.target.closest('.setting'); if (li && nav.idx !== +li.dataset.i) { nav.idx = +li.dataset.i; [...$('settingsList').children].forEach(x => x.classList.toggle('focused', x === li)); }
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
    focus(1, 0, false);
  };
  // Retour dans le lanceur : la liste des applis installées a pu changer
  window.tvOnResume = () => {
    if (!refreshInstalled()) return;
    if (layer === 'settings') renderSettings();
    buildRows(); r = Math.min(r, NAV.length - 1);
    if (layer === 'home') focus(r, Math.min(c, NAV[r].items.length - 1), false);
  };
  window.tvToast = (msg) => toast(msg);

  // Retour depuis une appli ouverte : on reprend la bannière et la veille
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { clearTimeout(rotTimer); clearTimeout(idleTimer); }
    else { resetIdle(); restartRotation(); }
  });

  /* ---------- Démarrage ---------- */
  buildRows();
  showSlide(0, false);
  focus(1, 0, false);
  updateWeather(); setInterval(updateWeather, 15 * 60 * 1000);
  startSplash();
})();
