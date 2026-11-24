// The city in the browser: drawing it, picking where you start on a world map, and downloading the streets.
(function (L) {
  'use strict';

  // ---- Drawing ----
  var ROAD = { motorway: '#4a4d57', trunk: '#4a4d57', primary: '#454852', secondary: '#42454e', tertiary: '#3f424b' };

  function bboxOf(pts) {
    var b = [Infinity, Infinity, -Infinity, -Infinity];
    pts.forEach(function (p) { b[0] = Math.min(b[0], p[0]); b[1] = Math.min(b[1], p[1]); b[2] = Math.max(b[2], p[0]); b[3] = Math.max(b[3], p[1]); });
    return b;
  }

  function path(ctx, pts, close) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    if (close) ctx.closePath();
  }

  var ROOFS = ['#8c4b3a', '#7a6a58', '#5f6670', '#9a7b55', '#6b4f45', '#56604f', '#8a8a80', '#a0603f'];
  var SHOPS = ['#c9b79c', '#b8c2c9', '#d1c3a6'];
  var CARS = ['#b03a3a', '#e6e6e6', '#2f3b52', '#3d3d3d', '#c9a227', '#4f6f8f', '#8a8f96'];

  function poly(ctx, pts) {
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
  }

  // Yards, plazas, sidewalks with their curb, asphalt; then parked cars, buildings with their shadow, and trees.
  // Only what is on screen is drawn: roads by their box, the rest by chunks (js/city.js).
  L.drawCity = function (ctx, city, camX, camY, W, H, t) {
    var s = L.data.city.scale;
    if (!city._boxes) {
      city.roads.forEach(function (r) { r.box = bboxOf(r.pts); });
      city.parks.forEach(function (p) { p.box = bboxOf(p.pts); });
      city._boxes = true;
    }
    var x0 = camX - 60, y0 = camY - 60, x1 = camX + W + 60, y1 = camY + H + 60;
    var on = function (b, pad) { return b[2] + pad > x0 && b[0] - pad < x1 && b[3] + pad > y0 && b[1] - pad < y1; };
    ctx.fillStyle = '#0b0c10';
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    ctx.fillStyle = '#3c4630'; // back yards: grass and dirt
    ctx.fillRect(Math.max(0, x0), Math.max(0, y0), Math.min(city.size, x1) - Math.max(0, x0), Math.min(city.size, y1) - Math.max(0, y0));
    city.parks.forEach(function (p) {
      if (!on(p.box, 0)) return;
      var paved = p.kind === 'square' || p.kind === 'plaza' || p.kind === 'pedestrian';
      ctx.fillStyle = paved ? '#77736a' : '#335e2e'; path(ctx, p.pts, true); ctx.fill();
    });
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    var visible = city.roads.filter(function (r) { return on(r.box, r.w + 8 * s); });
    var sw = L.data.city.lots.sidewalk * s;
    visible.forEach(function (r) { ctx.strokeStyle = '#8c8980'; ctx.lineWidth = r.w + sw * 2; path(ctx, r.pts); ctx.stroke(); });   // sidewalk
    visible.forEach(function (r) { ctx.strokeStyle = '#5d5b55'; ctx.lineWidth = r.w + 0.5 * s; path(ctx, r.pts); ctx.stroke(); }); // curb
    visible.forEach(function (r) { ctx.strokeStyle = ROAD[r.kind] || '#3a3c42'; ctx.lineWidth = r.w; path(ctx, r.pts); ctx.stroke(); });
    ctx.setLineDash([3 * s, 3 * s]); ctx.lineWidth = 0.25 * s; ctx.strokeStyle = 'rgba(240,230,200,0.45)';
    visible.forEach(function (r) { if (r.w >= 12 * s) { path(ctx, r.pts); ctx.stroke(); } });
    ctx.setLineDash([]);
    // Chunks on screen.
    var S = L.data.city.chunk, cols = city.chunkCols, seen = [];
    if (city.chunks) {
      for (var cy = Math.max(0, Math.floor(y0 / S)); cy <= Math.min(cols - 1, Math.floor(y1 / S)); cy++) {
        for (var cx = Math.max(0, Math.floor(x0 / S)); cx <= Math.min(cols - 1, Math.floor(x1 / S)); cx++) {
          var c = city.chunks[cy * cols + cx];
          if (c) seen.push(c);
        }
      }
    }
    var drawn = new Set();
    var each = function (kind, fn) { seen.forEach(function (c) { c[kind].forEach(function (it) { if (!drawn.has(it)) { drawn.add(it); fn(it); } }); }); };
    // Parked cars: body, roof and windshields.
    each('cars', function (c) {
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.ang);
      var hl = L.data.city.cars.length * s / 2, hw = L.data.city.cars.width * s / 2;
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-hl + 3, -hw + 4, hl * 2, hw * 2);
      ctx.fillStyle = CARS[c.color]; ctx.fillRect(-hl, -hw, hl * 2, hw * 2);
      ctx.fillStyle = 'rgba(20,28,36,0.85)'; ctx.fillRect(-hl * 0.45, -hw * 0.8, hl * 1.05, hw * 1.6);
      ctx.fillStyle = CARS[c.color]; ctx.fillRect(-hl * 0.25, -hw * 0.8, hl * 0.6, hw * 1.6);
      ctx.restore();
    });
    // Buildings: a shadow to the south-east, the roof, its edge, and a ridge on houses.
    var sh = 1.2 * s;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    each('houses', function (h) { ctx.save(); ctx.translate(sh, sh); poly(ctx, h.pts); ctx.fill(); ctx.restore(); });
    each('buildings', function (b) { ctx.save(); ctx.translate(sh * 1.6, sh * 1.6); poly(ctx, b); ctx.fill(); ctx.restore(); });
    drawn.clear();
    ctx.lineWidth = 2; ctx.strokeStyle = '#1d1a17';
    each('buildings', function (b) { ctx.fillStyle = ROOFS[Math.abs(Math.floor(b[0][0] * 7 + b[0][1] * 3)) % ROOFS.length]; poly(ctx, b); ctx.fill(); ctx.stroke(); });
    each('houses', function (h) {
      ctx.fillStyle = h.shop ? SHOPS[h.roof % 3] : ROOFS[h.roof]; poly(ctx, h.pts); ctx.fill(); ctx.stroke();
      if (!h.shop) {
        ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(h.ridge[0], h.ridge[1]); ctx.lineTo(h.ridge[2], h.ridge[3]); ctx.stroke();
        ctx.lineWidth = 2; ctx.strokeStyle = '#1d1a17';
      }
    });
    // Trees over the sidewalk.
    each('trees', function (tr) {
      circle(ctx, tr.x + 0.6 * s, tr.y + 0.8 * s, tr.r, 'rgba(0,0,0,0.3)');
      circle(ctx, tr.x, tr.y, tr.r, tr.shade < 0.5 ? '#2f5527' : '#3a6a2c');
      circle(ctx, tr.x - tr.r * 0.3, tr.y - tr.r * 0.3, tr.r * 0.45, 'rgba(140,190,90,0.35)');
    });
    // The yellow sun's glare over everything.
    ctx.fillStyle = 'rgba(255,214,60,' + (0.05 + Math.sin(t * 0.4) * 0.015) + ')';
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  };

  function circle(ctx, x, y, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }

  // Minimap (top right): the streets around you, plazas, you in the middle and the zombies close by, plus the
  // name of the street you are on. `range` is how many pixels of city fit from the center to the edge.
  L.drawMinimap = function (ctx, g, W) {
    var city = g.city, p = g.player, size = 190, range = 2600, k = size / 2 / range, x0 = W - size - 14, y0 = 72;
    if (!city._boxes) return;
    ctx.save();
    ctx.globalAlpha = 0.88;
    ctx.fillStyle = '#1b1f17'; ctx.fillRect(x0, y0, size, size);
    ctx.beginPath(); ctx.rect(x0, y0, size, size); ctx.clip();
    var mx = function (x) { return x0 + size / 2 + (x - p.x) * k; }, my = function (y) { return y0 + size / 2 + (y - p.y) * k; };
    var near = function (b) { return b[2] > p.x - range && b[0] < p.x + range && b[3] > p.y - range && b[1] < p.y + range; };
    city.parks.forEach(function (pk) {
      if (!near(pk.box)) return;
      ctx.fillStyle = '#2f5a2a'; ctx.beginPath();
      pk.pts.forEach(function (q, i) { if (i) ctx.lineTo(mx(q[0]), my(q[1])); else ctx.moveTo(mx(q[0]), my(q[1])); });
      ctx.fill();
    });
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    city.roads.forEach(function (r) {
      if (!near(r.box)) return;
      ctx.strokeStyle = r.w >= 12 * L.data.city.scale ? '#c9c2a8' : '#8a877d'; ctx.lineWidth = Math.max(1.5, r.w * k * 1.6);
      ctx.beginPath();
      r.pts.forEach(function (q, i) { if (i) ctx.lineTo(mx(q[0]), my(q[1])); else ctx.moveTo(mx(q[0]), my(q[1])); });
      ctx.stroke();
    });
    ctx.fillStyle = '#ff5a5a';
    g.enemies.forEach(function (e) {
      var ex = mx(e.x), ey = my(e.y);
      if (ex > x0 && ex < x0 + size && ey > y0 && ey < y0 + size) ctx.fillRect(ex - 1.5, ey - 1.5, e.type.boss ? 6 : 3, e.type.boss ? 6 : 3);
    });
    ctx.fillStyle = '#ffd27a';
    g.chests.forEach(function (c) { var cx = mx(c.x), cy = my(c.y); ctx.fillRect(cx - 2.5, cy - 2.5, 5, 5); });
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x0 + size / 2, y0 + size / 2, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,233,168,0.6)'; ctx.lineWidth = 2; ctx.strokeRect(x0, y0, size, size);
    // The street you are on (checked a few times per second: it walks the nearby streets).
    if (!g._streetT || g.time - g._streetT > 0.5) { g._streetT = g.time; g._street = L.cityStreetAt(city, p.x, p.y); }
    ctx.textAlign = 'center'; ctx.font = '700 14px system-ui, sans-serif'; ctx.fillStyle = '#ffe9a8';
    ctx.fillText(g._street || (city.name || ''), x0 + size / 2, y0 + size + 20);
  };

  // Street names under you, for the HUD.
  L.cityStreetAt = function (city, x, y) {
    var best = null, bd = 200 * 200;
    city.roads.forEach(function (r) {
      if (!r.name || !r.box || x < r.box[0] - 200 || x > r.box[2] + 200 || y < r.box[1] - 200 || y > r.box[3] + 200) return;
      for (var i = 1; i < r.pts.length; i++) {
        var a = r.pts[i - 1], b = r.pts[i], dx = b[0] - a[0], dy = b[1] - a[1], len2 = dx * dx + dy * dy || 1;
        var k = L.clamp(((x - a[0]) * dx + (y - a[1]) * dy) / len2, 0, 1), qx = a[0] + dx * k - x, qy = a[1] + dy * k - y;
        if (qx * qx + qy * qy < bd) { bd = qx * qx + qy * qy; best = r.name; }
      }
    });
    return best;
  };

  // ---- Downloading ----
  // Overpass servers, tried in order. Free and without an account; we ask little and only when you press play.
  var SERVERS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];

  // Tries the servers from i up to `last`, each for `wait` ms.
  function ask(query, i, last, wait, done) {
    if (i > last) { done(null); return; }
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, wait);
    fetch(SERVERS[i], { method: 'POST', body: 'data=' + encodeURIComponent(query), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (json) { clearTimeout(timer); done(json); })
      .catch(function () { clearTimeout(timer); ask(query, i + 1, last, wait, done); });
  }

  // Calls done(city, message). The city is invented if the streets can't be downloaded.
  L.loadCity = function (place, seed, done) {
    if (!place) { done(L.cityProcedural(seed), null); return; }
    ask(L.cityQuery(place.lat, place.lon, 'streets'), 0, SERVERS.length - 1, 25000, function (streets) {
      var city = streets && L.cityFromOSM(streets, place.lat, place.lon, place.name);
      if (!city) { done(L.cityProcedural(seed), 'No se pudieron bajar las calles de ese lugar: jugás en una ciudad inventada.'); return; }
      // Buildings are only drawn: if they don't come, play without them.
      // Buildings are only drawn: one server, a short wait, and if they don't come, play without them.
      ask(L.cityQuery(place.lat, place.lon, 'buildings'), 0, 0, 12000, function (b) {
        if (b) {
          var extra = L.cityFromOSM({ elements: (streets.elements || []).concat(b.elements || []) }, place.lat, place.lon, place.name);
          if (extra) city = extra;
        }
        done(city, null);
      });
    });
  };

  // ---- Picking the place ----
  L.data.places = [
    { name: 'Plaza de San Miguel, Buenos Aires', lat: -34.5430, lon: -58.7125 },
    { name: 'Obelisco, Buenos Aires', lat: -34.6037, lon: -58.3816 },
    { name: 'Plaza San Martín, Córdoba', lat: -31.4166, lon: -64.1838 },
    { name: 'Monumento a la Bandera, Rosario', lat: -32.9477, lon: -60.6305 },
    { name: 'Plaza Independencia, Mendoza', lat: -32.8895, lon: -68.8458 },
    { name: 'Plaza Independencia, Montevideo', lat: -34.9068, lon: -56.1994 },
    { name: 'Zócalo, Ciudad de México', lat: 19.4326, lon: -99.1332 },
    { name: 'Puerta del Sol, Madrid', lat: 40.4169, lon: -3.7035 }
  ];

  var LEAFLET = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
  function loadLeaflet(done) {
    if (window.L_leaflet) { done(window.L_leaflet); return; }
    var s = document.createElement('script');
    s.src = LEAFLET;
    s.onload = function () { window.L_leaflet = window.L; done(window.L); };
    s.onerror = function () { done(null); };
    document.head.appendChild(s);
  }

  function lastPlace() { try { return JSON.parse(localStorage.getItem('lluvia.place') || 'null'); } catch (e) { return null; } }
  function savePlace(p) { try { localStorage.setItem('lluvia.place', JSON.stringify(p)); } catch (e) { /* not saved */ } }

  // onPick(place or null for an invented city).
  L.ui.mapPick = function (onPick, onBack) {
    var ov = document.getElementById('overlay');
    var chosen = lastPlace() || L.data.places[0];
    ov.innerHTML = '';
    ov.classList.remove('hidden');
    var box = document.createElement('div'); box.className = 'panel mappick';
    box.innerHTML = '<h2>¿Dónde te agarró el Sol Amarillo?</h2><p class="tagline">Tocá el mapa para elegir dónde arrancás. Se juega en las calles de verdad de ese lugar.</p>';
    var map = document.createElement('div'); map.className = 'worldmap'; map.textContent = 'Cargando el mapa...';
    var label = document.createElement('p'); label.className = 'hint';
    var setLabel = function () { label.textContent = 'Arrancás en: ' + (chosen.name || (chosen.lat.toFixed(4) + ', ' + chosen.lon.toFixed(4))); };
    setLabel();
    var list = document.createElement('div'); list.className = 'places';
    var marker = null, lmap = null;
    var choose = function (p) { chosen = p; setLabel(); if (lmap) { lmap.setView([p.lat, p.lon], 15); if (marker) marker.setLatLng([p.lat, p.lon]); } };
    L.data.places.forEach(function (p) {
      var b = document.createElement('button'); b.className = 'btn ghost small'; b.textContent = p.name;
      b.onclick = function () { choose(p); }; list.appendChild(b);
    });
    if (navigator.geolocation) {
      var here = document.createElement('button'); here.className = 'btn ghost small'; here.textContent = '📍 Donde estoy';
      here.onclick = function () {
        navigator.geolocation.getCurrentPosition(function (pos) { choose({ name: 'Donde estás', lat: pos.coords.latitude, lon: pos.coords.longitude }); },
          function () { label.textContent = 'No se pudo saber dónde estás: elegí en el mapa.'; });
      };
      list.appendChild(here);
    }
    var row = document.createElement('div'); row.className = 'row';
    var go = document.createElement('button'); go.className = 'btn'; go.textContent = 'Jugar acá';
    go.onclick = function () { savePlace(chosen); onPick(chosen); };
    var inv = document.createElement('button'); inv.className = 'btn ghost'; inv.textContent = 'Ciudad inventada';
    inv.onclick = function () { onPick(null); };
    row.appendChild(go); row.appendChild(inv);
    if (onBack) { var back = document.createElement('button'); back.className = 'btn ghost'; back.textContent = 'Volver'; back.onclick = onBack; row.appendChild(back); }
    [map, label, list, row].forEach(function (n) { box.appendChild(n); });
    ov.appendChild(box);
    L.ui.current = 'mappick';
    var gaveUp = false;
    var slow = setTimeout(function () { gaveUp = true; map.textContent = 'El mapa no cargó: elegí uno de los lugares de abajo.'; }, 8000);
    loadLeaflet(function (LF) {
      clearTimeout(slow);
      if (gaveUp && LF && map.isConnected) gaveUp = false; // it came late: show it anyway
      if (!LF || !map.isConnected) { map.textContent = 'El mapa no cargó: elegí uno de los lugares de abajo.'; return; }
      map.textContent = '';
      lmap = LF.map(map, { zoomControl: true, attributionControl: true }).setView([chosen.lat, chosen.lon], 15);
      LF.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(lmap);
      marker = LF.circleMarker([chosen.lat, chosen.lon], { radius: 9, color: '#ffd23f', fillColor: '#ffd23f', fillOpacity: 0.7 }).addTo(lmap);
      lmap.on('click', function (e) { choose({ name: '', lat: e.latlng.lat, lon: e.latlng.lng }); });
    });
  };

  L.ui.loading = function (text) {
    var ov = document.getElementById('overlay');
    ov.innerHTML = '<div class="panel"><h2>' + text + '</h2><p class="tagline">Esto tarda unos segundos la primera vez.</p></div>';
    ov.classList.remove('hidden');
    L.ui.current = 'loading';
  };
})(this.Lluvia = this.Lluvia || {});
