// What a body sees in the city (data/sight.js): a cone toward where it aims plus a small circle all round, cut by
// whatever hides what is behind it. On the ground floor that is the walk grid (js/city.js): a blocked cell hides
// unless it is see-through (value 2: a car, low furniture, a window). On any other floor, that floor of the
// building: its walls, its outer wall (open at the windows) and its tall furniture, drawn on a fine grid of its
// own; past the building, the city's grid again.
(function (L) {
  'use strict';

  function S() { return L.data.sight; }

  // ---- A floor's own grid (floors other than the ground one) ----
  var FINE = 0.25; // meters per cell

  function levelGrid(city, plan, f) {
    var level = L.planLevel(plan, f);
    if (level._sight) return level._sight;
    var s = city.scale, c = FINE * s, xs = plan.outline.map(function (q) { return q[0]; }), ys = plan.outline.map(function (q) { return q[1]; });
    var x0 = Math.min.apply(null, xs) - c, y0 = Math.min.apply(null, ys) - c;
    var W = Math.ceil((Math.max.apply(null, xs) + c - x0) / c), H = Math.ceil((Math.max.apply(null, ys) + c - y0) / c);
    var g = { x0: x0, y0: y0, c: c, W: W, H: H, a: new Uint8Array(W * H) };
    var line = function (ax, ay, bx, by) {
      var n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / (c / 3)));
      for (var k = 0; k <= n; k++) {
        var x = Math.floor((ax + (bx - ax) * k / n - x0) / c), y = Math.floor((ay + (by - ay) * k / n - y0) / c);
        if (x >= 0 && y >= 0 && x < W && y < H) g.a[y * W + x] = 1;
      }
    };
    var rails = (level.railsPx || []).map(String);
    level.wallsPx.forEach(function (w) { if (rails.indexOf(String(w)) < 0) line(w[0], w[1], w[2], w[3]); }); // railings are low
    // The outer wall, open where its windows are.
    var wins = (level.windows || []).map(function (w) { return [w[0] * s, w[1] * s, w[2] * s, w[3] * s]; });
    var o = plan.outline;
    for (var i = 0; i < o.length; i++) {
      var a = o[i], b = o[(i + 1) % o.length], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / (c / 3)));
      for (var k = 0; k <= n; k++) {
        var px = a[0] + (b[0] - a[0]) * k / n, py = a[1] + (b[1] - a[1]) * k / n;
        if (wins.some(function (w) { return segDist(px, py, w) < c * 0.6; })) continue;
        var cx = Math.floor((px - x0) / c), cy = Math.floor((py - y0) / c);
        if (cx >= 0 && cy >= 0 && cx < W && cy < H) g.a[cy * W + cx] = 1;
      }
    }
    var tall = S().tall;
    (level.solidPx || []).forEach(function (sp, k) {
      if (tall.indexOf(level.furniture[k].t) < 0) return;
      for (var j = 0; j < 4; j++) { var p = sp.pts[j], q = sp.pts[(j + 1) % 4]; line(p[0], p[1], q[0], q[1]); }
    });
    level._sight = g;
    return g;
  }

  function segDist(x, y, w) {
    var dx = w[2] - w[0], dy = w[3] - w[1], t = L.clamp(((x - w[0]) * dx + (y - w[1]) * dy) / (dx * dx + dy * dy || 1), 0, 1);
    return Math.hypot(w[0] + dx * t - x, w[1] + dy * t - y);
  }

  // Walks a ray cell by cell (every cell it crosses, so it never slips through a wall drawn as a diagonal chain of
  // cells) on a grid; `opaque(cx, cy)` says whether a cell hides. Returns how far it got (≤ len), in px.
  function march(gx0, gy0, c, x, y, dx, dy, len, opaque, stopOut) {
    var fx = (x - gx0) / c, fy = (y - gy0) / c, cx = Math.floor(fx), cy = Math.floor(fy);
    var sx = dx > 0 ? 1 : -1, sy = dy > 0 ? 1 : -1;
    var tdx = dx ? Math.abs(c / dx) : Infinity, tdy = dy ? Math.abs(c / dy) : Infinity;
    var tx = dx ? ((dx > 0 ? cx + 1 - fx : fx - cx) * c) / Math.abs(dx) : Infinity, ty = dy ? ((dy > 0 ? cy + 1 - fy : fy - cy) * c) / Math.abs(dy) : Infinity;
    var t = 0;
    while (t < len) {
      if (tx < ty) { t = tx; tx += tdx; cx += sx; } else { t = ty; ty += tdy; cy += sy; }
      if (t >= len) return len;
      var r = opaque(cx, cy);
      if (r === true) return t;
      if (r === 'out' && stopOut) return { out: t };
    }
    return len;
  }

  // How far a ray from (x, y) at angle `ang` goes on `ent`'s floor before something hides what is past it, in px.
  function ray(city, ent, x, y, ang, len) {
    var dx = Math.cos(ang), dy = Math.sin(ang), c = city.cell, f = ent.floor || 0;
    if (f && ent.house) {
      var g = levelGrid(city, ent.house, f);
      var r = march(g.x0, g.y0, g.c, x, y, dx, dy, len, function (cx, cy) {
        if (cx < 0 || cy < 0 || cx >= g.W || cy >= g.H) return 'out';
        return g.a[cy * g.W + cx] === 1;
      }, true);
      if (typeof r === 'number') return r;
      // Out of the building (through a window): the city, from there on.
      var t0 = r.out;
      return t0 + ray(city, { floor: 0 }, x + dx * t0, y + dy * t0, ang, len - t0);
    }
    return marchCity(city, x, y, dx, dy, len);
  }

  // The same walk on the city's grid, written out for speed (it runs a few hundred times a frame): the zone of the
  // grid is looked up only when the ray enters a new one.
  function marchCity(city, x, y, dx, dy, len) {
    if (!city.pages) return march(0, 0, city.cell, x, y, dx, dy, len, function (cx, cy) { return L.citySightCell(city, cx, cy) === 0; }, false);
    var c = city.cell, P = L.data.city.page, fx = x / c, fy = y / c, cx = Math.floor(fx), cy = Math.floor(fy);
    var sx = dx > 0 ? 1 : -1, sy = dy > 0 ? 1 : -1, adx = Math.abs(dx), ady = Math.abs(dy);
    var tdx = adx ? c / adx : Infinity, tdy = ady ? c / ady : Infinity;
    var tx = adx ? (dx > 0 ? cx + 1 - fx : fx - cx) * c / adx : Infinity, ty = ady ? (dy > 0 ? cy + 1 - fy : fy - cy) * c / ady : Infinity;
    var t = 0, zx = -1, zy = -1, page = null, cols = city.cols, rows = city.rows;
    while (true) {
      if (tx < ty) { t = tx; tx += tdx; cx += sx; } else { t = ty; ty += tdy; cy += sy; }
      if (t >= len) return len;
      if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) return t;
      var px = (cx / P) | 0, py = (cy / P) | 0;
      if (px !== zx || py !== zy) {
        zx = px; zy = py;
        page = city.pages.get(py * city.pcols + px);
        if (!page) { L.citySightCell(city, cx, cy); page = city.pages.get(py * city.pcols + px); } // builds the zone
      }
      if (page[(cy - py * P) * P + (cx - px * P)] === 0) return t;
    }
  }
  L.sightRay = ray;

  // The edge of what `ent` sees, aiming at angle `aim`: points [x, y] in px around it, in order of angle.
  L.sightPolygon = function (city, ent, aim) {
    var D = S(), s = city.scale, half = D.cone * Math.PI / 360, far = D.range * s, near = D.near * s, out = [];
    var n = D.rays, inCone = Math.max(24, Math.round(n * 0.75)), rest = n - inCone;
    var add = function (a, len) { var d = ray(city, ent, ent.x, ent.y, a, len); out.push([ent.x + Math.cos(a) * d, ent.y + Math.sin(a) * d]); };
    for (var i = 0; i <= inCone; i++) add(aim - half + 2 * half * i / inCone, far);
    for (i = 1; i < rest; i++) add(aim + half + (2 * Math.PI - 2 * half) * i / rest, near);
    return out;
  };

  // Does `ent`, aiming at `aim`, see the spot (x, y) px? In the cone or close by, nothing in between, same floor.
  L.canSee = function (city, ent, aim, x, y, floor) {
    if ((floor || 0) !== (ent.floor || 0)) return false;
    var D = S(), s = city.scale, dx = x - ent.x, dy = y - ent.y, d = Math.hypot(dx, dy);
    if (d < 1) return true;
    var ang = Math.atan2(dy, dx), diff = Math.abs(((ang - aim) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI);
    if (d > D.near * s && (diff > D.cone * Math.PI / 360 || d > D.range * s)) return false;
    return ray(city, ent, ent.x, ent.y, ang, d) >= d - city.cell * 0.5;
  };
})(this.Lluvia = this.Lluvia || {});
