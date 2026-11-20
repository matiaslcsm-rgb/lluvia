// A match: 8 players, each in their own arena (a full game from game.js). One is you, the other 7 are bots.
// Every arena runs on the same clock. When you open a level-up choice the whole match waits.
// The last one with lives left wins.
(function (L) {
  'use strict';

  L.data.rivals = ['Nube', 'Trueno', 'Granizo', 'Bruma', 'Rocío', 'Relámpago', 'Llovizna'];
  var AI_STEP = 1 / 30; // the engine's longest safe step

  // opts: { seed, characterId, viewW, viewH, humanBot } — humanBot makes "you" a bot too (simulated games).
  L.createMatch = function (opts) {
    opts = opts || {};
    var seed = opts.seed || 1, rng = L.makeRng(seed ^ 0x5bd1e995);
    var chars = L.data.characters;
    var m = { time: 0, over: false, winner: null, players: [], human: null, rng: rng };
    for (var i = 0; i < 8; i++) {
      var isHuman = i === 0;
      var charId = isHuman && opts.characterId ? opts.characterId : rng.pick(chars).id;
      var pl = {
        index: i,
        name: isHuman ? 'Vos' : L.data.rivals[i - 1],
        isHuman: isHuman,
        game: L.createGame({
          seed: (seed + i * 7919) >>> 0, characterId: charId,
          viewW: isHuman ? opts.viewW : 1280, viewH: isHuman ? opts.viewH : 720
        }),
        // Rivals get a spread of skills so some fall early and some go far.
        bot: (!isHuman || opts.humanBot) ? L.makeBot((seed * 31 + i) >>> 0, isHuman ? 0.7 : 0.35 + 0.6 * ((i - 1) / 6)) : null,
        out: false,
        place: 0,
        // Rivals' arenas advance in 1/30 s steps on alternate frames, so only half of them work each frame.
        acc: i % 2 ? AI_STEP / 2 : 0
      };
      m.players.push(pl);
    }
    m.human = m.players[0];
    return m;
  };

  L.alivePlayers = function (m) { return m.players.filter(function (pl) { return !pl.out; }); };

  // Plays a bot's arena for dt seconds, answering its level-up choices as they come.
  function playBot(pl, dt) {
    var g = pl.game, input = L.botInput(g, pl.bot), rest = dt, guard = 0;
    while (rest > 1e-9 && !g.over && guard++ < 50) {
      if (g.choice) L.botChoose(g, pl.bot);
      rest = L.update(g, rest, input);
    }
  }

  function tell(m, text, color) { L.toast(m.human.game, text, color); }

  // input: your movement. Returns nothing; read m.over / m.winner / players[i].place.
  L.updateMatch = function (m, dt, input) {
    if (m.over) return;
    var human = m.human, played = dt;
    if (!human.out) {
      if (human.bot) playBot(human, dt);
      else {
        if (human.game.choice) return; // the whole match waits for your choice
        played = dt - L.update(human.game, dt, input);
      }
    }
    m.time += played;
    var livesBefore = m.players.map(function (pl) { return pl.game.lives; });
    m.players.forEach(function (pl) {
      if (pl.out || pl.isHuman) return;
      pl.acc += played;
      if (pl.acc >= AI_STEP - 1e-9) { playBot(pl, pl.acc); pl.acc = 0; }
    });

    // Lives lost and eliminations. Everyone knocked out in the same frame shares the worst free place.
    var alive = L.alivePlayers(m).length, newlyOut = [];
    m.players.forEach(function (pl, i) {
      if (pl.out) return;
      if (pl.game.over) newlyOut.push(pl);
      else if (!pl.isHuman && pl.game.lives < livesBefore[i]) tell(m, pl.name + ' perdió una vida', '#c4c6d2');
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
    } else if (human.out && !human.bot) {
      m.over = true; // you are out: the match ends for you
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
