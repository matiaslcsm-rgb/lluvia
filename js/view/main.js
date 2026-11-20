// Boots the game in the browser: canvas size, frame loop, menus and keys.
(function (L) {
  'use strict';
  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var game = null, paused = false, last = 0;

  function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    if (game) { game.view.w = canvas.width; game.view.h = canvas.height; }
  }

  function start(characterId) {
    game = L.createGame({ seed: (Date.now() >>> 0) || 1, characterId: characterId, viewW: canvas.width, viewH: canvas.height });
    paused = false;
    L.ui.hide();
  }

  function pick(i) {
    if (game && L.choose(game, i)) L.ui.hide();
  }

  function togglePause() {
    if (!game || game.over || game.choice) return;
    paused = !paused;
    if (paused) L.ui.pause(togglePause); else L.ui.hide();
  }

  function menu() { game = null; L.ui.characterSelect(start); }

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
    if (game && !paused) {
      L.update(game, dt, L.input.vector());
      if (game.choice && L.ui.current !== 'choice') L.ui.choice(game.choice, pick);
      if (game.over && L.ui.current !== 'over') L.ui.gameOver(game, menu);
    }
    L.render(game, ctx, canvas.width, canvas.height);
    requestAnimationFrame(frame);
  }

  addEventListener('resize', resize);
  resize();
  menu();
  requestAnimationFrame(function (t) { last = t; frame(t); });
})(this.Lluvia = this.Lluvia || {});
