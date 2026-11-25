// Weight, eating and drinking, fainting, one life, experience without picking it up, objects in furniture, the
// readied blow (2026-11-25 batch).

function needsGame() {
  var L = Lluvia, city = L.cityHome(1);
  var g = L.createGame({ seed: 21, city: city, explore: true, noSpawn: true, night: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
  g.spawning = false;
  var sp = L.cityFree(city, city.start.x, city.start.y);
  g.player.x = sp.x; g.player.y = sp.y; g.player.aim = 0;
  return g;
}

test('peso: todo pesa, de más te frena; una sola vida; la experiencia llega sola al matar y al hacer cosas', function () {
  var L = Lluvia, C = L.data.loot.carry, g = needsGame(), p = g.player;
  assert.strictEqual(g.lives, 1, 'con el reloj no hay una sola vida');
  var light = L.packWeight(g);
  assert.ok(light > 0 && light < C.cap, 'al empezar pesa ' + light);
  assert.strictEqual(L.packSlow(g), 0, 'liviano te frena');
  L.wear(g, 'mochila'); L.packAdd(g, 'nafta', 3); L.packAdd(g, 'tablas', 6);
  assert.ok(L.packOver(g) > 0 && L.packSlow(g) > 0.1, 'cargado no te frena: ' + L.packWeight(g).toFixed(1) + ' kg');
  // Experience: a kill gives it straight away (no gem), and doing things too.
  var xp = p.xp, z = L.spawnEnemy(g, 'rastrero', p.x + 2000, p.y);
  L.applyHit(g, z, 999, 0, 0);
  L.update(g, 1 / 30, {});
  assert.ok(p.xp > xp && g.gems.length === 0, 'matar no da experiencia directa');
  xp = p.xp; L.gainSkill(g, 'cuerpo', 4);
  assert.ok(p.xp > xp, 'pelear no da experiencia');
});

test('comer y tomar: solo cuando hace falta y si tenés; sin comer el malestar crece; nervioso te podés desmayar', function () {
  var L = Lluvia, N = L.data.needs, K = L.data.clock, g = needsGame(), p = g.player, hour = K.hour;
  L.packAdd(g, 'agua', 1); L.packAdd(g, 'comida', 1);
  L.updateNeeds(g, (N.drink.every - 0.5) * hour);
  assert.strictEqual(L.packCount(g, 'agua'), 1, 'toma agua antes de tiempo');
  L.updateNeeds(g, hour);
  assert.strictEqual(L.packCount(g, 'agua'), 0, 'a las 6 horas no toma agua');
  assert.ok(p.watered < 1);
  L.updateNeeds(g, N.eat.every * hour);
  assert.strictEqual(L.packCount(g, 'comida'), 0, 'a las 12 horas no come');
  // Nothing left: a day without eating does nothing, then the unease grows.
  p.fed = 0; p.watered = 0;
  for (var i = 0; i < 20; i++) L.updateNeeds(g, hour);
  assert.strictEqual(L.uneaseOf({ fed: N.eat.every + N.eat.grace - 1, watered: 0 }), 0, 'un día sin comer ya hace mal');
  assert.ok(L.uneaseOf({ fed: 40, watered: 0 }) > 0, 'sin comer no crece el malestar');
  assert.ok(L.uneaseOf({ fed: 40, watered: 30 }) > L.uneaseOf({ fed: 40, watered: 0 }), 'sin tomar no suma');
  // Calm, nobody faints; nervous and sick, it happens.
  p.fed = 60; p.watered = 30; p.faint = 0; g.rng = L.makeRng(1);
  for (i = 0; i < 300 && !(p.faint > 0); i++) L.updateNeeds(g, 0.1);
  assert.ok(!(p.faint > 0), 'tranquilo se desmaya');
  var z = L.spawnEnemy(g, 'rastrero', p.x + 100, p.y); z.mind = 'chase';
  for (i = 0; i < 20000 && !(p.faint > 0); i++) L.updateNeeds(g, 0.1);
  assert.ok(p.faint > 0, 'nervioso y mal nunca se desmaya');
  var x0 = p.x;
  L.update(g, 0.1, { x: 1, y: 0 });
  assert.strictEqual(p.x, x0, 'desmayado se mueve');
});

test('objetos raros en los muebles; el golpe preparado pega más fuerte', function () {
  var L = Lluvia, g = needsGame(), p = g.player, s = g.city.scale, items = Object.keys(p.items).length;
  var orig = L.searchTarget, plan = { index: 77 }, k = 0;
  // A piece that holds one: the first wardrobe that rolls it.
  var has = function (kk) { return L.lootOf(plan, 0, kk, 'ropero').some(function (q) { return q[0] === 'i:'; }); };
  while (k < 2000 && !has(k)) k++;
  assert.ok(k < 2000, 'ningún ropero tiene objetos raros');
  L.searchTarget = function () { return { plan: plan, f: 0, k: k, t: 'ropero', key: '77:0:' + k }; };
  try { L.updateLoot(g, L.data.loot.search + 0.01, { use: true }); } finally { L.searchTarget = orig; }
  assert.ok(Object.keys(p.items).length > items, 'el objeto raro no se suma');
  // Readied blow.
  p.hand = 'melee'; p.melee = { id: 'barra', dur: 300 };
  var z = L.spawnEnemy(g, 'rastrero', p.x + 0.9 * s, p.y); z.floor = 0; z.hp = z.maxHp = 1000;
  L.swing(g); var plain = 1000 - z.hp; z.hp = 1000; p.swingCd = 0;
  g.time = 5;
  for (var i = 0; i < 30; i++) L.updateMelee(g, 1 / 30, { aiming: true });
  assert.ok(p.ready > 0.9, 'el clic derecho no prepara el golpe');
  L.swing(g);
  assert.ok(1000 - z.hp > plain * 1.4, 'el golpe preparado no pega más');
});
