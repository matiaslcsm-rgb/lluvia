// Boots the game in the browser: canvas size, frame loop, menus and keys.
(function (L) {
  'use strict';
  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var match = null, paused = false, last = 0, reward = null;

  // Your Cuaderno, kept in this browser.
  L.profile = L.newProfile();
  try {
    var saved = JSON.parse(localStorage.getItem('lluvia.profile') || 'null');
    if (saved) { var base = L.newProfile(); for (var k in base) if (saved[k] !== undefined) base[k] = saved[k]; L.profile = base; }
  } catch (e) { /* storage blocked or broken: start a fresh notebook */ }
  L.saveProfile = function () { try { localStorage.setItem('lluvia.profile', JSON.stringify(L.profile)); } catch (e) { /* not saved */ } };

  function game() { return match && match.human.game; }

  function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    if (match) { game().view.w = canvas.width; game().view.h = canvas.height; }
  }

  function start(characterId) {
    L.fx.clear();
    match = L.createMatch({ seed: (Date.now() >>> 0) || 1, characterId: characterId, viewW: canvas.width, viewH: canvas.height, profile: L.profile });
    reward = null;
    paused = false;
    L.ui.hide();
  }

  function pick(i) {
    if (match && L.choose(game(), i)) L.ui.hide();
  }

  function togglePause() {
    if (!match || match.over || game().choice) return;
    paused = !paused;
    if (paused) L.ui.pause(togglePause); else L.ui.hide();
  }

  // Space: your ulti toward the mouse, in your arena or in the duel.
  function ulti() {
    var mouse = L.input.mouse;
    if (match.duel && match.human.inDuel) {
      var v = L.duelView, i = match.duel.players.indexOf(match.human);
      if (v) L.castDuelUlti(match.duel, i, (mouse.x - v.ox) / v.scale, (mouse.y - v.oy) / v.scale);
      return;
    }
    var g = game();
    if (g.choice || match.final) return;
    // The camera keeps you in the middle of the screen.
    L.castUlti(g, g.player.x - canvas.width / 2 + mouse.x, g.player.y - canvas.height / 2 + mouse.y);
  }

  // Q / E: bet a slice of your limit on the first or second fighter.
  function bet(side) {
    var mine = match.betting.byPlayer[match.human.index];
    if (!mine) return;
    if (L.placeBet(match, match.human, side, Math.max(1, Math.floor(mine.cap * L.data.bets.pressShare))) || mine.side === side) L.sound.play('bet');
  }

  function menu() { match = null; L.ui.characterSelect(start); }

  addEventListener('keydown', function (e) {
    var n = /^(Digit|Numpad)[1-8]$/.test(e.code) ? Number(e.code.slice(-1)) - 1 : undefined;
    if (L.ui.current === 'select' && n !== undefined && L.data.characters[n]) start(L.data.characters[n].id);
    else if (L.ui.current === 'choice' && n !== undefined) pick(n);
    else if (L.ui.current === 'over' && e.code === 'Enter') menu();
    else if (e.code === 'Escape' || e.code === 'KeyP') togglePause();
    else if ((e.code === 'KeyQ' || e.code === 'KeyE') && match && match.betting && !paused) bet(e.code === 'KeyQ' ? 0 : 1);
    else if (e.code === 'Space' && match && !paused && !match.over) { e.preventDefault(); ulti(); }
    else if (e.code === 'KeyM') L.ui.flash(L.sound.toggle() ? 'Sonido apagado (M)' : 'Sonido prendido (M)');
  });

  // Sounds for what happens in the match itself (duels, bets, the end), comparing with the last frame.
  var seen = { duel: null, betting: null, over: false };
  function matchSounds() {
    if (match.duel && match.duel !== seen.duel) L.sound.play('duel');
    if (match.over && !seen.over) L.sound.play(match.winner === match.human ? 'win' : 'lose');
    seen.duel = match.duel; seen.over = match.over;
  }

  function frame(t) {
    var dt = Math.min((t - last) / 1000, 0.05);
    last = t;
    L.frameDt = paused ? 0 : dt;
    if (match && !paused) {
      L.updateMatch(match, dt, L.input.vector());
      L.fx.consume(game().events);
      if (match.duel && match.duel.events) L.fx.consume(match.duel.events);
      matchSounds();
      L.tips.check(match);
      var g = game();
      if (!match.over && g.choice && L.ui.current !== 'choice') L.ui.choice(g.choice, pick);
      if (match.over && L.ui.current !== 'over') {
        if (!reward) { reward = L.settleMatch(L.profile, match); L.saveProfile(); }
        L.ui.result(match, menu, reward);
      }
    }
    if (match && match.duel && match.human.inDuel) L.renderDuel(match.duel, ctx, canvas.width, canvas.height, match.duel.players.indexOf(match.human));
    else L.render(game(), ctx, canvas.width, canvas.height, match);
    if (match && !match.over) L.tips.draw(ctx, canvas.width, paused ? 0 : dt);
    requestAnimationFrame(frame);
  }

  addEventListener('resize', resize);
  resize();
  menu();
  requestAnimationFrame(function (t) { last = t; frame(t); });
})(this.Lluvia = this.Lluvia || {});
