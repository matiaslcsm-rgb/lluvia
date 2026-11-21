// A match: 8 players, each in their own arena (a full game from game.js). One is you, the other 7 are bots.
// Every arena runs on the same clock. When you open a level-up choice the whole match waits.
// Every few minutes two players leave their arenas for a duel (duel.js); the loser loses a life.
// When only two are left the hordes stop and they duel until one runs out of lives. The last one in wins.
(function (L) {
  'use strict';

  L.data.rivals = ['Nube', 'Trueno', 'Granizo', 'Bruma', 'Rocío', 'Relámpago', 'Llovizna'];
  var AI_STEP = 1 / 30; // the engine's longest safe step

  // opts: { seed, characterId, viewW, viewH, humanBot, profile } — humanBot makes "you" a bot too (simulated
  // games); profile is your Cuaderno (upgrades apply only to you).
  L.createMatch = function (opts) {
    opts = opts || {};
    var seed = opts.seed || 1, rng = L.makeRng(seed ^ 0x5bd1e995);
    var chars = L.data.characters;
    var m = {
      time: 0, over: false, winner: null, players: [], human: null, rng: rng,
      duel: null,                       // the duel being fought, if any
      betting: null,                    // the bets open before the next duel, if any
      lastDuel: null,                   // the last finished duel (for the screen)
      nextDuel: L.data.duels.every,
      final: false,                     // only two left: no more hordes, duels back to back
      storm: !!opts.storm,              // Tormenta eterna (hard mode)
      pacts: opts.pacts || []           // Pactos del Cielo turned on
    };
    for (var i = 0; i < 8; i++) {
      var isHuman = i === 0;
      var charId = isHuman && opts.characterId ? opts.characterId : rng.pick(chars).id;
      var pl = {
        index: i,
        name: isHuman ? 'Vos' : L.data.rivals[i - 1],
        isHuman: isHuman,
        game: L.createGame({
          seed: (seed + i * 7919) >>> 0, characterId: charId, listen: isHuman && !opts.humanBot,
          viewW: isHuman ? opts.viewW : 1280, viewH: isHuman ? opts.viewH : 720, storm: m.storm, pacts: m.pacts
        }),
        // Rivals get a spread of skills so some fall early and some go far.
        bot: (!isHuman || opts.humanBot) ? L.makeBot((seed * 31 + i) >>> 0, isHuman ? 0.7 : Math.min(1, 0.35 + 0.6 * ((i - 1) / 6) + (m.storm ? L.data.meta.storm.botSkill : 0))) : null,
        out: false,
        place: 0,
        duels: 0,
        inDuel: false,
        // Rivals' arenas advance in 1/30 s steps on alternate frames, so only half of them work each frame.
        acc: i % 2 ? AI_STEP / 2 : 0
      };
      m.players.push(pl);
    }
    m.human = m.players[0];
    if (opts.profile && !opts.humanBot) L.applyMeta(m.human.game, opts.profile);
    return m;
  };

  L.alivePlayers = function (m) { return m.players.filter(function (pl) { return !pl.out; }); };

  // Plays a bot's arena for dt seconds, answering its level-up choices as they come.
  function playBot(pl, dt) {
    var g = pl.game, input = L.botInput(g, pl.bot), rest = dt, guard = 0;
    L.botUlti(g, pl.bot);
    while (rest > 1e-9 && !g.over && guard++ < 50) {
      if (g.choice) L.botChoose(g, pl.bot);
      rest = L.update(g, rest, input);
    }
  }

  function tell(m, text, color) { L.toast(m.human.game, text, color); }

  // Picks the two players who have fought the fewest duels (ties at random). Nobody who is out, nor anybody
  // waiting to come back to the horde, except in the final: there is no horde to come back to, so being down
  // doesn't matter (and waiting for it would freeze the match).
  function pickPair(m) {
    var pool = L.alivePlayers(m).filter(function (pl) { return m.final || pl.game.respawn <= 0; });
    if (pool.length < 2) return null;
    pool.forEach(function (pl) { pl._roll = m.rng(); });
    pool.sort(function (a, b) { return (a.duels - b.duels) || (a._roll - b._roll); });
    return [pool[0], pool[1]];
  }

  // The duel is announced with its rule, and the others get a few seconds to bet (none in the final).
  function openBets(m) {
    var pair = pickPair(m);
    if (!pair) { m.nextDuel = m.time + 1; return; }
    var rule = m.rng.pick(L.data.duelRules);
    m.betting = L.openBetting(m, pair, rule, m.final ? 0 : L.data.bets.window);
    var canBet = !m.final && pair.indexOf(m.human) === -1 && !m.human.out;
    tell(m, '¡Se viene un duelo! ' + pair[0].name + ' contra ' + pair[1].name + ' — ' + rule.name +
      (canBet ? '. Apostá con Q o E' : ''), '#ffd27a');
    if (m.final) startDuel(m);
  }

  function startDuel(m) {
    var b = m.betting, pair = b.pair;
    m.betting = null;
    if (pair[0].out || pair[1].out) { L.refundBets(m, b); m.nextDuel = m.time + 1; return; }
    m.duel = L.createDuel(m, pair[0], pair[1], b.rule);
    m.duel.betting = b;
    pair.forEach(function (pl) { pl.inDuel = true; pl.duels++; });
  }

  // The loser loses a life, the winner takes the prize, and both go back to their arenas on the match clock.
  function endDuel(m) {
    var d = m.duel, w = d.winner, l = d.loser, step = Math.floor(m.time / 60);
    var prize = Math.round(L.data.duels.prize * Math.pow(1 + L.data.horde.goldGrowth, step));
    w.game.gold += prize;
    w.duelsWon = (w.duelsWon || 0) + 1;
    l.game.lives--;
    if (l.game.lives <= 0) l.game.over = true;
    d.players.forEach(function (pl) {
      pl.inDuel = false;
      pl.game.time = m.time;
      pl.game.player.invuln = L.data.duels.returnInvuln;
      pl.game.projectiles.length = 0;
      pl.game.player.abilities.forEach(function (ab) { ab.turrets = []; }); // duel turrets stay in the duel
    });
    d.prize = prize;
    d.payout = L.settleBets(m, d.betting, d.players.indexOf(w));
    var me = String(m.human.index);
    if (me in d.payout.paid) { m.human.betsWon = (m.human.betsWon || 0) + 1; tell(m, 'Tu apuesta salió: cobraste ' + d.payout.paid[me] + ' oro', '#6fdc6a'); }
    else if (me in d.payout.lost) tell(m, 'Perdiste tu apuesta' + (d.payout.lost[me] ? ' (' + d.payout.lost[me] + ' oro)' : ''), '#ff9a7a');
    m.lastDuel = d;
    m.duel = null;
    m.nextDuel = m.time + (m.final ? L.data.duels.finalBreak : L.data.duels.every);
    tell(m, w.name + ' le ganó el duelo a ' + l.name + (d.timeout ? ' por tiempo' : '') + ' (+' + prize + ' oro)', '#ffd27a');
  }

  // input: your movement. Returns nothing; read m.over / m.winner / players[i].place.
  L.updateMatch = function (m, dt, input) {
    if (m.over) return;
    var human = m.human, played = dt;
    var humanInHorde = !human.out && !human.inDuel && !m.final;
    if (humanInHorde) {
      if (human.bot) playBot(human, dt);
      else {
        if (human.game.choice) return; // the whole match waits for your choice
        played = dt - L.update(human.game, dt, input);
      }
    }
    m.time += played;
    var livesBefore = m.players.map(function (pl) { return pl.game.lives; });
    if (!m.final) {
      m.players.forEach(function (pl) {
        if (pl.out || pl.isHuman || pl.inDuel) return;
        pl.acc += played;
        if (pl.acc >= AI_STEP - 1e-9) { playBot(pl, pl.acc); pl.acc = 0; }
      });
    }

    if (!m.final) L.updateSends(m, played);
    var duelLoser = null;
    if (m.duel) {
      L.updateDuel(m.duel, played, human.inDuel && !human.bot ? input : null);
      if (m.duel.over) { duelLoser = m.duel.loser; endDuel(m); }
    } else if (m.betting) {
      L.botBets(m);
      if (m.time >= m.betting.endsAt) startDuel(m);
    } else if (m.time >= m.nextDuel && L.alivePlayers(m).length >= 2) {
      openBets(m);
    }

    // Lives lost and eliminations. Everyone knocked out in the same frame shares the worst free place.
    var alive = L.alivePlayers(m).length, newlyOut = [];
    m.players.forEach(function (pl, i) {
      if (pl.out) return;
      if (pl.game.over) newlyOut.push(pl);
      // A duel loser already got its own message.
      else if (!pl.isHuman && pl.game.lives < livesBefore[i] && pl !== duelLoser) tell(m, pl.name + ' perdió una vida', '#c4c6d2');
    });
    newlyOut.forEach(function (pl) {
      pl.out = true;
      pl.place = alive - newlyOut.length + 1;
      if (!pl.isHuman) tell(m, pl.name + ' quedó afuera (' + pl.place + '.º)', '#ff9a7a');
    });
    var left = L.alivePlayers(m);
    if (left.length <= 1) {
      m.over = true;
      m.winner = left[0] || null;
      if (m.winner) m.winner.place = 1;
      if (m.duel) { m.duel.players.forEach(function (pl) { pl.inDuel = false; }); m.duel = null; }
      if (m.betting) { L.refundBets(m, m.betting); m.betting = null; }
    } else if (human.out && !human.bot) {
      m.over = true; // you are out: the match ends for you
    } else if (left.length === 2 && !m.final) {
      // Recta final: hordes stop and the two left duel back to back.
      m.final = true;
      if (!m.duel) m.nextDuel = Math.min(m.nextDuel, m.time + L.data.duels.finalBreak);
      tell(m, '¡Quedan dos! ' + left[0].name + ' y ' + left[1].name + ' se baten a duelo hasta el final', '#ffd27a');
    }
  };

  // Standings: players still in by lives, then level, then kills; those out by the place they got.
  L.standings = function (m) {
    return m.players.slice().sort(function (a, b) {
      if (a.out !== b.out) return a.out ? 1 : -1;
      if (a.out) return a.place - b.place;
      var ga = a.game, gb = b.game;
      return (gb.lives - ga.lives) || (gb.player.level - ga.player.level) || (gb.kills - ga.kills);
    });
  };
})(this.Lluvia = this.Lluvia || {});
