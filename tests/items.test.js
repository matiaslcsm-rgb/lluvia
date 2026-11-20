// Stage 2: gold, chests, stacking items, item effects, the difficulty clock and bosses.

function itemGame(opts) {
  var o = { seed: 11, characterId: 'brasa', viewW: 1280, viewH: 720, noSpawn: true };
  for (var k in opts) o[k] = opts[k];
  var g = Lluvia.createGame(o);
  g.player.abilities.length = 0; // no automatic attacks unless the test adds them
  return g;
}

// Runs `fn` with an item's chance temporarily set, so tests don't depend on luck.
function withChance(id, chance, fn) {
  var def = Lluvia.findItem(id), old = def.chance;
  def.chance = chance;
  try { fn(); } finally { def.chance = old; }
}

function hpLost(e) { return e.maxHp - e.hp; }

test('el reloj sube un escalón por minuto', function () {
  var g = itemGame();
  assert.strictEqual(Lluvia.difficulty(g), 1);
  g.time = 59.9; assert.strictEqual(Lluvia.difficulty(g), 1);
  g.time = 60; assert.strictEqual(Lluvia.difficulty(g), 2);
  g.time = 300; assert.strictEqual(Lluvia.difficulty(g), 6);
});

test('los cofres cuestan más a medida que sube el reloj', function () {
  var g = itemGame();
  var first = Lluvia.chestCost(g);
  g.time = 240;
  assert.strictEqual(first, Lluvia.data.chests.base);
  assert.ok(Lluvia.chestCost(g) > first);
});

test('matar enemigos da oro, y da más con el reloj alto', function () {
  var g = itemGame(), p = g.player;
  var e = Lluvia.spawnEnemy(g, 'bruto', p.x + 300, p.y); // bruto always drops gold
  Lluvia.update(g, 1 / 60, {});
  Lluvia.hit(g, e, 1e6, 0);
  var early = g.gold;
  assert.strictEqual(early, Lluvia.findEnemy('bruto').gold);
  g.time = 600;
  var late = Lluvia.spawnEnemy(g, 'bruto', p.x + 300, p.y);
  Lluvia.update(g, 1 / 60, {});
  Lluvia.hit(g, late, 1e9, 0);
  assert.ok(g.gold - early > early, 'oro tardío: ' + (g.gold - early));
});

test('un cofre se abre al tocarlo si te alcanza el oro, y da un ítem', function () {
  var g = itemGame(), p = g.player;
  Lluvia.dropChest(g, p.x, p.y, 'normal');
  g.gold = Lluvia.chestCost(g) - 1;
  Lluvia.update(g, 1 / 60, {});
  assert.strictEqual(g.chests.length, 1, 'se abrió sin oro suficiente');
  g.gold += 1;
  Lluvia.update(g, 1 / 60, {});
  assert.strictEqual(g.chests.length, 0);
  assert.strictEqual(g.gold, 0);
  assert.strictEqual(p.itemOrder.length, 1);
});

test('el cofre del jefe es gratis y nunca da ítems comunes', function () {
  for (var seed = 1; seed <= 20; seed++) {
    var g = itemGame({ seed: seed }), p = g.player;
    Lluvia.dropChest(g, p.x, p.y, 'boss');
    Lluvia.update(g, 1 / 60, {});
    assert.strictEqual(p.itemOrder.length, 1);
    assert.notStrictEqual(Lluvia.findItem(p.itemOrder[0]).rarity, 'comun');
  }
});

test('los ítems se apilan: dos afiladores dan +24% de daño', function () {
  var g = itemGame(), p = g.player;
  Lluvia.addItem(g, 'afilador'); Lluvia.addItem(g, 'afilador');
  assert.strictEqual(p.items.afilador, 2);
  assert.ok(Math.abs(p.stats.damageMul - 1.24) < 1e-9);
});

test('el reloj de arena rinde cada vez menos pero nunca deja la recarga en cero', function () {
  var g = itemGame(), p = g.player, prev = 1, prevGain = Infinity;
  for (var i = 1; i <= 30; i++) {
    Lluvia.addItem(g, 'arena');
    var gain = prev - p.stats.cooldownMul;
    assert.ok(gain < prevGain, 'la copia ' + i + ' rindió más que la anterior');
    prev = p.stats.cooldownMul; prevGain = gain;
  }
  assert.ok(p.stats.cooldownMul > 0.2);
});

test('Eco suma un proyectil a Chispa', function () {
  var g = itemGame(), p = g.player;
  Lluvia.addAbility(g, 'chispa');
  Lluvia.addItem(g, 'eco');
  Lluvia.spawnEnemy(g, 'bruto', p.x + 200, p.y);
  Lluvia.update(g, 1 / 60, {});
  assert.strictEqual(g.projectiles.length, 2);
});

test('la Mecha hace explotar al enemigo muerto y daña a los de al lado', function () {
  var g = itemGame(), p = g.player;
  Lluvia.addItem(g, 'mecha');
  var a = Lluvia.spawnEnemy(g, 'rastrero', p.x + 300, p.y);
  var b = Lluvia.spawnEnemy(g, 'bruto', p.x + 330, p.y);
  Lluvia.update(g, 1 / 60, {});
  Lluvia.hit(g, a, 1e6, 1);
  assert.ok(hpLost(b) > 0, 'el de al lado no recibió daño');
});

test('el Arpa de chispas salta a otros enemigos', function () {
  withChance('arpa', 1, function () {
    var g = itemGame(), p = g.player;
    Lluvia.addItem(g, 'arpa');
    var a = Lluvia.spawnEnemy(g, 'bruto', p.x + 300, p.y);
    var others = [Lluvia.spawnEnemy(g, 'bruto', p.x + 360, p.y), Lluvia.spawnEnemy(g, 'bruto', p.x + 300, p.y + 60)];
    Lluvia.update(g, 1 / 60, {});
    Lluvia.hit(g, a, 10, 1);
    others.forEach(function (o) { assert.ok(hpLost(o) > 0, 'el rayo no saltó'); });
  });
});

test('la Ascua quema con el tiempo', function () {
  withChance('ascua', 1, function () {
    var g = itemGame(), p = g.player;
    Lluvia.addItem(g, 'ascua');
    var e = Lluvia.spawnEnemy(g, 'bruto', p.x + 400, p.y);
    e.speed = 0;
    Lluvia.update(g, 1 / 60, {});
    Lluvia.hit(g, e, 10, 1);
    var afterHit = hpLost(e);
    Lluvia.update(g, 2.5, {});
    var burned = hpLost(e) - afterHit;
    assert.ok(Math.abs(burned - 10 * 0.6) < 0.5, 'quemó ' + burned);
    assert.strictEqual(e.burnTtl <= 0, true);
  });
});

test('el Colmillo cura al pegar, y menos seguido con golpes débiles', function () {
  var g = itemGame(), p = g.player;
  Lluvia.addItem(g, 'colmillo');
  var e = Lluvia.spawnEnemy(g, 'bruto', p.x + 400, p.y);
  e.hp = e.maxHp = 1e9;
  Lluvia.update(g, 1 / 60, {});
  p.hp = 50;
  Lluvia.hit(g, e, 1, 1);
  assert.strictEqual(p.hp, 51);
  // Weak hits (proc 0.2) heal about one time in five.
  p.stats.maxHp = 1e9;
  var before = p.hp;
  for (var i = 0; i < 1000; i++) Lluvia.hit(g, e, 1, 0.2);
  var healed = p.hp - before;
  assert.ok(healed > 150 && healed < 250, 'curó ' + healed + ' en 1000 golpes débiles');
});

test('los efectos encadenados tienen tope y no se repiten para siempre', function () {
  withChance('espejo', 1, function () {
    var g = itemGame(), p = g.player;
    Lluvia.addItem(g, 'espejo');
    var e = Lluvia.spawnEnemy(g, 'bruto', p.x + 400, p.y);
    e.hp = e.maxHp = 1e6;
    Lluvia.update(g, 1 / 60, {});
    Lluvia.hit(g, e, 10, 1);
    // The first hit plus one repeat per link of the chain.
    assert.strictEqual(hpLost(e), 10 * (Lluvia.MAX_PROC_DEPTH + 1));
  });
});

test('el jefe llega a las 2:30, y al matarlo deja un cofre gratis', function () {
  var g = itemGame({ noSpawn: false }), p = g.player;
  p.hp = p.stats.maxHp = 1e9;
  Lluvia.update(g, 149, {});
  assert.strictEqual(g.boss, null);
  Lluvia.update(g, 2, {});
  assert.ok(g.boss, 'no llegó el jefe');
  var bossChests = function () { return g.chests.filter(function (c) { return c.kind === 'boss'; }).length; };
  assert.strictEqual(bossChests(), 0);
  Lluvia.hit(g, g.boss, 1e9, 0);
  assert.strictEqual(g.boss, null);
  assert.strictEqual(bossChests(), 1);
});

test('la arena arranca con cofres y se reponen al abrirlos', function () {
  var g = itemGame({ noSpawn: false }), p = g.player, n = Lluvia.data.chests.count;
  assert.strictEqual(g.chests.length, n);
  var c = g.chests[0];
  p.x = c.x; p.y = c.y;
  g.gold = 1000;
  Lluvia.update(g, 1 / 60, {});
  assert.strictEqual(p.itemOrder.length, 1);
  assert.strictEqual(g.chests.filter(function (ch) { return ch.kind === 'normal'; }).length, n);
});

test('con muchos ítems sigue sin trabarse (menos de 6 ms por cuadro con 300 enemigos)', function () {
  var g = itemGame(), p = g.player;
  p.hp = p.stats.maxHp = 1e9;
  ['chispa', 'lanza', 'temblor', 'cuchillas', 'niebla'].forEach(function (id) { Lluvia.addAbility(g, id); });
  ['arpa', 'arpa', 'ascua', 'ascua', 'mecha', 'colmillo', 'eco', 'corona', 'espejo', 'cristal', 'cristal'].forEach(function (id) { Lluvia.addItem(g, id); });
  for (var i = 0; i < 300; i++) {
    var a = i / 300 * Math.PI * 2, r = 250 + (i % 7) * 40;
    var e = Lluvia.spawnEnemy(g, 'rastrero', p.x + Math.cos(a) * r, p.y + Math.sin(a) * r);
    e.hp = e.maxHp = 1e7;
  }
  for (var w = 0; w < 30; w++) { if (g.choice) Lluvia.choose(g, 0); Lluvia.update(g, 1 / 60, {}); }
  var t0 = performance.now(), frames = 300;
  for (var f = 0; f < frames; f++) {
    if (g.choice) Lluvia.choose(g, 0);
    Lluvia.update(g, 1 / 60, {});
  }
  var ms = (performance.now() - t0) / frames;
  assert.strictEqual(g.enemies.length, 300);
  assert.ok(ms < 6, 'tardó ' + ms.toFixed(2) + ' ms por cuadro');
});
