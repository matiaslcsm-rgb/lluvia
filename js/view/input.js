// Input: keyboard (WASD or arrows), mouse (aiming the ulti) and a gamepad if there is one.
(function (L) {
  'use strict';
  var keys = {};
  addEventListener('keydown', function (e) { keys[e.code] = true; });
  addEventListener('keyup', function (e) { keys[e.code] = false; });
  addEventListener('blur', function () { keys = {}; });
  var mouse = { x: 0, y: 0 };
  addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; });

  function down(a, b) { return keys[a] || keys[b] ? 1 : 0; }

  // Touch: the first finger is a stick (drag from where you touched); any other tap is reported to onTap.
  var stick = null;
  function onCanvas(e) { return e.target && e.target.id === 'game'; }
  addEventListener('touchstart', function (e) {
    if (!onCanvas(e)) return;
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      if (!stick) stick = { id: t.identifier, sx: t.clientX, sy: t.clientY, x: t.clientX, y: t.clientY, at: Date.now() };
      else if (L.input.onTap) L.input.onTap(t.clientX, t.clientY);
    }
    e.preventDefault();
  }, { passive: false });
  addEventListener('touchmove', function (e) {
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      if (stick && t.identifier === stick.id) { stick.x = t.clientX; stick.y = t.clientY; }
    }
    if (onCanvas(e)) e.preventDefault();
  }, { passive: false });
  function endTouch(e) {
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      if (stick && t.identifier === stick.id) {
        // A quick tap without dragging also counts as a tap (to bet or aim with one finger).
        if (Date.now() - stick.at < 220 && Math.abs(stick.x - stick.sx) + Math.abs(stick.y - stick.sy) < 12 && L.input.onTap) L.input.onTap(t.clientX, t.clientY);
        stick = null;
      }
    }
  }
  addEventListener('touchend', endTouch);
  addEventListener('touchcancel', endTouch);

  function pad() {
    var pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (var i = 0; i < pads.length; i++) if (pads[i] && pads[i].connected) return pads[i];
    return null;
  }

  // Gamepad buttons pressed this frame (not held): A, LB, RB, Start, D-pad.
  var held = {};
  var NAMES = { 0: 'a', 4: 'lb', 5: 'rb', 9: 'start', 12: 'up', 13: 'down', 14: 'left', 15: 'right' };

  L.input = {
    mouse: mouse,
    stick: function () { return stick; },
    onTap: null,
    vector: function () {
      var x = down('KeyD', 'ArrowRight') - down('KeyA', 'ArrowLeft');
      var y = down('KeyS', 'ArrowDown') - down('KeyW', 'ArrowUp');
      if (stick && !x && !y) {
        var tx = (stick.x - stick.sx) / 60, ty = (stick.y - stick.sy) / 60;
        if (Math.abs(tx) + Math.abs(ty) > 0.15) { x = tx; y = ty; }
      }
      var gp = pad();
      if (gp && !x && !y) {
        var ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
        if (Math.sqrt(ax * ax + ay * ay) > 0.25) { x = ax; y = ay; } // dead zone
      }
      var len = Math.sqrt(x * x + y * y);
      return len > 1 ? { x: x / len, y: y / len } : len ? { x: x, y: y } : { x: 0, y: 0 };
    },
    padPresses: function () {
      var gp = pad(), out = [];
      if (!gp) return out;
      for (var b in NAMES) {
        var on = gp.buttons[b] && gp.buttons[b].pressed;
        if (on && !held[b]) out.push(NAMES[b]);
        held[b] = on;
      }
      return out;
    }
  };
})(this.Lluvia = this.Lluvia || {});
