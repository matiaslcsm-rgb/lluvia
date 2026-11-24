// Stage 0 and 1: movement, horde, abilities, experience and level-ups.
// Test names are in Spanish so the user can read the results.

function newGame(opts) {
  var o = { seed: 7, characterId: 'brasa', viewW: 1280, viewH: 720 };
  for (var k in opts) o[k] = opts[k];
  return Lluvia.createGame(o);
}

// Plays `seconds` in 1/60 steps, walking in a circle and always taking the first level-up option.
function play(g, seconds) {
  var steps = Math.round(seconds * 60);
  for (var i = 0; i < steps && !g.over; i++) {
    if (g.choice) Lluvia.choose(g, 0);
    var a = g.time * 0.7;
    Lluvia.update(g, 1 / 60, { x: Math.cos(a), y: Math.sin(a) });
  }
}

test('el personaje se mueve a su velocidad y no sale de la arena', function () {
  var g = newGame({ noSpawn: true }), p = g.player, x0 = p.x;
  Lluvia.update(g, 1, { x: 1, y: 0 });
  assert.ok(Math.abs(p.x - x0 - p.stats.speed) < 0.01, 'avanzó ' + (p.x - x0));
  Lluvia.update(g, 30, { x: 1, y: 0 });
  assert.strictEqual(p.x, g.arena - p.r);
});

test('cada personaje arranca con su habilidad y su vida', function () {
  Lluvia.data.characters.forEach(function (c) {
    var g = newGame({ characterId: c.id });
    assert.strictEqual(g.player.abilities[0].id, c.start);
    assert.strictEqual(g.player.hp, c.stats.maxHp);
  });
});

test('los niveles de una habilidad suman sus mejoras', function () {
  var s = Lluvia.abilityStats(Lluvia.findAbility('chispa'), 3);
  assert.strictEqual(s.damage, 18);
  assert.strictEqual(s.count, 2);
  assert.strictEqual(s.cooldown, 0.8);
});

test('Chispa mata a un enemigo y su experiencia se junta', function () {
  var g = newGame({ noSpawn: true }), p = g.player;
  Lluvia.spawnEnemy(g, 'rastrero', p.x + 200, p.y);
  Lluvia.update(g, 2, { x: 0, y: 0 });
  assert.strictEqual(g.kills, 1);
  assert.strictEqual(g.enemies.length, 0);
  // Walk over to the gem and pick it up.
  for (var i = 0; i < 120 && g.gems.length; i++) {
    var gem = g.gems[0];
    Lluvia.update(g, 1 / 60, { x: gem.x - p.x, y: gem.y - p.y });
  }
  assert.strictEqual(g.gems.length, 0);
  assert.strictEqual(p.xp, 1);
});

test('Temblor golpea a los de cerca y no a los de lejos', function () {
  var g = newGame({ characterId: 'roca', noSpawn: true }), p = g.player;
  var near = Lluvia.spawnEnemy(g, 'bruto', p.x + 60, p.y);
  var far = Lluvia.spawnEnemy(g, 'bruto', p.x + 400, p.y);
  Lluvia.update(g, 1 / 60, { x: 0, y: 0 });
  assert.ok(near.hp < near.maxHp, 'el cercano no recibió daño');
  assert.strictEqual(far.hp, far.maxHp);
});

test('las cuchillas no pegan dos veces seguidas al mismo enemigo', function () {
  var g = newGame({ characterId: 'filo', noSpawn: true }), p = g.player;
  var e = Lluvia.spawnEnemy(g, 'bruto', p.x + 70, p.y);
  e.speed = 0;
  Lluvia.update(g, 0.3, { x: 0, y: 0 });
  var dmg = Lluvia.findAbility('cuchillas').base.damage;
  // Two blades can each hit once in 0.3 s; never more than that.
  assert.ok(e.maxHp - e.hp <= dmg * 2 + 1e-9, 'recibió ' + (e.maxHp - e.hp));
});

test('al subir de nivel aparecen 3 opciones distintas y el juego espera', function () {
  var g = newGame({ noSpawn: true }), p = g.player;
  p.xp = Lluvia.xpToNext(1);
  Lluvia.update(g, 1 / 60, { x: 0, y: 0 });
  assert.strictEqual(p.level, 2);
  assert.strictEqual(g.choice.length, 3);
  var ids = g.choice.map(function (o) { return o.type + o.id; });
  assert.strictEqual(new Set(ids).size, 3);
  var t = g.time;
  Lluvia.update(g, 5, { x: 1, y: 0 });
  assert.strictEqual(g.time, t, 'el tiempo corrió con la elección abierta');
});

test('elegir una opción la aplica y cierra la elección', function () {
  var g = newGame({ noSpawn: true }), p = g.player;
  p.xp = Lluvia.xpToNext(1);
  Lluvia.update(g, 1 / 60, {});
  g.choice = [{ type: 'newPassive', id: 'corazon' }];
  var hp = p.hp, max = p.stats.maxHp;
  assert.ok(Lluvia.choose(g, 0));
  assert.strictEqual(g.choice, null);
  assert.strictEqual(p.stats.maxHp, max + 20);
  assert.strictEqual(p.hp, hp + 20);
});

test('con todo al máximo la elección ofrece curarse', function () {
  var g = newGame({ noSpawn: true }), p = g.player;
  p.abilities.forEach(function (a) { a.level = 5; });
  while (p.abilities.length < Lluvia.ABILITY_SLOTS) Lluvia.addAbility(g, Lluvia.data.abilities[p.abilities.length].id);
  p.abilities.forEach(function (a) { a.level = 5; });
  Lluvia.data.passives.slice(0, Lluvia.PASSIVE_SLOTS).forEach(function (ps) { Lluvia.addPassive(g, ps.id); });
  p.passives.forEach(function (ps) { ps.level = 5; });
  var options = Lluvia.makeChoices(g);
  assert.strictEqual(options.length, 1);
  assert.strictEqual(options[0].type, 'heal');
});

test('si te bajan la vida a cero en tu última vida, la partida termina', function () {
  var g = newGame({ noSpawn: true, lives: 1 }), p = g.player;
  p.abilities.length = 0;
  Lluvia.spawnEnemy(g, 'bruto', p.x, p.y);
  p.hp = 5;
  Lluvia.update(g, 2, { x: 0, y: 0 });
  assert.ok(g.over);
  assert.strictEqual(p.hp, 0);
});

test('la horda crece con el reloj', function () {
  var g = newGame(), p = g.player;
  p.hp = 1e9; p.stats.maxHp = 1e9; p.abilities.length = 0;
  Lluvia.update(g, 60.5, { x: 0, y: 0 });
  assert.strictEqual(Lluvia.difficulty(g), 2);
  var firstMinute = g.enemies.length;
  var late = Lluvia.spawnEnemy(g, 'rastrero', 0, 0);
  assert.ok(late.maxHp > Lluvia.findEnemy('rastrero').hp, 'los enemigos del minuto 1 no son más duros');
  Lluvia.update(g, 60, { x: 0, y: 0 });
  assert.ok(g.enemies.length - firstMinute > firstMinute, 'el segundo minuto no trajo más enemigos que el primero');
});

test('la misma semilla da la misma partida', function () {
  var a = newGame({ seed: 42 }), b = newGame({ seed: 42 });
  play(a, 90); play(b, 90);
  assert.strictEqual(a.kills, b.kills);
  assert.strictEqual(a.player.level, b.player.level);
  assert.strictEqual(a.player.hp, b.player.hp);
});

test('una partida de prueba avanza: mata, sube de nivel y arma su kit', function () {
  var g = newGame({ seed: 3 });
  play(g, 120);
  assert.ok(g.kills > 50, 'bajas: ' + g.kills);
  assert.ok(g.player.level >= 5, 'nivel: ' + g.player.level);
});

test('aguanta 300 enemigos sin trabarse (menos de 4 ms por cuadro)', function () {
  var g = newGame({ noSpawn: true }), p = g.player;
  p.hp = 1e9; p.stats.maxHp = 1e9;
  ['lanza', 'temblor', 'cuchillas', 'niebla'].forEach(function (id) { Lluvia.addAbility(g, id); });
  for (var i = 0; i < 300; i++) {
    var a = i / 300 * Math.PI * 2, r = 250 + (i % 7) * 40;
    var e = Lluvia.spawnEnemy(g, 'rastrero', p.x + Math.cos(a) * r, p.y + Math.sin(a) * r);
    e.hp = e.maxHp = 1e6;
  }
  play(g, 0.5); // warm up
  var t0 = performance.now(), frames = 300;
  for (var f = 0; f < frames; f++) {
    if (g.choice) Lluvia.choose(g, 0);
    Lluvia.update(g, 1 / 60, { x: 0, y: 0 });
  }
  var ms = (performance.now() - t0) / frames;
  assert.strictEqual(g.enemies.length, 300);
  assert.ok(ms < 4, 'tardó ' + ms.toFixed(2) + ' ms por cuadro');
});
