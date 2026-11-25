// The weather, flooding, covering yourself and refilling bottles (js/weather.js, js/melee.js, js/loot.js).

function wxGame() {
  var L = Lluvia, city = L.cityHome(1);
  var g = L.createGame({ seed: 31, city: city, explore: true, noSpawn: true, night: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
  g.spawning = false;
  var sp = L.cityFree(city, city.start.x, city.start.y);
  g.player.x = sp.x; g.player.y = sp.y; g.player.aim = 0;
  return g;
}
function setWeather(g, id) { g.weather.id = g.weather.prev = id; g.weather.blend = 1; g.weather.left = 99; }

test('clima: cambia solo, nunca dos veces igual seguido; la niebla y la lluvia achican la vista; el frío de noche afuera lastima', function () {
  var L = Lluvia, K = L.data.clock, g = wxGame(), seen = {}, last = g.weather.id;
  for (var i = 0; i < 40 * 30; i++) {
    L.updateWeather(g, K.hour / 30);
    if (g.weather.id !== last) { assert.notStrictEqual(g.weather.prev, g.weather.id); last = g.weather.id; }
    seen[g.weather.id] = 1;
  }
  assert.ok(Object.keys(seen).length >= 4, 'en 40 horas solo hubo ' + Object.keys(seen).join(', '));
  g.time = (12 - K.start) * K.hour;
  setWeather(g, 'despejado'); var clear = L.sightReach(g);
  setWeather(g, 'niebla'); var fog = L.sightReach(g);
  setWeather(g, 'lluvia'); var rain = L.sightReach(g);
  assert.ok(fog < clear * 0.6 && rain < clear, 'la niebla o la lluvia no achican la vista');
  setWeather(g, 'tormenta'); g.weather.nextFlash = 0;
  L.updateWeather(g, 0.016);
  assert.ok(g.weather.flashT > 0 && L.sightReach(g) >= clear * 0.99, 'el rayo no ilumina todo');
  // Cold at night outdoors, in a T-shirt (js/clothes.js decides how cold you are).
  setWeather(g, 'frio'); g.time = (24 - K.start) * K.hour;
  var hp = g.player.hp;
  for (i = 0; i < 30; i++) { L.updateWeather(g, K.hour / 30); L.updateClothes(g, 0, K.hour / 30); }
  assert.ok(g.player.hp < hp, 'el frío de noche afuera no lastima');
});

test('clima: con lluvia lo bajo se inunda y el agua frena; cuando para, baja', function () {
  var L = Lluvia, K = L.data.clock, g = wxGame(), city = g.city, T = city.map.terrain;
  setWeather(g, 'tormenta'); g.weather.nextFlash = 999;
  for (var i = 0; i < 4 * 30; i++) L.updateWeather(g, K.hour / 30);
  var rise = g.weather.rise;
  assert.ok(rise > 1, 'en 4 horas de tormenta el agua subió ' + rise.toFixed(2) + ' m');
  // The lowest and the highest spot of the map.
  var lo = 0, hi = 0;
  T.dm.forEach(function (v, k) { if (v < T.dm[lo]) lo = k; if (v > T.dm[hi]) hi = k; });
  var at = function (k) { var M = city.map, s = city.scale; return [((k % T.nx) + 0.5) * T.step * M.unit * s, (Math.floor(k / T.nx) + 0.5) * T.step * M.unit * s]; };
  var a = at(lo), b = at(hi);
  assert.ok(L.floodAt(g, a[0], a[1]) > 0.3 && L.floodSlow(g, a[0], a[1]) > 0, 'lo más bajo no se inunda');
  assert.strictEqual(L.floodAt(g, b[0], b[1]), 0, 'lo más alto se inunda');
  setWeather(g, 'despejado');
  for (i = 0; i < 2 * 30; i++) L.updateWeather(g, K.hour / 30);
  assert.ok(g.weather.rise < rise, 'sin lluvia el agua no baja');
});

test('cubrirse: con Espacio un golpe de adelante lastima menos y gasta aire; una pileta llena botellas', function () {
  var L = Lluvia, g = wxGame(), p = g.player, s = g.city.scale;
  var z = L.spawnEnemy(g, 'rastrero', p.x + (p.r + 10), p.y); z.floor = 0; z.mind = 'chase'; z.face = Math.PI;
  var hurt = function (input) {
    p.hp = p.stats.maxHp; p.air = L.data.melee.air.max; p.invuln = 0;
    z.x = p.x + p.r + 10; z.y = p.y; z.stun = 99;
    for (var i = 0; i < 15; i++) L.update(g, 1 / 30, input);
    return p.stats.maxHp - p.hp;
  };
  var open = hurt({}), cover = hurt({ block: true });
  assert.ok(open > 0, 'el zombi no lastima');
  assert.ok(cover < open * 0.7 && p.air < L.data.melee.air.max, 'cubrirse no frena el golpe: ' + cover.toFixed(2) + ' de ' + open.toFixed(2));
  // A sink: empty bottles become water.
  g.enemies = [];
  L.wear(g, 'mochila'); L.packAdd(g, 'botella', 2);
  var orig = L.searchTarget;
  L.searchTarget = function () { return { plan: { index: 1 }, f: 0, k: 0, t: 'pileta', key: '1:0:0', fill: true }; };
  try { L.updateLoot(g, L.data.loot.search + 0.01, { use: true }); } finally { L.searchTarget = orig; }
  assert.strictEqual(L.packCount(g, 'agua'), 2, 'la pileta no llena las botellas');
  assert.strictEqual(L.packCount(g, 'botella'), 0);
});
