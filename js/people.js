// Survivors (data/survivors.js, stage 69). g.people: [{ id, name, coat, x, y, floor, house (building number) or null,
// door (that house's opening key), street, want, give, done, line, dirX, dirY, still, r }]. Houses are decided once
// as you come near (g.peopleHouses: building number -> true); a house with somebody gets its door nailed from inside.
// Near one, E talks (g.talking: the person while the window is open; js/view/ui.js shows it).
(function (L) {
  'use strict';

  function D() { return L.data.survivors; }
  function hash(n) { return ((n + 101) * 2654435761) >>> 0; }
  var HOMES = { lateral: 1, central: 1, frontBack: 1, open: 1 };

  function pick(list, r) { return list[Math.floor(r * list.length) % list.length]; }
  function newPerson(g, rng, x, y) {
    var S = D(), want = pick(S.wants, rng()), give = pick(S.gives, rng());
    while (give[0] === want[0]) give = pick(S.gives, rng());
    g.peopleN = (g.peopleN || 0) + 1;
    return { id: g.peopleN, name: pick(S.names, rng()), coat: pick(S.coats, rng()), x: x, y: y, floor: 0, house: null, door: null,
      street: false, want: want, give: give, done: false, line: Math.floor(rng() * 3), dirX: 1, dirY: 0, still: 1, r: g.player.r,
      hp: S.hp, trust: S.trust.start, ties: {}, sanity: L.newSanity ? L.newSanity(rng) : 70 };
  }

  // Is there somebody in this house (always the same houses)?
  L.houseHasSurvivor = function (plan) { return !!plan && HOMES[plan.layout] && (hash(plan.index) % 1000) / 1000 < D().house; };

  // Decides the houses within `R` meters (default: scan) that were not decided yet.
  L.peopleScan = function (g, R) {
    var city = g.city, p = g.player, s = city.scale, k = city.k, r2 = Math.pow((R || D().scan) * s, 2), nail = false;
    g.peopleHouses = g.peopleHouses || {};
    if (!g.people) g.people = [];
    var B = city.map.buildings, cell = 50 * s, grid = city._bgrid;
    if (!grid) { // building numbers by 50 m cell, made once
      grid = city._bgrid = new Map();
      for (var j = 0; j < B.length; j++) { var key0 = Math.floor(B[j][0][0] * k / cell) + ',' + Math.floor(B[j][0][1] * k / cell); (grid.get(key0) || grid.set(key0, []).get(key0)).push(j); }
    }
    var near = [], R0 = Math.ceil((R || D().scan) * s / cell), cx = Math.floor(p.x / cell), cy = Math.floor(p.y / cell);
    for (var gx = cx - R0; gx <= cx + R0; gx++) for (var gy = cy - R0; gy <= cy + R0; gy++) { var list = grid.get(gx + ',' + gy); if (list) near = near.concat(list); }
    near.sort(function (a, b) { return a - b; });
    for (var n = 0; n < near.length; n++) {
      var i = near[n];
      if (g.peopleHouses[i]) continue;
      var x = B[i][0][0] * k, y = B[i][0][1] * k;
      if ((x - p.x) * (x - p.x) + (y - p.y) * (y - p.y) > r2) continue;
      g.peopleHouses[i] = true;
      if ((hash(i) % 1000) / 1000 >= D().house) continue; // the draw first: only those get their plan made
      var plan = L.cityHouse(city, i);
      if (!L.houseHasSurvivor(plan) || !plan.exitsPx.length || (g.refuge && plan.index === g.refuge.house)) continue;
      var e = plan.exitsPx[0], at = L.cityFree(city, e.x - e.nx * 1.2 * s, e.y - e.ny * 1.2 * s);
      if (L.cityHouseAt(city, at.x, at.y) !== plan) continue;
      var who = newPerson(g, L.makeRng(hash(i) || 1), at.x, at.y);
      who.house = plan.index; who.dirX = e.nx; who.dirY = e.ny;
      // The door, nailed from inside.
      if (g.barricades && L.planOpenings) {
        var o = L.planOpenings(plan).filter(function (q) { return q.kind === 'door'; }).sort(function (a, b) { return Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y); })[0];
        if (o) {
          var Bd = L.data.barricade;
          g.barricades[o.key] = { planks: Bd.planks.door, hp: Bd.planks.door * Bd.plankHp, furn: -1, fhp: 0, broken: false, glass: Bd.glassHp };
          who.door = o.key; nail = true;
        }
      }
      g.people.push(who);
    }
    if (nail) L.useBarricades(g);
  };

  // Somebody on a street, by day, out of sight.
  function spawnStreet(g) {
    var S = D().street, p = g.player, s = g.city.scale;
    for (var tries = 0; tries < 6; tries++) {
      var a = g.rng() * Math.PI * 2, r0 = (S.near + g.rng() * (S.far - S.near)) * s;
      var pt = L.cityFree(g.city, p.x + Math.cos(a) * r0, p.y + Math.sin(a) * r0);
      if (L.cityHouseAt(g.city, pt.x, pt.y)) continue;
      if (L.canSee && L.canSee(g.city, p, p.aim || 0, pt.x, pt.y, 0)) continue;
      var who = newPerson(g, g.rng, pt.x, pt.y);
      who.street = true; who.walk = { t: 0, dx: 0, dy: 0 };
      g.people.push(who);
      return who;
    }
    return null;
  }

  // The person you can talk to: on your floor, close enough (through their door from a little farther).
  L.talkTarget = function (g) {
    var p = g.player, s = g.city.scale, best = null, bd = Infinity;
    (g.people || []).forEach(function (q) {
      if (q.dead || q.hostile || q.mode === 'travel' || (q.floor || 0) !== (p.floor || 0)) return;
      // You talk to somebody you look at (else anyone walking by, or the one following you, would take E from the
      // furniture and the doors); through a nailed door, just standing there.
      var door = q.door && g.barricades[q.door];
      if (!door) { var da = Math.atan2(q.y - p.y, q.x - p.x) - (p.aim || 0); da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) > D().face) return; }
      var d = Math.hypot(q.x - p.x, q.y - p.y), reach = (q.door && g.barricades[q.door] ? D().door : D().talk) * s + p.r;
      if (d < reach && d < bd) { bd = d; best = q; }
    });
    return best;
  };

  // What they say now.
  L.personText = function (g, q) {
    var S = D(), T = S.lines;
    if (q.say) return q.say; // what they answered to what you just asked
    if (L.refuses(q)) return T.refuse[q.line % T.refuse.length];
    if (L.isOdd && L.isOdd(q)) { var Mo = L.data.madness.lines.odd; return Mo[q.line % Mo.length] + (q.done ? '' : ' ' + T.ask.replace('{want}', L.lootText([q.want])).replace('{give}', L.lootText([q.give]))); }
    if (q.mode === 'refuge') return q.done ? T.refugeDone : T.refugeAsk.replace('{want}', L.lootText([q.want]));
    if (q.mode === 'follow') return T.following;
    if (q.mode === 'wait') return T.waiting;
    if (q.done) return q.thanks ? T.thanks.replace('{give}', L.lootText([q.give])) : T.done;
    var first = q.house !== null && q.door && g.barricades[q.door] ? T.house[q.line] : q.street ? T.street[q.line] : T.house[q.line];
    return first + ' ' + T.ask.replace('{want}', L.lootText([q.want])).replace('{give}', L.lootText([q.give]));
  };
  function count(g, id) {
    if (id.indexOf('w:') === 0) {
      var wid = id.slice(2), h = g.player.hands || {}, n = 0;
      [h.r, h.l === h.r ? null : h.l].forEach(function (sl) { if (sl && sl.id === id) n++; });
      L.packWeapons(g).forEach(function (w) { if (w.place.slots[w.i].id === id) n++; });
      return n;
    }
    return L.packCount(g, id);
  }
  L.canGive = function (g, q) { return !q.done && !L.refuses(q) && count(g, q.want[0]) >= q.want[1]; };
  // Hands over what they asked for and gets what they promised (what doesn't fit lands at your feet).
  L.giveTo = function (g, q) {
    if (!L.canGive(g, q)) return false;
    var id = q.want[0];
    if (id.indexOf('w:') === 0) {
      var h = g.player.hands || {};
      if (h.r && h.r.id === id) { if (h.l === h.r) h.l = null; h.r = null; }
      else if (h.l && h.l.id === id) h.l = null;
      else { var w = L.packWeapons(g).filter(function (x) { return x.place.slots[x.i].id === id; })[0]; w.place.slots.splice(w.i, 1); }
    } else L.packTake(g, id, q.want[1]);
    if (q.mode === 'refuge') {
      // The people of the Catedral: nothing back but their trust.
      q.done = true; trust(q, D().trust.helped);
      L.emit(g, 'loot', g.player.x, g.player.y, { piece: 'persona', got: [] });
      if (L.repChange) L.repChange(g, 'catedral', D().refuge.rep, 'La gente de ' + g.refuge.name + ' te lo agradece.');
      return true;
    }
    var gid = q.give[0], n = q.give[1];
    if (gid.indexOf('w:') === 0) { if (!L.giveMelee(g, gid.slice(2))) L.dropToGround(g, { id: gid, n: 1, dur: L.meleeDef(gid.slice(2)).dur }); }
    else if (gid.indexOf('r:') === 0) { var c = L.newCloth(gid.slice(2)); if (!(L.giveCloth ? L.giveCloth(g, c) : L.packAddSlot(g, c))) L.dropToGround(g, c); }
    else { var left = L.packAdd(g, gid, n); if (left) L.dropToGround(g, { id: gid, n: left }); }
    q.done = true; q.thanks = true; // says thanks until the talk ends
    trust(q, D().trust.helped);
    L.emit(g, 'loot', g.player.x, g.player.y, { piece: 'persona', got: [q.give] });
    if (L.repChange && g.refuge) L.repChange(g, 'catedral', D().rep, 'Ayudaste a ' + q.name + '.');
    return true;
  };

  // ---- Stage 70: sending them to the Catedral, walking with you, waiting ----
  // Somebody inside a nailed house comes out next to you (by the back, as it were).
  function comeOut(g, q) {
    if (q.house !== null && q.mode !== 'refuge' && q.door) { var at = behind(g); q.x = at.x; q.y = at.y; q.floor = at.floor; q.fh = at.fh; }
    q.house = null; q.door = null; q.street = false;
  }
  function behind(g) {
    var p = g.player, s = g.city.scale, a = p.aim || 0;
    var ent = { x: p.x - Math.cos(a) * D().behind * s, y: p.y - Math.sin(a) * D().behind * s, floor: p.floor || 0, house: p.floor ? p.house : null };
    var fr = L.cityLevelFree(g.city, ent, p.r) || { x: p.x, y: p.y };
    return { x: fr.x, y: fr.y, floor: p.floor || 0, fh: p.floor && p.house ? p.house.index : null };
  }
  // A free spot inside the refuge, a few meters around its middle spot.
  function refugeSpot(g) {
    var plan = L.refugePlan(g), s = g.city.scale;
    for (var n = 0; n < 40; n++) {
      var a = g.rng() * Math.PI * 2, d = g.rng() * D().inside.spread * s, fr = L.cityFree(g.city, g.refuge.x + Math.cos(a) * d, g.refuge.y + Math.sin(a) * d);
      if (L.cityHouseAt(g.city, fr.x, fr.y) === plan) return fr;
    }
    return { x: g.refuge.x, y: g.refuge.y };
  }
  function refugeWant(g, q) { q.want = D().refuge.wants[Math.floor(g.rng() * D().refuge.wants.length)]; q.done = false; }
  L.sendToRefuge = function (g, q) {
    if (!g.refuge || q.mode === 'refuge' || q.mode === 'travel') return false;
    var s = g.city.scale, d = Math.hypot(q.x - g.refuge.x, q.y - g.refuge.y) / s;
    comeOut(g, q);
    q.mode = 'travel'; q.travel = d / D().travel; q.say = D().lines.sent;
    L.toast(g, q.name + ' va para ' + g.refuge.name + '.', '#9fc3a0');
    return true;
  };
  function arrive(g, q) {
    var at = refugeSpot(g);
    q.mode = 'refuge'; q.x = at.x; q.y = at.y; q.floor = 0; q.fh = null; q.house = g.refuge.house; q.travel = 0;
    q.walk = { t: 0, dx: 0, dy: 0 };
    refugeWant(g, q);
    L.toast(g, q.name + ' llegó a ' + g.refuge.name + '.', '#9fc3a0');
  }
  L.followMe = function (g, q) {
    if (q.mode === 'travel' || q.mode === 'follow') return false;
    comeOut(g, q);
    q.mode = 'follow'; q.say = D().lines.follow; q.stuckT = 0; q.hitT = 0;
    return true;
  };
  L.waitHere = function (g, q) {
    if (q.mode !== 'follow') return false;
    q.mode = 'wait'; q.say = D().lines.wait;
    return true;
  };
  // What you can ask of somebody now (the talk window shows these as buttons).
  L.personActions = function (g, q) {
    var out = [], add = function (label, run) { out.push({ label: label, run: run }); };
    var helped = q.done || q.mode === 'follow' || q.mode === 'wait' || q.mode === 'refuge';
    if (L.canCalm && L.canCalm(g, q)) add('Calmarlo (' + L.lootText([L.data.madness.calm.item]) + ')', function () { return L.calm(g, q); });
    if (!helped || L.refuses(q)) return out; // first they want to see you help
    if (q.mode !== 'follow') add('Que te acompañe', function () { return L.followMe(g, q); });
    if (q.mode === 'follow') add('Que espere acá', function () { return L.waitHere(g, q); });
    if (q.mode !== 'refuge' && g.refuge) add('Mandarlo a ' + g.refuge.name, function () { return L.sendToRefuge(g, q); });
    return out;
  };

  // ---- Stage 71: trust, ties between them, hitting them ----
  function trust(q, dv) { q.trust = Math.max(0, Math.min(100, (q.trust === undefined ? D().trust.start : q.trust) + dv)); }
  L.refuses = function (q) { return (q.trust === undefined ? D().trust.start : q.trust) < D().trust.refuse; };
  L.trustWord = function (q) {
    var w = D().words, v = q.trust === undefined ? D().trust.start : q.trust;
    for (var i = 0; i < w.length; i++) if (v >= w[i][0]) return w[i][1];
    return w[w.length - 1][1];
  };
  // Who is standing in front of you within `reach` meters, on your floor (for a blow): { q, d } or null.
  L.personInFront = function (g, reach, half) {
    var p = g.player, s = g.city.scale, aim = p.aim || 0, best = null, bd = Infinity;
    (g.people || []).forEach(function (q) {
      if (q.dead || q.mode === 'travel' || (q.floor || 0) !== (p.floor || 0)) return;
      var dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy);
      if (d > reach * s + q.r + p.r) return;
      var diff = Math.abs(((Math.atan2(dy, dx) - aim) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI);
      if (diff > half && d > q.r + p.r) return;
      if (d < bd) { bd = d; best = q; }
    });
    return best ? { q: best, d: bd } : null;
  };
  // Who a bullet at (x, y) hits, or null.
  L.personAt = function (g, x, y, r, floor) {
    var hit = null;
    (g.people || []).forEach(function (q) { if (!hit && !q.dead && q.mode !== 'travel' && (q.floor || 0) === (floor || 0) && Math.hypot(q.x - x, q.y - y) < q.r + r) hit = q; });
    return hit;
  };
  // You hurt somebody: they trust you much less, the ones who see it too (more if they were close to them), and the
  // Catedral finds out if anybody lived to tell. Dead, they get up as one of them after a while.
  L.hurtPerson = function (g, q, dmg) {
    if (q.dead) return;
    var S = D(), p = g.player, s = g.city.scale;
    q.hp = (q.hp === undefined ? S.hp : q.hp) - dmg;
    q.flash = 0.15;
    var dying = q.hp <= 0, self = !!q.hostile; // one who turned on you: defending yourself costs nothing
    if (!self) trust(q, S.trust.hit);
    if (L.changeSanity) L.changeSanity(q, L.data.madness.sawHit);
    var seen = [];
    g.people.forEach(function (w) {
      if (w === q || w.dead || w.mode === 'travel') return;
      var plan = w.fh !== null && w.fh !== undefined ? L.cityHouse(g.city, w.fh) : null, ent = { x: w.x, y: w.y, floor: w.floor || 0, house: plan };
      if (Math.hypot(w.x - q.x, w.y - q.y) > S.witness * s || !L.canSee(g.city, ent, Math.atan2(q.y - w.y, q.x - w.x), q.x, q.y, q.floor || 0)) return;
      if (!self) trust(w, S.trust.saw - S.trust.tie * ((w.ties || {})[q.id] || 0));
      if (L.changeSanity) L.changeSanity(w, dying ? L.data.madness.sawDeath : L.data.madness.sawHit);
      seen.push(w);
    });
    // Walking with you: not any more. It goes off on its own.
    if (q.mode === 'follow' || q.mode === 'wait') { q.mode = null; q.street = true; q.walk = { t: 0, dx: 0, dy: 0 }; }
    seen.forEach(function (w) { if (w.mode === 'follow' && L.refuses(w)) { w.mode = null; w.street = true; w.walk = { t: 0, dx: 0, dy: 0 }; } });
    var dead = q.hp <= 0;
    if (dead) { q.dead = true; q.deadT = S.turn; q.still = 1; L.emit(g, 'headshot', q.x, q.y); } // blood (the 'kill' effect is for zombies)
    else L.emit(g, 'bodyhit', q.x, q.y);
    // One fight is one story: blows to the same person within `again` seconds count once (killing still counts).
    var fresh = dead || !(q.hitAt > g.time - S.again); q.hitAt = g.time;
    var told = (seen.length > 0 || !dead) && fresh && !self;
    if (self) { L.toast(g, dead ? 'Te defendiste: ' + q.name + ' cayó.' : 'Te defendés de ' + q.name + '.', '#c26a4a'); return; }
    if (told && L.repChange && g.refuge) L.repChange(g, 'catedral', -(dead ? S.harm.kill : S.harm.hit), dead ? 'Mataste a ' + q.name + ' y alguien lo vio.' : 'Le pegaste a ' + q.name + '.');
    else if (fresh) L.toast(g, dead ? 'Mataste a ' + q.name + '. Nadie lo vio.' : 'Le pegaste a ' + q.name + '.', '#c26a4a');
    if (seen.length) L.toast(g, seen.map(function (w) { return w.name; }).join(', ') + (seen.length === 1 ? ' lo vio.' : ' lo vieron.'), '#c26a4a');
  };
  // Dead: after a while it gets up as one of them.
  function rise(g, q) {
    var z = L.spawnEnemy(g, 'rastrero', q.x, q.y);
    z.floor = q.floor || 0;
    if (q.fh !== null && q.fh !== undefined && z.floor) z.house = L.cityHouse(g.city, q.fh);
    L.emit(g, 'barrier', q.x, q.y);
    q.gone = true;
  }

  // Walking with you: keeps close, catches up when far and out of sight, hits zombies next to it.
  function follow(g, q, dt) {
    var F = D().follow, p = g.player, city = g.city, s = city.scale;
    var d = Math.hypot(p.x - q.x, p.y - q.y), sameFloor = (q.floor || 0) === (p.floor || 0);
    var seen = sameFloor && L.canSee && L.canSee(city, p, p.aim || 0, q.x, q.y, q.floor || 0);
    if ((!sameFloor || d > F.catch * s || q.stuckT > 4) && !seen) {
      var at = behind(g); q.x = at.x; q.y = at.y; q.floor = at.floor; q.fh = at.fh; q.fs = null; q.stuckT = 0; q.still = 1;
      return;
    }
    if (d > F.keep * s && sameFloor) {
      var v = p.stats.speed * F.speed * dt, nx = q.x + (p.x - q.x) / d * v, ny = q.y + (p.y - q.y) / d * v;
      var plan = q.fh !== null && q.fh !== undefined ? L.cityHouse(city, q.fh) : null;
      var ent = { x: q.x, y: q.y, floor: q.floor || 0, z: q.z || 0, house: plan, stairOn: plan && q.fs !== null && q.fs !== undefined ? plan.stairs[q.fs] : null };
      var out = L.cityLevelMove(city, ent, nx, ny, q.r);
      var moved = Math.hypot(out.x - q.x, out.y - q.y);
      q.dirX = (p.x - q.x) / d; q.dirY = (p.y - q.y) / d;
      q.x = out.x; q.y = out.y; q.floor = ent.floor; q.z = ent.z;
      q.fh = ent.house ? ent.house.index : null; q.fs = ent.stairOn && ent.house ? ent.house.stairs.indexOf(ent.stairOn) : null;
      q.still = moved > 0.2 * v ? 0 : 1;
      q.stuckT = moved < 0.2 * v ? (q.stuckT || 0) + dt : 0;
    } else { q.still = 1; q.stuckT = 0; }
    // A zombie next to it gets hit.
    q.hitT = Math.max(0, (q.hitT || 0) - dt);
    if (q.hitT > 0) return;
    var best = null, bd = F.reach * s;
    g.enemies.forEach(function (e) { if (e.dead || (e.floor || 0) !== (q.floor || 0)) return; var de = Math.hypot(e.x - q.x, e.y - q.y) - e.r; if (de < bd) { bd = de; best = e; } });
    if (best) {
      var dl = Math.hypot(best.x - q.x, best.y - q.y) || 1;
      L.applyHit(g, best, F.hit, 0, 0); q.hitT = F.every; q.dirX = (best.x - q.x) / dl; q.dirY = (best.y - q.y) / dl;
      L.emit(g, 'blow', best.x, best.y);
    }
  }
  // Living in the Catedral: walking around inside.
  function wanderInside(g, q, dt) {
    var s = g.city.scale, plan = L.refugePlan(g), w = q.walk || (q.walk = { t: 0, dx: 0, dy: 0 });
    w.t -= dt;
    if (w.t <= 0) { w.t = 2 + g.rng() * 4; var a = g.rng() * Math.PI * 2, go = g.rng() < 0.4; w.dx = go ? Math.cos(a) : 0; w.dy = go ? Math.sin(a) : 0; }
    var nx = q.x + w.dx * D().inside.speed * s * dt, ny = q.y + w.dy * D().inside.speed * s * dt;
    if ((w.dx || w.dy) && L.cityFits(g.city, nx, ny, L.data.city.body) && L.cityHouseAt(g.city, nx, ny) === plan) { q.x = nx; q.y = ny; q.dirX = w.dx; q.dirY = w.dy; q.still = 0; }
    else { w.t = 0; q.still = 1; }
  }

  // Each frame: houses near you, people on the streets, and E to talk.
  // `gdt`: seconds of the game's clock (faster while you sleep), for the trip to the Catedral.
  L.updatePeople = function (g, dt, input, gdt) {
    if (!g.city || !g.people && !g.refuge) return;
    var S = D(), St = S.street, p = g.player, s = g.city.scale;
    g.peopleScanT = (g.peopleScanT || 0) - dt;
    var ls = g.peopleScanAt;
    if (g.peopleScanT <= 0 && (!ls || Math.hypot(p.x - ls.x, p.y - ls.y) > S.rescan * s)) { g.peopleScanT = 0.5; g.peopleScanAt = { x: p.x, y: p.y }; L.peopleScan(g); }
    var light = L.clockOf(g).light > 0.5;
    // The streets: one more by day now and then, the far ones go away.
    g.people = g.people.filter(function (q) { return !q.street || q === g.talking || Math.hypot(q.x - p.x, q.y - p.y) < St.leave * s; });
    var onStreet = g.people.filter(function (q) { return q.street; }).length;
    g.peopleT = (g.peopleT || 0) + dt;
    if (light && onStreet < St.max && g.peopleT >= St.every) { g.peopleT = 0; spawnStreet(g); }
    // Every morning the people of the Catedral need something new, and the ones living together get closer.
    var day = L.clockOf(g).day;
    if (g.peopleDay !== day) {
      if (g.peopleDay !== undefined && L.madnessDay) L.madnessDay(g); // how they lived yesterday (js/madness.js)
      g.peopleDay = day;
      var home = g.people.filter(function (q) { return q.mode === 'refuge' && !q.dead; });
      home.forEach(function (q) {
        refugeWant(g, q);
        q.ties = q.ties || {};
        home.forEach(function (o) { if (o !== q) q.ties[o.id] = Math.min(100, (q.ties[o.id] || 0) + D().trust.together); });
      });
    }
    // The dead get up.
    g.people.forEach(function (q) { if (q.dead && !q.gone) { q.deadT -= dt; if (q.deadT <= 0) rise(g, q); } });
    g.people = g.people.filter(function (q) { return !q.gone; });
    // On the way to the Catedral, walking with you, living there; people on the street wander a little.
    g.people.forEach(function (q) {
      if (q.flash > 0) q.flash -= dt;
      if (q.dead || q.hostile) return;
      if (q.mode === 'travel') { q.travel -= gdt || dt; if (q.travel <= 0) arrive(g, q); return; }
      if (q === g.talking) { q.still = 1; return; }
      if (q.mode === 'follow') { follow(g, q, dt); return; }
      if (q.mode === 'refuge') { wanderInside(g, q, dt); return; }
      if (!q.street) { q.still = 1; return; }
      var w = q.walk;
      w.t -= dt;
      if (w.t <= 0) { w.t = 1 + g.rng() * 3; var a = g.rng() * Math.PI * 2, go = g.rng() < 0.5; w.dx = go ? Math.cos(a) : 0; w.dy = go ? Math.sin(a) : 0; }
      var nx = q.x + w.dx * St.speed * s * dt, ny = q.y + w.dy * St.speed * s * dt;
      if ((w.dx || w.dy) && L.cityFits(g.city, nx, ny, L.data.city.body) && !L.cityHouseAt(g.city, nx, ny)) { q.x = nx; q.y = ny; q.dirX = w.dx; q.dirY = w.dy; q.still = 0; }
      else { w.t = 0; q.still = 1; }
    });
    if (L.updateMadness) L.updateMadness(g, dt); // screams, plots, trances, the ones who turned on you (js/madness.js)
    // E: talk (a press).
    var tg = g.barWork || g.search ? null : L.talkTarget(g); // nailing or searching: E stays on that
    g.talkTarget = tg;
    if (tg && input && input.use && !g.talkWas && !g.talking) { g.talking = tg; var dx = p.x - tg.x, dy = p.y - tg.y, l = Math.hypot(dx, dy) || 1; tg.dirX = dx / l; tg.dirY = dy / l; }
    g.talkWas = !!(input && input.use);
  };
  L.stopTalking = function (g) { if (g.talking) { g.talking.thanks = false; g.talking.say = null; } g.talking = null; g.talkWas = true; g.useWas = true; };
})(this.Lluvia = this.Lluvia || {});
