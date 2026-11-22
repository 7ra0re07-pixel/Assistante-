(() => {
  'use strict';
  const D = window.TV_DATA;
  const $ = (id) => document.getElementById(id);
  const appById = Object.fromEntries(D.apps.map(a => [a.id, a]));

  /* ---------- Préférences (stockage local facultatif) ---------- */
  const prefs = Object.assign({ cityIndex: 0, h24: true, reduceMotion: false }, load('tv.prefs', {}));
  function load(k, def) { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignoré */ } }

  /* ---------- Mise à l'échelle 16:9 ---------- */
  function fit() {
    const s = Math.min(innerWidth / 1920, innerHeight / 1080);
    document.documentElement.style.setProperty('--scale', s);
  }
  addEventListener('resize', fit); fit();

  /* ---------- Horloge ---------- */
  function tick() {
    const now = new Date();
    $('time').textContent = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: !prefs.h24 });
    const d = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    $('date').textContent = d.charAt(0).toUpperCase() + d.slice(1);
  }
  tick(); setInterval(tick, 1000 * 10);

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
  function renderWeather(w) {
    const city = D.cities[prefs.cityIndex] || D.cities[0];
    $('weatherCity').textContent = city.name;
    if (!w) { $('weatherTemp').textContent = '--°'; $('weatherIcon').innerHTML = ICONS.cloud; return; }
    $('weatherTemp').textContent = Math.round(w.t) + '°';
    $('weatherIcon').innerHTML = ICONS[iconFor(w.code, w.day)];
  }
  async function updateWeather() {
    const city = D.cities[prefs.cityIndex] || D.cities[0];
    const cache = load('tv.weather', null);
    if (cache && cache.city === city.name) renderWeather(cache); else renderWeather(null);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,weather_code,is_day&timezone=auto`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(r.status);
      const j = await r.json();
      const w = { city: city.name, t: j.current.temperature_2m, code: j.current.weather_code, day: !!j.current.is_day };
      save('tv.weather', w); renderWeather(w);
    } catch { /* hors ligne : on garde le cache */ }
  }
  updateWeather(); setInterval(updateWeather, 15 * 60 * 1000);

  /* ---------- Construction des rangées ---------- */
  const art = (c) => `radial-gradient(circle at 78% 28%, ${c[2]} 0%, transparent 38%),
    radial-gradient(ellipse at 15% 100%, ${c[0]} 0%, transparent 60%),
    linear-gradient(160deg, ${c[0]} 0%, ${c[1]} 75%)`;

  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  function appTile(a) {
    const t = el('button', 'tile tile-app focusable');
    t.style.setProperty('--tc1', a.colors[0]); t.style.setProperty('--tc2', a.colors[1]); t.style.setProperty('--tc3', a.colors[2]);
    t.style.setProperty('--logo', a.logoColor);
    const logo = a.logoStyle === 'play' ? `<span class="play"></span>${a.name}` : a.name;
    t.innerHTML = `<span class="app-logo ${a.logoStyle}">${logo}</span>`;
    t.setAttribute('aria-label', a.name);
    t._item = { kind: 'app', title: a.name, source: a.id, desc: a.desc, tags: [], colors: a.colors, action: 'Ouvrir' };
    return t;
  }
  function contentTile(it, wide) {
    const a = appById[it.app];
    const t = el('button', 'tile focusable ' + (wide ? 'tile-wide' : 'tile-poster'));
    t.style.setProperty('--tc1', it.colors[0]);
    t.innerHTML = `<div class="art" style="background:${art(it.colors)}"></div><div class="art-shade"></div>
      <span class="badge" style="--badge:${a.logoColor === '#FFFFFF' ? '#fff' : a.logoColor}">${a.name}</span>
      <div class="tile-info"><div class="tile-title">${it.title}</div>
      ${wide ? `<div class="tile-sub">${it.sub}</div><div class="progress"><i style="width:${Math.round(it.progress * 100)}%"></i></div>` : ''}</div>`;
    t.setAttribute('aria-label', `${it.title}, sur ${a.name}`);
    t._item = { kind: 'content', title: it.title, source: it.app, desc: it.desc,
      tags: wide ? [it.sub, it.left] : it.tags, colors: it.colors, action: wide ? 'Reprendre' : 'Regarder' };
    return t;
  }
  const ROWS = [
    { title: 'Mes applis', items: D.apps.map(appTile) },
    { title: 'Continuer à regarder', items: D.continue.map(i => contentTile(i, true)) },
    { title: 'Recommandations', items: D.recommendations.map(i => contentTile(i, false)) }
  ];
  const rowsEl = $('rows');
  ROWS.forEach(r => {
    const sec = el('section', 'row');
    sec.appendChild(el('h2', 'row-title', r.title));
    const vp = el('div', 'row-viewport'); const tr = el('div', 'track');
    r.items.forEach(i => tr.appendChild(i));
    vp.appendChild(tr); sec.appendChild(vp); rowsEl.appendChild(sec);
    r.el = sec; r.track = tr; r.offset = 0;
  });

  /* ---------- Bannière ---------- */
  let heroItem = Object.assign({ kind: 'content' }, D.featured);
  function setAmbient(c) {
    const s = document.documentElement.style;
    s.setProperty('--c1', c[0]); s.setProperty('--c2', c[1]); s.setProperty('--c3', c[2]);
  }
  function renderHero(item, animate) {
    const apply = () => {
      const a = appById[item.source];
      $('heroSource').innerHTML = item.kind === 'app' ? '<span class="dot"></span>Application' : `<span class="dot"></span>Sur ${a.name}`;
      $('heroTitle').textContent = item.title;
      $('heroDesc').textContent = item.desc;
      $('heroTags').innerHTML = (item.tags || []).filter(Boolean).map(t => `<span class="tag">${t}</span>`).join('');
      $('heroPlayLabel').textContent = item.action || 'Regarder';
      $('heroText').classList.remove('swap');
    };
    heroItem = item; setAmbient(item.colors);
    if (!animate || prefs.reduceMotion) return apply();
    $('heroText').classList.add('swap');
    setTimeout(apply, 200);
  }
  renderHero(heroItem, false);

  /* ---------- Navigation à la télécommande ---------- */
  const NAV = [
    { items: [$('settingsBtn')] },
    { items: [$('heroPlay'), $('heroMore')] },
    ...ROWS
  ];
  const memory = NAV.map(() => 0);
  let r = 2, c = 0, focusedEl = null, heroTimer = 0;

  function focus(nr, nc, fromKey = true) {
    r = Math.max(0, Math.min(NAV.length - 1, nr));
    const items = NAV[r].items;
    c = Math.max(0, Math.min(items.length - 1, nc));
    memory[r] = c;
    const target = items[c];
    if (focusedEl) focusedEl.classList.remove('focused');
    target.classList.add('focused'); focusedEl = target;
    ROWS.forEach((row, i) => { row.el.classList.toggle('active', row === NAV[r]); row.el.classList.toggle('above', i + 2 < r); });
    if (target._item && target._item !== heroItem) {
      clearTimeout(heroTimer);
      heroTimer = setTimeout(() => renderHero(target._item, true), fromKey ? 180 : 0);
    }
    scrollTo();
  }

  function scrollTo() {
    // horizontal : la tuile reste dans la zone de sécurité
    const row = NAV[r];
    if (row.track) {
      const t = row.items[c], SAFE = 96, W = 1920;
      const left = t.offsetLeft, right = left + t.offsetWidth;
      const max = Math.max(0, row.track.scrollWidth - W);
      if (right - row.offset > W - SAFE) row.offset = right - (W - SAFE);
      if (left - row.offset < SAFE) row.offset = left - SAFE;
      row.offset = Math.max(0, Math.min(max, row.offset));
      row.track.style.transform = `translateX(${-row.offset}px)`;
    }
    // vertical : la bannière s'efface quand on descend sous la 1re rangée
    let y = 0;
    if (r > 2) {
      const scroller = $('scroller');
      y = Math.min(row.el.offsetTop - 190, scroller.scrollHeight - 1080);
    }
    $('scroller').style.transform = `translateY(${-y}px)`;
    $('hero').style.opacity = r > 2 ? 0 : 1;
    $('stage').classList.toggle('scrolled', r > 2);
  }

  function move(dir) {
    if (dir === 'left') return focus(r, c - 1);
    if (dir === 'right') return focus(r, c + 1);
    if (dir === 'up') { if (r > 0) focus(r - 1, r - 1 <= 1 ? 0 : memory[r - 1]); return; }
    if (dir === 'down') { if (r < NAV.length - 1) focus(r + 1, r + 1 <= 1 ? 0 : memory[r + 1]); }
  }

  function activate(target) {
    if (target === $('settingsBtn')) return openSettings();
    if (target === $('heroMore')) return openDetails(heroItem);
    const item = target === $('heroPlay') ? heroItem : target._item;
    if (item) launch(appById[item.source], item);
  }

  /* ---------- Lancement ---------- */
  function launch(app, item) {
    const what = item.kind === 'app' ? app.name : `${item.title} dans ${app.name}`;
    toast(`Ouverture de ${what}`);
    // Dans le lanceur Android, le pont natif ouvre l'appli installée.
    if (window.AndroidTV && typeof AndroidTV.launchApp === 'function') {
      const ok = AndroidTV.launchApp(app.package);
      if (!ok) toast(`${app.name} n'est pas installée sur cette TV`);
      return;
    }
    setTimeout(() => { location.href = app.url; }, 700);
  }

  let toastTimer = 0;
  function toast(msg) {
    const t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  /* ---------- Fiche détail ---------- */
  let layer = 'home'; // home | settings | details
  function openDetails(item) {
    $('detailsTitle').textContent = item.title; $('detailsDesc').textContent = item.desc;
    $('details').classList.add('open'); $('details').setAttribute('aria-hidden', 'false'); layer = 'details';
  }
  function closeDetails() { $('details').classList.remove('open'); $('details').setAttribute('aria-hidden', 'true'); layer = 'home'; }

  /* ---------- Paramètres ---------- */
  const SETTINGS = [
    { label: 'Ville pour la météo', value: () => `‹ ${D.cities[prefs.cityIndex].name} ›`,
      step: (d) => { prefs.cityIndex = (prefs.cityIndex + d + D.cities.length) % D.cities.length; updateWeather(); } },
    { label: 'Heure sur 24 h', toggle: 'h24', after: tick },
    { label: 'Réduire les animations', toggle: 'reduceMotion', after: applyMotion },
    { label: 'Plein écran', value: () => document.fullscreenElement ? 'Activé' : 'Désactivé',
      step: () => { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.().catch(() => toast('Plein écran indisponible dans ce navigateur')); setTimeout(renderSettings, 300); } },
    { label: "Recharger l'accueil", value: () => '', step: () => location.reload() }
  ];
  let sIdx = 0;
  function renderSettings() {
    $('settingsList').innerHTML = SETTINGS.map((s, i) => {
      const val = s.toggle ? `<span class="switch ${prefs[s.toggle] ? 'on' : ''}"></span>` : s.value();
      return `<li class="setting ${i === sIdx ? 'focused' : ''}" data-i="${i}"><span>${s.label}</span><span class="val">${val}</span></li>`;
    }).join('');
  }
  function changeSetting(d) {
    const s = SETTINGS[sIdx];
    if (s.toggle) { prefs[s.toggle] = !prefs[s.toggle]; s.after && s.after(); }
    else s.step(d);
    save('tv.prefs', prefs); renderSettings();
  }
  function openSettings() { sIdx = 0; renderSettings(); $('settings').classList.add('open'); $('settings').setAttribute('aria-hidden', 'false'); layer = 'settings'; }
  function closeSettings() { $('settings').classList.remove('open'); $('settings').setAttribute('aria-hidden', 'true'); layer = 'home'; }
  function applyMotion() { document.documentElement.classList.toggle('reduce-motion', prefs.reduceMotion); }
  applyMotion();

  /* ---------- Clavier / télécommande ---------- */
  const KEY = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    Enter: 'ok', ' ': 'ok', Select: 'ok', MediaPlayPause: 'ok',
    Escape: 'back', Backspace: 'back', BrowserBack: 'back', GoBack: 'back'
  };
  const CODE = { 37: 'left', 38: 'up', 39: 'right', 40: 'down', 13: 'ok', 23: 'ok', 4: 'back', 8: 'back', 27: 'back', 461: 'back', 10009: 'back' };
  let last = 0;
  addEventListener('keydown', (e) => {
    const k = KEY[e.key] || CODE[e.keyCode];
    if (!k) return;
    e.preventDefault();
    const now = performance.now();
    if (e.repeat && now - last < 110) return; // appui long : défilement régulier
    last = now;
    handle(k);
  });
  // exposé pour le pont Android (touche Retour de la télécommande)
  window.tvHandleKey = handle;

  function handle(k) {
    if (layer === 'details') { if (k === 'back' || k === 'ok') closeDetails(); return; }
    if (layer === 'settings') {
      if (k === 'back') return closeSettings();
      if (k === 'up') sIdx = Math.max(0, sIdx - 1);
      else if (k === 'down') sIdx = Math.min(SETTINGS.length - 1, sIdx + 1);
      else if (k === 'ok' || k === 'right') return changeSetting(1);
      else if (k === 'left') return changeSetting(-1);
      return renderSettings();
    }
    if (k === 'ok') return activate(focusedEl);
    if (k === 'back') { if (r !== 2 || c !== 0) focus(2, 0); return; }
    move(k);
  }

  /* ---------- Souris / tactile (en bonus) ---------- */
  NAV.forEach((row, ri) => row.items.forEach((it, ci) => {
    it.addEventListener('mouseenter', () => layer === 'home' && focus(ri, ci, false));
    it.addEventListener('click', (e) => { e.preventDefault(); focus(ri, ci, false); activate(it); });
    it.tabIndex = -1;
  }));
  $('settingsList').addEventListener('click', (e) => {
    const li = e.target.closest('.setting'); if (!li) return;
    sIdx = +li.dataset.i; changeSetting(1);
  });
  $('details').addEventListener('click', closeDetails);

  // focus initial sur la première appli, sans remplacer la bannière mise en avant
  focusedEl = NAV[2].items[0]; focusedEl.classList.add('focused'); ROWS[0].el.classList.add('active');
})();
