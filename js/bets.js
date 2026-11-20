// Bets on duels. Before each duel the players who are not fighting can bet on one of the two.
// Shared pot: everything bet (plus the free bets, paid by the house) is split among those who backed the winner,
// in proportion to what each one put in. Those who backed the loser lose their gold.
(function (L) {
  'use strict';

  function goldScale(m) { return Math.pow(1 + L.data.horde.goldGrowth, Math.floor(m.time / 60)); }

  // pair: the two fighters. window: seconds to bet (0 = no betting).
  L.openBetting = function (m, pair, rule, window) {
    var b = { pair: pair, rule: rule, opensAt: m.time, endsAt: m.time + window, byPlayer: {}, free: Math.round(L.data.bets.free * goldScale(m)) };
    // Each bettor's limit is fixed when betting opens, and bots decide when to bet.
    m.players.forEach(function (pl) {
      if (pl.out || pair.indexOf(pl) !== -1) return;
      b.byPlayer[pl.index] = {
        side: -1, real: 0, free: 0,
        cap: Math.floor(pl.game.gold * L.data.bets.maxShare),
        botAt: pl.bot ? m.time + window * (0.1 + 0.7 * m.rng()) : Infinity
      };
    });
    return b;
  };

  // Bets `amount` gold from `pl` on fighter `side` (0 or 1). Returns the gold actually bet.
  // You can't bet on a duel you fight, switch sides, or go over your limit. Your first bet adds the free one.
  L.placeBet = function (m, pl, side, amount) {
    var b = m.betting;
    if (!b || m.time >= b.endsAt || pl.out) return 0;
    var mine = b.byPlayer[pl.index];
    if (!mine || (mine.side !== -1 && mine.side !== side)) return 0;
    var room = Math.min(mine.cap - mine.real, pl.game.gold);
    var put = Math.max(0, Math.min(Math.floor(amount), room));
    if (put <= 0 && mine.side !== -1) return 0;
    if (mine.side === -1) { mine.side = side; mine.free = b.free; }
    mine.real += put;
    pl.game.gold -= put;
    return put;
  };

  // Gold on each side (real + free) and what one gold pays on each side if it wins.
  L.betOdds = function (b) {
    var totals = [0, 0];
    Object.keys(b.byPlayer).forEach(function (k) {
      var x = b.byPlayer[k];
      if (x.side !== -1) totals[x.side] += x.real + x.free;
    });
    var pot = totals[0] + totals[1];
    return { totals: totals, pot: pot, mult: totals.map(function (t) { return t > 0 ? pot / t : 0; }) };
  };

  // How strong a player looks from the outside: what anybody could read on the standings and the duel screen.
  L.powerScore = function (pl) {
    var p = pl.game.player, s = p.level * 0.5;
    p.abilities.forEach(function (a) { s += a.level; });
    p.passives.forEach(function (ps) { s += ps.level * 0.6; });
    p.itemOrder.forEach(function (id) { s += p.items[id] * 1.5; });
    return s;
  };

  // Bots bet once, at their own moment: on whoever looks stronger (a sloppy bot misreads it more often),
  // more gold the clearer it looks.
  L.botBets = function (m) {
    var b = m.betting;
    if (!b) return;
    m.players.forEach(function (pl) {
      var mine = b.byPlayer[pl.index];
      if (!mine || !pl.bot || mine.side !== -1 || m.time < mine.botAt || m.time >= b.endsAt) return;
      mine.botAt = Infinity;
      var diff = L.powerScore(b.pair[0]) - L.powerScore(b.pair[1]);
      var pA = 1 / (1 + Math.exp(-diff * 0.25));
      var read = pA + (m.rng() - 0.5) * (1.2 - pl.bot.skill);
      var side = read >= 0.5 ? 0 : 1;
      var confidence = Math.min(1, Math.abs(read - 0.5) * 2);
      var share = 0.1 + 0.9 * confidence * (0.4 + 0.6 * m.rng());
      L.placeBet(m, pl, side, mine.cap * share);
    });
  };

  // Pays the duel's bets. Returns { paid: {index: gold back}, lost: {index: gold lost} }.
  L.settleBets = function (m, b, winnerSide) {
    var odds = L.betOdds(b), out = { paid: {}, lost: {} };
    var winTotal = odds.totals[winnerSide];
    Object.keys(b.byPlayer).forEach(function (k) {
      var x = b.byPlayer[k], pl = m.players[k];
      if (x.side === -1) return;
      if (x.side === winnerSide) {
        var back = Math.floor(odds.pot * (x.real + x.free) / winTotal);
        pl.game.gold += back;
        out.paid[k] = back;
      } else {
        out.lost[k] = x.real;
      }
    });
    return out;
  };

  // A fighter dropped out before the duel: everybody gets their gold back.
  L.refundBets = function (m, b) {
    Object.keys(b.byPlayer).forEach(function (k) { m.players[k].game.gold += b.byPlayer[k].real; });
  };
})(this.Lluvia = this.Lluvia || {});
