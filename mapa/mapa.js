// Map viewer: shows data/map-sanmiguel.js layer by layer, to check it against the real city before it goes into
// the game. Draws only when something changes (pan, zoom, a checkbox), and only what is on screen.
(function () {
  'use strict';
  var M = Lluvia.data.maps.sanmiguel, U = M.unit, canvas = document.getElementById('map'), ctx = canvas.getContext('2d');
  var $ = function (id) { return document.getElementById(id); };
  var KIND_COLORS = { casa: '#c98f6a', galpon: '#8f8a80', negocio: '#e0b94f', edificio: '#7fa6d9', escuela: '#6fdc6a', iglesia: '#c48bff',
    salud: '#ff7a7a', estacion: '#ff9d3d', industria: '#a0a0a0', garage: '#6f6a64', oficina: '#5fc9c9', publico: '#5fb0ff' };
  var ROOF_COLORS = { terraza: '#b8b2a6', tejas: '#b5553c', chapa: '#8fa0ad' };
  var SRC = ['OpenStreetMap', 'Google (satélite)', 'Microsoft (satélite)'], SRC_COLORS = ['#ffd23f', '#7fa6d9', '#6fdc6a'];
  var ROAD_W = { motorway: 22, trunk: 20, primary: 16, secondary: 14, tertiary: 12, residential: 10, unclassified: 10, living_street: 9, pedestrian: 6, service: 6, footway: 2, path: 2, cycleway: 2, steps: 2 };

  // Everything in meters.
  var pts = function (f) { var o = []; for (var i = 0; i + 1 < f.length; i += 2) o.push([f[i] * U, f[i + 1] * U]); return o; };
  var box = function (p) { var b = [Infinity, Infinity, -Infinity, -Infinity]; p.forEach(function (q) { b[0] = Math.min(b[0], q[0]); b[1] = Math.min(b[1], q[1]); b[2] = Math.max(b[2], q[0]); b[3] = Math.max(b[3], q[1]); }); return b; };
  var buildings = M.buildings.map(function (r, i) {
    var p = pts(r[0]);
    return { i: i, p: p, b: box(p), kind: M.kinds[r[1]], floors: r[2], roof: M.roofs[r[3]], basement: r[4], est: r[5], src: r[6], place: r[7] };
  });
  var roads = M.roads.map(function (r) { var p = pts(r[2]); return { kind: r[0], name: r[1], p: p, b: box(p) }; });
  var parks = M.parks.map(function (r) { var p = pts(r[2]); return { kind: r[0], name: r[1], p: p, b: box(p) }; });
  var land = M.landuse.map(function (r) { var p = pts(r[2]); return { cls: r[0], p: p, b: box(p) }; });
  var water = M.water.map(function (r) { var p = pts(r[2]); return { cls: r[0], name: r[1], p: p, b: box(p) }; });
  var rail = M.rail.map(function (r) { var p = pts(r[2]); return { p: p, b: box(p) }; });
  var places = M.places.map(function (r) { return { name: r[0], cat: r[1], x: r[2] * U, y: r[3] * U, b: r[4] }; });

  // Chunks of 100 m for buildings, so a frame only looks at what is on screen.
  var CH = 100, cols = Math.ceil(M.meters / CH), chunks = [];
  buildings.forEach(function (bd) {
    for (var cy = Math.max(0, Math.floor(bd.b[1] / CH)); cy <= Math.min(cols - 1, Math.floor(bd.b[3] / CH)); cy++)
      for (var cx = Math.max(0, Math.floor(bd.b[0] / CH)); cx <= Math.min(cols - 1, Math.floor(bd.b[2] / CH)); cx++)
        (chunks[cy * cols + cx] = chunks[cy * cols + cx] || []).push(bd);
  });

  // Terrain image: heights → colors (low green, high ochre) with hillshade (light from the north-west).
  var T = M.terrain, N = T.n, zmin = Infinity, zmax = -Infinity;
  T.dm.forEach(function (v) { zmin = Math.min(zmin, v); zmax = Math.max(zmax, v); });
  var RES = 600, timg = document.createElement('canvas'); timg.width = timg.height = RES;
  (function () {
    var tc = timg.getContext('2d'), img = tc.createImageData(RES, RES);
    var zAt = function (x, y) { // bilinear, in decimeters; x, y in grid units
      x = Math.max(0, Math.min(N - 1.001, x)); y = Math.max(0, Math.min(N - 1.001, y));
      var i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, a = T.dm[j * N + i], b = T.dm[j * N + i + 1], c = T.dm[(j + 1) * N + i], d = T.dm[(j + 1) * N + i + 1];
      return a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy;
    };
    for (var y = 0; y < RES; y++) for (var x = 0; x < RES; x++) {
      var gx = x / RES * N - 0.5, gy = y / RES * N - 0.5, z = zAt(gx, gy), t = (z - zmin) / (zmax - zmin || 1);
      var dzx = (zAt(gx + 0.3, gy) - zAt(gx - 0.3, gy)) / 10, dzy = (zAt(gx, gy + 0.3) - zAt(gx, gy - 0.3)) / 10;
      var shade = Math.max(0.6, Math.min(1, 1 - (dzx + dzy) * 0.3)) * (0.88 + t * 0.12);
      var r = 255 * shade, g = 255 * shade, b = 250 * shade, k = (y * RES + x) * 4;
      // Contour lines every 2 m.
      var band = Math.floor(z / 20), bandR = Math.floor(zAt(gx + N / RES, gy) / 20), bandD = Math.floor(zAt(gx, gy + N / RES) / 20);
      if (band !== bandR || band !== bandD) { r *= 0.86; g *= 0.86; b *= 0.86; }
      img.data[k] = r; img.data[k + 1] = g; img.data[k + 2] = b; img.data[k + 3] = 255;
    }
    tc.putImageData(img, 0, 0);
  })();
  var heightAt = function (x, y) { // meters above sea level at a map point
    var gx = Math.max(0, Math.min(N - 1, Math.floor(x / T.step))), gy = Math.max(0, Math.min(N - 1, Math.floor(y / T.step)));
    return T.dm[gy * N + gx] / 10;
  };

  // ---- View ----
  var view = { x: M.start[0] * U, y: M.start[1] * U, z: 2 }; // z = pixels per meter
  var level = 0, selected = null, dirty = true;
  var opt = function (id) { return $(id).checked; };
  function resize() { canvas.width = innerWidth * devicePixelRatio; canvas.height = innerHeight * devicePixelRatio; dirty = true; }
  addEventListener('resize', resize); resize();
  function toScreen(x, y) { return [(x - view.x) * view.z * devicePixelRatio + canvas.width / 2, (y - view.y) * view.z * devicePixelRatio + canvas.height / 2]; }
  function toMap(sx, sy) { return [(sx * devicePixelRatio - canvas.width / 2) / (view.z * devicePixelRatio) + view.x, (sy * devicePixelRatio - canvas.height / 2) / (view.z * devicePixelRatio) + view.y]; }

  function path(p, close) { ctx.beginPath(); p.forEach(function (q, i) { if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); if (close) ctx.closePath(); }
  function buildingColor(bd) {
    var by = $('colorBy').value;
    if (by === 'floors') { var t = Math.min(1, (bd.floors - 1) / 9); return 'rgb(' + Math.round(200 - t * 140) + ',' + Math.round(170 - t * 60) + ',' + Math.round(120 + t * 120) + ')'; }
    if (by === 'roof') return ROOF_COLORS[bd.roof];
    if (by === 'src') return SRC_COLORS[bd.src];
    return KIND_COLORS[bd.kind] || '#999';
  }
  // Does this building have the level being looked at? -1 basement, 0 ground floor, n floors up, top = the roof.
  function hasLevel(bd) {
    if (level === 0) return true;
    if (level < 0) return bd.basement;
    return bd.floors > level || (bd.floors === level && bd.roof === 'terraza');
  }

  function draw() {
    dirty = false;
    var W = canvas.width, H = canvas.height, s = view.z * devicePixelRatio;
    var tl = toMap(0, 0), br = toMap(innerWidth, innerHeight), vb = [tl[0], tl[1], br[0], br[1]];
    var on = function (b, pad) { return b[2] + pad > vb[0] && b[0] - pad < vb[2] && b[3] + pad > vb[1] && b[1] - pad < vb[3]; };
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0b0c10'; ctx.fillRect(0, 0, W, H);
    ctx.setTransform(s, 0, 0, s, W / 2 - view.x * s, H / 2 - view.y * s);
    var colorBy = $('colorBy').value;
    var shown = Lluvia.mapdraw.draw(ctx, M, {
      view: vb, scale: s, terrain: opt('lTerrain') ? timg : null, buildings: opt('lBuildings'),
      color: colorBy === 'real' ? null : buildingColor, dim: function (bd) { return !hasLevel(bd); }
    });
    if (selected) { ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 3 / s; path(selected.p, true); ctx.stroke(); }
    if (opt('lPlaces') && s > 1.5) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.font = Math.round(11 * devicePixelRatio) + 'px system-ui'; ctx.textAlign = 'center';
      places.forEach(function (p) {
        if (p.x < vb[0] || p.x > vb[2] || p.y < vb[1] || p.y > vb[3]) return;
        var q = toScreen(p.x, p.y);
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillText(p.name, q[0] + 1, q[1] + 1);
        ctx.fillStyle = '#fff3c4'; ctx.fillText(p.name, q[0], q[1]);
      });
    }
    var c = toMap(innerWidth / 2, innerHeight / 2);
    $('status').textContent = 'Altura del terreno acá: ' + heightAt(c[0], c[1]).toFixed(1) + ' m · zoom ' + view.z.toFixed(2) + ' px/m · ' +
      (opt('lBuildings') ? shown + ' edificios con este nivel en pantalla' : '');
  }

  // ---- Legend ----
  function legend() {
    var by = $('colorBy').value, html = '<b>Edificios</b>';
    var add = function (c, t) { html += '<div><i style="background:' + c + '"></i>' + t + '</div>'; };
    if (by === 'kind') {
      var counts = {}; buildings.forEach(function (bd) { counts[bd.kind] = (counts[bd.kind] || 0) + 1; });
      Object.keys(KIND_COLORS).forEach(function (k) { if (counts[k]) add(KIND_COLORS[k], k + ' (' + counts[k] + ')'); });
    } else if (by === 'floors') { [1, 2, 4, 7, 10].forEach(function (f) { add(buildingColor({ floors: f }), f + (f === 10 ? '+ pisos' : f === 1 ? ' piso' : ' pisos')); }); }
    else if (by === 'roof' || by === 'real') Object.keys(ROOF_COLORS).forEach(function (k) { add(ROOF_COLORS[k], 'techo de ' + k); });
    else SRC.forEach(function (n, i) { add(SRC_COLORS[i], n); });
    html += '<div style="margin-top:6px;color:#9a9db0">Terreno: ' + (zmin / 10).toFixed(0) + ' a ' + (zmax / 10).toFixed(0) + ' m, curvas cada 2 m</div>';
    html += '<div style="margin-top:8px;color:#7d8090;font-size:11px;display:block">Datos: © OpenStreetMap (ODbL), Overture Maps (ODbL), Google Open Buildings (CC BY 4.0), Microsoft (ODbL), SRTM/NASA.</div>';
    $('legend').innerHTML = html;
  }

  // ---- Info on click ----
  function inside(p, x, y) { var c = false; for (var i = 0, j = p.length - 1; i < p.length; j = i++) { if ((p[i][1] > y) !== (p[j][1] > y) && x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) c = !c; } return c; }
  function area(p) { var s = 0; for (var i = 0, j = p.length - 1; i < p.length; j = i++) s += (p[j][0] + p[i][0]) * (p[j][1] - p[i][1]); return Math.abs(s / 2); }
  function pick(x, y) {
    var cands = chunks[Math.floor(y / CH) * cols + Math.floor(x / CH)] || [];
    for (var i = 0; i < cands.length; i++) if (inside(cands[i].p, x, y)) return cands[i];
    return null;
  }
  function info(bd) {
    selected = bd; dirty = true;
    if (!bd) { $('info').style.display = 'none'; return; }
    var pl = bd.place >= 0 ? places[bd.place] : null, cx = (bd.b[0] + bd.b[2]) / 2, cy = (bd.b[1] + bd.b[3]) / 2;
    var rows = [['Tipo', bd.kind], ['Pisos', bd.floors + (bd.est ? ' (estimado)' : '')], ['Techo', bd.roof + (bd.roof === 'terraza' ? ' (se puede subir)' : '')],
      ['Sótano', bd.basement ? 'sí' : 'no'], ['Superficie', Math.round(area(bd.p)) + ' m²'], ['Altura del terreno', heightAt(cx, cy).toFixed(1) + ' m'], ['Dato de', SRC[bd.src]]];
    if (pl) rows.unshift(['Lugar', pl.name + ' (' + pl.cat.replace(/_/g, ' ') + ')']);
    $('info').innerHTML = '<h2>' + (pl ? pl.name : 'Edificio ' + bd.i) + '</h2><dl>' + rows.map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>'; }).join('') + '</dl>';
    $('info').style.display = 'block';
  }

  // ---- Input ----
  var drag = null;
  canvas.addEventListener('mousedown', function (e) { drag = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, moved: false }; canvas.classList.add('drag'); });
  addEventListener('mousemove', function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
    view.x = drag.vx - dx / view.z; view.y = drag.vy - dy / view.z; dirty = true;
  });
  addEventListener('mouseup', function (e) {
    if (drag && !drag.moved) { var m = toMap(e.clientX, e.clientY); info(pick(m[0], m[1])); }
    drag = null; canvas.classList.remove('drag');
  });
  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    var before = toMap(e.clientX, e.clientY);
    view.z = Math.max(0.12, Math.min(12, view.z * (e.deltaY < 0 ? 1.2 : 1 / 1.2)));
    var after = toMap(e.clientX, e.clientY);
    view.x += before[0] - after[0]; view.y += before[1] - after[1]; dirty = true;
  }, { passive: false });
  ['lTerrain', 'lBuildings', 'lPlaces'].forEach(function (id) { $(id).addEventListener('change', function () { dirty = true; }); });
  $('colorBy').addEventListener('change', function () { legend(); dirty = true; });
  $('levelRange').addEventListener('input', function () {
    level = +this.value;
    $('level').textContent = level < 0 ? 'sótano' : level === 0 ? 'planta baja' : 'piso ' + level + ' (o terraza)';
    dirty = true;
  });

  legend();
  (function loop() { if (dirty) draw(); requestAnimationFrame(loop); })();
  window.mapView = view; // handy for checking from the console
})();
