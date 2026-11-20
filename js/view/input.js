// Keyboard state for movement (WASD or arrows).
(function (L) {
  'use strict';
  var keys = {};
  addEventListener('keydown', function (e) { keys[e.code] = true; });
  addEventListener('keyup', function (e) { keys[e.code] = false; });
  addEventListener('blur', function () { keys = {}; });
  var mouse = { x: 0, y: 0 };
  addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; });

  function down(a, b) { return keys[a] || keys[b] ? 1 : 0; }

  L.input = {
    mouse: mouse,
    vector: function () {
      var x = down('KeyD', 'ArrowRight') - down('KeyA', 'ArrowLeft');
      var y = down('KeyS', 'ArrowDown') - down('KeyW', 'ArrowUp');
      var len = Math.sqrt(x * x + y * y);
      return len ? { x: x / len, y: y / len } : { x: 0, y: 0 };
    }
  };
})(this.Lluvia = this.Lluvia || {});
