// Floor plans for the houses of the real map, so you can walk in. There is no public data of what a house looks
// like inside, so each plan is made from what the map does know: the real footprint, which side faces the street
// and how big it is. A house picks one of several layouts that fit its shape (data/houses.js), its number of
// bedrooms from its size, and its own proportions, all seeded by its index: the same house is always the same
// inside, and two neighbours rarely match.
// A plan lives in the house's own frame: x along the front, y from the front toward the back, in cells.
(function (L) {
  'use strict';

  var OUT = -2; // a cell of the plan's rectangle that is outside the footprint
  // Narrowest side of any room, bath included: on a house turned against the walk grid the walls eat up to a
  // meter of a small room.
  var MIN_SIDE = 2.2;

  function H() { return L.data.houses; }
  function cells(m) { return Math.round(m / H().cell); }

  // ---- Layouts ----
  // Rooms are rectangles [x0, y0, x1, y1) in cells, painted in order (a later one covers an earlier one, so an
  // L-shaped room is a big rectangle with a smaller one on top). Links say which rooms open into which.

  function Plan(name) { this.name = name; this.rooms = []; this.links = []; this.entry = 0; this.back = -1; }
  Plan.prototype.add = function (type, x0, y0, x1, y1) { this.rooms.push({ type: type, x0: x0, y0: y0, x1: x1, y1: y1 }); return this.rooms.length - 1; };
  Plan.prototype.link = function (a, b) { if (a >= 0 && b >= 0) this.links.push([a, b]); };

  // Cuts `len` cells into parts by weight, each at least `min` cells. Returns the cut points (0 … len), or null.
  function cuts(len, weights, min) {
    if (len < weights.length * min) return null;
    var total = weights.reduce(function (a, b) { return a + b; }, 0), out = [0], at = 0;
    for (var i = 0; i < weights.length - 1; i++) {
      var after = (weights.length - 1 - i) * min, size = Math.round(len * weights[i] / total);
      size = Math.max(min, Math.min(size, len - at - after));
      at += size; out.push(at);
    }
    out.push(len);
    return out;
  }

  // Each part's weight, a bit different every house.
  function wobble(weights, rng) { return weights.map(function (w) { return w * (0.85 + rng() * 0.3); }); }

  // A row of rooms (bedrooms and a bath) cut along one side. False if a bedroom comes out too narrow.
  function row(p, types, len, rng, place) {
    var ws = wobble(types.map(function (t) { return t === 'bano' ? 2.4 : 3.3; }), rng), cut = cuts(len, ws, cells(MIN_SIDE));
    if (!cut) return false;
    for (var i = 0; i < types.length; i++) if (types[i] === 'dormitorio' && cut[i + 1] - cut[i] < cells(H().bedroomMin)) return false;
    return types.map(function (t, i) { return place(t, cut[i], cut[i + 1]); });
  }

  function bedroomsAndBath(n, rng) {
    var t = [];
    for (var i = 0; i < n; i++) t.push('dormitorio');
    t.splice(Math.floor(rng() * (n + 1)), 0, 'bano'); // the bath goes anywhere in the row
    return t;
  }

  var LAYOUTS = {
    // "Casa chorizo": a corridor along one side, living at the front, then the bedrooms and the bath in a row,
    // and the kitchen across the back with the door to the yard.
    lateral: function (W, D, n, rng) {
      var hall = cells(H().hall), left = rng() < 0.5, hx = left ? 0 : W - hall, cx0 = left ? hall : 0, cx1 = left ? W : W - hall;
      // Only on narrow lots: past 6 m the rooms in the row come out long and thin, not like a real chorizo.
      if (D < W * 1.3 || cx1 - cx0 < cells(2.6) || cx1 - cx0 > cells(6) || D < cells(8)) return null;
      var kd = Math.min(cells(4), Math.max(cells(2.6), Math.round(D * 0.22))), colD = D - kd, p = new Plan('lateral');
      var types = ['living'].concat(bedroomsAndBath(n, rng).filter(function (t) { return t !== 'bano'; }), ['bano']);
      var ws = wobble(types.map(function (t) { return t === 'living' ? 4.2 : t === 'bano' ? 2.4 : 3.3; }), rng), cut = cuts(colD, ws, cells(MIN_SIDE));
      if (!cut) return null;
      for (var i = 0; i < types.length; i++) if (types[i] === 'dormitorio' && cut[i + 1] - cut[i] < cells(H().bedroomMin)) return null;
      var h = p.add('pasillo', hx, 0, hx + hall, colD);
      types.forEach(function (t, i) { p.link(p.add(t, cx0, cut[i], cx1, cut[i + 1]), h); });
      var k = p.add('cocina', 0, colD, W, D);
      p.link(k, h);
      p.entry = rng() < 0.5 ? h : 1; p.back = k;
      return p;
    },
    // A corridor down the middle from the living to the kitchen, rooms on both sides.
    central: function (W, D, n, rng) {
      if (W < cells(8) || D < cells(9)) return null;
      var hall = cells(H().hall), ld = Math.round(D * (0.28 + rng() * 0.1)), kd = Math.round(D * (0.22 + rng() * 0.08)), midD = D - ld - kd;
      var hx = Math.round(W / 2 - hall / 2 + (rng() - 0.5) * 3);
      if (midD < cells(3) || hx < cells(2.6) || W - hx - hall < cells(2.6)) return null;
      var p = new Plan('central'), liv = p.add('living', 0, 0, W, ld), h = p.add('pasillo', hx, ld, hx + hall, ld + midD), sides = [[], []];
      bedroomsAndBath(n, rng).forEach(function (t, i) { sides[i % 2].push(t); });
      for (var s = 0; s < 2; s++) {
        if (!sides[s].length) continue;
        var x0 = s ? hx + hall : 0, x1 = s ? W : hx;
        var ids = row(p, sides[s], midD, rng, function (t, a, b) { return p.add(t, x0, ld + a, x1, ld + b); });
        if (!ids) return null;
        ids.forEach(function (id) { p.link(id, h); });
      }
      var k;
      if (W >= cells(10) && rng() < 0.6) {
        var lw = cells(2.4), lavLeft = rng() < 0.5;
        k = p.add('cocina', lavLeft ? lw : 0, D - kd, lavLeft ? W : W - lw, D);
        p.link(p.add('lavadero', lavLeft ? 0 : W - lw, D - kd, lavLeft ? lw : W, D), k);
      } else k = p.add('cocina', 0, D - kd, W, D);
      p.link(liv, h); p.link(k, h);
      p.entry = liv; p.back = k;
      return p;
    },
    // Living and kitchen at the front; bedrooms and bath at the back, off a short corridor when there are two or
    // more bedrooms.
    frontBack: function (W, D, n, rng) {
      if (W < cells(6) || D < cells(7)) return null;
      var fd = Math.round(D * (0.42 + rng() * 0.14)), kw = Math.round(W * (0.32 + rng() * 0.1)), kLeft = rng() < 0.5;
      if (kw < cells(2.2)) return null;
      var p = new Plan('frontBack'), liv = p.add('living', kLeft ? kw : 0, 0, kLeft ? W : W - kw, fd), k = p.add('cocina', kLeft ? 0 : W - kw, 0, kLeft ? kw : W, fd);
      p.link(k, liv);
      var useHall = n >= 2, hall = cells(H().hall), by = fd + (useHall ? hall : 0);
      if (D - by < cells(2.6)) return null;
      var h = useHall ? p.add('pasillo', 0, fd, W, by) : -1;
      p.link(h, liv);
      var ids = row(p, bedroomsAndBath(n, rng), W, rng, function (t, a, b) { return p.add(t, a, by, b, D); });
      if (!ids) return null;
      ids.forEach(function (id) { p.link(id, useHall ? h : liv); });
      p.entry = liv;
      return p;
    },
    // One big living-kitchen at the front; bedrooms and bath at the back open straight into it.
    open: function (W, D, n, rng) {
      if (W < cells(6) || D < cells(7) || n > 3) return null;
      var fd = Math.round(D * (0.5 + rng() * 0.1));
      if (D - fd < cells(2.6)) return null;
      var p = new Plan('open'), lc = p.add('livingCocina', 0, 0, W, fd);
      var ids = row(p, bedroomsAndBath(n, rng), W, rng, function (t, a, b) { return p.add(t, a, fd, b, D); });
      if (!ids) return null;
      ids.forEach(function (id) { p.link(id, lc); });
      p.entry = lc;
      return p;
    }
  };

  // A single room with the bath in a back corner.
  function studio(W, D, rng) {
    var p = new Plan('studio'), amb = p.add('ambiente', 0, 0, W, D);
    var bw = Math.min(W - cells(2), cells(MIN_SIDE + rng() * 0.6)), bd = Math.min(D - cells(2), cells(2.4 + rng() * 0.6)), left = rng() < 0.5;
    if (bw >= cells(MIN_SIDE) && bd >= cells(MIN_SIDE)) p.link(p.add('bano', left ? 0 : W - bw, D - bd, left ? bw : W, D), amb);
    p.entry = amb; p.back = amb;
    return p;
  }

  function bedroomsFor(area, rng) {
    var n = 0, table = H().bedrooms;
    for (var i = 0; i < table.length; i++) if (area <= table[i][0]) { n = table[i][1]; break; }
    var r = rng();
    if (r < 0.2 && n > 0) n--;
    else if (r > 0.85 && n < 4 && area > 50) n++;
    return n;
  }

  // Tries the layouts in a random order weighted by data/houses.js, each with fewer bedrooms if they don't fit.
  function layoutFor(W, D, n, rng) {
    if (n > 0) {
      var names = Object.keys(H().layouts), order = [];
      while (names.length) {
        var total = names.reduce(function (a, k) { return a + H().layouts[k]; }, 0), r = rng() * total, j = 0;
        while (r > H().layouts[names[j]] && j < names.length - 1) { r -= H().layouts[names[j]]; j++; }
        order.push(names.splice(j, 1)[0]);
      }
      for (var i = 0; i < order.length; i++) {
        for (var k = n; k >= 1; k--) { var p = LAYOUTS[order[i]](W, D, k, rng); if (p) return p; }
      }
    }
    return studio(W, D, rng);
  }

  // ---- The frame: which side is the front ----

  function areaOf(pts) {
    var a = 0;
    for (var i = 0; i < pts.length; i++) { var q = pts[i], r = pts[(i + 1) % pts.length]; a += q[0] * r[1] - r[0] * q[1]; }
    return Math.abs(a / 2);
  }

  function inside(pts, x, y) {
    var c = false;
    for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      if ((pts[i][1] > y) !== (pts[j][1] > y) && x < (pts[j][0] - pts[i][0]) * (y - pts[i][1]) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c;
    }
    return c;
  }

  // The house's own frame, lined up with its longest wall, with y = 0 on the side that faces `toStreet` (a unit
  // vector from the house toward its street). A point (x, y) of the frame, in meters, is o + u·x + v·y.
  L.houseFrame = function (pts, toStreet) {
    var best = -1, ang = 0;
    for (var i = 0; i < pts.length; i++) {
      var q = pts[i], r = pts[(i + 1) % pts.length], len = Math.hypot(r[0] - q[0], r[1] - q[1]);
      if (len > best) { best = len; ang = Math.atan2(r[1] - q[1], r[0] - q[0]); }
    }
    var a = [Math.cos(ang), Math.sin(ang)], b = [-a[1], a[0]], dirs = [a, [-a[0], -a[1]], b, [-b[0], -b[1]]], front = dirs[0];
    dirs.forEach(function (d) { if (d[0] * toStreet[0] + d[1] * toStreet[1] > front[0] * toStreet[0] + front[1] * toStreet[1]) front = d; });
    var v = [-front[0], -front[1]], u = [-v[1], v[0]], u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
    pts.forEach(function (q) {
      var pu = q[0] * u[0] + q[1] * u[1], pv = q[0] * v[0] + q[1] * v[1];
      u0 = Math.min(u0, pu); u1 = Math.max(u1, pu); v0 = Math.min(v0, pv); v1 = Math.max(v1, pv);
    });
    return { ox: u[0] * u0 + v[0] * v0, oy: u[1] * u0 + v[1] * v0, ux: u[0], uy: u[1], vx: v[0], vy: v[1], w: u1 - u0, d: v1 - v0 };
  };

  // ---- The plan ----

  // Runs of consecutive edges on one line: edges are {o: 'v' | 'h', x, y} between cells.
  function runsOf(edges) {
    var groups = new Map();
    edges.forEach(function (e) {
      var key = e.o + (e.o === 'v' ? e.x : e.y);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(e);
    });
    var runs = [];
    groups.forEach(function (list) {
      var along = function (e) { return e.o === 'v' ? e.y : e.x; };
      list.sort(function (p, q) { return along(p) - along(q); });
      var cur = [list[0]];
      for (var i = 1; i < list.length; i++) {
        if (along(list[i]) === along(cur[cur.length - 1]) + 1) cur.push(list[i]);
        else { runs.push(cur); cur = [list[i]]; }
      }
      runs.push(cur);
    });
    return runs;
  }

  // A run's middle `len` edges (or null if it is shorter).
  function middle(run, len) {
    if (run.length < len) return null;
    var s = Math.floor((run.length - len) / 2);
    return run.slice(s, s + len);
  }

  // Edge run → segment [x0, y0, x1, y1] in cells.
  function segment(run) {
    var a = run[0], b = run[run.length - 1];
    return a.o === 'v' ? [a.x, a.y, a.x, b.y + 1] : [a.x, a.y, b.x + 1, a.y];
  }

  // pts: the footprint in meters; toStreet: unit vector toward its street; seed: the same seed, the same house;
  // opts.canExit(x, y): optional, false where a door can't lead (a point in cells of the plan's frame).
  // Returns { frame, W, D, cell, lab (room index per cell, or OUT), rooms [{ type, cells, cx, cy }], walls,
  // doors (segments in cells), exits [{ x, y, side, dir, seg }] (a door's middle on the outline; side -1 front,
  // 1 back, 0 a side; dir: outward, in the frame), layout, bedrooms, reachable }.
  L.housePlan = function (pts, toStreet, seed, opts) {
    var cs = H().cell, fr = L.houseFrame(pts, toStreet), W = Math.max(2, Math.round(fr.w / cs)), D = Math.max(2, Math.round(fr.d / cs));
    var rng = L.makeRng((seed * 2654435761) >>> 0 || 1), n = bedroomsFor(areaOf(pts), rng), p = layoutFor(W, D, n, rng);
    if (rng() < 0.5) p.rooms.forEach(function (r) { var x0 = r.x0; r.x0 = W - r.x1; r.x1 = W - x0; }); // mirrored
    var lab = new Int16Array(W * D).fill(-1), x, y, i;
    p.rooms.forEach(function (r, k) { for (y = r.y0; y < r.y1; y++) for (x = r.x0; x < r.x1; x++) lab[y * W + x] = k; });
    for (y = 0; y < D; y++) for (x = 0; x < W; x++) {
      var mx = (x + 0.5) * cs, my = (y + 0.5) * cs;
      if (!inside(pts, fr.ox + fr.ux * mx + fr.vx * my, fr.oy + fr.uy * mx + fr.vy * my)) lab[y * W + x] = OUT;
    }
    var at = function (cx, cy) { return cx < 0 || cy < 0 || cx >= W || cy >= D ? OUT : lab[cy * W + cx]; };
    // Edges between two different rooms, by pair.
    var pairs, count;
    var scan = function () {
      pairs = new Map(); count = new Array(p.rooms.length).fill(0);
      for (y = 0; y < D; y++) for (x = 0; x < W; x++) {
        var a = lab[y * W + x];
        if (a < 0) continue;
        count[a]++;
        [['v', x + 1, y, at(x + 1, y)], ['h', x, y + 1, at(x, y + 1)]].forEach(function (e) {
          var b = e[3];
          if (b < 0 || b === a) return;
          var key = Math.min(a, b) * 1000 + Math.max(a, b);
          if (!pairs.has(key)) pairs.set(key, []);
          pairs.get(key).push({ o: e[0], x: e[1], y: e[2] });
        });
      }
    };
    scan();
    // Leftovers the footprint cut too small join the neighbour they share the most wall with.
    var minCells = Math.ceil(H().minRoom / (cs * cs)), merged = true;
    while (merged) {
      merged = false;
      for (i = 0; i < p.rooms.length && !merged; i++) {
        if (!count[i] || count[i] >= minCells) continue;
        var bestN = -1, bestLen = 0;
        pairs.forEach(function (list, key) {
          var a = Math.floor(key / 1000), b = key % 1000;
          if ((a === i || b === i) && list.length > bestLen) { bestLen = list.length; bestN = a === i ? b : a; }
        });
        if (bestN < 0) continue;
        for (var c = 0; c < lab.length; c++) if (lab[c] === i) lab[c] = bestN;
        p.links = p.links.map(function (l) { return [l[0] === i ? bestN : l[0], l[1] === i ? bestN : l[1]]; });
        if (p.entry === i) p.entry = bestN;
        if (p.back === i) p.back = bestN;
        merged = true;
        scan();
      }
    }
    // Doors: one per link, in the middle of the longest stretch of shared wall; then any room still cut off gets
    // a door to a room you can reach.
    var doorLen = cells(H().door), doors = [], opened = new Set(), reach = new Set();
    var open = function (a, b) {
      var list = pairs.get(Math.min(a, b) * 1000 + Math.max(a, b));
      if (!list) return false;
      var runs = runsOf(list).sort(function (r1, r2) { return r2.length - r1.length; }), d = middle(runs[0], doorLen);
      if (!d) return false;
      d.forEach(function (e) { opened.add(e.o + e.x + ',' + e.y); });
      doors.push({ a: a, b: b, seg: segment(d) });
      return true;
    };
    var seenLink = new Set();
    p.links.forEach(function (l) {
      var key = Math.min(l[0], l[1]) * 1000 + Math.max(l[0], l[1]);
      if (l[0] !== l[1] && count[l[0]] && count[l[1]] && !seenLink.has(key)) { seenLink.add(key); open(l[0], l[1]); }
    });
    if (!count[p.entry]) p.entry = count.indexOf(Math.max.apply(null, count));
    var spread = function () {
      reach.clear(); reach.add(p.entry);
      for (var grew = true; grew;) {
        grew = false;
        doors.forEach(function (d) {
          if (reach.has(d.a) !== reach.has(d.b)) { reach.add(d.a); reach.add(d.b); grew = true; }
        });
      }
    };
    spread();
    for (var fixed = true; fixed;) {
      fixed = false;
      for (i = 0; i < p.rooms.length && !fixed; i++) {
        if (!count[i] || reach.has(i)) continue;
        for (var j = 0; j < p.rooms.length && !fixed; j++) if (reach.has(j) && open(i, j)) { spread(); fixed = true; }
      }
    }
    // Inside walls: every edge between two rooms that is not a door.
    var wallEdges = [];
    pairs.forEach(function (list) { list.forEach(function (e) { if (!opened.has(e.o + e.x + ',' + e.y)) wallEdges.push(e); }); });
    var walls = wallEdges.length ? runsOf(wallEdges).map(segment) : [];
    // Front door from the entry room (or any room on the front), back door from the kitchen. `canExit(x, y)` (in
    // cells, the spot 80 cm out of a door) can turn a side down: then the front door goes on a side, or the back.
    var exitLen = cells(H().exit), exits = [], canExit = opts && opts.canExit;
    var SIDES = { front: [0, -1], back: [0, 1], left: [-1, 0], right: [1, 0] };
    var exitFrom = function (room, side) {
      var sd = SIDES[side], edges = [], o = sd[0] ? 'v' : 'h';
      for (y = 0; y < D; y++) for (x = 0; x < W; x++) {
        var r = lab[y * W + x];
        if (r < 0 || (room >= 0 && r !== room) || at(x + sd[0], y + sd[1]) !== OUT) continue;
        edges.push({ o: o, x: sd[0] > 0 ? x + 1 : x, y: sd[1] > 0 ? y + 1 : y, room: r });
      }
      // Stretches of that side, the outermost first, then the longest; each door is checked with canExit.
      var out = function (e) { return o === 'h' ? e.y * sd[1] : e.x * sd[0]; }, runs = runsOf(edges);
      runs.sort(function (r1, r2) { return out(r2[0]) - out(r1[0]) || r2.length - r1.length; });
      for (var k = 0; k < runs.length; k++) {
        var d = middle(runs[k], exitLen) || middle(runs[k], doorLen);
        if (!d) continue;
        var sg = segment(d), mx = (sg[0] + sg[2]) / 2, my = (sg[1] + sg[3]) / 2, step = 0.8 / cs;
        if (canExit && !canExit(mx + sd[0] * step, my + sd[1] * step)) continue;
        exits.push({ x: mx, y: my, side: side === 'front' ? -1 : side === 'back' ? 1 : 0, dir: sd, room: d[0].room, seg: sg });
        return true;
      }
      return false;
    };
    var tries = [[p.entry, 'front'], [-1, 'front'], [p.entry, 'left'], [p.entry, 'right'], [-1, 'left'], [-1, 'right'], [-1, 'back']];
    for (i = 0; i < tries.length; i++) if (exitFrom(tries[i][0], tries[i][1])) break;
    if (p.back >= 0 && count[p.back] && !(exits[0] && exits[0].side > 0)) exitFrom(p.back, 'back');
    var rooms = p.rooms.map(function (r, k) {
      var sx = 0, sy = 0;
      for (var c = 0; c < lab.length; c++) if (lab[c] === k) { sx += c % W + 0.5; sy += Math.floor(c / W) + 0.5; }
      return { type: r.type, cells: count[k], cx: count[k] ? sx / count[k] : 0, cy: count[k] ? sy / count[k] : 0 };
    });
    return { frame: fr, W: W, D: D, cell: cs, lab: lab, rooms: rooms, walls: walls, doors: doors.map(function (d) { return d.seg; }),
      exits: exits, layout: p.name, bedrooms: rooms.filter(function (r) { return r.type === 'dormitorio' && r.cells; }).length,
      reachable: reach.size === count.filter(function (c) { return c; }).length };
  };
  L.housePlan.OUT = OUT;

  // A point of a plan (in cells, its own frame) in meters on the map.
  L.housePoint = function (plan, x, y) {
    var f = plan.frame, mx = x * plan.cell, my = y * plan.cell;
    return [f.ox + f.ux * mx + f.vx * my, f.oy + f.uy * mx + f.vy * my];
  };

  // ---- Houses of the real map ----

  // Is (x, y) px inside a footprint kept as the map's flat numbers (times k)?
  function insideFlat(f, k, x, y) {
    var c = false, n = f.length >> 1;
    for (var i = 0, j = n - 1; i < n; j = i++) {
      var xi = f[i * 2] * k, yi = f[i * 2 + 1] * k, xj = f[j * 2] * k, yj = f[j * 2 + 1] * k;
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
    }
    return c;
  }

  // The nearest street to a point (px): a unit vector toward it, or straight south if none is within 60 m.
  function toStreet(city, x, y) {
    var B = 50 * city.scale, grid = city._roadGrid;
    if (!grid) {
      grid = city._roadGrid = new Map();
      city.roads.forEach(function (r) {
        for (var k = 1; k < r.pts.length; k++) {
          var a = r.pts[k - 1], b = r.pts[k], seg = [a[0], a[1], b[0], b[1]];
          for (var gy = Math.floor(Math.min(a[1], b[1]) / B); gy <= Math.floor(Math.max(a[1], b[1]) / B); gy++)
            for (var gx = Math.floor(Math.min(a[0], b[0]) / B); gx <= Math.floor(Math.max(a[0], b[0]) / B); gx++) {
              var key = gx + ',' + gy;
              if (!grid.has(key)) grid.set(key, []);
              grid.get(key).push(seg);
            }
        }
      });
    }
    var best = Infinity, bx = 0, by = 1, gx0 = Math.floor(x / B), gy0 = Math.floor(y / B);
    for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
      var list = grid.get((gx0 + dx) + ',' + (gy0 + dy));
      if (!list) continue;
      list.forEach(function (s) {
        var ex = s[2] - s[0], ey = s[3] - s[1], t = L.clamp(((x - s[0]) * ex + (y - s[1]) * ey) / (ex * ex + ey * ey || 1), 0, 1);
        var qx = s[0] + ex * t - x, qy = s[1] + ey * t - y, d = qx * qx + qy * qy;
        if (d < best) { best = d; bx = qx; by = qy; }
      });
    }
    var len = Math.hypot(bx, by);
    return len ? [bx / len, by / len] : [0, 1];
  }

  // The plan of building i of a real-map city, or null if it stays solid. Kept once made. Besides the plan it
  // carries, in px: `outline` (the footprint), `wallsPx`, `doorsPx` and `exitSegsPx` (segments [ax, ay, bx, by]),
  // and `exitsPx` ({ x, y, r }: a front or back doorway's middle and half width).
  L.cityHouse = function (city, i) {
    if (!city.map) return null;
    var cache = city._houses || (city._houses = new Map());
    if (cache.has(i)) return cache.get(i);
    var M = city.map, b = M.buildings[i], Hd = H(), plan = null;
    if (Hd.kinds.indexOf(M.kinds[b[1]]) >= 0) {
      var f = b[0], pts = [];
      for (var j = 0; j + 1 < f.length; j += 2) pts.push([f[j] * M.unit, f[j + 1] * M.unit]);
      var area = areaOf(pts);
      if (pts.length >= 3 && area >= Hd.area[0] && area <= Hd.area[1]) {
        var s = city.scale, cx = 0, cy = 0, frameOf = null;
        pts.forEach(function (q) { cx += q[0]; cy += q[1]; });
        // A door can't lead into another building or past the partido's border.
        var canExit = function (x, y) {
          var q = L.housePoint(frameOf, x, y), wx = q[0] * s, wy = q[1] * s;
          if (city.border && !inside(city.border, wx, wy)) return false;
          var P = L.data.city.page, z = Math.floor(wy / city.cell / P) * city.pcols + Math.floor(wx / city.cell / P), list = city.zoneB.get(z) || [];
          for (var k = 0; k < list.length; k++) if (list[k] !== i && insideFlat(M.buildings[list[k]][0], M.unit * s, wx, wy)) return false;
          return true;
        };
        var street = toStreet(city, cx / pts.length * s, cy / pts.length * s);
        frameOf = { frame: L.houseFrame(pts, street), cell: Hd.cell };
        plan = L.housePlan(pts, street, i, { canExit: canExit });
        var px = function (q) { return [q[0] * s, q[1] * s]; }, f = plan.frame;
        plan.index = i;
        plan.outline = pts.map(px);
        plan.wallsPx = plan.walls.map(function (w) { return px(L.housePoint(plan, w[0], w[1])).concat(px(L.housePoint(plan, w[2], w[3]))); });
        plan.exitsPx = plan.exits.map(function (e) {
          var q = px(L.housePoint(plan, e.x, e.y));
          return { x: q[0], y: q[1], r: Hd.exit / 2 * s, nx: f.ux * e.dir[0] + f.vx * e.dir[1], ny: f.uy * e.dir[0] + f.vy * e.dir[1] };
        });
        var segPx = function (g) { return px(L.housePoint(plan, g[0], g[1])).concat(px(L.housePoint(plan, g[2], g[3]))); };
        plan.doorsPx = plan.doors.map(segPx);
        plan.exitSegsPx = plan.exits.map(function (e) { return segPx(e.seg); });
      }
    }
    cache.set(i, plan);
    return plan;
  };

  // The house (its plan) you are standing in at (x, y) px, or null.
  L.cityHouseAt = function (city, x, y) {
    if (!city.map || !city.zoneB) return null;
    var P = L.data.city.page, z = Math.floor(y / city.cell / P) * city.pcols + Math.floor(x / city.cell / P), list = city.zoneB.get(z);
    if (!list) return null;
    for (var i = 0; i < list.length; i++) {
      var plan = L.cityHouse(city, list[i]);
      if (plan && inside(plan.outline, x, y)) return plan;
    }
    return null;
  };
})(this.Lluvia = this.Lluvia || {});
