// Stage 4: duels, crazy rules and the final stretch.

function duelMatch(seed) {
  return Lluvia.createMatch({ seed: seed || 30, characterId: 'brasa', humanBot: true });
}

function rule(id) { return Lluvia.findById(Lluvia.data.duelRules, id); }

// Plays a duel to the end with bots on both sides. Returns the duel.
function fight(d, seconds) {
  for (var i = 0; i < (seconds || 120) * 30 && !d.over; i++) Lluvia.updateDuel(d, 1 / 30, null);
  return d;
}

// Makes a player much stronger: more damage, more abilities.
function buff(pl) {
  var g = pl.game;
  ['lanza', 'rayo', 'temblor'].forEach(function (id) { if (!Lluvia.findById(g.player.abilities, id)) Lluvia.addAbility(g, id); });
  for (var i = 0; i < 6; i++) Lluvia.addItem(g, 'afilador');
}

test('el duelo no toca tu vida de la horda', function () {
  var m = duelMatch(), a = m.players[1], b = m.players[2];
  var hpA = a.game.player.hp, hpB = b.game.player.hp;
  var d = fight(Lluvia.createDuel(m, a, b, rule('fragiles')));
  assert.ok(d.over);
  assert.strictEqual(a.game.player.hp, hpA);
  assert.strictEqual(b.game.player.hp, hpB);
});

test('gana el duelo el que tiene mejor kit', function () {
  var wins = 0;
  for (var s = 1; s <= 6; s++) {
    var m = duelMatch(40 + s), a = m.players[1], b = m.players[2];
    buff(a);
    var d = fight(Lluvia.createDuel(m, a, b, rule('fragiles')));
    if (d.winner === a) wins++;
  }
  assert.ok(wins >= 5, 'el más fuerte ganó ' + wins + ' de 6');
});

test('la vida del duelo crece con el reloj, igual que la de los enemigos', function () {
  var m = duelMatch(), p = m.players[1].game.player, r = rule('lava');
  var early = Lluvia.duelPool(m, p, r);
  m.time = 600;
  var late = Lluvia.duelPool(m, p, r);
  assert.ok(Math.abs(late / early - Math.pow(1 + Lluvia.data.horde.hpGrowth, 10)) < 1e-9);
});

test('si nadie muere en 60 segundos, gana el que tiene más vida en porcentaje', function () {
  var m = duelMatch(), a = m.players[1], b = m.players[2];
  var d = Lluvia.createDuel(m, a, b, rule('gigantes'));
  a.game.player.abilities.length = 0; b.game.player.abilities.length = 0; // nobody can hurt anybody
  a.game.player.ulti.cd = b.game.player.ulti.cd = Infinity;
  d.fighters[1].hp = d.fighters[1].maxHp * 0.9;
  fight(d, 70);
  assert.ok(d.over && d.timeout);
  assert.strictEqual(d.winner, a);
  assert.ok(Math.abs(d.time - Lluvia.data.duels.maxTime) < 0.05);
});

test('reglas: gigantes agranda, de cristal baja la vida a la mitad', function () {
  var m = duelMatch(), a = m.players[1], b = m.players[2];
  var normal = Lluvia.createDuel(m, a, b, rule('vampiros'));
  var giant = Lluvia.createDuel(m, a, b, rule('gigantes'));
  var glass = Lluvia.createDuel(m, a, b, rule('fragiles'));
  assert.ok(giant.fighters[0].r > normal.fighters[0].r * 2);
  assert.ok(Math.abs(glass.fighters[0].maxHp - normal.fighters[0].maxHp / 2) < 1e-6);
});

test('regla de lava: afuera del círculo te quemás, adentro no', function () {
  var m = duelMatch(), a = m.players[1], b = m.players[2];
  a.game.player.abilities.length = 0; b.game.player.abilities.length = 0;
  var d = Lluvia.createDuel(m, a, b, rule('lava'));
  d.bots = [null, null];
  var F = d.fighters, c = d.size / 2;
  for (var i = 0; i < 30 * 40; i++) {
    F[0].x = c; F[0].y = c;   // safe in the middle
    F[1].x = 15; F[1].y = 15; // in the corner, in the lava
    Lluvia.updateDuel(d, 1 / 30, null);
    if (d.over) break;
  }
  assert.strictEqual(F[0].hp, F[0].maxHp);
  assert.ok(F[1].hp < F[1].maxHp);
});

test('regla de vampiros: pegar te cura', function () {
  var m = duelMatch(), a = m.players[1], b = m.players[2];
  var d = Lluvia.createDuel(m, a, b, rule('vampiros'));
  var F = d.fighters;
  F[0].hp = F[0].maxHp * 0.5;
  b.game.player.abilities.length = 0; // b can't hit back
  a.game.player.ulti.cd = b.game.player.ulti.cd = Infinity;
  var lowest = F[0].hp;
  fight(d, 20);
  assert.ok(F[0].hp > lowest, 'no se curó');
});

test('regla de rebote: los proyectiles rebotan en vez de irse', function () {
  var m = duelMatch(), a = m.players[1], b = m.players[2];
  var d = Lluvia.createDuel(m, a, b, rule('rebote'));
  var v = d.views[0];
  v.projectiles.push({ x: d.size - 5, y: 500, vx: 400, vy: 0, r: 5, proc: 1, damage: 1, pierce: 0, life: 5, hit: [], color: '#fff', dead: false, long: true });
  Lluvia.updateDuel(d, 1 / 30, null);
  var pr = v.projectiles.filter(function (q) { return q.long && q.damage === 1; })[0];
  assert.ok(pr, 'el proyectil se fue de la arena');
  assert.ok(pr.vx < 0);
});

test('a los 2 minutos se anuncia el duelo de los que pelearon menos, y empieza al cerrar las apuestas', function () {
  var m = duelMatch(50);
  m.players.forEach(function (pl) { pl.game.player.hp = pl.game.player.stats.maxHp = 1e9; });
  m.players.forEach(function (pl, i) { pl.duels = i < 6 ? 1 : 0; }); // only the last two have never fought
  while (m.time < Lluvia.data.duels.every - 0.1) Lluvia.updateMatch(m, 1 / 30, {});
  assert.strictEqual(m.betting, null);
  Lluvia.updateMatch(m, 0.2, {});
  assert.ok(m.betting, 'no se abrieron las apuestas');
  assert.strictEqual(m.duel, null);
  var closes = m.betting.endsAt;
  assert.ok(Math.abs(closes - m.betting.opensAt - Lluvia.data.bets.window) < 1e-9);
  while (m.time < closes - 0.1) Lluvia.updateMatch(m, 1 / 30, {});
  assert.strictEqual(m.duel, null, 'empezó antes de cerrar las apuestas');
  Lluvia.updateMatch(m, 0.3, {});
  assert.ok(m.duel, 'no empezó el duelo');
  assert.deepStrictEqual(m.duel.players.map(function (pl) { return pl.index; }).sort(), [6, 7]);
  var paused = m.players[6].game.time, running = m.players[1].game.time;
  for (var i = 0; i < 60; i++) Lluvia.updateMatch(m, 1 / 30, {});
  if (m.duel) assert.strictEqual(m.players[6].game.time, paused, 'la horda del que pelea siguió');
  assert.ok(m.players[1].game.time > running, 'la horda de los demás se frenó');
});

test('al terminar el duelo: el que pierde pierde una vida, el que gana cobra, y vuelven al reloj de la partida', function () {
  var m = duelMatch(51);
  m.players.forEach(function (pl) { pl.game.player.hp = pl.game.player.stats.maxHp = 1e9; });
  while (!m.duel) Lluvia.updateMatch(m, 1 / 30, {});
  var d = m.duel, a = d.players[0], b = d.players[1];
  var lives = [a.game.lives, b.game.lives], gold = [a.game.gold, b.game.gold];
  while (m.duel) Lluvia.updateMatch(m, 1 / 30, {});
  var w = d.winner, l = d.loser, wi = d.players.indexOf(w), li = d.players.indexOf(l);
  assert.strictEqual(l.game.lives, lives[li] - 1);
  assert.strictEqual(w.game.lives, lives[wi]);
  assert.ok(w.game.gold > gold[wi], 'el ganador no cobró');
  d.players.forEach(function (pl) {
    assert.ok(Math.abs(pl.game.time - m.time) < 1e-9);
    assert.ok(pl.game.player.invuln > 0);
    assert.ok(!pl.inDuel);
  });
  assert.ok(Math.abs(m.nextDuel - (m.time + Lluvia.data.duels.every)) < 1e-9);
});

test('cuando quedan dos se frenan las hordas y pelean duelos seguidos hasta que gana uno', function () {
  var m = duelMatch(52);
  m.players.forEach(function (pl, i) { if (i > 1) pl.game.over = true; });
  Lluvia.updateMatch(m, 1 / 30, {});
  assert.ok(m.final);
  var kills = [m.players[0].game.kills, m.players[1].game.kills];
  var duels = 0, last = null;
  for (var i = 0; i < 30 * 60 * 10 && !m.over; i++) {
    Lluvia.updateMatch(m, 1 / 30, {});
    if (m.lastDuel && m.lastDuel !== last) { last = m.lastDuel; duels++; }
  }
  assert.ok(m.over, 'la final no terminó');
  assert.ok(m.winner);
  assert.ok(duels >= 3, 'hubo ' + duels + ' duelos');
  // No horde in the final: nobody killed a single enemy.
  assert.strictEqual(m.players[0].game.kills, kills[0]);
  assert.strictEqual(m.players[1].game.kills, kills[1]);
});

test('la recta final termina aunque uno de los dos estuviera caído esperando volver', function () {
  var m = duelMatch(53);
  m.players.forEach(function (pl, i) { if (i > 1) pl.game.over = true; });
  m.players[1].game.respawn = 4; // down in the horde when the final starts
  for (var i = 0; i < 30 * 60 * 10 && !m.over; i++) Lluvia.updateMatch(m, 1 / 30, {});
  assert.ok(m.over, 'la final quedó trabada');
  assert.ok(m.winner);
});

test('una partida simulada entera termina con un ganador', function () {
  var m = Lluvia.createMatch({ seed: 2, humanBot: true });
  // The design aims at 20-25 minutes; with a duel every 2 minutes it runs about 30-40 (stage 7 tunes it).
  while (!m.over && m.time < 60 * 60) Lluvia.updateMatch(m, 1 / 30, {});
  assert.ok(m.over, 'a los 60 minutos seguía');
  assert.ok(m.winner);
  var places = m.players.map(function (pl) { return pl.place; }).sort(function (a, b) { return a - b; });
  assert.strictEqual(places[0], 1);
});
