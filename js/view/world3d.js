// The 3D view (a trial, the user's answer a, 2026-11-27: "pasar el juego a 3D"): V turns it on and off. The game is
// the same (js/ doesn't change); this draws it with three.js (lib/three.min.js) instead of the 2D canvas, which then
// draws only the HUD on top. Meters in 3D: x = px / scale, z = py / scale, y up. The city around you (buildings with
// their real floors, streets, plazas) is built in one piece and rebuilt when you walk far; the house you are in is
// drawn inside (walls, furniture, doors) on your floor; people and zombies are simple figures.
(function (L) {
  'use strict';

  var V = L.view3d = { on: false, dist: 26, tilt: 58 };
  var T = null, R = null, scene, cam, cv, sun, hemi, flash, ground, cityMesh = null, cityAt = null, houseMesh = null, houseKey = '';
  var bgrid = null, figures = new Map(), seen = new Set();
  var FLOOR = 3; // meters per floor

  function init() {
    if (R) return true;
    T = window.THREE;
    if (!T) return false;
    cv = document.createElement('canvas'); cv.id = 'world3d';
    document.body.insertBefore(cv, document.getElementById('game'));
    R = new T.WebGLRenderer({ canvas: cv, antialias: true });
    R.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    scene = new T.Scene();
    scene.background = new T.Color(0x14161c);
    scene.fog = new T.Fog(0x14161c, 45, 160);
    cam = new T.PerspectiveCamera(50, 1, 0.5, 500);
    hemi = new T.HemisphereLight(0xdfe6ee, 0x3a3428, 0.6); scene.add(hemi);
    sun = new T.DirectionalLight(0xfff1d8, 0.8); scene.add(sun); scene.add(sun.target);
    flash = new T.SpotLight(0xfff3d0, 0, 32, 0.42, 0.45, 1.3); scene.add(flash); scene.add(flash.target);
    ground = new T.Mesh(new T.PlaneGeometry(4000, 4000), new T.MeshLambertMaterial({ color: 0x3b4a2e }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; scene.add(ground);
    addEventListener('wheel', function (ev) { if (V.on && !L.ui.current) V.dist = Math.max(10, Math.min(70, V.dist * (ev.deltaY < 0 ? 0.9 : 1.1))); });
    return true;
  }

  V.toggle = function () {
    if (!init()) { L.ui.flash && L.ui.flash('No se pudo cargar el 3D.'); return false; }
    V.on = !V.on;
    cv.style.display = V.on ? 'block' : 'none';
    if (L.ui.flash) L.ui.flash(V.on ? 'Vista 3D (V para volver al 2D) · rueda: acercar' : 'Vista 2D');
    return V.on;
  };

  // ---- Building one piece of geometry from many shapes ----
  function Builder() { this.p = []; this.c = []; }
  Builder.prototype.tri = function (a, b, c, col) {
    this.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    for (var i = 0; i < 3; i++) this.c.push(col.r, col.g, col.b);
  };
  Builder.prototype.quad = function (a, b, c, d, col) { this.tri(a, b, c, col); this.tri(a, c, d, col); };
  // A box from (x0, z0) to (x1, z1) along a segment, `w` thick, from height y0 to y1.
  Builder.prototype.wall = function (x0, z0, x1, z1, w, y0, y1, col) {
    var dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz) || 1, nx = -dz / l * w / 2, nz = dx / l * w / 2;
    var a = [x0 + nx, z0 + nz], b = [x1 + nx, z1 + nz], c = [x1 - nx, z1 - nz], d = [x0 - nx, z0 - nz];
    var P = function (q, y) { return [q[0], y, q[1]]; };
    this.quad(P(a, y0), P(b, y0), P(b, y1), P(a, y1), col);
    this.quad(P(c, y0), P(d, y0), P(d, y1), P(c, y1), col);
    this.quad(P(b, y0), P(c, y0), P(c, y1), P(b, y1), col);
    this.quad(P(d, y0), P(a, y0), P(a, y1), P(d, y1), col);
    this.quad(P(a, y1), P(b, y1), P(c, y1), P(d, y1), col);
  };
  // A flat polygon ([[x, z], ...]) at height y.
  Builder.prototype.flat = function (pts, y, col) {
    if (pts.length < 3) return;
    var v = pts.map(function (q) { return new T.Vector2(q[0], q[1]); });
    if (T.ShapeUtils.isClockWise(v)) { v.reverse(); pts = pts.slice().reverse(); }
    var tris = T.ShapeUtils.triangulateShape(v, []), self = this;
    tris.forEach(function (t) { self.tri([pts[t[0]][0], y, pts[t[0]][1]], [pts[t[2]][0], y, pts[t[2]][1]], [pts[t[1]][0], y, pts[t[1]][1]], col); });
  };
  Builder.prototype.mesh = function () {
    var geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(this.p, 3));
    geo.setAttribute('color', new T.Float32BufferAttribute(this.c, 3));
    geo.computeVertexNormals();
    return new T.Mesh(geo, new T.MeshLambertMaterial({ vertexColors: true, side: T.DoubleSide }));
  };
  var C = function (hex) { return new T.Color(hex); };

  // ---- The city around you ----
  function buildingsNear(city, x, y, r) {
    var M = city.map, cell = 60;
    if (!bgrid || bgrid.city !== city) {
      bgrid = { city: city, m: new Map() };
      for (var i = 0; i < M.buildings.length; i++) {
        var b = M.buildings[i][0], k = Math.floor(b[0] * M.unit / cell) + ',' + Math.floor(b[1] * M.unit / cell);
        (bgrid.m.get(k) || bgrid.m.set(k, []).get(k)).push(i);
      }
    }
    var out = [], n = Math.ceil(r / cell), cx = Math.floor(x / cell), cy = Math.floor(y / cell);
    for (var gx = cx - n; gx <= cx + n; gx++) for (var gy = cy - n; gy <= cy + n; gy++) { var l = bgrid.m.get(gx + ',' + gy); if (l) out = out.concat(l); }
    return out;
  }
  var ROOF = { tejas: 0x8a4a3a, chapa: 0x7d8288, terraza: 0xb9b2a4 };
  function buildCity(g, mx, mz, skip) {
    var city = g.city, M = city.map, s = city.scale, U = M.unit, B = new Builder(), r = 230;
    var wallC = C(0x9a9184), wallD = C(0x7a7266), roadC = C(0x44464c), walkC = C(0x6b6a66), parkC = C(0x456b38);
    // Plazas and streets.
    city.parks.forEach(function (pk) {
      var b = pk.box; if (b[2] / s < mx - r || b[0] / s > mx + r || b[3] / s < mz - r || b[1] / s > mz + r) return;
      B.flat(pk.pts.map(function (q) { return [q[0] / s, q[1] / s]; }), 0.01, parkC);
    });
    city.roads.forEach(function (rd) {
      var b = rd.box; if (b[2] / s < mx - r || b[0] / s > mx + r || b[3] / s < mz - r || b[1] / s > mz + r) return;
      for (var i = 1; i < rd.pts.length; i++) {
        var a = rd.pts[i - 1], c = rd.pts[i];
        B.wall(a[0] / s, a[1] / s, c[0] / s, c[1] / s, rd.w / s + 3, 0, 0.02, walkC);
        B.wall(a[0] / s, a[1] / s, c[0] / s, c[1] / s, rd.w / s, 0.02, 0.04, roadC);
      }
    });
    // Buildings: walls up to their floors, the roof on top.
    buildingsNear(city, mx, mz, r).forEach(function (i) {
      if (i === skip) return;
      var row = M.buildings[i], raw = row[0], pts = [];
      for (var j = 0; j + 1 < raw.length; j += 2) pts.push([raw[j] * U, raw[j + 1] * U]);
      if (Math.hypot(pts[0][0] - mx, pts[0][1] - mz) > r) return;
      var h = Math.max(1, row[2] || 1) * FLOOR, roofC = C(ROOF[M.roofs[row[3]]] || 0x8a8276);
      for (var k = 0; k < pts.length; k++) {
        var a = pts[k], b = pts[(k + 1) % pts.length];
        B.quad([a[0], 0, a[1]], [b[0], 0, b[1]], [b[0], h, b[1]], [a[0], h, a[1]], k % 2 ? wallC : wallD);
      }
      B.flat(pts, h, roofC);
    });
    if (cityMesh) { scene.remove(cityMesh); cityMesh.geometry.dispose(); }
    cityMesh = B.mesh(); scene.add(cityMesh);
  }

  // ---- The house you are in, inside, on your floor ----
  function buildHouse(g, plan, fl) {
    var s = plan.scale, B = new Builder(), y0 = fl * FLOOR, level = L.planLevel(plan, fl), bar = g.barricades || {};
    var floorC = C(0xb3a58a), wallC = C(0xd8d0c0), outC = C(0x9a9184), woodC = C(0x7a5a3a), tallC = C(0x6e5a44), lowC = C(0x8f7a5c), doorC = C(0x5e432a);
    B.flat(plan.outline.map(function (q) { return [q[0] / s, q[1] / s]; }), y0 + 0.03, floorC);
    // Inner walls.
    var walls = fl ? (level.wallsPx || []) : plan.wallsPx;
    walls.forEach(function (w) { B.wall(w[0] / s, w[1] / s, w[2] / s, w[3] / s, 0.14, y0, y0 + 2.6, wallC); });
    // The outer wall, with gaps where its doorways are.
    var gaps = fl ? [] : plan.exitSegsPx.map(function (q) { return q.map(function (v) { return v / s; }); });
    var o = plan.outline.map(function (q) { return [q[0] / s, q[1] / s]; });
    for (var k = 0; k < o.length; k++) {
      var a = o[k], b = o[(k + 1) % o.length], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz) || 1, cut = [];
      gaps.forEach(function (q) {
        var t0 = ((q[0] - a[0]) * dx + (q[1] - a[1]) * dz) / (len * len), t1 = ((q[2] - a[0]) * dx + (q[3] - a[1]) * dz) / (len * len);
        var off = Math.abs((q[0] - a[0]) * dz - (q[1] - a[1]) * dx) / len;
        if (off < 0.5) cut.push([Math.min(t0, t1), Math.max(t0, t1)]);
      });
      cut.sort(function (p, q) { return p[0] - q[0]; });
      var t = 0;
      cut.concat([[1, 1]]).forEach(function (c) {
        if (c[0] > t) B.wall(a[0] + dx * t, a[1] + dz * t, a[0] + dx * c[0], a[1] + dz * c[0], 0.22, y0, y0 + 2.8, outC);
        t = Math.max(t, c[1]);
      });
    }
    // Furniture: tall pieces taller.
    var tall = L.data.sight ? L.data.sight.tall : [];
    (level.solidPx || []).forEach(function (q, k) {
      if (!fl && bar[plan.index + ':f:' + k]) return;
      var t = level.furniture[k].t, h = tall.indexOf(t) >= 0 ? 1.9 : t === 'cama' ? 0.55 : 0.85, ux = q.ax, uz = q.ay;
      var x0 = q.x / s - ux * q.hw / s, z0 = q.y / s - uz * q.hw / s, x1 = q.x / s + ux * q.hw / s, z1 = q.y / s + uz * q.hw / s;
      B.wall(x0, z0, x1, z1, 2 * q.hd / s, y0, y0 + h, tall.indexOf(t) >= 0 ? tallC : t === 'cama' ? C(0x8a8fa8) : lowC);
    });
    // Closed doors and planks (js/doors.js, js/barricade.js).
    if (!fl && L.planOpenings) L.planOpenings(plan).forEach(function (op) {
      var q = op.seg.map(function (v) { return v / s; }), st = L.doorState ? L.doorState(g, op) : null, b = bar[op.key];
      if (st && st.closed) B.wall(q[0], q[1], q[2], q[3], 0.08, y0, y0 + 2.1, doorC);
      if (b && b.planks > 0) for (var j = 0; j < b.planks; j++) B.wall(q[0], q[1], q[2], q[3], 0.05, y0 + 0.5 + j * 0.45, y0 + 0.7 + j * 0.45, woodC);
    });
    if (houseMesh) { scene.remove(houseMesh); houseMesh.geometry.dispose(); }
    houseMesh = B.mesh(); scene.add(houseMesh);
  }

  // ---- People and zombies ----
  var GEO = null;
  function figure(color, zombie) {
    if (!GEO) GEO = { body: new T.CylinderGeometry(0.22, 0.26, 1.15, 10), head: new T.SphereGeometry(0.17, 12, 10), nose: new T.BoxGeometry(0.08, 0.06, 0.14) };
    var gr = new T.Group(), mat = new T.MeshLambertMaterial({ color: color }), skin = new T.MeshLambertMaterial({ color: zombie ? 0x8a9a6a : 0xc99b7a });
    var body = new T.Mesh(GEO.body, mat); body.position.y = 0.6; gr.add(body);
    var head = new T.Mesh(GEO.head, skin); head.position.y = 1.35; gr.add(head);
    var nose = new T.Mesh(GEO.nose, skin); nose.position.set(0, 1.35, 0.17); gr.add(nose); // which way it faces
    if (zombie) { body.rotation.x = 0.25; head.position.z = 0.15; nose.position.z = 0.32; }
    gr.userData.mat = mat;
    scene.add(gr);
    return gr;
  }
  function place(obj, key, color, zombie, x, z, y, face, dim) {
    var f = figures.get(obj);
    if (!f) { f = figure(color, zombie); figures.set(obj, f); }
    f.position.set(x, y, z); f.rotation.y = -face + Math.PI / 2;
    f.visible = true; f.userData.mat.opacity = dim ? 0.35 : 1; f.userData.mat.transparent = !!dim;
    seen.add(obj);
  }

  // ---- Each frame ----
  V.render = function (g, W, H) {
    if (!V.on || !init() || !g || !g.city) return;
    var city = g.city, s = city.scale, p = g.player, px = p.x / s, pz = p.y / s, py = (p.z || p.floor || 0) * FLOOR;
    if (cv.width !== W || cv.height !== H) { R.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix(); cv.style.width = W + 'px'; cv.style.height = H + 'px'; }
    // The house you are in (drawn inside) and the city around (rebuilt when you walk far or go in or out).
    var here = L.planHere ? L.planHere(city, p) : null, fl = p.floor || 0, hk = here ? here.index + ':' + fl + ':' + JSON.stringify(g.barricades || {}).length : '';
    if (!cityAt || Math.hypot(px - cityAt.x, pz - cityAt.z) > 90 || cityAt.skip !== (here ? here.index : -1)) { buildCity(g, px, pz, here ? here.index : -1); cityAt = { x: px, z: pz, skip: here ? here.index : -1 }; }
    if (hk !== houseKey) { houseKey = hk; if (here) buildHouse(g, here, fl); else if (houseMesh) { scene.remove(houseMesh); houseMesh = null; } }
    // People, zombies, you.
    seen.clear();
    var aim = p.aim !== undefined ? p.aim : Math.atan2(p.dirY || 0, p.dirX || 1);
    place(p, 'p', 0x4d5646, false, px, pz, py, aim, false);
    // Only what you see (as in 2D: your cone, nothing in between, as far as the light lets you; js/sight.js).
    var reach = L.sightReach ? L.sightReach(g) : Infinity;
    var sees = L.canSee && L.data.sight ? function (x, y, f) { return L.canSee(city, p, aim, x, y, f) && (Math.hypot(x - p.x, y - p.y) <= reach || (L.lightAt && L.lightAt(g, x, y, f) > 0.35)); } : function () { return true; };
    g.enemies.forEach(function (e) {
      if (e.dead) return;
      if (Math.hypot(e.x / s - px, e.y / s - pz) > 70 || !sees(e.x, e.y, e.floor || 0)) return;
      place(e, 'e', 0x5a3a3a, true, e.x / s, e.y / s, (e.floor || 0) * FLOOR, e.face !== undefined ? e.face : Math.atan2(p.y - e.y, p.x - e.x), (e.floor || 0) !== fl);
    });
    (g.people || []).forEach(function (q) {
      if (q.dead || q.mode === 'travel' || Math.hypot(q.x / s - px, q.y / s - pz) > 70 || !sees(q.x, q.y, q.floor || 0)) return;
      place(q, 'q', parseInt((q.coat || '#6a5a48').slice(1), 16), false, q.x / s, q.y / s, (q.floor || 0) * FLOOR, Math.atan2(q.dirY || 0, q.dirX || 1), (q.floor || 0) !== fl);
    });
    figures.forEach(function (f, obj) { if (!seen.has(obj)) { if (obj.dead || obj.gone || obj.mode === 'travel') { scene.remove(f); figures.delete(obj); } else f.visible = false; } });
    // Light: day and night, the flashlight.
    var k = L.clockOf(g), light = k.light, night = new T.Color(0x05060a), day = new T.Color(0x8d98a2);
    var sky = night.clone().lerp(day, light);
    scene.background = sky; scene.fog.color = sky;
    hemi.intensity = 0.12 + 0.6 * light; sun.intensity = 0.85 * light;
    sun.position.set(px + 30, 70, pz + 20); sun.target.position.set(px, 0, pz);
    var fon = p.flashlight && p.flashlight.on;
    flash.intensity = fon ? 2.2 : 0;
    flash.position.set(px, py + 1.4, pz);
    flash.target.position.set(px + Math.cos(aim) * 10, py + 0.2, pz + Math.sin(aim) * 10);
    // The camera: behind and above, looking north, as the 2D one (WASD moves the same way).
    var tl = V.tilt * Math.PI / 180;
    cam.position.set(px, py + V.dist * Math.sin(tl), pz + V.dist * Math.cos(tl));
    cam.lookAt(px, py + 0.8, pz);
    R.render(scene, cam);
  };

  // Where the mouse points, on the floor you stand on: { x, y } in px of the world (for aiming).
  var ray = null;
  V.pick = function (g, mx, my, W, H) {
    if (!R || !cam) return null;
    var p = g.player, s = g.city.scale, py = (p.z || p.floor || 0) * FLOOR + 1.0;
    ray = ray || new T.Raycaster();
    ray.setFromCamera(new T.Vector2(mx / W * 2 - 1, -(my / H) * 2 + 1), cam);
    var o = ray.ray.origin, d = ray.ray.direction;
    if (Math.abs(d.y) < 1e-6) return null;
    var t = (py - o.y) / d.y;
    if (t < 0) return null;
    return { x: (o.x + d.x * t) * s, y: (o.z + d.z * t) * s };
  };
})(this.Lluvia = this.Lluvia || {});
