// Shelter and barricades (data/barricade.js). Each building's ground floor has openings: its front and back doorways
// and its windows (js/interiors.js, js/furnish.js). What has been done to them lives in g.barricades, saved with the
// game, and the city reads it when it builds its walk grid (js/city.js):
//   'building:x:i' (doorway i) / 'building:w:i' (window i): { planks, hp (what the planks have left), furn (the
//   piece of furniture against it, or -1), fhp (what it has left), broken (a window's glass), glass (what it has left) }
//   'building:f:k': { moved: true }: piece k of the ground floor is not in its place (dragged to a door or broken)
(function (L) {
  'use strict';

  function D() { return L.data.barricade; }

  // The openings of a building's ground floor, in px: [{ key, kind: 'door' | 'window', seg, x, y, nx, ny }], (nx, ny)
  // pointing out of the house.
  L.planOpenings = function (plan) {
    if (plan._openings) return plan._openings;
    var s = plan.scale, out = [];
    var add = function (key, kind, q) {
      var x = (q[0] + q[2]) / 2, y = (q[1] + q[3]) / 2, dx = q[2] - q[0], dy = q[3] - q[1], l = Math.hypot(dx, dy) || 1;
      var nx = -dy / l, ny = dx / l;
      if (inPoly(plan.outline, x + nx * s, y + ny * s)) { nx = -nx; ny = -ny; }
      out.push({ key: plan.index + ':' + key, kind: kind, seg: q, x: x, y: y, nx: nx, ny: ny, plan: plan });
    };
    (plan.exitSegsPx || []).forEach(function (q, i) { add('x:' + i, 'door', q); });
    (plan.doorsPx || []).forEach(function (q, i) { add('d:' + i, 'inner', q); }); // doors between rooms (js/doors.js)
    (plan.windows || []).forEach(function (w, i) { add('w:' + i, 'window', [w[0] * s, w[1] * s, w[2] * s, w[3] * s]); });
    plan._openings = out;
    return out;
  };
  function inPoly(poly, x, y) {
    var c = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var a = poly[i], b = poly[j];
      if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
    }
    return c;
  }
  function segDist(x, y, q) {
    var dx = q[2] - q[0], dy = q[3] - q[1], t = L.clamp(((x - q[0]) * dx + (y - q[1]) * dy) / (dx * dx + dy * dy || 1), 0, 1);
    return Math.hypot(q[0] + dx * t - x, q[1] + dy * t - y);
  }

  // Is the opening closed to bodies? A doorway with planks or furniture; a window unless its glass is broken and
  // it has no planks.
  L.openingShut = function (g, o) {
    var b = g.barricades[o.key];
    if (L.isDoor && L.isDoor(o)) { var st = L.doorState(g, o); return !!b && (b.planks > 0 || b.furn >= 0) || !!(st && st.closed); }
    return !b || !b.broken || b.planks > 0;
  };

  // The city builds its walk grid from this game's barricades. Called when a game starts or is loaded.
  L.useBarricades = function (g) {
    var city = g.city;
    if (!city || !city.map) return;
    var old = city._bar || {};
    city._bar = g.barricades;
    var redo = {};
    Object.keys(old).concat(Object.keys(g.barricades)).forEach(function (k) { redo[k.split(':')[0]] = true; });
    Object.keys(redo).forEach(function (i) { forget(g, +i); });
  };
  L.forgetHouse = function (g, i) { forget(g, i); };
  function forget(g, i) {
    var plan = L.cityHouse(g.city, i);
    if (!plan) return;
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, m = g.city.cell * 3;
    plan.outline.forEach(function (q) { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); });
    L.cityForget(g.city, x0 - m, y0 - m, x1 + m, y1 + m);
    g.flowT = 0;
    // A zombie standing where a plank or a piece of furniture just went: out of the wall.
    g.enemies.forEach(function (e) {
      if (e.dead || (e.floor || 0) !== 0 || e.x < x0 - m || e.x > x1 + m || e.y < y0 - m || e.y > y1 + m) return;
      if (L.cityFits(g.city, e.x, e.y, Math.min(e.r, L.data.city.body))) return;
      var fr = L.cityFree(g.city, e.x, e.y);
      e.x = fr.x; e.y = fr.y;
    });
  }
  function entry(g, o) {
    return g.barricades[o.key] || (g.barricades[o.key] = { planks: 0, hp: 0, furn: -1, fhp: 0, broken: false, glass: D().glassHp });
  }
  // Drops an entry that no longer changes anything (an intact window with no planks, a bare doorway).
  function tidy(g, o) {
    var b = g.barricades[o.key];
    if (b && b.planks <= 0 && b.furn < 0 && !b.broken && b.glass >= D().glassHp && !b.door) delete g.barricades[o.key];
  }

  function hasHammer(g) { return L.packCount(g, 'w:martillo') > 0; }

  // A heavy piece of the ground floor near the doorway, still in its place: { k, t } or null.
  function pieceNear(g, o) {
    var plan = o.plan, r = D().moveReach * g.city.scale, best = null, bd = r;
    (plan.solidPx || []).forEach(function (q, k) {
      var t = plan.furniture[k].t;
      if (!D().heavy[t] || g.barricades[plan.index + ':f:' + k]) return;
      var d = Math.hypot(q.x - o.x, q.y - o.y);
      if (d < bd) { bd = d; best = { k: k, t: t }; }
    });
    return best;
  }

  // What you can do at the opening nearest to you, on the ground floor: { o, add, rem, addLabel, remLabel, need }
  // (add / rem: 'nail' | 'move' | 'pry' | 'back' | null) or null when there is no opening within reach.
  L.barricadeTarget = function (g) {
    var p = g.player, city = g.city;
    if (!city || !city.map || (p.floor || 0) !== 0 || !L.cityHouseAt || !g.barricades) return null;
    var reach = D().reach * city.scale + p.r, best = null, bd = reach;
    var plans = [L.cityHouseAt(city, p.x, p.y)];
    // From outside: the houses whose doorway or window is right there.
    [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]].forEach(function (d) { plans.push(L.cityHouseAt(city, p.x + d[0] * reach, p.y + d[1] * reach)); });
    plans.forEach(function (plan) {
      if (!plan) return;
      L.planOpenings(plan).forEach(function (o) {
        var d = segDist(p.x, p.y, o.seg);
        if (d < bd) { bd = d; best = o; }
      });
    });
    if (!best) return null;
    var o = best, b = g.barricades[o.key] || { planks: 0, furn: -1 }, max = D().planks[o.kind] || 0, T = { o: o, add: null, rem: null };
    var inside = L.cityHouseAt(city, p.x, p.y) === o.plan; // furniture is dragged from inside the house only
    var mats = L.packCount(g, 'tablas') >= 1 && L.packCount(g, 'clavos') >= D().nails && hasHammer(g);
    if (b.furn < 0 && b.planks < max && mats) { T.add = 'nail'; T.addLabel = 'clavar una tabla (' + (b.planks + 1) + '/' + max + ')'; }
    else if (o.kind === 'door' && b.furn < 0 && !b.planks && inside) {
      var pc = pieceNear(g, o);
      if (pc) { T.add = 'move'; T.piece = pc; T.addLabel = 'trabar la puerta con ' + D().heavy[pc.t].name; }
    }
    if (b.furn >= 0 && inside) { T.rem = 'back'; T.remLabel = 'correr ' + D().heavy[o.plan.furniture[b.furn].t].name; }
    else if (b.planks > 0 && hasHammer(g)) { T.rem = 'pry'; T.remLabel = 'sacar una tabla'; }
    if (!T.add && b.furn < 0 && b.planks < max) T.need = 'Para trabarla: tablas, ' + D().nails + ' clavos y un martillo';
    // The door itself (js/doors.js): a press opens, closes, locks; holding X forces a lock.
    if (L.doorActions) {
      var A = L.doorActions(g, o, inside);
      T.tapE = A.tapE || null; T.tapX = A.tapX || null;
      if (A.holdX && !T.rem) { T.rem = 'force'; T.remLabel = A.holdX.label; }
      if (A.need) T.need = A.need;
    }
    return T;
  };

  // Each frame, from js/loot.js: holding E works on the opening (nail a plank, drag furniture), holding X undoes.
  // Returns true while you are doing something with an opening, so nothing else takes the key.
  L.updateBarricadeWork = function (g, dt, input) {
    var T = L.barricadeTarget(g), p = g.player, tap = L.data.doors ? L.data.doors.tap : 0;
    g.barTarget = T;
    // A door: a short press of E or X does its thing on release (js/doors.js); holding goes on to the long work.
    var useNow = !!(input && input.use), pryNow = !!(input && input.pry), eT = g.eHeldT || 0, xT = g.xHeldT || 0;
    g.eHeldT = useNow ? eT + dt : 0; g.xHeldT = pryNow ? xT + dt : 0;
    if (T && !useNow && eT > 0 && eT < tap && T.tapE && !g.barWork) { L.doDoor(g, T.o, T.tapE.act); return true; }
    if (T && !pryNow && xT > 0 && xT < tap && T.tapX && !g.barWork) { L.doDoor(g, T.o, T.tapX.act); return true; }
    var useHold = useNow && T && T.add && (!T.tapE || g.eHeldT >= tap), pryHold = pryNow && T && T.rem && (!T.tapX || g.xHeldT >= tap);
    var act = useHold ? T.add : pryHold ? T.rem : null;
    if (!act) { g.barWork = null; return !!(T && (useNow && T.tapE || pryNow && T.tapX)); }
    var key = T.o.key + ':' + act, need = act === 'nail' ? D().nail : act === 'pry' ? D().pry : act === 'force' ? L.data.doors.force : D().move;
    if (!g.barWork || g.barWork.key !== key) g.barWork = { key: key, t: 0, need: need };
    g.barWork.t += dt;
    if (act === 'nail' && Math.floor(g.barWork.t * 2) !== Math.floor((g.barWork.t - dt) * 2)) {
      if (L.makeNoise) L.makeNoise(g, p.x, p.y, D().noise.nail, 0, p);
      L.emit(g, 'hammer', p.x, p.y);
    }
    if (act === 'force' && Math.floor(g.barWork.t) !== Math.floor(g.barWork.t - dt)) { if (L.makeNoise) L.makeNoise(g, p.x, p.y, L.data.doors.noise, 0, p); L.emit(g, 'bang', T.o.x, T.o.y); }
    if (g.barWork.t < need) return true;
    g.barWork = null;
    if (act === 'force') { L.doDoor(g, T.o, 'force'); return true; }
    var o = T.o, b = entry(g, o);
    if (act === 'nail') {
      L.packTake(g, 'tablas', 1); L.packTake(g, 'clavos', D().nails);
      b.planks++; b.hp += D().plankHp;
      L.toast(g, b.planks === D().planks[o.kind] ? (o.kind === 'door' ? 'La puerta quedó bien trabada.' : 'La ventana quedó tapiada.') : 'Clavaste una tabla.', '#c9a46a');
    } else if (act === 'pry') {
      b.planks--; b.hp = Math.min(b.hp, b.planks * D().plankHp);
      var left = L.packAdd(g, 'tablas', 1);
      if (left && L.dropToGround) L.dropToGround(g, { id: 'tablas', n: left });
      L.toast(g, 'Sacaste una tabla.', '#c9a46a');
    } else if (act === 'move') {
      b.furn = T.piece.k; b.fhp = D().heavy[T.piece.t].hp;
      g.barricades[o.plan.index + ':f:' + T.piece.k] = { moved: true };
      L.toast(g, 'Trabaste la puerta con ' + D().heavy[T.piece.t].name + '.', '#c9a46a');
    } else if (act === 'back') {
      delete g.barricades[o.plan.index + ':f:' + b.furn];
      b.furn = -1; b.fhp = 0;
      L.toast(g, 'Volviste a correr el mueble a su lugar.', '#c9a46a');
    }
    L.emit(g, act === 'nail' ? 'hammer' : 'shove', p.x, p.y);
    tidy(g, o);
    forget(g, o.plan.index);
    // Standing right on the doorway, or where the piece goes back: a step aside, so you aren't inside the wall.
    if (!L.cityFits(g.city, p.x, p.y, Math.min(p.r, L.data.city.body)) && L.unstick) L.unstick(g);
    return true;
  };

  // Every frame: the zombies that want to get in bang on the closed doorways and windows of the house they are
  // after (you inside it, or the noise they heard there) until the glass, the planks or the furniture give way.
  L.updateBarricades = function (g, dt) {
    var city = g.city;
    if (!city || !city.map || !L.cityHouseAt || !g.barricades) return;
    var p = g.player, s = city.scale, reach = D().bangReach * s, seek = D().seek * s;
    var pPlan = (p.floor || 0) === 0 ? L.cityHouseAt(city, p.x, p.y) : p.house;
    for (var i = 0; i < g.enemies.length; i++) {
      var e = g.enemies[i];
      if (e.dead || (e.floor || 0) !== 0 || (e.mind !== 'chase' && e.mind !== 'investigate')) continue;
      var plan = e.mind === 'chase' ? pPlan : L.cityHouseAt(city, e.goX, e.goY);
      if (!plan || L.cityHouseAt(city, e.x, e.y) === plan) continue;
      // The nearest closed opening of that house.
      var best = null, bd = seek;
      L.planOpenings(plan).forEach(function (o) {
        if (!L.openingShut(g, o)) return;
        var d = segDist(e.x, e.y, o.seg);
        if (d < bd) { bd = d; best = o; }
      });
      if (!best) continue;
      if (bd > reach) {
        // Looking for a way in: it walks up to that doorway or window, aiming just past it (still inside the house,
        // so it keeps after the same house).
        if (e.mind === 'investigate') { e.goX = best.x - best.nx * 0.5 * s; e.goY = best.y - best.ny * 0.5 * s; e.linger = Math.max(e.linger || 0, 2); } // just inside: it walks into the opening
        continue;
      }
      if (e.mind === 'investigate') e.linger = Math.max(e.linger || 0, 2); // keeps at it
      bang(g, e, best, D().bang * dt);
    }
  };

  function bang(g, e, o, dmg) {
    var b = entry(g, o);
    e.bangT = (e.bangT || 0) + dmg / D().bang;
    if (e.bangT >= 0.8) {
      e.bangT = 0;
      L.emit(g, 'bang', o.x, o.y);
      if (L.makeNoise) L.makeNoise(g, o.x, o.y, D().noise.bang, 0, e);
    }
    var gone = false;
    if (b.furn >= 0) {
      b.fhp -= dmg;
      if (b.fhp <= 0) { b.furn = -1; b.fhp = 0; gone = true; L.emit(g, 'break', o.x, o.y); } // the piece stays broken (its 'f:' mark)
    } else if (b.planks > 0) {
      b.hp -= dmg;
      var left = Math.max(0, Math.ceil(b.hp / D().plankHp - 1e-9));
      if (left < b.planks) { b.planks = left; gone = true; L.emit(g, 'break', o.x, o.y); }
    } else if (L.isDoor && L.isDoor(o) && L.doorState(g, o).closed) {
      if (L.hitDoor(g, o, dmg, e)) return; // it broke (js/doors.js rebuilds the walls)
    } else if (o.kind === 'window' && !b.broken) {
      b.glass -= dmg;
      if (b.glass <= 0) { b.broken = true; b.glass = 0; gone = true; L.emit(g, 'glass', o.x, o.y); }
    }
    if (gone) { tidy(g, o); forget(g, o.plan.index); }
  }
})(this.Lluvia = this.Lluvia || {});
