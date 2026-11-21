// Sending Anegados: pay gold to drop a pack of creatures (with an elite) on the rival who is ahead.
// The leader is the usual target, so it works as a brake on whoever is running away with the match.
(function (L) {
  'use strict';

  L.sendCost = function (g) {
    var S = L.data.send;
    return Math.round(S.cost * Math.pow(1 + S.growth, L.difficulty(g) - 1));
  };

  // Who you would send to: the first in the standings who isn't you, nor out, nor in a duel.
  L.sendTarget = function (m, from) {
    var rows = L.standings(m);
    for (var i = 0; i < rows.length; i++) {
      var pl = rows[i];
      if (pl !== from && !pl.out && !pl.inDuel) return pl;
    }
    return null;
  };

  // Returns why it can't be sent, or null if it can.
  L.cantSend = function (m, from) {
    var g = from.game;
    if (m.final || m.over || from.out || from.inDuel) return 'ahora no';
    if ((from.sendCd || 0) > 0) return 'en ' + Math.ceil(from.sendCd) + ' s';
    if (g.gold < L.sendCost(g)) return 'falta oro';
    if (!L.sendTarget(m, from)) return 'nadie a quien';
    return null;
  };

  L.sendAnegados = function (m, from) {
    if (L.cantSend(m, from)) return false;
    var S = L.data.send, g = from.game, to = L.sendTarget(m, from), tg = to.game, p = tg.player;
    g.gold -= L.sendCost(g);
    from.sendCd = S.cooldown;
    from.sent = (from.sent || 0) + 1;
    var n = S.pack.length + Math.floor(S.perStep * (L.difficulty(tg) - 1)), a0 = tg.rng() * Math.PI * 2;
    for (var i = 0; i < n; i++) {
      var a = a0 + (i / n) * Math.PI * 0.9, d = 360 + tg.rng() * 60;
      var e = L.spawnEnemy(tg, S.pack[i % S.pack.length], p.x + Math.cos(a) * d, p.y + Math.sin(a) * d);
      if (i < S.elites) L.makeElite(e);
    }
    L.toast(tg, '¡' + from.name + ' te mandó Anegados!', '#ff9a7a');
    L.emit(tg, 'boss', p.x, p.y);
    if (from.isHuman) L.toast(g, 'Le mandaste Anegados a ' + to.name, '#c9b8ff');
    else if (to.isHuman) { /* already told */ }
    else if (m.human && !m.human.out) L.toast(m.human.game, from.name + ' le mandó Anegados a ' + to.name, '#9a9db0');
    return true;
  };

  // Called every match frame: cooldowns, and the bots deciding to send.
  L.updateSends = function (m, dt) {
    var S = L.data.send;
    m.players.forEach(function (pl) {
      if (pl.sendCd > 0) pl.sendCd -= dt;
      if (!pl.bot || pl.isHuman || m.time < S.botFrom) return;
      pl.sendThink = (pl.sendThink || 0) - dt;
      if (pl.sendThink > 0) return;
      pl.sendThink = S.botEvery;
      if (pl.game.gold >= 2 * L.sendCost(pl.game) && pl.bot.rng() < S.botChance) L.sendAnegados(m, pl);
    });
  };
})(this.Lluvia = this.Lluvia || {});
