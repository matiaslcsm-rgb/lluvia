// Boots the game in the browser: canvas size, frame loop, menus and keys.
(function (L) {
  'use strict';
  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var match = null, paused = false, last = 0;

  function game() { return match && match.human.game; }

  function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    if (match) { game().view.w = canvas.width; game().view.h = canvas.height; }
  }

  function start(characterId) {
    match = L.createMatch({ seed: (Date.now() >>> 0) || 1, characterId: characterId, viewW: canvas.width, viewH: canvas.height });
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

  function menu() { match = null; L.ui.characterSelect(start); }

  addEventListener('keydown', function (e) {
    var n = { Digit1: 0, Digit2: 1, Digit3: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2 }[e.code];
    if (L.ui.current === 'select' && n !== undefined) start(L.data.characters[n].id);
    else if (L.ui.current === 'choice' && n !== undefined) pick(n);
    else if (L.ui.current === 'over' && e.code === 'Enter') menu();
    else if (e.code === 'Escape' || e.code === 'KeyP') togglePause();
  });

  function frame(t) {
    var dt = Math.min((t - last) / 1000, 0.05);
    last = t;
    if (match && !paused) {
      L.updateMatch(match, dt, L.input.vector());
      var g = game();
      if (!match.over && g.choice && L.ui.current !== 'choice') L.ui.choice(g.choice, pick);
      if (match.over && L.ui.current !== 'over') L.ui.result(match, menu);
    }
    L.render(game(), ctx, canvas.width, canvas.height, match);
    requestAnimationFrame(frame);
  }

  addEventListener('resize', resize);
  resize();
  menu();
  requestAnimationFrame(function (t) { last = t; frame(t); });
})(this.Lluvia = this.Lluvia || {});
