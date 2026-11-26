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
      street: false, want: want, give: give, done: false, line: Math.floor(rng() * 3), dirX: 1, dirY: 0, still: 1, r: g.player.r };
  }

  // Is there somebody in this house (always the same houses)?
  L.houseHasSurvivor = function (plan) { return !!plan && HOMES[plan.layout] && (hash(plan.index) % 1000) / 1000 < D().house; };

  // Decides the houses within `R` meters (default: scan) that were not decided yet.
  L.peopleScan = function (g, R) {
    var city = g.city, p = g.player, s = city.scale, k = city.k, r2 = Math.pow((R || D().scan) * s, 2), nail = false;
    g.peopleHouses = g.peopleHouses || {};
    if (!g.people) g.people = [];
    var B = city.map.buildings;
    for (var i = 0; i < B.length; i++) {
      if (g.peopleHouses[i]) continue;
      var x = B[i][0][0] * k, y = B[i][0][1] * k;
      if ((x - p.x) * (x - p.x) + (y - p.y) * (y - p.y) > r2) continue;
      g.peopleHouses[i] = true;
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
      if (q.dead || (q.floor || 0) !== (p.floor || 0)) return;
      var d = Math.hypot(q.x - p.x, q.y - p.y), reach = (q.door && g.barricades[q.door] ? D().door : D().talk) * s + p.r;
      if (d < reach && d < bd) { bd = d; best = q; }
    });
    return best;
  };

  // What they say now.
  L.personText = function (g, q) {
    var S = D(), T = S.lines;
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
  L.canGive = function (g, q) { return !q.done && count(g, q.want[0]) >= q.want[1]; };
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
    var gid = q.give[0], n = q.give[1];
    if (gid.indexOf('w:') === 0) { if (!L.giveMelee(g, gid.slice(2))) L.dropToGround(g, { id: gid, n: 1, dur: L.meleeDef(gid.slice(2)).dur }); }
    else if (gid.indexOf('r:') === 0) { var c = L.newCloth(gid.slice(2)); if (!(L.giveCloth ? L.giveCloth(g, c) : L.packAddSlot(g, c))) L.dropToGround(g, c); }
    else { var left = L.packAdd(g, gid, n); if (left) L.dropToGround(g, { id: gid, n: left }); }
    q.done = true; q.thanks = true; // says thanks until the talk ends
    L.emit(g, 'loot', g.player.x, g.player.y, { piece: 'persona', got: [q.give] });
    if (L.repChange && g.refuge) L.repChange(g, 'catedral', D().rep, 'Ayudaste a ' + q.name + '.');
    return true;
  };

  // Each frame: houses near you, people on the streets, and E to talk.
  L.updatePeople = function (g, dt, input) {
    if (!g.city || !g.people && !g.refuge) return;
    var S = D(), St = S.street, p = g.player, s = g.city.scale;
    g.peopleScanT = (g.peopleScanT || 0) - dt;
    var ls = g.peopleScanAt;
    if (g.peopleScanT <= 0 && (!ls || Math.hypot(p.x - ls.x, p.y - ls.y) > 10 * s)) { g.peopleScanT = 0.5; g.peopleScanAt = { x: p.x, y: p.y }; L.peopleScan(g); }
    var light = L.clockOf(g).light > 0.5;
    // The streets: one more by day now and then, the far ones go away.
    g.people = g.people.filter(function (q) { return !q.street || q === g.talking || Math.hypot(q.x - p.x, q.y - p.y) < St.leave * s; });
    var onStreet = g.people.filter(function (q) { return q.street; }).length;
    g.peopleT = (g.peopleT || 0) + dt;
    if (light && onStreet < St.max && g.peopleT >= St.every) { g.peopleT = 0; spawnStreet(g); }
    // People on the street wander a little.
    g.people.forEach(function (q) {
      if (!q.street || q === g.talking) { q.still = 1; return; }
      var w = q.walk;
      w.t -= dt;
      if (w.t <= 0) { w.t = 1 + g.rng() * 3; var a = g.rng() * Math.PI * 2, go = g.rng() < 0.5; w.dx = go ? Math.cos(a) : 0; w.dy = go ? Math.sin(a) : 0; }
      var nx = q.x + w.dx * St.speed * s * dt, ny = q.y + w.dy * St.speed * s * dt;
      if ((w.dx || w.dy) && L.cityFits(g.city, nx, ny, L.data.city.body) && !L.cityHouseAt(g.city, nx, ny)) { q.x = nx; q.y = ny; q.dirX = w.dx; q.dirY = w.dy; q.still = 0; }
      else { w.t = 0; q.still = 1; }
    });
    // E: talk (a press).
    var tg = L.talkTarget(g);
    g.talkTarget = tg;
    if (tg && input && input.use && !g.talkWas && !g.talking) { g.talking = tg; var dx = p.x - tg.x, dy = p.y - tg.y, l = Math.hypot(dx, dy) || 1; tg.dirX = dx / l; tg.dirY = dy / l; }
    g.talkWas = !!(input && input.use);
  };
  L.stopTalking = function (g) { if (g.talking) g.talking.thanks = false; g.talking = null; g.talkWas = true; g.useWas = true; };
})(this.Lluvia = this.Lluvia || {});
