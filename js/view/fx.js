// Screen effects: particles, screen shake and floating text. They live only in the view; the engine just emits
// events (L.emit) and this file turns them into bursts and sounds.
(function (L) {
  'use strict';
  var TAU = Math.PI * 2, parts = [], texts = [], shake = 0;

  // Player options (screen shake, big text), kept in the browser.
  L.options = { shake: true, big: false };
  try { var saved = JSON.parse(localStorage.getItem('lluvia.options') || 'null'); if (saved) for (var k in saved) L.options[k] = saved[k]; } catch (e) { /* defaults */ }
  L.saveOptions = function () {
    try { localStorage.setItem('lluvia.options', JSON.stringify(L.options)); } catch (e) { /* not saved */ }
    document.body.classList.toggle('bigtext', !!L.options.big);
  };
  document.body.classList.toggle('bigtext', !!L.options.big);

  function burst(x, y, color, n, speed, life) {
    for (var i = 0; i < n && parts.length < 700; i++) {
      var a = Math.random() * TAU, v = speed * (0.3 + Math.random() * 0.7);
      parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: life, max: life, color: color, r: 2 + Math.random() * 2.5 });
    }
  }

  function float(x, y, text, color) {
    if (texts.length < 30) texts.push({ x: x, y: y, text: text, color: color, life: 1.1 });
  }

  L.fx = {
    shake: function (amount) { if (L.options.shake) shake = Math.max(shake, amount); },

    // Turns what happened since last frame into effects and sounds. events: a game's or duel's list (emptied).
    consume: function (events) {
      if (!events || !events.length) return;
      var S = L.sound;
      for (var i = 0; i < events.length; i++) {
        var ev = events[i];
        switch (ev.type) {
          case 'kill':
            var e = ev.extra;
            burst(ev.x, ev.y, e.type.color, e.type.boss ? 60 : e.elite ? 24 : 7, e.type.boss ? 380 : 160, e.type.boss ? 1.1 : 0.45);
            if (e.type.boss) { L.fx.shake(14); S.play('bossDown'); float(ev.x, ev.y - 40, '¡' + e.type.name + ' cayó!', '#ffd27a'); }
            else if (e.elite) { S.play('elite'); float(ev.x, ev.y - 20, '+élite', '#ffd27a'); }
            else S.play('kill');
            break;
          case 'shot': S.play('shot'); break;
          case 'gem': S.play('gem'); break;
          case 'level': S.play('level'); burst(ev.x, ev.y, '#5fe0d0', 30, 220, 0.7); break;
          case 'chest':
            var rare = ev.extra.rarity;
            S.play(rare === 'legendario' ? 'legendary' : 'chest');
            burst(ev.x, ev.y, L.data.rarities[rare].color, rare === 'legendario' ? 50 : 22, 240, 0.8);
            float(ev.x, ev.y - 26, ev.extra.name, L.data.rarities[rare].color);
            break;
          case 'ulti': S.play('ulti'); L.fx.shake(8); break;
          case 'lifeLost': S.play('lifeLost'); L.fx.shake(16); burst(ev.x, ev.y, '#ff6b81', 40, 260, 0.9); break;
          case 'fenix': S.play('legendary'); burst(ev.x, ev.y, '#ff5a5a', 60, 300, 1); break;
          case 'boss': S.play('boss'); L.fx.shake(6); break;
          case 'explode': S.play('boom'); burst(ev.x, ev.y, '#ffb347', 26, 300, 0.5); L.fx.shake(4); break;
          case 'split': burst(ev.x, ev.y, '#e8d36a', 10, 120, 0.4); break;
          case 'spit': S.play('spit'); break;
        }
      }
      events.length = 0;
    },

    // Camera offset this frame from the screen shake.
    offset: function (dt) {
      shake = Math.max(0, shake - dt * 40);
      if (!shake) return { x: 0, y: 0 };
      return { x: (Math.random() - 0.5) * shake, y: (Math.random() - 0.5) * shake };
    },

    // Draws and advances particles and floating texts, in world coordinates (call inside the camera transform).
    draw: function (ctx, dt) {
      var n = 0, i;
      for (i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.life -= dt;
        if (p.life <= 0) continue;
        p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy *= 0.92;
        ctx.globalAlpha = p.life / p.max;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.r / 2, p.y - p.r / 2, p.r, p.r);
        parts[n++] = p;
      }
      parts.length = n;
      ctx.textAlign = 'center';
      ctx.font = '700 14px system-ui, sans-serif';
      n = 0;
      for (i = 0; i < texts.length; i++) {
        var tx = texts[i];
        tx.life -= dt;
        if (tx.life <= 0) continue;
        tx.y -= 30 * dt;
        ctx.globalAlpha = Math.min(1, tx.life * 2);
        ctx.fillStyle = tx.color;
        ctx.fillText(tx.text, tx.x, tx.y);
        texts[n++] = tx;
      }
      texts.length = n;
      ctx.globalAlpha = 1;
    },

    clear: function () { parts.length = 0; texts.length = 0; shake = 0; }
  };
})(this.Lluvia = this.Lluvia || {});
