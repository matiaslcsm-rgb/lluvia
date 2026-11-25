// Clothes (stage 62, the user's answer 3): like Project Zomboid, each garment warms and protects.

function clothesGame(seed) {
  var L = Lluvia, city = L.cityHome(1);
  var g = L.createGame({ seed: seed || 81, city: city, explore: true, noSpawn: true, night: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
  g.spawning = false;
  var sp = L.cityFree(city, city.start.x, city.start.y);
  g.player.x = sp.x; g.player.y = sp.y;
  L.wear(g, 'mochila');
  return g;
}
function setWeather(g, id) { g.weather.id = id; g.weather.prev = id; g.weather.blend = 1; }

test('ropa: arrancás vestido; abriga, el frío y el calor cambian el cuerpo; helado perdés vida', function () {
  var L = Lluvia, C = L.data.clothes, g = clothesGame(), p = g.player, hour = L.data.clock.hour;
  assert.deepStrictEqual(C.start.map(function (c) { return p.clothes[C.kinds[c].slot].id; }), C.start.map(function (c) { return 'r:' + c; }), 'no arrancás con la ropa de inicio');
  var base = L.warmth(g);
  assert.ok(Math.abs(base - C.start.reduce(function (a, c) { return a + C.kinds[c].warm; }, 0)) < 1e-9);
  // A cold day: with only the starting clothes you are cold; a camperón fixes it.
  setWeather(g, 'frio');
  L.updateClothes(g, 0, 0.01 * hour);
  assert.ok(p.warmState === 'frio' || p.warmState === 'helado', 'con frío y remera no tenés frío: ' + p.warmState);
  assert.ok(L.tempMul(g, 'hunger') > 1, 'el frío no da más hambre');
  L.putOn(g, L.newCloth('camperon')); L.putOn(g, L.newCloth('gorro')); L.putOn(g, L.newCloth('guantesLana'));
  L.updateClothes(g, 0, 0.01 * hour);
  assert.ok(p.warmState === 'bien' || p.warmState === 'calor', 'abrigado seguís con frío: ' + p.warmState);
  // A hot day with all that on: hot, more thirst.
  setWeather(g, 'calor');
  L.updateClothes(g, 0, 0.01 * hour);
  assert.ok(p.warmState === 'calor' || p.warmState === 'muchoCalor', 'con camperón en el calor no tenés calor: ' + p.warmState);
  assert.ok(L.tempMul(g, 'thirst') > 1 && L.tempMul(g, 'air') < 1);
  // Naked in the cold: freezing, you lose life.
  C.slots.forEach(function (s) { p.clothes[s] = null; });
  setWeather(g, 'frio');
  var hp = p.hp;
  L.updateClothes(g, 0, 1 * hour);
  assert.strictEqual(p.warmState, 'helado');
  assert.ok(p.hp < hp - 1, 'helado no perdés vida');
});

test('ropa: la lluvia moja, mojada abriga menos, se seca bajo techo; el piloto protege lo de abajo', function () {
  var L = Lluvia, g = clothesGame(), p = g.player, hour = L.data.clock.hour;
  var dry = L.warmth(g);
  setWeather(g, 'lluvia');
  L.updateClothes(g, 0, 1 * hour);
  assert.ok(p.clothes.torso.wet > 0.5, 'la remera no se moja con la lluvia');
  assert.ok(L.warmth(g) < dry * 0.8, 'mojada abriga igual');
  // A raincoat over a dry shirt: the shirt barely gets wet.
  p.clothes.torso.wet = 0; L.putOn(g, L.newCloth('piloto'));
  L.updateClothes(g, 0, 1 * hour);
  assert.ok(p.clothes.torso.wet < 0.15, 'con piloto la remera se moja igual: ' + p.clothes.torso.wet);
  // It dries without rain.
  setWeather(g, 'despejado');
  var wet = p.clothes.piernas.wet;
  L.updateClothes(g, 0, 2 * hour);
  assert.ok(p.clothes.piernas.wet < wet, 'no se seca');
});

test('ropa: protege de las heridas y se gasta; se rompe', function () {
  var L = Lluvia, count = function (dress) {
    var n = 0;
    for (var i = 0; i < 60; i++) {
      var g = clothesGame(100 + i); g.rng = L.makeRng(500 + i); dress(g);
      L.takeWound(g, L.data.health.every * 5, null);
      n += g.player.wounds.length;
    }
    return n;
  };
  var naked = count(function (g) { L.data.clothes.slots.forEach(function (s) { g.player.clothes[s] = null; }); });
  var armored = count(function (g) {
    ['casco', 'camperaCuero', 'guantesCuero', 'pantalonTrabajo', 'botas'].forEach(function (c) { L.putOn(g, L.newCloth(c)); });
  });
  assert.ok(armored < naked * 0.75, 'la ropa no protege: con ' + armored + ', sin ' + naked);
  // A garment that stops blows wears out and tears.
  var g = clothesGame(), p = g.player;
  L.putOn(g, L.newCloth('camperaJean'));
  p.clothes.abrigo.dur = 1;
  g.rng = function () { return 0.35; }; // lands on the torso, and is stopped
  assert.ok(L.clothesStop(g, 'k'), 'la campera no frena el corte');
  assert.strictEqual(p.clothes.abrigo.dur, 0);
  assert.ok(/roto/.test(L.slotName(p.clothes.abrigo)), 'no dice que está rota');
  assert.ok(!L.clothesStop(g, 'k'), 'rota sigue protegiendo'); // only the shirt is left there, and it barely stops anything
});

test('ropa: en el ropero te ponés lo que falta y lo demás queda en el piso; ponerte cambia y guardás lo viejo', function () {
  var L = Lluvia, g = clothesGame(), p = g.player;
  p.clothes.cabeza = null;
  assert.ok(L.foundCloth(g, L.newCloth('gorro')), 'no te ponés el gorro');
  assert.strictEqual(p.clothes.cabeza.id, 'r:gorro');
  var before = g.ground.length;
  assert.ok(!L.foundCloth(g, L.newCloth('jogging')));
  assert.strictEqual(g.ground.length, before + 1, 'el jogging no queda en el piso');
  // Pick it up (it goes to the backpack: the legs are taken), then put it on: the jean goes to the backpack.
  p.x = g.ground[before].x; p.y = g.ground[before].y;
  assert.ok(L.pickUp(g, before));
  var pl = g.pack.places.filter(function (q) { return q.slots.some(function (sl) { return sl.id === 'r:jogging'; }); })[0];
  var i = pl.slots.findIndex(function (sl) { return sl.id === 'r:jogging'; });
  var put = L.slotActions(g, { pl: pl, i: i }).filter(function (a) { return a.label === 'Ponerte'; })[0];
  assert.ok(put && put.run());
  assert.strictEqual(p.clothes.piernas.id, 'r:jogging');
  assert.ok(g.pack.places.some(function (q) { return q.slots.some(function (sl) { return sl.id === 'r:jean'; }); }), 'el jean no quedó en la mochila');
  // Take it off: to the backpack.
  L.clothActions(g, 'piernas')[0].run();
  assert.strictEqual(p.clothes.piernas, null);
  // Saved and loaded, the clothes come back.
  var g2 = clothesGame();
  L.applySave(g2, JSON.parse(JSON.stringify(L.saveGame(g))));
  assert.strictEqual(g2.player.clothes.cabeza.id, 'r:gorro');
  assert.strictEqual(g2.player.clothes.piernas, null);
});
