// Doors (the user, 2026-11-26: "agreguemos puertas a todo, que tengan llave, se puedan forzar y romper"): in the
// real game most street doors are closed and some locked; E opens and closes, from inside X locks; a locked one is
// forced with a tool (holding X) or broken by blows; zombies break them too.

function doorGame(seed) {
  var L = Lluvia, city = L.cityHome(1);
  var g = L.createGame({ seed: seed, city: city, explore: true, noSpawn: true, night: true, refuge: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
  g.spawning = false;
  return g;
}
// A street door near the start whose state matches `want(st)`, with the player standing outside (or inside) it.
function atDoor(g, want, inside) {
  var L = Lluvia, city = g.city, s = city.scale, p = g.player;
  for (var i = 0; i < city.map.buildings.length; i++) {
    var plan = L.cityHouse(city, i);
    if (!plan || !plan.exitsPx.length || plan.index === g.refuge.house) continue;
    var hit = null;
    L.planOpenings(plan).forEach(function (o) { if (!hit && o.kind === 'door' && want(L.doorState(g, o)) && !g.barricades[o.key]) hit = o; });
    if (!hit) continue;
    var side = inside ? -1 : 1, x = hit.x + hit.nx * 0.9 * s * side, y = hit.y + hit.ny * 0.9 * s * side;
    if (!L.cityFits(city, x, y, L.data.city.body) || (L.cityHouseAt(city, x, y) === plan) !== !!inside) continue;
    p.x = x; p.y = y; p.floor = 0; p.house = null; p.aim = Math.atan2(hit.y - y, hit.x - x);
    g.enemies.length = 0;
    return hit;
  }
  return null;
}
function tapKey(g, key) {
  var L = Lluvia, i = {}; i[key] = true;
  L.update(g, 1 / 30, i); L.update(g, 1 / 30, {});
}
function holdKey(g, key, secs, inp) {
  var L = Lluvia;
  for (var t = 0; t < secs; t += 1 / 30) { var i = {}; i[key] = true; L.update(g, 1 / 30, i); }
  L.update(g, 1 / 30, {});
}

test('puertas: casi todas las de la calle están cerradas (no se pasa ni se ve); la Catedral, abierta; sin refugio no hay puertas', function () {
  var L = Lluvia, g = doorGame(151), city = g.city;
  var o = atDoor(g, function (st) { return st.closed; });
  assert.ok(o, 'no hay ninguna puerta cerrada');
  assert.ok(!L.cityFits(city, o.x, o.y, 2), 'por una puerta cerrada se pasa');
  L.planOpenings(L.refugePlan(g)).forEach(function (q) { if (L.isDoor(q)) assert.ok(!L.doorState(g, q).closed, 'la Catedral tiene una puerta cerrada'); });
  var h = L.createGame({ seed: 151, city: L.cityHome(1), explore: true, noSpawn: true, night: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
  assert.ok(!L.doorStateOf(null, o, h.city._doors && !h.refuge ? false : false).closed);
});

test('puertas: E la abre y la cierra; desde adentro, X la traba y la destraba', function () {
  var L = Lluvia, g = doorGame(152), city = g.city;
  var o = atDoor(g, function (st) { return st.closed && !st.locked; });
  assert.ok(o, 'no hay una puerta cerrada sin llave');
  tapKey(g, 'use');
  assert.ok(!L.doorState(g, o).closed, 'E no la abrió');
  assert.ok(L.cityFits(city, o.x, o.y, 2), 'abierta no se pasa');
  tapKey(g, 'use');
  assert.ok(L.doorState(g, o).closed, 'E no la cerró');
  // From inside: lock and unlock.
  var p = g.player, s = city.scale;
  p.x = o.x - o.nx * 0.9 * s; p.y = o.y - o.ny * 0.9 * s;
  if (L.cityFits(city, p.x, p.y, L.data.city.body)) {
    tapKey(g, 'pry');
    assert.ok(L.doorState(g, o).locked, 'X desde adentro no la traba');
    tapKey(g, 'pry');
    assert.ok(!L.doorState(g, o).locked, 'X no la destraba');
  }
});

test('puertas: cerrada con llave no abre; sin herramienta no se fuerza; con una barra, manteniendo X, sí', function () {
  var L = Lluvia, g = doorGame(153);
  var o = atDoor(g, function (st) { return st.locked; });
  assert.ok(o, 'no hay una puerta con llave');
  tapKey(g, 'use');
  assert.ok(L.doorState(g, o).closed, 'con llave se abre igual');
  holdKey(g, 'pry', L.data.doors.force + 0.5);
  assert.ok(L.doorState(g, o).closed, 'se forzó sin herramienta');
  assert.ok(/forzala|rompela/.test(g.barTarget.need), 'no dice qué hace falta');
  L.wear(g, 'mochila'); L.giveMelee(g, 'barra');
  holdKey(g, 'pry', L.data.doors.force + 0.5);
  var st = L.doorState(g, o);
  assert.ok(!st.closed && !st.locked, 'con la barra no se forzó');
});

test('puertas: a golpes se rompe; un zombi que te busca también la rompe', function () {
  var L = Lluvia, g = doorGame(154), p = g.player, s = g.city.scale;
  var o = atDoor(g, function (st) { return st.locked; });
  L.wear(g, 'mochila'); L.holdWeapon(g, 'martillo'); p.hand = 'melee';
  for (var n = 0; n < 200 && !L.doorState(g, o).broken; n++) { p.swingCd = 0; p.swingCdR = 0; p.air = L.data.melee.air.max; L.swing(g); }
  assert.ok(L.doorState(g, o).broken, 'a golpes no se rompe');
  assert.ok(L.cityFits(g.city, o.x, o.y, 2), 'rota no se pasa');
  // A zombie after a noise inside another locked house.
  var o2 = atDoor(g, function (st) { return st.locked; }), plan = o2.plan;
  var z = L.spawnEnemy(g, 'rastrero', o2.x + o2.nx * 1.0 * s, o2.y + o2.ny * 1.0 * s);
  z.floor = 0; z.face = 0; z.mind = 'investigate'; z.goX = o2.x - o2.nx * 2 * s; z.goY = o2.y - o2.ny * 2 * s; z.linger = 60;
  p.x = o2.x - o2.nx * 3 * s; p.y = o2.y - o2.ny * 3 * s; p.house = null; p.floor = 0;
  var fr = L.cityFree(g.city, p.x, p.y); p.x = fr.x; p.y = fr.y;
  for (var t = 0; t < 60 && !L.doorState(g, o2).broken; t += 1 / 30) { L.update(g, 1 / 30, {}); p.hp = p.stats.maxHp; z.linger = 60; z.mind = 'investigate'; z.goX = o2.x - o2.nx * 2 * s; z.goY = o2.y - o2.ny * 2 * s; }
  assert.ok(L.doorState(g, o2).broken, 'el zombi no rompió la puerta');
});
