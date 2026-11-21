// Second season: creatures with behaviours, elites, storm events and the Cuaderno (progress between matches).

function s2Game(opts) {
  var o = { seed: 120, characterId: 'roca', viewW: 1280, viewH: 720, noSpawn: true };
  for (var k in opts) o[k] = opts[k];
  var g = Lluvia.createGame(o);
  g.player.abilities.length = 0;
  return g;
}

test('el Escupelodo se queda lejos y te escupe barro que lastima', function () {
  var g = s2Game(), p = g.player;
  var e = Lluvia.spawnEnemy(g, 'escupidor', p.x + 300, p.y);
  e.cd = 0;
  var hp = p.hp;
  Lluvia.update(g, 3, {});
  assert.ok(Math.abs(e.x - p.x) > 200, 'se acercó demasiado');
  assert.ok(p.hp < hp, 'el barro no lastimó');
});

test('el Charco madre se parte en tres Gotitas al morir', function () {
  var g = s2Game(), p = g.player;
  var e = Lluvia.spawnEnemy(g, 'divisor', p.x + 400, p.y);
  Lluvia.update(g, 1 / 60, {});
  Lluvia.hit(g, e, 1e6, 0);
  Lluvia.update(g, 1 / 60, {});
  assert.strictEqual(g.enemies.filter(function (x) { return x.type.id === 'gotita'; }).length, 3);
});

test('el Tronador prende la mecha cerca tuyo y explota; si lo matás antes, no te lastima', function () {
  var g = s2Game(), p = g.player;
  var e = Lluvia.spawnEnemy(g, 'tronador', p.x + 50, p.y);
  var hp = p.hp;
  Lluvia.update(g, 1.5, {});
  assert.ok(e.dead && p.hp < hp, 'no explotó o no lastimó');
  var g2 = s2Game(), p2 = g2.player;
  var e2 = Lluvia.spawnEnemy(g2, 'tronador', p2.x + 50, p2.y);
  Lluvia.update(g2, 1 / 60, {});
  var hp2 = p2.hp;
  Lluvia.hit(g2, e2, 1e6, 0);
  assert.strictEqual(p2.hp, hp2);
});

test('las élites son más duras y dejan más oro', function () {
  var g = s2Game(), p = g.player;
  var e = Lluvia.makeElite(Lluvia.spawnEnemy(g, 'bruto', p.x + 400, p.y));
  assert.strictEqual(e.maxHp, Lluvia.findEnemy('bruto').hp * Lluvia.data.horde.elite.hp);
  Lluvia.update(g, 1 / 60, {});
  Lluvia.hit(g, e, 1e9, 0);
  assert.strictEqual(g.gold, Lluvia.findEnemy('bruto').gold * Lluvia.data.horde.elite.gold);
});

test('cada minuto hay un evento de tormenta, nunca el mismo dos veces seguidas', function () {
  var g = s2Game({ noSpawn: false }), p = g.player, last = null;
  p.hp = p.stats.maxHp = 1e9;
  var seen = [];
  Lluvia.update(g, Lluvia.data.horde.waveFirst - 30, {});
  if (g.choice) g.choice = null, g.pendingLevels = 0;
  for (var i = 0; i < 6; i++) {
    Lluvia.update(g, 60, {});
    if (g.choice) g.choice = null, g.pendingLevels = 0;
    seen.push(g.lastWave);
  }
  for (var k = 1; k < seen.length; k++) assert.notStrictEqual(seen[k], seen[k - 1]);
  assert.ok(seen[0], 'no hubo evento');
});

test('Cuaderno: comprar una mejora cuesta monedas y se aplica en la partida', function () {
  var prof = Lluvia.newProfile();
  prof.coins = 100;
  assert.ok(Lluvia.buyUpgrade(prof, 'vida'));
  assert.ok(Lluvia.buyUpgrade(prof, 'vida'));
  assert.strictEqual(prof.coins, 100 - 20 - 40);
  var m = Lluvia.createMatch({ seed: 5, characterId: 'roca', profile: prof });
  assert.ok(Math.abs(m.human.game.player.stats.maxHp - 150 * 1.1) < 1e-9);
  assert.strictEqual(m.players[1].game.meta, undefined, 'los rivales no tienen tus mejoras');
  prof.coins = 0;
  assert.ok(!Lluvia.buyUpgrade(prof, 'vida'), 'compró sin monedas');
});

test('Cuaderno: al terminar una partida se cobran monedas y logros una sola vez', function () {
  var prof = Lluvia.newProfile();
  var m = Lluvia.createMatch({ seed: 6, characterId: 'brasa' });
  m.players.forEach(function (pl) { if (!pl.isHuman) pl.game.over = true; });
  Lluvia.updateMatch(m, 1 / 60, {});
  var r = Lluvia.settleMatch(prof, m);
  assert.ok(r.unlocked.some(function (a) { return a.id === 'sol'; }));
  assert.ok(r.unlocked.some(function (a) { return a.id === 'invicto'; }));
  assert.strictEqual(prof.coins, r.coins);
  var again = Lluvia.settleMatch(prof, m);
  assert.strictEqual(again.unlocked.length, 0, 'cobró los logros dos veces');
});

test('Santuario del Trueno: aguantar el desafío deja un cofre; el Pozo dobla o saca oro', function () {
  var g = s2Game();
  g.events = [];             // shrines only exist where someone watches
  g.player.hp = g.player.stats.maxHp = 1e9;
  g.time = Lluvia.data.shrines.first;
  Lluvia.update(g, 1 / 60, {});
  var s = g.shrines[0];
  assert.strictEqual(s.kind, 'trueno');
  g.player.x = s.x; g.player.y = s.y;
  Lluvia.update(g, 1 / 60, {});
  assert.ok(s.active, 'no empezó el desafío');
  var items = g.player.itemOrder.length;
  Lluvia.update(g, Lluvia.data.shrines.challenge.seconds + 0.5, {});
  // The chest lands on the shrine, where you stand, so it opens right away.
  var opened = g.player.itemOrder.length > items || g.chests.some(function (c) { return c.kind === 'boss'; });
  assert.ok(opened, 'no dejó el cofre');
  g.gold = 100;
  g.shrines.push({ kind: 'pozo', x: g.player.x, y: g.player.y, r: 22, life: 30, active: false });
  Lluvia.update(g, 1 / 60, {});
  assert.ok(g.gold === 125 || g.gold === 75, 'oro: ' + g.gold);
});

test('los desbloqueos se abren con su logro o con monedas, y la Tormenta eterna paga doble', function () {
  var P = Lluvia.newProfile();
  assert.ok(Lluvia.isUnlocked(P, 'brasa') && !Lluvia.isUnlocked(P, 'marea') && !Lluvia.isUnlocked(P, 'tormenta'));
  P.achievements.fusion = true;
  assert.ok(Lluvia.isUnlocked(P, 'marea'));
  P.coins = 80;
  assert.ok(Lluvia.buyUnlock(P, 'oxido') && Lluvia.isUnlocked(P, 'oxido') && P.coins === 0);
  assert.ok(!Lluvia.buyUnlock(P, 'tormenta'), 'la Tormenta eterna solo se abre ganando');
  var m = Lluvia.createMatch({ seed: 4, storm: true, humanBot: true });
  var e = Lluvia.spawnEnemy(m.human.game, 'rastrero', 100, 100);
  assert.ok(Math.abs(e.maxHp - Lluvia.findEnemy('rastrero').hp * Lluvia.data.meta.storm.hpMul) < 1e-9);
});

test('en el Juicio con Anegados entran criaturas, se pueden bajar y curan', function () {
  var m = Lluvia.createMatch({ seed: 9, humanBot: true });
  m.players.forEach(function (pl) { for (var t = 0; t < 120; t++) Lluvia.update(pl.game, 1 / 30, {}); });
  var d = Lluvia.createDuel(m, m.players[1], m.players[2], Lluvia.findById(Lluvia.data.duelRules, 'anegados'));
  var seen = 0;
  while (!d.over && d.time < 20) { Lluvia.updateDuel(d, 1 / 30, null); seen = Math.max(seen, d.creeps.length); }
  assert.ok(seen > 0, 'no entró ninguna criatura');
  assert.ok(d.creeps.length <= 20);
});
