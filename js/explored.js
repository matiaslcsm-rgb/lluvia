// The map remembers what you saw (stage 64, the user's answer 8): "el mini mapa te da un recuerdo del lugar que ya
// visitaste; desbloquea el rango de visión". Later the fog of war (and loading the map little by little) can hang
// from this.
//   g.explored: { cell (px), cols, rows, grid: Uint8Array (1 seen), count, dirty: [indexes marked since the screen
//   last looked], all (true: the screen must redraw it all), acc }
(function (L) {
  'use strict';

  function D() { return L.data.senses.memory; }

  L.makeExplored = function (g) {
    var city = g.city;
    if (!city) return null;
    var cell = D().cell * city.scale, cols = Math.ceil(city.size / cell), rows = Math.ceil(city.size / cell);
    g.explored = { cell: cell, cols: cols, rows: rows, grid: new Uint8Array(cols * rows), count: 0, dirty: [], all: true, acc: 0 };
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

  // Every frame: now and then, what you see now becomes remembered.
  L.updateExplored = function (g, dt) {
    var X = g.explored, p = g.player;
    if (!X) return;
    X.acc -= dt;
    if (X.acc > 0) return;
    X.acc = D().every;
    L.markExplored(g, p.x, p.y, Math.max(L.data.sight.near * g.city.scale, L.sightReach ? L.sightReach(g) : 0));
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
    return { cols: X.cols, rows: X.rows, runs: runs.join(',') };
  };
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
    return true;
  };
})(this.Lluvia = this.Lluvia || {});
