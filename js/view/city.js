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

  // Blocks are walls (dark rooftops); streets, plazas and parks on top. Only what is on screen is drawn.
  L.drawCity = function (ctx, city, camX, camY, W, H, t) {
    if (!city._boxes) {
      city.roads.forEach(function (r) { r.box = bboxOf(r.pts); });
      city.parks.forEach(function (p) { p.box = bboxOf(p.pts); });
      city._bld = city.buildings.map(function (b) { return { pts: b, box: bboxOf(b) }; });
      city._boxes = true;
    }
    var x0 = camX - 40, y0 = camY - 40, x1 = camX + W + 40, y1 = camY + H + 40;
    var on = function (b, pad) { return b[2] + pad > x0 && b[0] - pad < x1 && b[3] + pad > y0 && b[1] - pad < y1; };
    ctx.fillStyle = '#0b0c10';
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    ctx.fillStyle = '#2b2622';
    ctx.fillRect(Math.max(0, x0), Math.max(0, y0), Math.min(city.size, x1) - Math.max(0, x0), Math.min(city.size, y1) - Math.max(0, y0));
    // Sidewalks (a wider, lighter stroke) and then the asphalt.
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    city.roads.forEach(function (r) {
      if (!on(r.box, r.w)) return;
      ctx.strokeStyle = '#5b574f'; ctx.lineWidth = r.w + 5 * L.data.city.scale; path(ctx, r.pts); ctx.stroke();
    });
    city.parks.forEach(function (p) {
      if (!on(p.box, 0)) return;
      ctx.fillStyle = p.kind === 'square' || p.kind === 'plaza' || p.kind === 'pedestrian' ? '#6a6458' : '#2f5a2c';
      path(ctx, p.pts, true); ctx.fill();
    });
    city.roads.forEach(function (r) {
      if (!on(r.box, r.w)) return;
      ctx.strokeStyle = ROAD[r.kind] || '#3a3d45'; ctx.lineWidth = r.w; path(ctx, r.pts); ctx.stroke();
      if (r.w >= 12 * L.data.city.scale) { // center line on the big avenues
        ctx.strokeStyle = 'rgba(255,214,90,0.35)'; ctx.lineWidth = 3; ctx.setLineDash([30, 30]); path(ctx, r.pts); ctx.stroke(); ctx.setLineDash([]);
      }
    });
    // Buildings: rooftops a little lighter than the block, with an edge.
    ctx.lineWidth = 1.5; ctx.strokeStyle = '#1a1714';
    city._bld.forEach(function (b) {
      if (!on(b.box, 0)) return;
      ctx.fillStyle = '#3a332c'; path(ctx, b.pts, true); ctx.fill(); ctx.stroke();
    });
    // The yellow sun's glare over everything.
    ctx.fillStyle = 'rgba(255,214,60,' + (0.05 + Math.sin(t * 0.4) * 0.015) + ')';
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
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
