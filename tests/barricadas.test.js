// Shelter and barricades (data/barricade.js, the user's answer 3 a): planks and nails on doors and windows,
// furniture against a door, zombies that bang until they break through.

function barGame(seed) {
  var L = Lluvia, city = L.cityHome(1);
  var g = L.createGame({ seed: seed || 121, city: city, explore: true, noSpawn: true, night: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
  g.spawning = false;
  g.enemies.length = 0;
  L.wear(g, 'mochila');
  return g;
}
// A house with a doorway you can stand inside of (and, if asked, a heavy piece near it / a window): { plan, o, x, y }.
function barHouse(g, want) {
  var L = Lluvia, city = g.city, M = city.map, s = city.scale;
  for (var i = 0; i < M.buildings.length; i++) {
    var plan = L.cityHouse(city, i);
    if (!plan) continue;
    var ops = L.planOpenings(plan);
    for (var j = 0; j < ops.length; j++) {
      var o = ops[j];
      if (o.kind !== (want === 'window' ? 'window' : 'door')) continue;
      var x = o.x - o.nx * 0.8 * s, y = o.y - o.ny * 0.8 * s, ox = o.x + o.nx * 0.9 * s, oy = o.y + o.ny * 0.9 * s;
      if (!L.cityFits(city, ox, oy, L.data.city.body)) continue;
      if (want !== 'window' && !L.cityFits(city, x, y, L.data.city.body)) continue;
      if (L.cityHouseAt(city, ox, oy) === plan) continue;
      if (want === 'piece' && !(plan.solidPx || []).some(function (q, k) {
        return L.data.barricade.heavy[plan.furniture[k].t] && Math.hypot(q.x - o.x, q.y - o.y) < L.data.barricade.moveReach * s;
      })) continue;
      return { plan: plan, o: o, x: x, y: y, ox: ox, oy: oy };
    }
  }
  return null;
}
function hold(g, input, secs) { for (var t = 0; t < secs; t += 0.1) Lluvia.updateLoot(g, 0.1, input); }
// Is any cell along an opening walkable?
function anyOpen(city, o) {
  for (var f = 0.1; f <= 0.9; f += 0.05) if (Lluvia.cityWalkable(city, o.seg[0] + (o.seg[2] - o.seg[0]) * f, o.seg[1] + (o.seg[3] - o.seg[1]) * f)) return true;
  return false;
}

test('barricadas: con tablas, clavos y martillo clavás tablas en la puerta y queda cerrada; con X las sacás', function () {
  var L = Lluvia, B = L.data.barricade, g = barGame(), p = g.player, h = barHouse(g, 'door');
  assert.ok(h, 'no hay una casa con puerta para probar');
  p.x = h.x; p.y = h.y; p.floor = 0;
  assert.ok(anyOpen(g.city, h.o), 'la puerta arranca cerrada');
  var T = L.barricadeTarget(g);
  assert.ok(T && T.o.key === h.o.key && T.add !== 'nail' && (T.add || T.need), 'sin materiales no dice qué falta');
  L.packAdd(g, 'tablas', 3); L.packAdd(g, 'clavos', 10); L.giveMelee(g, 'martillo');
  T = L.barricadeTarget(g);
  assert.strictEqual(T.add, 'nail');
  hold(g, { use: true }, 2);
  var b = g.barricades[h.o.key];
  assert.ok(b && b.planks === 1, 'no se clavó la tabla');
  assert.strictEqual(L.packCount(g, 'tablas'), 2);
  assert.strictEqual(L.packCount(g, 'clavos'), 10 - B.nails);
  assert.ok(!anyOpen(g.city, h.o), 'con una tabla se pasa igual');
  // Up to three; no more.
  hold(g, { use: true }, 4);
  assert.strictEqual(b.planks, B.planks.door);
  assert.ok(!L.barricadeTarget(g).add, 'entra una cuarta tabla');
  // X pries them off: you get the planks back (not the nails).
  hold(g, { pry: true }, 4);
  assert.ok(!g.barricades[h.o.key], 'quedan tablas');
  assert.strictEqual(L.packCount(g, 'tablas'), 3);
  assert.ok(anyOpen(g.city, h.o), 'sin tablas la puerta sigue cerrada');
});

test('barricadas: sin tablas, trabás la puerta corriendo un mueble pesado; lo volvés a su lugar', function () {
  var L = Lluvia, g = barGame(122), p = g.player, h = barHouse(g, 'piece');
  assert.ok(h, 'no hay una puerta con un mueble pesado cerca');
  p.x = h.x; p.y = h.y; p.floor = 0;
  var T = L.barricadeTarget(g);
  assert.strictEqual(T.add, 'move', 'no ofrece trabar con un mueble');
  hold(g, { use: true }, 3);
  var b = g.barricades[h.o.key];
  assert.ok(b && b.furn === T.piece.k, 'no se trabó');
  assert.ok(g.barricades[h.plan.index + ':f:' + b.furn], 'el mueble sigue en su lugar');
  assert.ok(!anyOpen(g.city, h.o), 'trabada se pasa');
  // The piece is no longer where it was: you can't search it there.
  var q = h.plan.solidPx[b.furn];
  p.x = q.x; p.y = q.y;
  var st = L.searchTarget(g);
  assert.ok(!st || st.k !== b.furn, 'se revisa el mueble que está en la puerta');
  p.x = h.x; p.y = h.y;
  hold(g, { pry: true }, 3);
  assert.ok(!g.barricades[h.o.key] && !g.barricades[h.plan.index + ':f:' + T.piece.k], 'no volvió a su lugar');
  assert.ok(anyOpen(g.city, h.o));
});

test('barricadas: los zombis que te buscan golpean la puerta hasta romper las tablas, y rompen ventanas', function () {
  var L = Lluvia, B = L.data.barricade, g = barGame(123), h = barHouse(g, 'door');
  g.barricades[h.o.key] = { planks: 1, hp: B.plankHp, furn: -1, fhp: 0, broken: false, glass: B.glassHp };
  L.useBarricades(g);
  assert.ok(!anyOpen(g.city, h.o));
  var e = L.spawnEnemy(g, 'rastrero', h.ox, h.oy);
  e.floor = 0; e.mind = 'investigate'; e.goX = h.x; e.goY = h.y; e.linger = 1; e.face = 0;
  var bangs = 0;
  for (var t = 0; t < B.plankHp / B.bang - 1; t += 0.5) L.updateBarricades(g, 0.5);
  assert.ok(g.barricades[h.o.key], 'rompe la tabla antes de tiempo');
  for (t = 0; t < 4; t += 0.5) L.updateBarricades(g, 0.5);
  assert.ok(!g.barricades[h.o.key], 'no rompe la tabla');
  assert.ok(anyOpen(g.city, h.o), 'rota la tabla la puerta sigue cerrada');
  // A window: closed to bodies until the glass breaks.
  var w = barHouse(g, 'window');
  assert.ok(w, 'no hay ventana');
  assert.ok(L.openingShut(g, w.o));
  var z = L.spawnEnemy(g, 'rastrero', w.ox, w.oy);
  z.floor = 0; z.mind = 'investigate'; z.goX = w.x; z.goY = w.y; z.linger = 1; z.face = 0;
  g.enemies = [z];
  for (t = 0; t < B.glassHp / B.bang + 1; t += 0.5) L.updateBarricades(g, 0.5);
  assert.ok(g.barricades[w.o.key] && g.barricades[w.o.key].broken, 'no rompe el vidrio');
  assert.ok(!L.openingShut(g, w.o));
  assert.ok(anyOpen(g.city, w.o), 'por la ventana rota no se pasa');
});

test('barricadas: se guardan con la partida y una partida nueva arranca sin ellas', function () {
  var L = Lluvia, B = L.data.barricade, g = barGame(124), h = barHouse(g, 'door');
  g.barricades[h.o.key] = { planks: 2, hp: 2 * B.plankHp, furn: -1, fhp: 0, broken: false, glass: B.glassHp };
  L.useBarricades(g);
  var g2 = barGame(125);
  assert.ok(anyOpen(g2.city, h.o), 'una partida nueva hereda las tablas');
  L.applySave(g2, JSON.parse(JSON.stringify(L.saveGame(g))));
  assert.strictEqual(g2.barricades[h.o.key].planks, 2);
  assert.ok(!anyOpen(g2.city, h.o), 'al seguir la partida la puerta quedó abierta');
});

test('barricadas: un zombi que oyó un ruido adentro camina hasta la puerta trabada y la rompe', function () {
  var L = Lluvia, B = L.data.barricade, g = barGame(126), p = g.player, h = barHouse(g, 'door'), s = g.city.scale;
  g.barricades[h.o.key] = { planks: 1, hp: B.plankHp, furn: -1, fhp: 0, broken: false, glass: B.glassHp };
  L.useBarricades(g);
  p.x = h.x; p.y = h.y; p.floor = 0; g.god = true;
  var at = L.cityFree(g.city, h.o.x + h.o.nx * 6 * s, h.o.y + h.o.ny * 6 * s);
  var e = L.spawnEnemy(g, 'rastrero', at.x, at.y);
  e.floor = 0; e.mind = 'investigate'; e.goX = h.x; e.goY = h.y; e.linger = 3; e.face = 0;
  for (var t = 0; t < 40 && g.barricades[h.o.key]; t += 1 / 30) { g.enemies = g.enemies.filter(function (z) { return z === e; }); L.update(g, 1 / 30, {}); }
  assert.ok(!g.barricades[h.o.key], 'el zombi no llegó a romper la tabla (quedó a ' + (Math.hypot(e.x - h.o.x, e.y - h.o.y) / s).toFixed(1) + ' m, ' + e.mind + ')');
});
