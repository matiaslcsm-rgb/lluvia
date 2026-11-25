// The map remembers what you saw (stage 64, the user's answer 8): "el mini mapa te da un recuerdo del lugar que ya
// visitaste; desbloquea el rango de visión". Later the fog of war (and loading the map little by little) can hang
// from this.
//   g.explored: { cell (px), cols, rows, grid: Uint8Array (1 seen), count, dirty: [indexes marked since the screen
//   last looked], all (true: the screen must redraw it all), acc,
//   inside: { 'building:floor': Uint8Array, one per cell of its plan (js/interiors.js): 1 seen }, ver: { same keys:
//   how many times it changed, for the screen } }
// Inside a building only what your sight cone (js/sight.js) reaches, as far as there is light, is seen: the rest of
// the house stays hidden until you walk in (the user, after playing: the fog of war inside).
(function (L) {
  'use strict';

  function D() { return L.data.senses.memory; }

  L.makeExplored = function (g) {
    var city = g.city;
    if (!city) return null;
    var cell = D().cell * city.scale, cols = Math.ceil(city.size / cell), rows = Math.ceil(city.size / cell);
    g.explored = { cell: cell, cols: cols, rows: rows, grid: new Uint8Array(cols * rows), count: 0, dirty: [], all: true, acc: 0, inside: {}, ver: {} };
    return g.explored;
  };

  // Marks as seen every square within r px of (x, y).
  L.markExplored = function (g, x, y, r) {
    var X = g.explored;
    if (!X) return;
    var c = X.cell, i0 = Math.max(0, Math.floor((x - r) / c)), i1 = Math.min(X.cols - 1, Math.floor((x + r) / c));
    var j0 = Math.max(0, Math.floor((y - r) / c)), j1 = Math.min(X.rows - 1, Math.floor((y + r) / c)), r2 = r * r;
    for (var j = j0; j <= j1; j++) {
      for (var i = i0; i <= i1; i++) {
        var k = j * X.cols + i;
        if (X.grid[k]) continue;
        var dx = (i + 0.5) * c - x, dy = (j + 0.5) * c - y;
        if (dx * dx + dy * dy > r2) continue;
        X.grid[k] = 1; X.count++;
        if (X.dirty.length < 20000) X.dirty.push(k); else X.all = true;
      }
    }
  };

  L.isExplored = function (g, x, y) {
    var X = g.explored;
    if (!X) return true;
    var i = Math.floor(x / X.cell), j = Math.floor(y / X.cell);
    return i >= 0 && j >= 0 && i < X.cols && j < X.rows && X.grid[j * X.cols + i] === 1;
  };

  // Every frame: now and then, what you see now becomes remembered. Inside a building, its rooms too.
  L.updateExplored = function (g, dt) {
    var X = g.explored, p = g.player;
    if (!X) return;
    X.acc -= dt;
    if (X.acc > 0) return;
    X.acc = D().every;
    var reach = Math.max(L.data.sight.near * g.city.scale, L.sightReach ? L.sightReach(g) : 0);
    L.markExplored(g, p.x, p.y, reach);
    var plan = L.planHere(g.city, p);
    if (plan && L.sightPolygon) {
      var aim = p.aim !== undefined ? p.aim : Math.atan2(p.dirY || 0, p.dirX || 1);
      L.markInside(g, plan, p.floor || 0, L.sightPolygon(g.city, p, aim), reach);
    }
  };

  // The building you are in (as the screen shows it, js/view/city.js), or null.
  L.planHere = function (city, who) {
    if (!city) return null;
    return who.house && (who.floor || who.z) ? who.house : city.map && L.cityHouseAt ? L.cityHouseAt(city, who.x, who.y) : null;
  };
  // What you have seen of floor `fl` of a building: a Uint8Array per cell of its plan, or null.
  L.insideSeen = function (g, plan, fl) { return g.explored && g.explored.inside[plan.index + ':' + fl] || null; };
  function inPoly(poly, x, y) {
    var c = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var a = poly[i], b = poly[j];
      if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
    }
    return c;
  }
  // Marks the cells of floor `fl` of `plan` inside the sight polygon `poly` and within `reach` px of you.
  L.markInside = function (g, plan, fl, poly, reach) {
    var X = g.explored, level = L.planLevel(plan, fl), p = g.player, s = g.city.scale;
    if (!X || !level || !level.lab) return 0;
    var key = plan.index + ':' + fl, mem = X.inside[key] || (X.inside[key] = new Uint8Array(plan.W * plan.D)), n = 0, r2 = reach * reach;
    for (var y = 0; y < plan.D; y++) {
      for (var x = 0; x < plan.W; x++) {
        var k = y * plan.W + x;
        if (mem[k]) continue;
        var q = L.housePoint(plan, x + 0.5, y + 0.5), wx = q[0] * s, wy = q[1] * s, dx = wx - p.x, dy = wy - p.y;
        if (dx * dx + dy * dy > r2 || !inPoly(poly, wx, wy)) continue;
        mem[k] = 1; n++;
      }
    }
    if (n) X.ver[key] = (X.ver[key] || 0) + 1;
    return n;
  };

  // For saving (js/save.js): the grid as runs "seen,unseen,seen,..." lengths, starting with unseen.
  L.packExplored = function (g) {
    var X = g.explored;
    if (!X) return null;
    var runs = [], v = 0, n = 0;
    for (var k = 0; k < X.grid.length; k++) {
      if (X.grid[k] === v) n++;
      else { runs.push(n); v = X.grid[k]; n = 1; }
    }
    runs.push(n);
    var inside = {};
    Object.keys(X.inside).forEach(function (key) { inside[key] = pack(X.inside[key]); });
    return { cols: X.cols, rows: X.rows, runs: runs.join(','), inside: inside };
  };
  // Runs "unseen,seen,unseen,..." of a 0/1 array, as a string.
  function pack(a) {
    var runs = [], v = 0, n = 0;
    for (var k = 0; k < a.length; k++) { if (a[k] === v) n++; else { runs.push(n); v = a[k]; n = 1; } }
    runs.push(n);
    return runs.join(',');
  }
  function unpack(str) {
    var runs = str.split(',').map(Number), len = runs.reduce(function (a, b) { return a + b; }, 0), out = new Uint8Array(len), k = 0, v = 0;
    runs.forEach(function (n) { if (v) out.fill(1, k, k + n); k += n; v = 1 - v; });
    return out;
  }
  L.unpackExplored = function (g, data) {
    var X = g.explored;
    if (!X || !data || data.cols !== X.cols || data.rows !== X.rows) return false;
    var runs = data.runs.split(','), k = 0, v = 0;
    X.grid.fill(0); X.count = 0;
    runs.forEach(function (r) {
      var n = +r;
      if (v) { X.grid.fill(1, k, k + n); X.count += n; }
      k += n; v = 1 - v;
    });
    X.dirty = []; X.all = true;
    X.inside = {}; X.ver = {};
    Object.keys(data.inside || {}).forEach(function (key) { X.inside[key] = unpack(data.inside[key]); X.ver[key] = 1; });
    return true;
  };
})(this.Lluvia = this.Lluvia || {});
