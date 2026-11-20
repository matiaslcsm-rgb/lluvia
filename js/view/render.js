// Draws the arena with simple shapes, plus the HUD. Camera follows the player.
(function (L) {
  'use strict';
  var TAU = Math.PI * 2;

  function circle(ctx, x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }

  function bar(ctx, x, y, w, h, frac, color) {
    ctx.fillStyle = '#0b0c10'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color; ctx.fillRect(x, y, w * L.clamp(frac, 0, 1), h);
  }

  function clock(t) {
    var m = Math.floor(t / 60), s = Math.floor(t % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  L.render = function (g, ctx, W, H) {
    ctx.fillStyle = '#14161c';
    ctx.fillRect(0, 0, W, H);
    if (!g) return;
    var p = g.player, camX = p.x - W / 2, camY = p.y - H / 2;
    var pad = 40;
    function visible(x, y, r) { return x + r > camX - pad && x - r < camX + W + pad && y + r > camY - pad && y - r < camY + H + pad; }

    ctx.save();
    ctx.translate(-camX, -camY);

    // Floor grid and arena edge.
    var step = 80, x, y;
    ctx.strokeStyle = '#1c1f28'; ctx.lineWidth = 1; ctx.beginPath();
    for (x = Math.floor(camX / step) * step; x < camX + W; x += step) { ctx.moveTo(x, camY); ctx.lineTo(x, camY + H); }
    for (y = Math.floor(camY / step) * step; y < camY + H; y += step) { ctx.moveTo(camX, y); ctx.lineTo(camX + W, y); }
    ctx.stroke();
    ctx.strokeStyle = '#6a3448'; ctx.lineWidth = 6;
    ctx.strokeRect(0, 0, g.arena, g.arena);

    // Auras under everything.
    p.abilities.forEach(function (a) {
      if (a.def.kind !== 'aura') return;
      ctx.globalAlpha = 0.16;
      circle(ctx, p.x, p.y, a.stats.radius, a.def.color);
      ctx.globalAlpha = 1;
    });

    // Experience gems.
    ctx.fillStyle = '#5fe0d0';
    g.gems.forEach(function (gem) {
      if (!visible(gem.x, gem.y, 6)) return;
      var s = gem.v >= 5 ? 6 : 4;
      ctx.beginPath();
      ctx.moveTo(gem.x, gem.y - s); ctx.lineTo(gem.x + s, gem.y); ctx.lineTo(gem.x, gem.y + s); ctx.lineTo(gem.x - s, gem.y);
      ctx.fill();
    });

    // Enemies.
    g.enemies.forEach(function (e) {
      if (!visible(e.x, e.y, e.r)) return;
      circle(ctx, e.x, e.y, e.r, e.flash > 0 ? '#ffffff' : e.type.color);
      if (e.hp < e.maxHp && e.r >= 20) bar(ctx, e.x - e.r, e.y - e.r - 8, e.r * 2, 4, e.hp / e.maxHp, '#e05060');
    });

    // Projectiles and spinning blades.
    g.projectiles.forEach(function (pr) { circle(ctx, pr.x, pr.y, pr.r, pr.color); });
    p.abilities.forEach(function (a) {
      if (a.def.kind !== 'orbit') return;
      a.blades.forEach(function (b) { if (b) circle(ctx, b.x, b.y, a.stats.size, a.def.color); });
    });

    // Short-lived effects.
    g.effects.forEach(function (fx) {
      var k = fx.ttl / fx.max;
      ctx.globalAlpha = k;
      if (fx.kind === 'ring') {
        ctx.strokeStyle = fx.color; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(fx.x, fx.y, fx.r * (1.1 - k * 0.3), 0, TAU); ctx.stroke();
      } else if (fx.kind === 'bolt') {
        ctx.strokeStyle = fx.color; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(fx.x + 6, fx.y - 220); ctx.lineTo(fx.x - 8, fx.y - 90); ctx.lineTo(fx.x + 5, fx.y - 40); ctx.lineTo(fx.x, fx.y); ctx.stroke();
        circle(ctx, fx.x, fx.y, fx.r * (1 - k * 0.5), fx.color);
      }
      ctx.globalAlpha = 1;
    });

    // Player.
    circle(ctx, p.x, p.y, p.r + 3, '#0b0c10');
    circle(ctx, p.x, p.y, p.r, p.hurt > 0 ? '#ffffff' : p.char.color);
    ctx.restore();

    // ---- HUD ----
    var need = L.xpToNext(p.level);
    bar(ctx, 0, 0, W, 10, p.xp / need, '#5fe0d0');
    ctx.font = '600 16px system-ui, sans-serif';
    ctx.fillStyle = '#e8e8ee';
    ctx.textAlign = 'left';
    ctx.fillText('Nivel ' + p.level, 16, 36);
    bar(ctx, 16, 46, 220, 14, p.hp / p.stats.maxHp, '#e05060');
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillStyle = '#e8e8ee'; // bar() leaves its own color behind
    ctx.fillText(Math.ceil(p.hp) + ' / ' + Math.round(p.stats.maxHp), 22, 57);
    ctx.textAlign = 'center';
    ctx.font = '700 26px system-ui, sans-serif';
    ctx.fillText(clock(g.time), W / 2, 44);
    ctx.textAlign = 'right';
    ctx.font = '600 16px system-ui, sans-serif';
    ctx.fillText('Bajas: ' + g.kills, W - 16, 36);

    // Owned abilities and passives, bottom left.
    ctx.textAlign = 'left';
    ctx.font = '13px system-ui, sans-serif';
    var rows = p.abilities.map(function (a) { return { name: a.def.name, level: a.level, color: a.def.color }; })
      .concat(p.passives.map(function (ps) { return { name: ps.def.name, level: ps.level, color: '#ffd27a' }; }));
    rows.forEach(function (r, i) {
      var yy = H - 16 - (rows.length - 1 - i) * 20;
      circle(ctx, 22, yy - 4, 6, r.color);
      ctx.fillStyle = '#c4c6d2';
      ctx.fillText(r.name + '  ' + r.level, 34, yy);
    });
  };
})(this.Lluvia = this.Lluvia || {});
