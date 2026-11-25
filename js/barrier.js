// The black barrier (data/barrier.js): the partido's border is a black wall nobody crosses (the walk grid already
// ends there, js/city.js). Near it the city has more zombies, and some of them come out of the wall.
(function (L) {
  'use strict';

  function B() { return L.data.barrier; }

  function inPoly(poly, x, y) {
    var c = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var a = poly[i], b = poly[j];
      if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
    }
    return c;
  }

  // The spot of the barrier nearest to (x, y): { d (px), x, y, tx, ty (along the wall), nx, ny (into the city) },
  // or null if the city has no border.
  L.barrierNear = function (city, x, y) {
    var P = city && city.border;
    if (!P || P.length < 3) return null;
    var best = null, bd = Infinity;
    for (var i = 0, j = P.length - 1; i < P.length; j = i++) {
      var ax = P[j][0], ay = P[j][1], dx = P[i][0] - ax, dy = P[i][1] - ay, l2 = dx * dx + dy * dy;
      if (!l2) continue;
      var t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2)), qx = ax + dx * t, qy = ay + dy * t;
      var d2 = (x - qx) * (x - qx) + (y - qy) * (y - qy);
      if (d2 < bd) { bd = d2; var l = Math.sqrt(l2); best = { x: qx, y: qy, tx: dx / l, ty: dy / l }; }
    }
    best.d = Math.sqrt(bd);
    // The normal that points into the city.
    var nx = -best.ty, ny = best.tx, k = city.scale || 1;
    if (!inPoly(P, best.x + nx * k, best.y + ny * k)) { nx = -nx; ny = -ny; }
    best.nx = nx; best.ny = ny;
    return best;
  };

  // How many times the zombies near you: `more` at the wall, 1 at `near` meters or farther.
  L.barrierMul = function (g) {
    var n = g.barrier;
    if (!n || !g.city) return 1;
    var near = B().near * g.city.scale;
    return 1 + (B().more - 1) * Math.max(0, 1 - n.d / near);
  };

  // Every frame: now and then, how far the barrier is; the first time you get close, what it is.
  L.updateBarrier = function (g, dt) {
    if (!g.city || !g.city.border) return;
    g.barrierAcc = (g.barrierAcc || 0) - dt;
    if (g.barrierAcc > 0 && g.barrier) return;
    g.barrierAcc = B().every;
    var p = g.player;
    g.barrier = L.barrierNear(g.city, p.x, p.y);
    if (g.barrier && !g.barrierSeen && g.barrier.d < B().warn * g.city.scale) {
      g.barrierSeen = true;
      if (L.toast) L.toast(g, B().text);
    }
  };

  // A spot just inside the barrier, beside the stretch nearest to you, where a zombie can come out; or null.
  L.barrierSpawnPoint = function (g) {
    var n = g.barrier, s = g.city.scale;
    if (!n) return null;
    for (var tries = 0; tries < 4; tries++) {
      var along = (g.rng() * 2 - 1) * B().spread * s, out = B().out * s;
      var x = n.x + n.tx * along + n.nx * out, y = n.y + n.ty * along + n.ny * out;
      var pt = L.cityFree(g.city, x, y);
      if (Math.hypot(pt.x - x, pt.y - y) < 12 * s) return pt;
    }
    return null;
  };
})(this.Lluvia = this.Lluvia || {});
