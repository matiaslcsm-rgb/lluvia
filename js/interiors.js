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

  function Plan(name) { this.name = name; this.rooms = []; this.links = []; this.entry = 0; this.back = -1; this.hub = -1; }
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

  // Layouts for buildings that aren't houses (data/houses.js, `special`). `sp` is that kind's entry.
  var SPECIAL = {
    // One open room: a shed in the yard, a garage.
    shed: function (W, D, rng, sp) {
      var p = new Plan('shed');
      p.entry = p.back = p.add(sp.room || 'galpon', 0, 0, W, D);
      return p;
    },
    // A shop: the sales floor at the front, a storeroom and a bath at the back.
    shop: function (W, D, rng) {
      if (D < cells(6) || W < cells(3)) return SPECIAL.shed(W, D, rng, { room: 'local' });
      var bd = L.clamp(Math.round(D * 0.28), cells(2.4), cells(5)), p = new Plan('shop'), loc = p.add('local', 0, 0, W, D - bd), dep;
      var bw = cells(MIN_SIDE + 0.2), left = rng() < 0.5;
      if (W - bw >= cells(2.4)) {
        dep = p.add('deposito', left ? bw : 0, D - bd, left ? W : W - bw, D);
        p.link(p.add('bano', left ? 0 : W - bw, D - bd, left ? bw : W, D), dep);
      } else dep = p.add('deposito', 0, D - bd, W, D);
      p.link(dep, loc);
      p.entry = loc; p.back = dep;
      return p;
    },
    // A big hall: a factory floor with an office and a bath in a front corner, or a church with its sacristy at the
    // back.
    nave: function (W, D, rng, sp) {
      var p = new Plan('nave'), n = p.add(sp.room || 'nave', 0, 0, W, D), left = rng() < 0.5;
      p.entry = p.back = n;
      if (W >= cells(10) && D >= cells(10)) {
        if (sp.back) {
          var sw = Math.min(cells(5), W >> 1), sx = left ? 0 : W - sw;
          p.link(p.add(sp.back, sx, D - cells(3.5), sx + sw, D), n);
        } else {
          var ow = cells(4), bw = cells(2.4), od = cells(3.5), ox = left ? 0 : W - ow;
          p.link(p.add('oficina', ox, 0, ox + ow, od), n);
          p.link(p.add('bano', left ? ow : W - ow - bw, 0, left ? ow + bw : W - ow, od), n);
        }
      }
      return p;
    }
  };

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
  // opts.canExit(x, y): optional, false where a door can't lead (a point on the map, in meters);
  // opts.layout and opts.spec: a building that isn't a house (a key of SPECIAL and its entry in data/houses.js);
  // opts.floors: how many floors the house has (with 2 or more it gets a stair and an upper floor); opts.roof
  // ('terraza': a flat roof you can go up to) and opts.basement (true: a stair down to a cellar).
  // Returns { frame, W, D, cell, lab (room index per cell, or OUT), rooms [{ type, cells, cx, cy }], walls,
  // doors (segments in cells), exits [{ x, y, side, dir, seg }] (a door's middle on the outline; side -1 front,
  // 1 back, 0 a side; dir: outward, in the frame), layout, bedrooms, reachable, and with an upper floor
  // stairs [{ x0, y0, x1, y1, axis, up, from }] (cells; each joins floor `from` to the one above) and levels (the
  // plan of every floor but the ground one, by number: -1 the basement, 1 and up; same frame, no exits). `stair`
  // (the one from the ground floor up) and `upper` (floor 1) are kept for short.
  L.housePlan = function (pts, toStreet, seed, opts) {
    opts = opts || {};
    var cs = H().cell, fr = L.houseFrame(pts, toStreet), W = Math.max(2, Math.round(fr.w / cs)), D = Math.max(2, Math.round(fr.d / cs));
    var rng = L.makeRng((seed * 2654435761) >>> 0 || 1), n = bedroomsFor(areaOf(pts), rng);
    var p = opts.layout ? SPECIAL[opts.layout](W, D, rng, opts.spec || {}) : layoutFor(W, D, n, rng);
    if (rng() < 0.5) p.rooms.forEach(function (r) { var x0 = r.x0; r.x0 = W - r.x1; r.x1 = W - x0; }); // mirrored
    var plan = finish(pts, fr, W, D, p, opts.canExit, true), floors = opts.floors || 1;
    if (floors >= 2) {
      // No room for a stair: the biggest bedroom becomes the stair hall, joined to the room it opened into (the
      // bedrooms go upstairs), as in many real two-floor houses.
      if (!placeStair(plan, L.makeRng(1))) {
        var beds = p.rooms.map(function (r, k) { return k; }).filter(function (k) { return p.rooms[k].type === 'dormitorio' && plan.rooms[k].cells; });
        beds.sort(function (a, b) { return plan.rooms[b].cells - plan.rooms[a].cells; });
        var into = beds.length ? p.links.filter(function (l) { return l[0] === beds[0] || l[1] === beds[0]; })[0] : null;
        if (into) {
          p.merges = [[beds[0], into[0] === beds[0] ? into[1] : into[0]]];
          plan = finish(pts, fr, W, D, p, opts.canExit, true);
        }
      }
    }
    plan.stairs = []; plan.levels = {};
    var taken = new Uint8Array(W * D);
    if (floors >= 2) addUpperFloor(pts, plan, rng, taken);
    if (opts.roof === 'terraza') addRoof(pts, plan, floors, rng, taken);
    if (opts.basement) addBasement(pts, plan, rng, taken);
    finishLevels(plan);
    return plan;
  };

  // Turns a layout into a plan: cuts it to the footprint, merges leftovers, opens doors, finds the walls and (if
  // `withExits`) the front and back doors.
  function finish(pts, fr, W, D, p, canExit, withExits) {
    var cs = H().cell, lab = new Int16Array(W * D).fill(-1), x, y, i;
    while (p.rooms.length && p.rooms[p.rooms.length - 1].piece) p.rooms.pop(); // pieces from an earlier run
    p.rooms.forEach(function (r, k) { if (r.piece) return; var id = r.as >= 0 ? r.as : k; for (y = r.y0; y < r.y1; y++) for (x = r.x0; x < r.x1; x++) lab[y * W + x] = id; });
    for (y = 0; y < D; y++) for (x = 0; x < W; x++) {
      var mx = (x + 0.5) * cs, my = (y + 0.5) * cs;
      if (!inside(pts, fr.ox + fr.ux * mx + fr.vx * my, fr.oy + fr.uy * mx + fr.vy * my)) lab[y * W + x] = OUT;
    }
    // A room the footprint cut in separate pieces (a U-shaped school, an L-shaped house) keeps its biggest piece; each
    // other piece becomes a room of its own, which gets its door below.
    var comp = new Int32Array(W * D).fill(-1), comps = [];
    for (var c0 = 0; c0 < W * D; c0++) {
      if (lab[c0] < 0 || comp[c0] >= 0) continue;
      var stack = [c0], cellsOf = [];
      comp[c0] = comps.length;
      while (stack.length) {
        var cc = stack.pop(), ccx = cc % W, ccy = (cc - ccx) / W;
        cellsOf.push(cc);
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
          var nx2 = ccx + d[0], ny2 = ccy + d[1], m = ny2 * W + nx2;
          if (nx2 >= 0 && ny2 >= 0 && nx2 < W && ny2 < D && comp[m] < 0 && lab[m] === lab[c0]) { comp[m] = comps.length; stack.push(m); }
        });
      }
      comps.push({ room: lab[c0], cells: cellsOf });
    }
    var biggest = {};
    comps.forEach(function (q, k) { if (!(q.room in biggest) || q.cells.length > comps[biggest[q.room]].cells.length) biggest[q.room] = k; });
    comps.forEach(function (q, k) {
      if (biggest[q.room] === k) return;
      var src = p.rooms[q.room], id = p.rooms.length;
      p.rooms.push({ type: src.type, x0: src.x0, y0: src.y0, x1: src.x1, y1: src.y1, piece: true });
      q.cells.forEach(function (c) { lab[c] = id; });
    });
    // Rooms joined into another one (a bedroom given to the stair).
    (p.merges || []).forEach(function (m) {
      for (var c = 0; c < lab.length; c++) if (lab[c] === m[0]) lab[c] = m[1];
      p.links = p.links.filter(function (l) { return l[0] !== m[0] && l[1] !== m[0]; });
    });
    var grown = (p.merges || []).map(function (m) { return m[1]; });
    var at = function (cx, cy) { return cx < 0 || cy < 0 || cx >= W || cy >= D ? OUT : lab[cy * W + cx]; };
    // Edges between two different rooms, by pair.
    var pairs, count, roomy;
    var scan = function () {
      pairs = new Map(); count = new Array(p.rooms.length).fill(0); roomy = new Array(p.rooms.length).fill(0);
      for (y = 0; y < D; y++) for (x = 0; x < W; x++) {
        var a = lab[y * W + x];
        if (a < 0) continue;
        count[a]++;
        if (at(x + 1, y) === a && at(x + 2, y) === a && at(x, y + 1) === a && at(x, y + 2) === a && at(x + 1, y + 1) === a && at(x + 2, y + 2) === a && at(x + 2, y + 1) === a && at(x + 1, y + 2) === a) roomy[a]++; // a 1.5 × 1.5 m spot
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
    // Leftovers the footprint cut too small, or too thin to stand in (on a turned house the walls eat a strip narrower than 1.5 m), join the
    // neighbour they share the most wall with.
    var minCells = Math.ceil(H().minRoom / (cs * cs)), merged = true;
    while (merged) {
      merged = false;
      for (i = 0; i < p.rooms.length && !merged; i++) {
        if (!count[i] || (count[i] >= minCells && roomy[i] >= 2)) continue;
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
    // Cells with room to stand: part of a 1.5 × 1.5 m block of their room. A door goes where both sides have it, not
    // onto a thin arm of a room (an L-shaped house leaves some): on a turned house the walls eat those.
    var roomyCell = new Uint8Array(W * D);
    for (y = 0; y + 2 < D; y++) for (x = 0; x + 2 < W; x++) {
      var r0 = lab[y * W + x], full = r0 >= 0;
      for (var by = 0; by < 3 && full; by++) for (var bx = 0; bx < 3 && full; bx++) if (lab[(y + by) * W + x + bx] !== r0) full = false;
      if (full) for (by = 0; by < 3; by++) for (bx = 0; bx < 3; bx++) roomyCell[(y + by) * W + x + bx] = 1;
    }
    var standable = function (e) { return e.o === 'v' ? roomyCell[e.y * W + e.x - 1] && roomyCell[e.y * W + e.x] : roomyCell[(e.y - 1) * W + e.x] && roomyCell[e.y * W + e.x]; };
    var open = function (a, b, loose) {
      var list = pairs.get(Math.min(a, b) * 1000 + Math.max(a, b));
      if (list && !loose) list = list.filter(standable);
      if (!list || !list.length) return false;
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
    // A room left cut off opens into the hub first (a building's palier), else into any room you can reach; only
    // where there is room to stand on both sides, and only if nothing else works, anywhere.
    [false, true].forEach(function (loose) {
      for (var fixed = true; fixed;) {
        fixed = false;
        for (i = 0; i < p.rooms.length && !fixed; i++) {
          if (!count[i] || reach.has(i)) continue;
          for (var j0 = -1; j0 < p.rooms.length && !fixed; j0++) {
            var j = j0 < 0 ? p.hub : j0;
            if (j >= 0 && reach.has(j) && open(i, j, loose)) { spread(); fixed = true; }
          }
        }
      }
    });
    // Inside walls: every edge between two rooms that is not a door.
    var wallEdges = [];
    pairs.forEach(function (list) { list.forEach(function (e) { if (!opened.has(e.o + e.x + ',' + e.y)) wallEdges.push(e); }); });
    var walls = wallEdges.length ? runsOf(wallEdges).map(segment) : [];
    // Front door from the entry room (or any room on the front), back door from the kitchen. `canExit(x, y)` (in
    // cells, the spot 80 cm out of a door) can turn a side down: then the front door goes on a side, or the back.
    var exitLen = cells(H().exit), exits = [];
    var ok = function (cx, cy) { var m = L.housePoint({ frame: fr, cell: cs }, cx, cy); return canExit(m[0], m[1]); };
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
        var sg = segment(d), mx = (sg[0] + sg[2]) / 2, my = (sg[1] + sg[3]) / 2, step = 0.8 / cs, near = 0.3 / cs;
        // Free 80 cm out of its middle, and right outside its middle and both ends (in the city's dense blocks the
        // footprints of neighbours touch and overlap a little).
        if (canExit && !(ok(mx + sd[0] * step, my + sd[1] * step) && ok(mx + sd[0] * near, my + sd[1] * near) &&
          ok(sg[0] + sd[0] * near, sg[1] + sd[1] * near) && ok(sg[2] + sd[0] * near, sg[3] + sd[1] * near))) continue;
        exits.push({ x: mx, y: my, side: side === 'front' ? -1 : side === 'back' ? 1 : 0, dir: sd, room: d[0].room, seg: sg });
        return true;
      }
      return false;
    };
    if (withExits) {
      var tries = [[p.entry, 'front'], [-1, 'front'], [p.entry, 'left'], [p.entry, 'right'], [-1, 'left'], [-1, 'right'], [-1, 'back']];
      for (i = 0; i < tries.length; i++) if (exitFrom(tries[i][0], tries[i][1])) break;
      if (p.back >= 0 && count[p.back] && !(exits[0] && exits[0].side > 0)) exitFrom(p.back, 'back');
    }
    var rooms = p.rooms.map(function (r, k) {
      var sx = 0, sy = 0;
      for (var c = 0; c < lab.length; c++) if (lab[c] === k) { sx += c % W + 0.5; sy += Math.floor(c / W) + 0.5; }
      return { type: r.type, cells: count[k], cx: count[k] ? sx / count[k] : 0, cy: count[k] ? sy / count[k] : 0, grown: grown.indexOf(k) >= 0 };
    });
    return { frame: fr, W: W, D: D, cell: cs, lab: lab, rooms: rooms, walls: walls, doors: doors.map(function (d) { return d.seg; }),
      exits: exits, layout: p.name, bedrooms: rooms.filter(function (r) { return r.type === 'dormitorio' && r.cells; }).length,
      reachable: reach.size === count.filter(function (c) { return c; }).length, entry: p.entry };
  }
  L.housePlan.OUT = OUT;

  // ---- Stairs and the upper floor ----
  // The stair is a straight flight STAIR_W wide and STAIR_L long against a wall of the main room (living,
  // living-kitchen or the studio's room), with room to stand at its foot and without blocking any door. On the
  // ground floor its railing closes both long sides and the top, so you walk in only from the foot; upstairs it
  // closes both long sides and the foot, so you step out only at the top. Walking along it takes you up: `t`, from
  // 0 at the foot to 1 at the top, is how high you are.
  // Wider than a real one (about 1 m) for the same reason as the corridors: on a turned house its railings take
  // room, and a narrower stair closes up.
  var STAIR_W = 2, STAIR_L = 3.5;

  // Where along a stair a point (in cells of the plan's frame) is: t from 0 (foot) to 1 (top), or null if the point
  // isn't on it.
  function stairT(st, x, y) {
    if (x < st.x0 || x > st.x1 || y < st.y0 || y > st.y1) return null;
    var a = st.axis === 'y' ? (y - st.y0) / (st.y1 - st.y0) : (x - st.x0) / (st.x1 - st.x0);
    return st.up > 0 ? a : 1 - a;
  }
  L.stairT = stairT;

  // The stair's railings as wall segments (cells): both long sides, and the top end (ground floor) or the foot
  // (upper floor).
  function railings(st, upper) {
    var lo = st.up > 0 ? 'start' : 'end', closed = upper ? lo : (lo === 'start' ? 'end' : 'start'), segs;
    if (st.axis === 'y') {
      segs = [[st.x0, st.y0, st.x0, st.y1], [st.x1, st.y0, st.x1, st.y1]];
      segs.push(closed === 'start' ? [st.x0, st.y0, st.x1, st.y0] : [st.x0, st.y1, st.x1, st.y1]);
    } else {
      segs = [[st.x0, st.y0, st.x1, st.y0], [st.x0, st.y1, st.x1, st.y1]];
      segs.push(closed === 'start' ? [st.x0, st.y0, st.x0, st.y1] : [st.x1, st.y0, st.x1, st.y1]);
    }
    return segs;
  }

  // Finds a place for the stair: in the living (or the studio's room), in a room that grew with a bedroom given to
  // the stair, else in the kitchen. Or null.
  // opts.types: which rooms may hold it (a pattern of room types); opts.taken: cells already used by another stair.
  function placeStair(plan, rng, opts) {
    opts = opts || {};
    var types = opts.types || /living|ambiente|cocina|local|deposito|nave|templo|galpon/;
    var rank = function (k) { var r = plan.rooms[k]; return r.grown || r.type === 'pasillo' ? 0 : r.type === 'cocina' ? 2 : 1; };
    var order = plan.rooms.map(function (r, k) { return k; }).filter(function (k) { return plan.rooms[k].cells && (plan.rooms[k].grown || types.test(plan.rooms[k].type)); });
    order.sort(function (a, b) { return rank(a) - rank(b) || plan.rooms[b].cells - plan.rooms[a].cells; });
    for (var i = 0; i < order.length; i++) { var st = placeStairIn(plan, order[i], rng, opts.taken); if (st) return st; }
    return null;
  }

  // Marks a stair, the room to stand at both ends and a cell on each side as taken.
  function markTaken(taken, st, W, D) {
    var ax = st.axis === 'x' ? 4 : 1, ay = st.axis === 'y' ? 4 : 1;
    for (var y = Math.max(0, st.y0 - ay); y < Math.min(D, st.y1 + ay); y++)
      for (var x = Math.max(0, st.x0 - ax); x < Math.min(W, st.x1 + ax); x++) taken[y * W + x] = 1;
  }

  function placeStairIn(plan, main, rng, taken) {
    var W = plan.W, D = plan.D, lab = plan.lab, sw = cells(STAIR_W), sl = cells(STAIR_L), foot = 3, landing = 2;
    // Cells next to a door or doorway can't be under the stair or its railing.
    var nearDoor = new Uint8Array(W * D), mark = function (g) {
      for (var y = Math.floor(Math.min(g[1], g[3])) - 1; y <= Math.ceil(Math.max(g[1], g[3])); y++)
        for (var x = Math.floor(Math.min(g[0], g[2])) - 1; x <= Math.ceil(Math.max(g[0], g[2])); x++)
          if (x >= 0 && y >= 0 && x < W && y < D) nearDoor[y * W + x] = 1;
    };
    plan.doors.forEach(mark); plan.exits.forEach(function (e) { mark(e.seg); });
    var free = function (x, y) { return x >= 0 && y >= 0 && x < W && y < D && lab[y * W + x] === main && !nearDoor[y * W + x] && !(taken && taken[y * W + x]); };
    var cands = [];
    ['y', 'x'].forEach(function (axis) {
      var lw = axis === 'y' ? sw : sl, lh = axis === 'y' ? sl : sw;
      for (var y0 = 0; y0 + lh <= D; y0++) for (var x0 = 0; x0 + lw <= W; x0++) {
        var ok = true;
        for (var y = y0; y < y0 + lh && ok; y++) for (var x = x0; x < x0 + lw && ok; x++) if (!free(x, y)) ok = false;
        if (!ok) continue;
        // Against a wall: one long side borders something that isn't the room.
        var side = function (c) { for (var k = 0; k < (axis === 'y' ? lh : lw); k++) { var xx = axis === 'y' ? c : x0 + k, yy = axis === 'y' ? y0 + k : c; if (xx >= 0 && yy >= 0 && xx < W && yy < D && lab[yy * W + xx] === main) return false; } return true; };
        var walled = axis === 'y' ? side(x0 - 1) || side(x0 + lw) : side(y0 - 1) || side(y0 + lh);
        if (!walled) continue;
        [1, -1].forEach(function (up) {
          // Room to stand at the foot (in this room), and a landing past the top (inside the house: upstairs it is
          // the corridor).
          for (var k = 1; k <= foot; k++) for (var j = 0; j < sw; j++) {
            var fx = axis === 'y' ? x0 + j : (up > 0 ? x0 - k : x0 + lw - 1 + k), fy = axis === 'y' ? (up > 0 ? y0 - k : y0 + lh - 1 + k) : y0 + j;
            if (!(fx >= 0 && fy >= 0 && fx < W && fy < D && lab[fy * W + fx] === main && !(taken && taken[fy * W + fx]))) return;
            var tx = axis === 'y' ? x0 + j : (up > 0 ? x0 + lw - 1 + k : x0 - k), ty = axis === 'y' ? (up > 0 ? y0 + lh - 1 + k : y0 - k) : y0 + j;
            if (k <= landing && !(tx >= 0 && ty >= 0 && tx < W && ty < D && lab[ty * W + tx] >= 0)) return;
          }
          cands.push({ x0: x0, y0: y0, x1: x0 + lw, y1: y0 + lh, axis: axis, up: up });
        });
      }
    });
    // Keep only spots that leave the room in one piece: walking from the foot around the stair, with room to pass
    // (a body takes 2 × 2 cells, and the stair a cell more along its sides and its closed end: on a turned house its
    // railings take room), every door of the room is still reached.
    var whole = function (st) {
      var seen = new Uint8Array(W * D), win = new Uint8Array(W * D);
      var ex = st.axis === 'y' ? [1, 1, st.up > 0 ? 0 : 1, st.up > 0 ? 1 : 0] : [st.up > 0 ? 0 : 1, st.up > 0 ? 1 : 0, 1, 1];
      var blocked = function (x, y) { return x >= st.x0 - ex[0] && x < st.x1 + ex[1] && y >= st.y0 - ex[2] && y < st.y1 + ex[3]; };
      var open1 = function (x, y) { return x >= 0 && y >= 0 && x < W && y < D && lab[y * W + x] === main && !blocked(x, y); };
      // A spot (x, y) is the 2 × 2 block from that cell; it is open if all four cells are.
      var spot = function (x, y) { return open1(x, y) && open1(x + 1, y) && open1(x, y + 1) && open1(x + 1, y + 1); };
      var sx = st.axis === 'y' ? st.x0 + 1 : (st.up > 0 ? st.x0 - 2 : st.x1), sy = st.axis === 'y' ? (st.up > 0 ? st.y0 - 2 : st.y1) : st.y0 + 1;
      if (!spot(sx, sy)) return false;
      var q = [[sx, sy]];
      win[sy * W + sx] = 1;
      while (q.length) {
        var c = q.pop();
        seen[c[1] * W + c[0]] = seen[c[1] * W + c[0] + 1] = seen[(c[1] + 1) * W + c[0]] = seen[(c[1] + 1) * W + c[0] + 1] = 1;
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
          var x = c[0] + d[0], y = c[1] + d[1];
          if (x < 0 || y < 0 || win[y * W + x] || !spot(x, y)) return;
          win[y * W + x] = 1; q.push([x, y]);
        });
      }
      return plan.doors.concat(plan.exits.map(function (e) { return e.seg; })).every(function (g) {
        var mine = 0, got = 0, n = Math.max(Math.abs(g[2] - g[0]), Math.abs(g[3] - g[1]));
        for (var k = 0; k < n; k++) {
          var cs2 = g[0] === g[2] ? [[g[0] - 1, Math.min(g[1], g[3]) + k], [g[0], Math.min(g[1], g[3]) + k]] : [[Math.min(g[0], g[2]) + k, g[1] - 1], [Math.min(g[0], g[2]) + k, g[1]]];
          cs2.forEach(function (q2) {
            if (q2[0] < 0 || q2[1] < 0 || q2[0] >= W || q2[1] >= D || lab[q2[1] * W + q2[0]] !== main) return;
            mine++; if (seen[q2[1] * W + q2[0]]) got++;
          });
        }
        return !mine || got > 0;
      });
    };
    cands = cands.filter(whole);
    if (!cands.length) return null;
    var st = cands[Math.floor(rng() * cands.length)];
    st.room = main;
    return st;
  }

  // The upper floor: a corridor along the stair (with the stairwell in it) and the bedrooms and a bath on its sides.
  function upperLayout(W, D, st, n, rng) {
    var p = new Plan('upper'), hall = cells(H().hall), axis = st.axis;
    var size = axis === 'y' ? W : D, len = axis === 'y' ? D : W, c0 = axis === 'y' ? st.x0 : st.y0, c1 = axis === 'y' ? st.x1 : st.y1;
    // The corridor holds the stairwell with a walkway on both sides, so no room borders the railing.
    var h0 = Math.max(0, c0 - hall), h1 = Math.min(size, c1 + hall), narrow = cells(H().bedroomMin);
    // A strip left too narrow for a room on either side joins the corridor.
    if (h0 < narrow) h0 = 0;
    if (size - h1 < narrow) h1 = size;
    var rect = function (a0, a1, b0, b1) { return axis === 'y' ? [a0, b0, a1, b1] : [b0, a0, b1, a1]; }; // (cross, along) → x0 y0 x1 y1
    var add = function (type, r) { return p.add(type, r[0], r[1], r[2], r[3]); };
    var h = add('pasillo', rect(h0, h1, 0, len));
    var parts = [[0, h0], [h1, size]].filter(function (q) { return q[1] - q[0] > 0; }), types = bedroomsAndBath(Math.max(1, n), rng), bathPlaced = false;
    parts.forEach(function (q, pi) {
      if (q[1] - q[0] < cells(H().bedroomMin)) { p.link(add('pasillo', rect(q[0], q[1], 0, len)), h); return; }
      var count = Math.max(1, Math.min(4, Math.round(len / cells(3.4)))), mine = [];
      for (var k = 0; k < count; k++) mine.push('dormitorio');
      if (!bathPlaced && (pi === parts.length - 1 || types.indexOf('bano') >= 0)) { mine[Math.floor(rng() * count)] = 'bano'; bathPlaced = true; }
      var ws = wobble(mine.map(function (t) { return t === 'bano' ? 2.4 : 3.3; }), rng), cut = cuts(len, ws, cells(MIN_SIDE));
      if (!cut) { p.link(add('dormitorio', rect(q[0], q[1], 0, len)), h); return; }
      mine.forEach(function (t, k) { p.link(add(t, rect(q[0], q[1], cut[k], cut[k + 1])), h); });
    });
    p.entry = h;
    return p;
  }

  function addUpperFloor(pts, plan, rng, taken) {
    var st = placeStair(plan, rng, { taken: taken });
    if (!st) return;
    st.from = 0;
    plan.stairs.push(st); plan.stair = st;
    markTaken(taken, st, plan.W, plan.D);
    plan.upper = plan.levels[1] = finish(pts, plan.frame, plan.W, plan.D, upperLayout(plan.W, plan.D, st, Math.max(1, plan.bedrooms), rng), null, false);
  }

  // A single open floor covering the whole footprint: a flat roof or a cellar.
  function openLevel(pts, plan, type) {
    var p = new Plan(type);
    p.entry = p.add(type, 0, 0, plan.W, plan.D);
    var level = finish(pts, plan.frame, plan.W, plan.D, p, null, false);
    level.open = type;
    return level;
  }

  // A flat roof you can walk ("terraza"): a stair up to it from the top floor (the living below a one-floor
  // house; the corridor or a bedroom upstairs), and the roof itself, open, closed by its low wall all around.
  function addRoof(pts, plan, floors, rng, taken) {
    var top = floors >= 2 ? 1 : 0, below = top ? plan.levels[1] : plan;
    if (!below) return;
    var st = placeStair(below, rng, { taken: taken, types: top ? /pasillo|dormitorio/ : null });
    if (!st) return;
    st.from = top;
    plan.stairs.push(st);
    markTaken(taken, st, plan.W, plan.D);
    plan.levels[top + 1] = openLevel(pts, plan, 'terraza');
    if (!top) { plan.stair = st; plan.upper = plan.levels[1]; }
  }

  // A cellar: a stair down from the ground floor, the same flight turned around (you stand at its top in the room).
  function addBasement(pts, plan, rng, taken) {
    var st = placeStair(plan, rng, { taken: taken });
    if (!st) return;
    st.up = -st.up; st.from = -1;
    plan.stairs.push(st);
    markTaken(taken, st, plan.W, plan.D);
    plan.levels[-1] = openLevel(pts, plan, 'sotano');
  }

  // A railing that runs along the building's own wall is left out: the wall already closes that side, and the two
  // together would make a wall too thick for a turned building.
  function onOutline(plan, g) {
    var W = plan.W, D = plan.D, outside = function (x, y) { return x < 0 || y < 0 || x >= W || y >= D || plan.lab[y * W + x] === OUT; };
    var sides = g[0] === g[2] ? [[-1, 0], [0, 0]] : [[0, -1], [0, 0]];
    return sides.some(function (sd) {
      for (var k = 0, n = Math.max(Math.abs(g[2] - g[0]), Math.abs(g[3] - g[1])); k < n; k++) {
        var x = (g[0] === g[2] ? g[0] : Math.min(g[0], g[2]) + k) + sd[0], y = (g[0] === g[2] ? Math.min(g[1], g[3]) + k : g[1]) + sd[1];
        if (!outside(x, y)) return false;
      }
      return true;
    });
  }

  // Every floor gets the railings of the stairs that reach it: the lower end of the one going up from it, the upper
  // end of the one coming from below. A building's stair lane that no flight uses on a floor is closed all round.
  function finishLevels(plan) {
    var keep = function (g) { return !onOutline(plan, g); }, nums = [0];
    Object.keys(plan.levels).forEach(function (k) { nums.push(+k); });
    nums.forEach(function (f) {
      var level = f === 0 ? plan : plan.levels[f], add = [];
      plan.stairs.forEach(function (s) {
        if (s.from === f) add = add.concat(railings(s, false));
        else if (s.from + 1 === f) add = add.concat(railings(s, true));
      });
      (plan.lanes || []).forEach(function (ln, li) {
        if (plan.stairs.some(function (s) { return s.lane === li && (s.from === f || s.from + 1 === f); })) return;
        add.push([ln.x0, ln.y0, ln.x1, ln.y0], [ln.x1, ln.y0, ln.x1, ln.y1], [ln.x0, ln.y1, ln.x1, ln.y1], [ln.x0, ln.y0, ln.x0, ln.y1]);
      });
      level.walls = level.walls.concat(add.filter(keep));
    });
    plan.top = Math.max.apply(null, nums); plan.bottom = Math.min.apply(null, nums);
  }

  // The plan of floor f (0: the plan itself), or null.
  L.planLevel = function (plan, f) { return !f ? plan : plan.levels && plan.levels[f] || null; };

  // ---- Apartment buildings ----
  // A core in the middle of the depth: the palier with the stair, two flights side by side ("U"): one goes up
  // from the even floors, the other from the odd ones (and down to the basement), so every floor lands at one end
  // of the core, the front one on the ground floor. The palier goes all round the stair. In front and behind it,
  // two to four apartments per floor, each laid out like a house (living, kitchen, bedrooms, bath) with its door
  // to the palier. The ground floor has the entrance hall from the street to the palier; on top, a flat roof with
  // the stair's machine room; below, if it has one, a basement. Every floor is the same, as in a real building.
  // Same arguments and result as L.housePlan, plus `lanes` (the two flights' rectangles), or null if no core fits.
  // If the street door can't go on the entrance hall (another building stands against that side), the building
  // tries with its front on another side, so you always come in by the hall.
  L.buildingPlan = function (pts, toStreet, seed, opts) {
    var dirs = [toStreet, [-toStreet[1], toStreet[0]], [toStreet[1], -toStreet[0]], [-toStreet[0], -toStreet[1]]], first = null;
    for (var k = 0; k < dirs.length; k++) {
      var plan = buildingOnce(pts, dirs[k], seed, opts || {});
      if (plan && plan.exits.some(function (e) { return plan.rooms[e.room].type === 'hall'; })) return plan;
      first = first || plan;
    }
    return first;
  };

  function buildingOnce(pts, toStreet, seed, opts) {
    var Hd = H(), B = Hd.building, cs = Hd.cell, fr = L.houseFrame(pts, toStreet), W = Math.round(fr.w / cs), D = Math.round(fr.d / cs);
    var rng = L.makeRng((seed * 2654435761) >>> 0 || 1), lw = cells(B.lane), ll = cells(B.flight), land = cells(B.landing), side = cells(B.side);
    var cw = 2 * lw + 2 * side, cl = ll + 2 * land;
    if (W < cw + 2 || D < cl + cells(6)) return null;
    var isIn = function (x, y) { var m = L.housePoint({ frame: fr, cell: cs }, x + 0.5, y + 0.5); return inside(pts, m[0], m[1]); };
    var fits = function (x0, y0) {
      for (var y = y0; y < y0 + cl; y++) for (var x = x0; x < x0 + cw; x++) if (!isIn(x, y)) return false;
      return true;
    };
    // Centered if there is room for apartments on both sides, else against one side wall.
    var xs = W - cw >= cells(7) ? [Math.round((W - cw) / 2 + (rng() - 0.5) * 4)] : [];
    xs = xs.concat(rng() < 0.5 ? [0, W - cw] : [W - cw, 0]);
    var ys = [0.45, 0.4, 0.5, 0.35, 0.55].map(function (k) { return Math.round(D * k - cl / 2); }).filter(function (y) { return y >= cells(3) && D - y - cl >= cells(3); });
    var cx0 = -1, cy0 = -1;
    for (var a = 0; a < ys.length && cx0 < 0; a++) for (var b = 0; b < xs.length && cx0 < 0; b++) if (fits(xs[b], ys[a])) { cx0 = xs[b]; cy0 = ys[a]; }
    if (cx0 < 0) return null;
    var cx1 = cx0 + cw, cy1 = cy0 + cl, ax = cx0 + side;
    var lanes = [{ x0: ax, y0: cy0 + land, x1: ax + lw, y1: cy0 + land + ll }, { x0: ax + lw, y0: cy0 + land, x1: ax + 2 * lw, y1: cy0 + land + ll }];
    // Apartments: front and back of the core, split in two side by side on bigger floors.
    var area = 0;
    for (var c = 0; c < W * D; c++) if (isIn(c % W, Math.floor(c / W))) area += cs * cs;
    // rects: [x0, y0, x1, y1, which way the apartment's door faces: 'n' toward the back (a front apartment), 's'
    // toward the front, 'e' and 'w' sideways]. Beside the core, a strip wide enough is one more apartment; a
    // narrower one widens the palier.
    var units = area < B.units[0] ? 2 : area < B.units[1] ? 3 : 4, xm = Math.round((cx0 + cx1) / 2), pal0 = cx0, pal1 = cx1;
    var rects = units >= 3 ? [[0, 0, xm, cy0, 's'], [xm, 0, W, cy0, 's']] : [[0, 0, W, cy0, 's']];
    rects = rects.concat(units >= 4 ? [[0, cy1, xm, D, 'n'], [xm, cy1, W, D, 'n']] : [[0, cy1, W, D, 'n']]);
    if (cx0 >= cells(B.strip)) rects.push([0, cy0, cx0, cy1, 'e']); else pal0 = 0;
    if (W - cx1 >= cells(B.strip)) rects.push([cx1, cy0, W, cy1, 'w']); else pal1 = W;
    var fill = opts.fill;
    var floorLayout = function (ground) {
      var r2 = L.makeRng(((seed + 7) * 2654435761) >>> 0 || 1), p = new Plan(ground ? 'edificio-pb' : 'edificio'), entries = [];
      // A school, a clinic, offices: instead of apartments, a row of rooms of one kind along the palier (classrooms,
      // consulting rooms, offices), one of them a bath.
      if (fill) rects.forEach(function (rc, ri) {
        var side = rc[4] === 'e' || rc[4] === 'w', uw = side ? rc[3] - rc[1] : rc[2] - rc[0], ud = side ? rc[2] - rc[0] : rc[3] - rc[1];
        if (uw < cells(MIN_SIDE) || ud < cells(MIN_SIDE)) return;
        var k = Math.max(1, Math.round(uw * cs / fill.size)), cut = cuts(uw, wobble(new Array(k).fill(1), r2), cells(MIN_SIDE)) || [0, uw];
        for (var j = 0; j + 1 < cut.length; j++) {
          var a0 = cut[j], a1 = cut[j + 1], t = ri === 0 && j === 0 && cut.length > 2 ? 'bano' : fill.room;
          if (rc[4] === 's') entries.push(p.add(t, rc[0] + a0, rc[1], rc[0] + a1, rc[3]));
          else if (rc[4] === 'n') entries.push(p.add(t, rc[0] + a0, rc[1], rc[0] + a1, rc[3]));
          else entries.push(p.add(t, rc[0], rc[1] + a0, rc[2], rc[1] + a1));
        }
      });
      else rects.forEach(function (rc) {
        // Laid out like a house whose front faces the core: uw along its door's side, ud away from it.
        var side = rc[4] === 'e' || rc[4] === 'w', uw = side ? rc[3] - rc[1] : rc[2] - rc[0], ud = side ? rc[2] - rc[0] : rc[3] - rc[1];
        if (uw < cells(MIN_SIDE) || ud < cells(MIN_SIDE)) return;
        var lp = layoutFor(uw, ud, bedroomsFor(uw * ud * cs * cs, r2), r2), base = p.rooms.length, mir = r2() < 0.5;
        lp.rooms.forEach(function (r) {
          var a0 = mir ? uw - r.x1 : r.x0, a1 = mir ? uw - r.x0 : r.x1;
          if (rc[4] === 's') p.add(r.type, rc[0] + a0, rc[3] - r.y1, rc[0] + a1, rc[3] - r.y0);
          else if (rc[4] === 'n') p.add(r.type, rc[0] + a0, rc[1] + r.y0, rc[0] + a1, rc[1] + r.y1);
          else if (rc[4] === 'e') p.add(r.type, rc[2] - r.y1, rc[1] + a0, rc[2] - r.y0, rc[1] + a1);
          else p.add(r.type, rc[0] + r.y0, rc[1] + a0, rc[0] + r.y1, rc[1] + a1);
        });
        lp.links.forEach(function (l) { p.link(base + l[0], base + l[1]); });
        entries.push(base + lp.entry);
      });
      // On the ground floor the palier opens wide into the entrance hall (one room: no wall between them).
      var pal = p.add(ground ? 'hall' : 'palier', pal0, cy0, pal1, cy1);
      if (ground) { var hw = cells(B.hall), hx = L.clamp(Math.round(xm - hw / 2), cx0, cx1 - hw); p.rooms[p.add('hall', hx, 0, hx + hw, cy0)].as = pal; }
      entries.forEach(function (e) { p.link(e, pal); });
      p.hub = p.entry = pal;
      return p;
    };
    var core = function (type, around) {
      var p = new Plan(type);
      if (around) p.add(around, 0, 0, W, D);
      p.hub = p.entry = p.add(type, pal0, cy0, pal1, cy1);
      if (around) p.link(0, p.entry);
      return finish(pts, fr, W, D, p, null, false);
    };
    var plan = finish(pts, fr, W, D, floorLayout(true), opts.canExit, true);
    var floors = Math.max(2, opts.floors || 2), terrace = opts.roof !== 'tejas' && opts.roof !== 'chapa', bottom = opts.basement ? -1 : 0, top = terrace ? floors : floors - 1;
    plan.lanes = lanes; plan.stairs = []; plan.levels = {}; plan.kind = 'edificio';
    for (var f = bottom; f < top; f++) {
      var li = ((f % 2) + 2) % 2, ln = lanes[li];
      plan.stairs.push({ x0: ln.x0, y0: ln.y0, x1: ln.x1, y1: ln.y1, axis: 'y', up: li ? -1 : 1, from: f, lane: li });
    }
    var upper = finish(pts, fr, W, D, floorLayout(false), null, false);
    for (f = 1; f < (terrace ? top : top + 1); f++) plan.levels[f] = copyLevel(upper);
    if (terrace) { plan.levels[top] = core('casilla', 'terraza'); plan.levels[top].open = 'terraza'; }
    if (bottom < 0) { plan.levels[-1] = core('palier', 'sotano'); plan.levels[-1].open = 'sotano'; }
    plan.upper = plan.levels[1];
    plan.stair = plan.stairs.filter(function (s) { return s.from === 0; })[0];
    finishLevels(plan);
    plan.floorsUp = floors;
    return plan;
  }

  // Floors that repeat share their rooms; each gets its own walls (the railings change from floor to floor).
  function copyLevel(level) { var o = {}; for (var k in level) o[k] = level[k]; return o; }

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
    var M = city.map, b = M.buildings[i], Hd = H(), plan = null, kind = M.kinds[b[1]];
    var isBuilding = Object.prototype.hasOwnProperty.call(Hd.building.kinds, kind), sp = Hd.special[kind];
    if (Hd.kinds.indexOf(kind) >= 0 || isBuilding || sp) {
      var f = b[0], pts = [];
      for (var j = 0; j + 1 < f.length; j += 2) pts.push([f[j] * M.unit, f[j + 1] * M.unit]);
      var area = areaOf(pts);
      var range = isBuilding ? Hd.building.area : sp ? sp.area : Hd.area;
      if (pts.length >= 3 && area >= range[0] && area <= range[1]) {
        var s = city.scale, cx = 0, cy = 0;
        pts.forEach(function (q) { cx += q[0]; cy += q[1]; });
        // A door can't lead into another building or past the partido's border.
        var canExit = function (mx, my) {
          var wx = mx * s, wy = my * s;
          if (city.border && !inside(city.border, wx, wy)) return false;
          var P = L.data.city.page, z = Math.floor(wy / city.cell / P) * city.pcols + Math.floor(wx / city.cell / P), list = city.zoneB.get(z) || [];
          for (var k = 0; k < list.length; k++) if (list[k] !== i && insideFlat(M.buildings[list[k]][0], M.unit * s, wx, wy)) return false;
          return true;
        };
        var street = toStreet(city, cx / pts.length * s, cy / pts.length * s);
        var o = { canExit: canExit, floors: b[2], roof: M.roofs ? M.roofs[b[3]] : null, basement: !!b[4] };
        if (isBuilding) {
          o.fill = Hd.building.kinds[kind];
          plan = L.buildingPlan(pts, street, i, o);
          // A school or a clinic too small for a core: one hall with its rooms' kind.
          if (!plan && o.fill) { o.layout = 'nave'; o.spec = { room: o.fill.room }; plan = L.housePlan(pts, street, i, o); }
        } else {
          if (sp) { o.layout = sp.layout; o.spec = sp; }
          plan = L.housePlan(pts, street, i, o);
        }
      }
      if (plan) {
        var px = function (q) { return [q[0] * s, q[1] * s]; }, f = plan.frame;
        plan.index = i;
        plan.scale = s;
        plan.outline = pts.map(px);
        plan.wallsPx = plan.walls.map(function (w) { return px(L.housePoint(plan, w[0], w[1])).concat(px(L.housePoint(plan, w[2], w[3]))); });
        plan.exitsPx = plan.exits.map(function (e) {
          var q = px(L.housePoint(plan, e.x, e.y));
          return { x: q[0], y: q[1], r: Hd.exit / 2 * s, nx: f.ux * e.dir[0] + f.vx * e.dir[1], ny: f.uy * e.dir[0] + f.vy * e.dir[1] };
        });
        var segPx = function (g) { return px(L.housePoint(plan, g[0], g[1])).concat(px(L.housePoint(plan, g[2], g[3]))); };
        plan.doorsPx = plan.doors.map(segPx);
        plan.exitSegsPx = plan.exits.map(function (e) { return segPx(e.seg); });
        for (var lk in plan.levels) plan.levels[lk].wallsPx = plan.levels[lk].walls.map(segPx);
        // Where to stand to go up a stair (just past the foot) and to go down it (just past the top), for the
        // creatures.
        plan.stairs.forEach(function (st) {
          var mid = st.axis === 'y' ? (st.x0 + st.x1) / 2 : (st.y0 + st.y1) / 2;
          var lo = st.axis === 'y' ? st.y0 - 1 : st.x0 - 1, hi = st.axis === 'y' ? st.y1 + 1 : st.x1 + 1;
          var foot = st.up > 0 ? lo : hi, top = st.up > 0 ? hi : lo;
          st.footPx = px(st.axis === 'y' ? L.housePoint(plan, mid, foot) : L.housePoint(plan, foot, mid));
          st.topPx = px(st.axis === 'y' ? L.housePoint(plan, mid, top) : L.housePoint(plan, top, mid));
        });
        if (plan.stair) { plan.footPx = plan.stair.footPx; plan.topPx = plan.stair.topPx; }
      }
    }
    cache.set(i, plan);
    return plan;
  };

  // ---- Floors: moving up and down ----
  // Anyone moving in the city (`ent`: the player, a creature) carries `floor` (0 the ground, 1 and up upstairs, -1
  // the basement), `z` (how high: equal to the floor, or in between on a stair), `house` (the plan of the building
  // whose stair or floor it is on) and `stairOn` (the stair it is on, or null). On the ground floor the walk grid is
  // used; on any other floor, that floor's own walls.

  var WALL_HALF = 0.08; // meters: half the thickness of a wall upstairs, for bodies against it

  // A point in px → cells of the plan's frame.
  function toPlan(plan, x, y) {
    var f = plan.frame, mx = x / plan.scale - f.ox, my = y / plan.scale - f.oy;
    return [(mx * f.ux + my * f.uy) / plan.cell, (mx * f.vx + my * f.vy) / plan.cell];
  }

  function segDist(x, y, s) {
    var dx = s[2] - s[0], dy = s[3] - s[1], t = L.clamp(((x - s[0]) * dx + (y - s[1]) * dy) / (dx * dx + dy * dy || 1), 0, 1);
    return Math.hypot(s[0] + dx * t - x, s[1] + dy * t - y);
  }

  // Does a body of radius r (px) fit at (x, y) on a floor of a building other than the ground one (`level`, by
  // default floor 1)?
  function upperFits(plan, x, y, r, level) {
    if (!inside(plan.outline, x, y)) return false;
    var m = r + WALL_HALF * plan.scale, o = plan.outline, w = (level || plan.upper).wallsPx;
    for (var i = 0; i < o.length; i++) { var q = o[i], n = o[(i + 1) % o.length]; if (segDist(x, y, [q[0], q[1], n[0], n[1]]) < m) return false; }
    for (i = 0; i < w.length; i++) if (segDist(x, y, w[i]) < m) return false;
    return true;
  }

  // Moves `ent` toward (nx, ny) px on its floor, sliding along walls, and works out its floor and height from the
  // stair it is on. The new position goes in `out`.
  L.cityLevelMove = function (city, ent, nx, ny, r, out) {
    out = out || {};
    r = Math.min(r, L.data.city.body);
    var plan = ent.house, x = ent.x, y = ent.y, f = ent.floor || 0, level = f && plan ? L.planLevel(plan, f) : null;
    if (level) {
      if (upperFits(plan, nx, ny, r, level)) { out.x = nx; out.y = ny; }
      else if (upperFits(plan, nx, y, r, level)) { out.x = nx; out.y = y; }
      else if (upperFits(plan, x, ny, r, level)) { out.x = x; out.y = ny; }
      else { out.x = x; out.y = y; }
    } else L.cityMove(city, x, y, nx, ny, r, out);
    // Still on the stair it was on? Else, stepping onto one that reaches this floor (of the building it is in).
    var st = ent.stairOn, t = null, q;
    if (st && plan) { q = toPlan(plan, out.x, out.y); t = stairT(st, q[0], q[1]); }
    if (t === null) {
      st = ent.stairOn = null;
      var here = f ? plan : L.cityHouseAt(city, out.x, out.y);
      if (here && here.stairs) {
        q = toPlan(here, out.x, out.y);
        for (var i = 0; i < here.stairs.length && t === null; i++) {
          var s = here.stairs[i];
          if (s.from !== f && s.from + 1 !== f) continue;
          t = stairT(s, q[0], q[1]);
          if (t !== null) { st = ent.stairOn = s; plan = here; }
        }
      }
    }
    if (t !== null) { ent.house = plan; ent.z = st.from + t; ent.floor = t > 0.5 ? st.from + 1 : st.from; }
    else ent.z = ent.floor || 0;
    return out;
  };

  // The stair to take in a building to go from floor `from` toward floor `to`: up the one leaving `from`, or down
  // the one arriving at it. Or null.
  L.stairToward = function (plan, from, to) {
    if (!plan || !plan.stairs || from === to) return null;
    for (var i = 0; i < plan.stairs.length; i++) {
      var s = plan.stairs[i];
      if (to > from ? s.from === from : s.from === from - 1) return s;
    }
    return null;
  };

  // Is (x, y) px open (not a wall) on a floor? `plan` is the building for a floor other than the ground one.
  L.cityLevelOpen = function (city, floor, plan, x, y) {
    var level = floor && plan ? L.planLevel(plan, floor) : null;
    return level ? upperFits(plan, x, y, 0, level) : L.cityWalkable(city, x, y);
  };
  L.cityUpperFits = upperFits;
  L.housePlanPoint = toPlan;

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
