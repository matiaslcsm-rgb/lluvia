// Crafting (data/craft.js) and the molotov: making things out of what is in the backpack, at hand or at a workbench;
// throwing a molotov and the fire it leaves.
(function (L) {
  'use strict';

  function D() { return L.data.craft; }

  // Is there a workbench ("taller") within reach on your floor?
  L.nearBench = function (g) {
    var p = g.player, city = g.city, f = p.floor || 0;
    var plan = f && p.house ? p.house : L.cityHouseAt && L.cityHouseAt(city, p.x, p.y), lv = plan && L.planLevel(plan, f);
    if (!lv || !lv.solidPx) return false;
    var reach = D().reach * city.scale + p.r;
    return lv.furniture.some(function (q, k) {
      if (q.t !== 'taller') return false;
      var o = lv.solidPx[k], dx = p.x - o.x, dy = p.y - o.y, a = dx * o.ax + dy * o.ay, b = dx * o.fx + dy * o.fy;
      return Math.hypot(a - L.clamp(a, -o.hw, o.hw), b - L.clamp(b, -o.hd, o.hd)) < reach;
    });
  };

  // Can recipe r be made now? Returns null if so, else why not ("falta: 1 trapo", "hace falta un taller").
  // A need "a|b|c" is any of them: the first one you have enough of (or null).
  function pick(g, key, n) { return key.split('|').filter(function (id) { return L.packCount(g, id) >= n; })[0] || null; }
  // "1 venda, curita o trapo, 1 alcohol o sanitizante"
  L.needText = function (need) {
    return Object.keys(need).map(function (key) {
      var n = need[key], ids = key.split('|'), names = ids.map(function (id) { var nm = L.data.loot.items[id].name; return n === 1 ? nm[0] : nm[1]; });
      return n + ' ' + (names.length > 1 ? names.slice(0, -1).join(', ') + ' o ' + names[names.length - 1] : names[0]);
    }).join(', ');
  };
  L.craftBlock = function (g, r) {
    var miss = {};
    Object.keys(r.need).forEach(function (key) {
      if (pick(g, key, r.need[key])) return;
      var have = Math.max.apply(null, key.split('|').map(function (id) { return L.packCount(g, id); }));
      miss[key] = r.need[key] - have;
    });
    if (Object.keys(miss).length) return 'falta: ' + L.needText(miss);
    if (r.at === 'taller' && !L.nearBench(g)) return 'hace falta un taller';
    return null;
  };

  // Makes recipe r: takes what it needs and gives what it makes. Returns true if it was made.
  L.craft = function (g, r) {
    if (L.craftBlock(g, r)) return false;
    var made = r.make, id = made[0];
    // Room for it? (a weapon or a new kind of thing needs a slot)
    var used = Object.keys(r.need).map(function (key) { return [pick(g, key, r.need[key]), r.need[key]]; });
    used.forEach(function (u) { L.packTake(g, u[0], u[1]); });
    var rest = id.indexOf('w:') === 0 ? (L.giveMelee(g, id.slice(2)) ? 0 : 1) : L.packAdd(g, id, made[1]);
    if (rest) { used.forEach(function (u) { L.packAdd(g, u[0], u[1]); }); return false; } // no room: undo
    L.toast(g, 'Hiciste: ' + r.name + '.', '#d9cfa6');
    L.emit(g, 'craft', g.player.x, g.player.y);
    g.player.xp += 3; // crafting teaches you (the user's answer 9)
    return true;
  };

  // ---- The molotov ----
  // G throws one toward (tx, ty): it flies, then bursts into a fire.
  L.throwMolotov = function (g, tx, ty) {
    var p = g.player, M = D().molotov, s = g.city.scale;
    if (!L.packTake(g, 'molotov', 1)) return false;
    var dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy) || 1, far = Math.min(d, M.range * s);
    // It stops at the first wall on the way.
    if (L.sightRay) far = Math.min(far, L.sightRay(g.city, p, p.x, p.y, Math.atan2(dy, dx), far));
    (g.throws || (g.throws = [])).push({ x: p.x, y: p.y, tx: p.x + dx / d * far, ty: p.y + dy / d * far, t: 0, floor: p.floor || 0 });
    return true;
  };

  L.updateFire = function (g, dt, input) {
    var p = g.player, M = D().molotov, s = g.city.scale;
    if (input && input.throwIt && !g.throwHeld && input.aimX !== undefined) {
      if (!L.throwMolotov(g, input.aimX, input.aimY) && !(g.noMolotovAt > g.time - 3)) { g.noMolotovAt = g.time; L.toast(g, 'No tenés molotovs (Tab: fabricar).', '#8d8672'); }
    }
    g.throwHeld = !!(input && input.throwIt);
    (g.throws || []).forEach(function (th) {
      th.t += dt;
      if (th.t >= M.flight && !th.done) {
        th.done = true;
        (g.fires || (g.fires = [])).push({ x: th.tx, y: th.ty, r: M.radius * s, t: M.time, floor: th.floor });
        if (L.makeNoise) L.makeNoise(g, th.tx, th.ty, M.noise, th.floor, p);
        L.emit(g, 'explode', th.tx, th.ty);
      }
    });
    g.throws = (g.throws || []).filter(function (th) { return !th.done; });
    (g.fires || []).forEach(function (f) {
      f.t -= dt;
      g.enemies.forEach(function (e) {
        if (!e.dead && (e.floor || 0) === f.floor && Math.hypot(e.x - f.x, e.y - f.y) < f.r + e.r * 0.5) {
          e.burnDps = Math.max(e.burnDps || 0, M.dps); e.burnTtl = Math.max(e.burnTtl || 0, 1.5);
        }
      });
      if ((p.floor || 0) === f.floor && Math.hypot(p.x - f.x, p.y - f.y) < f.r && p.invuln <= 0) { p.hp -= M.dps * dt; p.hurt = 0.15; }
    });
    g.fires = (g.fires || []).filter(function (f) { return f.t > 0; });
  };
})(this.Lluvia = this.Lluvia || {});
