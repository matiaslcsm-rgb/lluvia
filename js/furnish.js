// Furniture, doors and windows for the plans of js/interiors.js. Each floor of a plan gets:
//   furniture [{ t, cx, cy, w, d, face }]: a piece (data/houses.js, `furniture`) centered at (cx, cy) in cells of
//     the plan's frame, w × d meters, its front toward `face` ([0, 1], [0, -1], [1, 0] or [-1, 0]);
//   windows [[ax, ay, bx, by]]: stretches of the outer wall, in meters of the world.
// All seeded by the building and the floor: the same house always has the same furniture.
(function (L) {
  'use strict';

  function H() { return L.data.houses; }
  var FACES = [[0, 1], [0, -1], [1, 0], [-1, 0]];

  function insidePoly(pts, x, y) {
    var c = false;
    for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      if ((pts[i][1] > y) !== (pts[j][1] > y) && x < (pts[j][0] - pts[i][0]) * (y - pts[i][1]) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c;
    }
    return c;
  }
  function edgeDist(pts, x, y) {
    var best = Infinity;
    for (var i = 0; i < pts.length; i++) {
      var a = pts[i], b = pts[(i + 1) % pts.length], dx = b[0] - a[0], dy = b[1] - a[1];
      var t = L.clamp(((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1), 0, 1);
      best = Math.min(best, Math.hypot(a[0] + dx * t - x, a[1] + dy * t - y));
    }
    return best;
  }

  // Cells where nothing goes on floor f: a door's swing on both sides, the doorways out, the stairs that reach this
  // floor with the room to stand at their ends, a building's stair lanes. Also each of those spots as a list of
  // cells (`zones`): the furniture must leave a way between them.
  function blockedCells(plan, f, level) {
    var W = plan.W, D = plan.D, cs = plan.cell, block = new Uint8Array(W * D), reach = Math.ceil(H().door / cs), zones = [];
    var box = function (x0, y0, x1, y1) {
      var z = [];
      for (var y = Math.max(0, Math.floor(y0)); y < Math.min(D, Math.ceil(y1)); y++)
        for (var x = Math.max(0, Math.floor(x0)); x < Math.min(W, Math.ceil(x1)); x++) { block[y * W + x] = 1; z.push(y * W + x); }
      zones.push(z);
    };
    var door = function (g) {
      if (g[0] === g[2]) box(g[0] - reach, Math.min(g[1], g[3]) - 0.5, g[0] + reach, Math.max(g[1], g[3]) + 0.5);
      else box(Math.min(g[0], g[2]) - 0.5, g[1] - reach, Math.max(g[0], g[2]) + 0.5, g[1] + reach);
    };
    (level.doors || []).forEach(door);
    if (!f) plan.exits.forEach(function (e) { door(e.seg); });
    (plan.stairs || []).forEach(function (st) {
      if (st.from !== f && st.from + 1 !== f) return;
      var ax = st.axis === 'x' ? 4 : 1, ay = st.axis === 'y' ? 4 : 1;
      box(st.x0 - ax, st.y0 - ay, st.x1 + ax, st.y1 + ay);
    });
    (plan.lanes || []).forEach(function (ln) { box(ln.x0 - 1, ln.y0 - 1, ln.x1 + 1, ln.y1 + 1); });
    block.zones = zones;
    return block;
  }

  // Which of a room's spots (doors, stairs) are joined by a way 1 m wide (2 × 2 free cells) that no furniture
  // stands on, off the walls by a cell (on a turned house the walls eat about that much of the walk grid): a group
  // number per spot (-1: none touches it).
  // `loose`: for a room too thin for that, any free cell will do.
  function linksOf(W, D, lab, used, k, zones, bb, loose) {
    var open = function (x, y) {
      var c = y * W + x;
      if (lab[c] !== k || used[c]) return false;
      return loose || x > 0 && y > 0 && x + 1 < W && y + 1 < D && lab[c - 1] === k && lab[c + 1] === k && lab[c - W] === k && lab[c + W] === k;
    };
    var node = function (x, y) {
      if (loose) return x >= 0 && y >= 0 && x < W && y < D && open(x, y);
      return x >= 0 && y >= 0 && x + 1 < W && y + 1 < D && open(x, y) && open(x + 1, y) && open(x, y + 1) && open(x + 1, y + 1);
    };
    var comp = new Int32Array(W * D).fill(-1), n = 0, stack = [];
    for (var y = bb[1]; y <= bb[3]; y++) for (var x = bb[0]; x <= bb[2]; x++) {
      if (comp[y * W + x] >= 0 || !node(x, y)) continue;
      comp[y * W + x] = n; stack.push(y * W + x);
      while (stack.length) {
        var c = stack.pop(), cx = c % W, cy = (c - cx) / W;
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
          var nx = cx + d[0], ny = cy + d[1];
          if (nx < 0 || ny < 0 || comp[ny * W + nx] >= 0 || !node(nx, ny)) return;
          comp[ny * W + nx] = n; stack.push(ny * W + nx);
        });
      }
      n++;
    }
    // A spot touches a group if one of its cells is covered by a 2 × 2 block of it.
    var groups = zones.map(function (z) {
      for (var i = 0; i < z.length; i++) {
        var x = z[i] % W, y = (z[i] - x) / W;
        for (var j = 0; j < (loose ? 1 : 4); j++) { var nx = x - (j & 1), ny = y - (j >> 1); if (nx >= 0 && ny >= 0 && comp[ny * W + nx] >= 0) return comp[ny * W + nx]; }
      }
      return -1;
    });
    return { groups: groups, comp: comp, bb: bb, W: W };
  }
  // Every two spots joined before are still joined, and no bit of floor you could walk to from them before is cut
  // off now (a desk closing a corner of the room).
  function stillJoined(before, after) {
    var a = before.groups, b = after.groups, i, j;
    for (i = 0; i < a.length; i++) for (j = i + 1; j < a.length; j++)
      if (a[i] >= 0 && a[i] === a[j] && !(b[i] >= 0 && b[i] === b[j])) return false;
    var mainA = {}, mainB = {}, W = before.W, bb = before.bb;
    a.forEach(function (g) { if (g >= 0) mainA[g] = 1; });
    b.forEach(function (g) { if (g >= 0) mainB[g] = 1; });
    for (var y = bb[1]; y <= bb[3]; y++) for (var x = bb[0]; x <= bb[2]; x++) {
      var c = y * W + x;
      if (mainA[before.comp[c]] && after.comp[c] >= 0 && !mainB[after.comp[c]]) return false;
    }
    return true;
  }

  // Furnishes one floor. `pts`: the footprint in meters (pieces stay inside it, off the outer wall).
  function furnishLevel(plan, f, level, pts, rng) {
    var W = plan.W, D = plan.D, cs = plan.cell, lab = level.lab, Fd = H().furniture, out = [];
    var block = blockedCells(plan, f, level), used = new Uint8Array(W * D), keep = new Uint8Array(W * D);
    var at = function (x, y) { return x < 0 || y < 0 || x >= W || y >= D ? -9 : lab[y * W + x]; };
    var free = function (k, x, y) { return at(x, y) === k && !block[y * W + x] && !used[y * W + x] && !keep[y * W + x]; };
    // A corner of a piece inside the footprint and off its wall. Deep inside (its cell and the eight around it all in
    // the footprint) needs no measuring.
    var deep = function (x, y) {
      for (var j = -1; j <= 1; j++) for (var i = -1; i <= 1; i++) { var q = at(x + i, y + j); if (q === L.housePlan.OUT || q === -9) return false; }
      return true;
    };
    var inPts = function (x, y) {
      if (deep(Math.floor(x), Math.floor(y))) return true;
      var m = L.housePoint(plan, x, y);
      return insidePoly(pts, m[0], m[1]) && edgeDist(pts, m[0], m[1]) > 0.06;
    };
    level.rooms.forEach(function (r, k) {
      var list = r.cells && Fd[r.type];
      if (!list) return;
      var bb = [W, D, -1, -1], cellsOf = [];
      for (var c0 = 0; c0 < lab.length; c0++) if (lab[c0] === k) { cellsOf.push(c0); var qx0 = c0 % W, qy0 = Math.floor(c0 / W); bb[0] = Math.min(bb[0], qx0); bb[1] = Math.min(bb[1], qy0); bb[2] = Math.max(bb[2], qx0); bb[3] = Math.max(bb[3], qy0); }
      // The furniture is solid: the room's doors and stairs must stay joined as they were.
      var zones = block.zones.map(function (z) { return z.filter(function (c) { return lab[c] === k; }); }).filter(function (z) { return z.length; });
      var loose = false, joined = linksOf(W, D, lab, used, k, zones, bb, false);
      if (joined.groups.every(function (g) { return g < 0; })) return; // too thin for a way through: no furniture
      var fits = function (q) {
        var y, x, ok;
        for (y = q.y0; y < q.y0 + q.sy; y++) for (x = q.x0; x < q.x0 + q.sx; x++) used[y * W + x] = 1;
        var now = linksOf(W, D, lab, used, k, zones, bb, loose);
        ok = stillJoined(joined, now);
        for (y = q.y0; y < q.y0 + q.sy; y++) for (x = q.x0; x < q.x0 + q.sx; x++) used[y * W + x] = 0;
        if (ok) joined = now; // the next piece is checked against the room as it is then
        return ok;
      };
      // Tries up to 8 candidates, in the order given, and takes the first that leaves the way open.
      var firstFit = function (list) { for (var i = 0; i < list.length && i < 8; i++) if (fits(list[i])) return list[i]; return null; };
      var place = function (pc) {
        var n = pc[4] || 1, before = out.length, bw = Math.ceil(pc[1] / cs - 0.01), bd = Math.ceil((pc[2] + (pc[3] === 'wall' ? 0.06 : 0)) / cs - 0.01); // a wall piece stands 6 cm off it
        for (var c = 0; c < n; c++) {
          var cands = [];
          FACES.forEach(function (fc) {
            var sx = fc[0] ? bd : bw, sy = fc[0] ? bw : bd, along = fc[0] ? sy : sx; // box size in cells
            // Against a wall: only the boxes whose back row starts on a cell of the room's edge on that side.
            var origins = [];
            if (pc[3] === 'wall') cellsOf.forEach(function (c) {
              var x = c % W, y = (c - x) / W;
              if (at(x - fc[0], y - fc[1]) === k) return;
              origins.push(fc[0] < 0 ? [x - sx + 1, y] : fc[1] < 0 ? [x, y - sy + 1] : [x, y]);
            });
            else for (var oy = bb[1]; oy + sy <= bb[3] + 1; oy++) for (var ox = bb[0]; ox + sx <= bb[2] + 1; ox++) origins.push([ox, oy]);
            for (var oi = 0; oi < origins.length; oi++) {
              var x0 = origins[oi][0], y0 = origins[oi][1], ok = true, x, y, j;
              if (pc[3] !== 'wall' && n > 1 && cands.length && cands[cands.length - 1].fc === fc && cands[cands.length - 1].y0 === y0) continue;
              if (pc[3] === 'wall') {
                // Its back against a wall all along (not another room's doorway: those cells are blocked anyway).
                for (j = 0; j < along && ok; j++) {
                  var bx = fc[0] ? (fc[0] > 0 ? x0 - 1 : x0 + sx) : x0 + j, by = fc[0] ? y0 + j : (fc[1] > 0 ? y0 - 1 : y0 + sy);
                  if (at(bx, by) === k) ok = false;
                }
              }
              for (y = y0; y < y0 + sy && ok; y++) for (x = x0; x < x0 + sx && ok; x++) if (!free(k, x, y)) ok = false;
              // In the middle: free all round, a cell's width.
              if (ok && pc[3] !== 'wall') for (y = y0 - 1; y <= y0 + sy && ok; y++) for (x = x0 - 1; x <= x0 + sx && ok; x++) {
                if (x >= x0 && x < x0 + sx && y >= y0 && y < y0 + sy) continue;
                // (rows may touch a wall; a row keeps 1 m from the next one, so you can walk between them)
                if (at(x, y) === k ? used[y * W + x] || block[y * W + x] || (n > 1 && keep[y * W + x]) : n === 1) ok = false;
              }
              if (!ok) continue;
              // The piece itself, flush with the back of its box.
              var inset = pc[3] === 'wall' ? 0.06 / cs : 0, dc = pc[2] / cs, wc = pc[1] / cs;
              var cx = x0 + sx / 2 - fc[0] * (sx / 2 - inset - dc / 2), cy = y0 + sy / 2 - fc[1] * (sy / 2 - inset - dc / 2);
              var hx = (fc[0] ? dc : wc) / 2, hy = (fc[0] ? wc : dc) / 2;
              if (!(inPts(cx - hx, cy - hy) && inPts(cx + hx, cy - hy) && inPts(cx - hx, cy + hy) && inPts(cx + hx, cy + hy))) continue;
              cands.push({ x0: x0, y0: y0, sx: sx, sy: sy, fc: fc, cx: cx, cy: cy });
            }
          });
          if (!cands.length) break;
          var pick;
          if (pc[3] === 'wall') {
            for (var sh = cands.length - 1; sh > 0; sh--) { var o = Math.floor(rng() * (sh + 1)), tmp = cands[sh]; cands[sh] = cands[o]; cands[o] = tmp; }
            pick = firstFit(cands);
          } else if (n > 1) {
            // Rows all look at the room's first piece against a wall (the blackboard, the altar), or at the front: a piece
            // looks toward its back (a desk with its chair in front), so the same way that piece faces.
            var lead = out.filter(function (q) { return q.room === k && q.wall; })[0], want = lead ? lead.face : [0, 1];
            cands.sort(function (a, b) { return a.y0 - b.y0 || a.x0 - b.x0; });
            pick = firstFit(cands.filter(function (q) { return q.fc[0] === want[0] && q.fc[1] === want[1]; }));
          } else {
            cands.sort(function (a, b) { return Math.hypot(a.cx - r.cx, a.cy - r.cy) - Math.hypot(b.cx - r.cx, b.cy - r.cy); });
            pick = firstFit(cands);
          }
          if (!pick) break;
          for (var y = pick.y0; y < pick.y0 + pick.sy; y++) for (var x = pick.x0; x < pick.x0 + pick.sx; x++) used[y * W + x] = 1;
          // A cell's width in front of it stays clear for the next ones; all round it, for a piece in rows.
          var fx = pick.fc[0], fy = pick.fc[1];
          if (pc[3] !== 'wall' && n > 1) for (y = pick.y0 - 1; y <= pick.y0 + pick.sy; y++) for (x = pick.x0 - 1; x <= pick.x0 + pick.sx; x++) if (at(x, y) === k && !used[y * W + x]) keep[y * W + x] = 1;
          for (var j = 0; j < (fx ? pick.sy : pick.sx); j++) {
            var qx = fx ? (fx > 0 ? pick.x0 + pick.sx : pick.x0 - 1) : pick.x0 + j, qy = fx ? pick.y0 + j : (fy > 0 ? pick.y0 + pick.sy : pick.y0 - 1);
            if (at(qx, qy) === k) keep[qy * W + qx] = 1;
          }
          out.push({ t: pc[0], cx: pick.cx, cy: pick.cy, w: pc[1], d: pc[2], face: pick.fc, room: k, wall: pc[3] === 'wall' });
        }
        // None fit: the smaller size, if it has one (a single bed instead of a double).
        if (out.length === before && pc[5]) place([pc[0], pc[5][0], pc[5][1], pc[3], 1]);
      };
      list.forEach(place);
    });
    return out;
  }

  // Windows of one floor: along each room's outer wall, onto the footprint's own edge, where `canSee(mx, my)` (a
  // spot 40 cm out, in meters) says nothing stands against it.
  function windowsOf(plan, f, level, pts, canSee) {
    var Wd = H().windows, W = plan.W, D = plan.D, cs = plan.cell, lab = level.lab, out = [];
    if (level.open && Wd.none.indexOf(level.open) >= 0) return out;
    var runs = new Map();
    for (var y = 0; y < D; y++) for (var x = 0; x < W; x++) {
      var k = lab[y * W + x];
      if (k < 0) continue;
      FACES.forEach(function (fc) {
        var nx = x + fc[0], ny = y + fc[1];
        if (!(nx < 0 || ny < 0 || nx >= W || ny >= D || lab[ny * W + nx] === L.housePlan.OUT)) return;
        // Edge on line `ln` (x for a vertical edge, y for a horizontal one), at position `p` along it.
        var ln = fc[0] ? x + (fc[0] > 0 ? 1 : 0) : y + (fc[1] > 0 ? 1 : 0), p = fc[0] ? y : x, key = k + ':' + fc + ':' + ln;
        if (!runs.has(key)) runs.set(key, { k: k, fc: fc, ln: ln, ps: [] });
        runs.get(key).ps.push(p);
      });
    }
    runs.forEach(function (run) {
      var type = level.rooms[run.k].type;
      if (Wd.none.indexOf(type) >= 0) return;
      var len = (Wd.smallIn.indexOf(type) >= 0 ? Wd.small : Wd.length) / cs;
      run.ps.sort(function (a, b) { return a - b; });
      for (var i = 0; i < run.ps.length;) {
        var j = i;
        while (j + 1 < run.ps.length && run.ps[j + 1] === run.ps[j] + 1) j++;
        var a = run.ps[i], n = j - i + 1;
        i = j + 1;
        if (n < len + 2) continue;
        var count = Math.max(1, Math.floor(n * cs / Wd.every));
        for (var c = 0; c < count; c++) {
          var mid = a + n * (c + 0.5) / count, fc = run.fc;
          if (!f && plan.exits.some(function (e) { return Math.hypot((e.x - (fc[0] ? run.ln : mid)), (e.y - (fc[0] ? mid : run.ln))) < (len + H().exit / cs) / 2 + 1; })) continue;
          var p0 = fc[0] ? [run.ln, mid - len / 2] : [mid - len / 2, run.ln], p1 = fc[0] ? [run.ln, mid + len / 2] : [mid + len / 2, run.ln];
          var A = L.housePoint(plan, p0[0], p0[1]), B = L.housePoint(plan, p1[0], p1[1]), M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
          var inner = L.housePoint(plan, (p0[0] + p1[0]) / 2 - fc[0], (p0[1] + p1[1]) / 2 - fc[1]);
          // The footprint edge it lies on: the nearest one running the same way.
          var dx = B[0] - A[0], dy = B[1] - A[1], dl = Math.hypot(dx, dy), best = null;
          for (var e = 0; e < pts.length; e++) {
            var q = pts[e], r = pts[(e + 1) % pts.length], ex = r[0] - q[0], ey = r[1] - q[1], el = Math.hypot(ex, ey);
            if (el < 1 || Math.abs((ex * dx + ey * dy) / (el * dl)) < 0.95) continue;
            var t = ((M[0] - q[0]) * ex + (M[1] - q[1]) * ey) / (el * el), d = Math.hypot(q[0] + ex * t - M[0], q[1] + ey * t - M[1]);
            if (t > 0 && t < 1 && d < 0.6 && (!best || d < best.d)) best = { q: q, ex: ex, ey: ey, el: el, d: d };
          }
          if (!best) continue;
          var proj = function (P) { return L.clamp(((P[0] - best.q[0]) * best.ex + (P[1] - best.q[1]) * best.ey) / (best.el * best.el), 0.3 / best.el, 1 - 0.3 / best.el); };
          var t0 = proj(A), t1 = proj(B);
          if (Math.abs(t1 - t0) * best.el < 0.5) continue;
          var X0 = [best.q[0] + best.ex * t0, best.q[1] + best.ey * t0], X1 = [best.q[0] + best.ex * t1, best.q[1] + best.ey * t1];
          var mx = (X0[0] + X1[0]) / 2, my = (X0[1] + X1[1]) / 2, ox = mx - inner[0], oy = my - inner[1], ol = Math.hypot(ox, oy) || 1;
          if (canSee && !canSee(mx + ox / ol * 0.4, my + oy / ol * 0.4)) continue;
          out.push([X0[0], X0[1], X1[0], X1[1]]);
        }
      }
    });
    return out;
  }

  // Furnishes every floor of a plan and puts its windows. `pts`: the footprint in meters; `canSee` as above (or
  // null: windows everywhere).
  L.furnishPlan = function (plan, pts, canSee) {
    var floors = [0].concat(Object.keys(plan.levels || {}).map(Number));
    floors.forEach(function (f) {
      var level = L.planLevel(plan, f);
      if (!level || level.furniture) return;
      // Floors that are the same plan (a building's upper floors) get the same furniture.
      var same = floors.map(function (g) { return L.planLevel(plan, g); }).filter(function (o) { return o && o !== level && o.lab === level.lab && o.furniture; })[0];
      if (same) { level.furniture = same.furniture; level.windows = same.windows; return; }
      var rng = L.makeRng((((plan.index || 1) * 7919 + (f + 3) * 104729) >>> 0) || 1);
      level.furniture = furnishLevel(plan, f, level, pts, rng);
      level.windows = windowsOf(plan, f, level, pts, canSee);
    });
    if (plan.scale) floors.forEach(function (f) { var lv = L.planLevel(plan, f); if (!lv.solidPx) lv.solidPx = lv.furniture.map(function (q) { return solidOf(plan, q); }); });
    return plan;
  };

  // A piece as a solid box in px, for bodies and bullets: center (x, y), the unit axes across it (ax, ay) and toward
  // its front (fx, fy), and half its width and depth (hw, hd). `pts`: its corners, at least 50 cm a side (a walk
  // cell, so a thin blackboard still closes the ground floor's grid).
  function solidOf(plan, q) {
    var f = plan.frame, s = plan.scale, m = L.housePoint(plan, q.cx, q.cy);
    var fx = f.ux * q.face[0] + f.vx * q.face[1], fy = f.uy * q.face[0] + f.vy * q.face[1], ax = -fy, ay = fx;
    var o = { x: m[0] * s, y: m[1] * s, ax: ax, ay: ay, fx: fx, fy: fy, hw: q.w / 2 * s, hd: q.d / 2 * s };
    var gw = Math.max(q.w, 0.5) / 2 * s, gd = Math.max(q.d, 0.5) / 2 * s;
    o.pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(function (c) { return [o.x + ax * gw * c[0] + fx * gd * c[1], o.y + ay * gw * c[0] + fy * gd * c[1]]; });
    return o;
  }

  // Is (x, y) px within r of a piece?
  L.solidNear = function (list, x, y, r) {
    for (var i = 0; list && i < list.length; i++) {
      var o = list[i], dx = x - o.x, dy = y - o.y;
      if (Math.abs(dx) > o.hw + o.hd + r || Math.abs(dy) > o.hw + o.hd + r) continue;
      var a = dx * o.ax + dy * o.ay, b = dx * o.fx + dy * o.fy, qa = L.clamp(a, -o.hw, o.hw), qb = L.clamp(b, -o.hd, o.hd);
      if ((a === qa && b === qb) || Math.hypot(a - qa, b - qb) < r) return true;
    }
    return false;
  };
})(this.Lluvia = this.Lluvia || {});
