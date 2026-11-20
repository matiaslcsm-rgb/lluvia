// Stage 5: bets on duels.

function betMatch(seed) {
  var m = Lluvia.createMatch({ seed: seed || 60, characterId: 'brasa' });
  m.players.forEach(function (pl) { pl.game.gold = 100; });
  return m;
}

// Opens betting on players 1 and 2 by hand, with or without free bets.
function open(m, free) {
  var b = Lluvia.openBetting(m, [m.players[1], m.players[2]], Lluvia.data.duelRules[0], 15);
  if (free === 0) b.free = 0;
  m.betting = b;
  return b;
}

test('los que pelean no pueden apostar en su propio duelo', function () {
  var m = betMatch(); open(m);
  assert.strictEqual(Lluvia.placeBet(m, m.players[1], 0, 10), 0);
  assert.strictEqual(m.players[1].game.gold, 100);
});

test('se puede apostar hasta la mitad del oro, y la primera apuesta suma la gratis', function () {
  var m = betMatch(), b = open(m), you = m.human;
  assert.strictEqual(Lluvia.placeBet(m, you, 0, 30), 30);
  assert.strictEqual(Lluvia.placeBet(m, you, 0, 30), 20, 'pasó el límite del 50%');
  assert.strictEqual(Lluvia.placeBet(m, you, 0, 30), 0);
  assert.strictEqual(you.game.gold, 50);
  assert.strictEqual(b.byPlayer[0].free, b.free);
  assert.ok(b.free > 0);
});

test('no se puede cambiar de lado una vez que apostaste', function () {
  var m = betMatch(); open(m);
  Lluvia.placeBet(m, m.human, 0, 10);
  assert.strictEqual(Lluvia.placeBet(m, m.human, 1, 10), 0);
});

test('pozo común: los que acertaron se reparten todo, en proporción a lo que pusieron', function () {
  var m = betMatch(), b = open(m, 0), P = m.players;
  Lluvia.placeBet(m, P[0], 0, 40);  // you: 40 on fighter 0
  Lluvia.placeBet(m, P[3], 0, 20);  // 20 on fighter 0
  Lluvia.placeBet(m, P[4], 1, 30);  // 30 on fighter 1
  var res = Lluvia.settleBets(m, b, 0);
  // Pot 90, winners put 60: you get 90 × 40/60 = 60, the other 30.
  assert.strictEqual(res.paid[0], 60);
  assert.strictEqual(res.paid[3], 30);
  assert.strictEqual(res.lost[4], 30);
  assert.strictEqual(P[0].game.gold, 100 - 40 + 60);
  assert.strictEqual(P[4].game.gold, 70);
});

test('la apuesta gratis cuenta para repartir pero no cuesta oro', function () {
  var m = betMatch(), b = open(m), P = m.players;
  Lluvia.placeBet(m, P[0], 1, 0);   // you only take the free bet
  Lluvia.placeBet(m, P[3], 0, 50);
  assert.strictEqual(P[0].game.gold, 100);
  var res = Lluvia.settleBets(m, b, 1);
  assert.ok(res.paid[0] > b.free, 'la gratis cobró ' + res.paid[0]);
  assert.strictEqual(res.lost[3], 50);
});

test('nunca se reparte más de lo que se apostó (más las gratis)', function () {
  for (var s = 1; s <= 10; s++) {
    var m = betMatch(70 + s), b = open(m), P = m.players;
    P.forEach(function (pl, i) { if (i > 2) Lluvia.placeBet(m, pl, i % 2, 10 + s * i); });
    var odds = Lluvia.betOdds(b), res = Lluvia.settleBets(m, b, s % 2);
    var paid = Object.keys(res.paid).reduce(function (a, k) { return a + res.paid[k]; }, 0);
    assert.ok(paid <= odds.pot, 'pagó ' + paid + ' de un pozo de ' + odds.pot);
  }
});

test('si uno de los dos queda afuera antes del duelo, se devuelve todo', function () {
  var m = betMatch(), P = m.players;
  m.time = 200; m.nextDuel = 200;
  P.forEach(function (pl, i) { pl.duels = (i === 1 || i === 2) ? 0 : 1; });
  Lluvia.updateMatch(m, 1 / 60, {});
  assert.ok(m.betting);
  var fighters = m.betting.pair;
  Lluvia.placeBet(m, P[0], 0, 40);
  fighters[0].game.over = true;
  for (var i = 0; i < 16 * 60 && m.betting; i++) Lluvia.updateMatch(m, 1 / 60, {});
  assert.strictEqual(m.duel, null);
  assert.ok(P[0].game.gold >= 100, 'no te devolvieron la apuesta');
});

test('la IA apuesta durante la ventana, y casi siempre al que se ve más fuerte', function () {
  var onStrong = 0, total = 0;
  for (var s = 1; s <= 8; s++) {
    var m = betMatch(80 + s), b = open(m), strong = m.players[1];
    ['lanza', 'rayo', 'temblor'].forEach(function (id) { Lluvia.addAbility(strong.game, id); });
    for (var k = 0; k < 8; k++) Lluvia.addItem(strong.game, 'afilador');
    for (var t = 0; t < 15 * 30; t++) { m.time += 1 / 30; Lluvia.botBets(m); }
    m.players.forEach(function (pl) {
      var x = b.byPlayer[pl.index];
      if (!x || !pl.bot) return;
      assert.notStrictEqual(x.side, -1, pl.name + ' no apostó');
      total++;
      if (x.side === 0) onStrong++;
    });
  }
  assert.ok(onStrong / total > 0.75, onStrong + ' de ' + total + ' apostaron al fuerte');
});

test('en la recta final no hay apuestas: el duelo empieza enseguida', function () {
  var m = betMatch();
  m.players.forEach(function (pl, i) { if (i > 1) pl.game.over = true; });
  Lluvia.updateMatch(m, 1 / 60, {});
  for (var i = 0; i < 6 * 60 && !m.duel; i++) Lluvia.updateMatch(m, 1 / 60, {});
  assert.ok(m.duel, 'no empezó el duelo final');
  assert.strictEqual(Lluvia.betOdds(m.duel.betting).pot, 0);
});

test('al terminar el duelo se pagan las apuestas', function () {
  var m = Lluvia.createMatch({ seed: 61, humanBot: true });
  m.players.forEach(function (pl) { pl.game.player.hp = pl.game.player.stats.maxHp = 1e9; });
  while (!m.duel) Lluvia.updateMatch(m, 1 / 30, {});
  var d = m.duel;
  while (m.duel) Lluvia.updateMatch(m, 1 / 30, {});
  assert.ok(d.payout, 'no hubo pago');
  var bettors = Object.keys(d.betting.byPlayer).filter(function (k) { return d.betting.byPlayer[k].side !== -1; });
  assert.ok(bettors.length >= 4, 'apostaron ' + bettors.length);
  bettors.forEach(function (k) { assert.ok(k in d.payout.paid || k in d.payout.lost); });
});
