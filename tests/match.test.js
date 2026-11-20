// Stage 3: lives, the AI bot and the 8-arena match.

function soloGame(opts) {
  var o = { seed: 21, characterId: 'roca', viewW: 1280, viewH: 720, noSpawn: true };
  for (var k in opts) o[k] = opts[k];
  return Lluvia.createGame(o);
}

function killPlayer(g) {
  var p = g.player;
  p.abilities.length = 0;
  p.invuln = 0;
  p.hp = 0.01;
  var e = Lluvia.spawnEnemy(g, 'bruto', p.x, p.y);
  e.speed = 0;
  Lluvia.update(g, 1 / 30, {});
  return e;
}

test('morir cuesta una vida y la mitad del oro, y volvés a los 5 segundos', function () {
  var g = soloGame(), p = g.player, h = Lluvia.data.horde;
  g.gold = 101;
  killPlayer(g);
  assert.strictEqual(g.lives, 2);
  assert.strictEqual(g.gold, 50);
  assert.ok(!g.over);
  assert.ok(g.respawn > 0);
  Lluvia.update(g, h.respawnTime - 0.2, {});
  assert.ok(g.respawn > 0, 'volvió antes de tiempo');
  Lluvia.update(g, 0.3, {});
  assert.strictEqual(g.respawn, 0);
  assert.strictEqual(p.hp, p.stats.maxHp);
  assert.ok(p.invuln > 0);
});

test('al volver se despejan los enemigos de alrededor y por un rato no te pegan', function () {
  var g = soloGame(), p = g.player;
  killPlayer(g);
  var far = Lluvia.spawnEnemy(g, 'rastrero', p.x + 900, p.y);
  Lluvia.update(g, Lluvia.data.horde.respawnTime + 0.1, {});
  assert.strictEqual(g.enemies.length, 1, 'quedaron enemigos encima');
  assert.strictEqual(g.enemies[0], far);
  var hp = p.hp;
  var e = Lluvia.spawnEnemy(g, 'bruto', p.x, p.y);
  e.speed = 0;
  Lluvia.update(g, 1, {});
  assert.strictEqual(p.hp, hp, 'te pegaron siendo invulnerable');
});

test('con la última vida, morir te deja afuera', function () {
  var g = soloGame({ lives: 1 });
  killPlayer(g);
  assert.ok(g.over);
  assert.strictEqual(g.lives, 0);
});

test('la partida tiene 8 jugadores: vos y 7 rivales con nombre propio', function () {
  var m = Lluvia.createMatch({ seed: 5, characterId: 'filo' });
  assert.strictEqual(m.players.length, 8);
  assert.strictEqual(m.players.filter(function (pl) { return pl.isHuman; }).length, 1);
  assert.strictEqual(m.human.game.player.char.id, 'filo');
  assert.strictEqual(new Set(m.players.map(function (pl) { return pl.name; })).size, 8);
  m.players.forEach(function (pl) { assert.strictEqual(pl.game.lives, 3); });
});

test('todas las arenas van con el mismo reloj', function () {
  var m = Lluvia.createMatch({ seed: 6, characterId: 'roca' });
  for (var i = 0; i < 600; i++) {
    if (m.human.game.choice) Lluvia.choose(m.human.game, 0);
    Lluvia.updateMatch(m, 1 / 60, { x: 0, y: 0 });
  }
  m.players.forEach(function (pl) {
    if (!pl.out) assert.ok(Math.abs(pl.game.time - m.time) <= 1 / 30 + 1e-6, pl.name + ' va a ' + pl.game.time + ' y la partida a ' + m.time);
  });
});

test('mientras elegís una mejora, toda la partida espera', function () {
  var m = Lluvia.createMatch({ seed: 7, characterId: 'brasa' });
  Lluvia.updateMatch(m, 1 / 60, {});
  m.human.game.player.xp = 1e3;
  Lluvia.updateMatch(m, 1 / 60, {});
  assert.ok(m.human.game.choice, 'no se abrió la elección');
  var times = m.players.map(function (pl) { return pl.game.time; }), t = m.time;
  for (var i = 0; i < 60; i++) Lluvia.updateMatch(m, 1 / 60, {});
  assert.strictEqual(m.time, t);
  m.players.forEach(function (pl, i) { assert.strictEqual(pl.game.time, times[i]); });
});

test('los que quedan afuera en el mismo momento comparten el peor puesto libre', function () {
  var m = Lluvia.createMatch({ seed: 8, characterId: 'brasa' });
  [1, 2, 3].forEach(function (i) { m.players[i].game.over = true; });
  Lluvia.updateMatch(m, 1 / 60, {});
  [1, 2, 3].forEach(function (i) { assert.strictEqual(m.players[i].place, 6); assert.ok(m.players[i].out); });
  m.players[4].game.over = true;
  Lluvia.updateMatch(m, 1 / 60, {});
  assert.strictEqual(m.players[4].place, 5);
  assert.ok(!m.over);
});

test('si quedás afuera, la partida termina para vos con tu puesto', function () {
  var m = Lluvia.createMatch({ seed: 9, characterId: 'brasa' });
  m.human.game.over = true;
  Lluvia.updateMatch(m, 1 / 60, {});
  assert.ok(m.over);
  assert.strictEqual(m.human.place, 8);
  assert.strictEqual(m.winner, null);
});

test('el último en pie gana', function () {
  var m = Lluvia.createMatch({ seed: 10, characterId: 'brasa' });
  m.players.forEach(function (pl) { if (!pl.isHuman) pl.game.over = true; });
  Lluvia.updateMatch(m, 1 / 60, {});
  assert.ok(m.over);
  assert.strictEqual(m.winner, m.human);
  assert.strictEqual(m.human.place, 1);
});

test('la tabla ordena por vidas y pone abajo a los que quedaron afuera', function () {
  var m = Lluvia.createMatch({ seed: 11, characterId: 'brasa' });
  m.players[3].game.lives = 1;
  m.players[5].game.over = true;
  Lluvia.updateMatch(m, 1 / 60, {});
  var rows = Lluvia.standings(m);
  assert.strictEqual(rows[7], m.players[5]);
  assert.strictEqual(rows[6], m.players[3]);
});

test('el bot juega solo: esquiva, sube de nivel, elige y compra cofres', function () {
  var g = Lluvia.createGame({ seed: 2, characterId: 'brasa' }), bot = Lluvia.makeBot(2, 0.8);
  for (var i = 0; i < 240 * 30 && !g.over; i++) {
    if (g.choice) Lluvia.botChoose(g, bot);
    Lluvia.update(g, 1 / 30, Lluvia.botInput(g, bot));
  }
  assert.ok(g.player.level >= 5, 'nivel ' + g.player.level);
  assert.ok(g.player.abilities.length + g.player.passives.length >= 3);
  assert.ok(g.player.itemOrder.length >= 1, 'no compró ningún cofre');
});

test('8 arenas llenas no traban (menos de 8 ms por cuadro con 250 enemigos en cada una)', function () {
  var m = Lluvia.createMatch({ seed: 12, humanBot: true });
  m.players.forEach(function (pl) {
    var g = pl.game, p = g.player;
    p.hp = p.stats.maxHp = 1e9;
    ['lanza', 'temblor', 'niebla'].forEach(function (id) { if (!Lluvia.findById(p.abilities, id)) Lluvia.addAbility(g, id); });
    ['arpa', 'mecha', 'cristal'].forEach(function (id) { Lluvia.addItem(g, id); });
    for (var i = 0; i < 250; i++) {
      var a = i / 250 * Math.PI * 2, r = 250 + (i % 7) * 40;
      var e = Lluvia.spawnEnemy(g, 'rastrero', p.x + Math.cos(a) * r, p.y + Math.sin(a) * r);
      e.hp = e.maxHp = 1e7;
    }
    g.spawning = false;
  });
  for (var w = 0; w < 30; w++) Lluvia.updateMatch(m, 1 / 60, {});
  var t0 = performance.now(), frames = 120;
  for (var f = 0; f < frames; f++) Lluvia.updateMatch(m, 1 / 60, {});
  var ms = (performance.now() - t0) / frames;
  assert.ok(ms < 8, 'tardó ' + ms.toFixed(2) + ' ms por cuadro');
});
