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

  // m (optional): the match, for lives of the others and the standings.
  function hearts(n) { var s = ''; for (var i = 0; i < n; i++) s += '♥'; return s; }

  // Everyone's position: name, lives and level. Highlights you; those out show their place.
  function standings(ctx, m, W) {
    var rows = L.standings(m), x = W - 16, y = 84;
    ctx.fillStyle = 'rgba(14, 15, 20, 0.7)';
    ctx.fillRect(x - 196, y - 17, 206, rows.length * 18 + 8);
    ctx.textAlign = 'right';
    ctx.font = '13px system-ui, sans-serif';
    rows.forEach(function (pl, i) {
      var g = pl.game, yy = y + i * 18;
      if (pl.isHuman) { ctx.fillStyle = 'rgba(143, 180, 255, 0.15)'; ctx.fillRect(x - 190, yy - 13, 194, 17); }
      ctx.fillStyle = pl.out ? '#5d6070' : pl.isHuman ? '#8fb4ff' : '#c4c6d2';
      var right = pl.out ? pl.place + '.º' : 'nv ' + g.player.level;
      ctx.fillText(right, x, yy);
      ctx.fillStyle = pl.out ? '#5d6070' : '#ff6b81';
      ctx.fillText(pl.out ? '' : hearts(g.lives), x - 48, yy);
      ctx.fillStyle = pl.out ? '#5d6070' : g.player.char.color;
      ctx.fillText((i + 1) + '. ' + pl.name, x - 92, yy);
    });
  }

  // In your arena: who is dueling right now, or when the next duel comes.
  function duelStatus(ctx, m) {
    ctx.textAlign = 'left';
    ctx.font = '600 13px system-ui, sans-serif';
    if (m.duel) {
      var d = m.duel, F = d.fighters;
      ctx.fillStyle = '#ffd27a';
      ctx.fillText('Duelo: ' + d.players[0].name + ' vs ' + d.players[1].name + ' — ' + d.rule.name, 16, 84);
      bar(ctx, 16, 90, 105, 6, F[0].hp / F[0].maxHp, F[0].type.color);
      bar(ctx, 131, 90, 105, 6, F[1].hp / F[1].maxHp, F[1].type.color);
      var mine = d.betting && d.betting.byPlayer[m.human.index];
      if (mine && mine.side !== -1) {
        ctx.fillStyle = '#c4c6d2';
        ctx.fillText('Tu apuesta: ' + mine.real + ' oro' + (mine.free ? ' + ' + mine.free + ' gratis' : '') + ' a ' + d.players[mine.side].name, 16, 112);
      }
    } else if (m.betting) {
      ctx.fillStyle = '#ffd27a';
      ctx.fillText('Duelo en ' + Math.ceil(m.betting.endsAt - m.time) + ' s: ' + m.betting.pair[0].name + ' vs ' + m.betting.pair[1].name + ' — ' + m.betting.rule.name, 16, 84);
    } else if (!m.over) {
      ctx.fillStyle = '#aab';
      var left = Math.max(0, m.nextDuel - m.time);
      ctx.fillText((m.final ? 'Duelo final en ' : 'Próximo duelo en ') + clock(left), 16, 84);
    }
  }

  // Betting panel at the bottom while bets are open and you are not fighting.
  function betPanel(ctx, m, W, H) {
    var b = m.betting, mine = b && b.byPlayer[m.human.index];
    if (!mine) return;
    var odds = L.betOdds(b), w = Math.min(560, W - 32), x = (W - w) / 2, y = H - 150, h = 96;
    ctx.fillStyle = 'rgba(14, 15, 20, 0.88)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#ffd27a'; ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd27a';
    ctx.font = '700 15px system-ui, sans-serif';
    ctx.fillText('APUESTAS — cierran en ' + Math.ceil(b.endsAt - m.time) + ' s  ·  ' + b.rule.name, W / 2, y + 22);
    [0, 1].forEach(function (side) {
      var pl = b.pair[side], cx = x + w * (side ? 0.75 : 0.25), chosen = mine.side === side, locked = mine.side !== -1 && !chosen;
      ctx.fillStyle = locked ? '#5d6070' : pl.game.player.char.color;
      ctx.font = '700 16px system-ui, sans-serif';
      ctx.fillText((side ? 'E' : 'Q') + ': ' + pl.name + (chosen ? '  ✓' : ''), cx, y + 48);
      ctx.fillStyle = locked ? '#5d6070' : '#c4c6d2';
      ctx.font = '13px system-ui, sans-serif';
      var mult = odds.mult[side] ? '×' + L.formatNumber(odds.mult[side]) : 'nadie todavía';
      ctx.fillText('nivel ' + pl.game.player.level + ' · pozo ' + odds.totals[side] + ' · paga ' + mult, cx, y + 68);
    });
    ctx.fillStyle = '#e8e8ee';
    ctx.font = '13px system-ui, sans-serif';
    var line = mine.side === -1
      ? 'Cada toque apuesta ' + Math.max(1, Math.floor(mine.cap * L.data.bets.pressShare)) + ' oro (hasta ' + mine.cap + '). La primera suma ' + b.free + ' gratis.'
      : 'Apostaste ' + mine.real + ' oro + ' + mine.free + ' gratis a ' + b.pair[mine.side].name + (mine.real < mine.cap ? '. Tocá de nuevo para subir.' : '. Llegaste al límite.');
    ctx.fillText(line, W / 2, y + 88);
  }

  // The duel arena, when you are one of the two fighters. Fits the whole arena on screen.
  L.renderDuel = function (d, ctx, W, H) {
    var size = d.size, top = 96, scale = Math.min(W / (size + 40), (H - top - 20) / (size + 40));
    var ox = (W - size * scale) / 2, oy = top + (H - top - size * scale) / 2;
    ctx.fillStyle = '#100d14';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#1b1622';
    ctx.fillRect(0, 0, size, size);
    if (d.rule.shrink) {
      ctx.fillStyle = 'rgba(255, 90, 40, 0.28)';
      ctx.beginPath();
      ctx.rect(0, 0, size, size);
      ctx.arc(size / 2, size / 2, d.lava, 0, TAU, true);
      ctx.fill();
      ctx.strokeStyle = '#ff7a3d'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(size / 2, size / 2, d.lava, 0, TAU); ctx.stroke();
    }
    ctx.strokeStyle = '#8a5a9e'; ctx.lineWidth = 6;
    ctx.strokeRect(0, 0, size, size);

    d.fighters.forEach(function (f, i) {
      var v = d.views[i];
      f.abilities.forEach(function (a) {
        if (a.def.kind === 'aura') { ctx.globalAlpha = 0.16; circle(ctx, f.x, f.y, a.stats.radius, a.def.color); ctx.globalAlpha = 1; }
      });
      v.projectiles.forEach(function (pr) { circle(ctx, pr.x, pr.y, pr.r, pr.color); });
      f.abilities.forEach(function (a) {
        if (a.def.kind === 'orbit') a.blades.forEach(function (b) { if (b) circle(ctx, b.x, b.y, a.stats.size, a.def.color); });
      });
    });
    d.effects.forEach(function (fx) {
      var k = Math.max(0, fx.ttl / fx.max);
      ctx.globalAlpha = k;
      ctx.strokeStyle = fx.color; ctx.lineWidth = 4;
      if (fx.kind === 'chain') { ctx.beginPath(); fx.pts.forEach(function (pt) { ctx.moveTo(fx.x, fx.y); ctx.lineTo(pt.x, pt.y); }); ctx.stroke(); }
      else if (fx.kind === 'bolt') circle(ctx, fx.x, fx.y, fx.r * (1 - k * 0.5), fx.color);
      else { ctx.beginPath(); ctx.arc(fx.x, fx.y, fx.r * (1.1 - k * 0.3), 0, TAU); ctx.stroke(); }
      ctx.globalAlpha = 1;
    });
    ctx.textAlign = 'center';
    ctx.font = '600 22px system-ui, sans-serif';
    d.fighters.forEach(function (f) {
      circle(ctx, f.x, f.y, f.r + 4, '#0b0c10');
      circle(ctx, f.x, f.y, f.r, f.flash > 0 ? '#ffffff' : f.burnTtl > 0 ? '#ff8a3d' : f.type.color);
      ctx.fillStyle = '#e8e8ee';
      ctx.fillText(f.type.name, f.x, f.y - f.r - 22);
      bar(ctx, f.x - 40, f.y - f.r - 16, 80, 8, f.hp / f.maxHp, '#e05060');
    });
    ctx.restore();

    // Header: names and health, the rule, time left.
    var F = d.fighters, bw = Math.min(260, W / 2 - 40);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd27a';
    ctx.font = '800 22px system-ui, sans-serif';
    ctx.fillText('DUELO — ' + d.rule.name, W / 2, 30);
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillStyle = '#c4c6d2';
    ctx.fillText(d.rule.desc + '   ·   quedan ' + Math.max(0, Math.ceil(L.data.duels.maxTime - d.time)) + ' s', W / 2, 50);
    ctx.font = '600 15px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = F[0].type.color;
    ctx.fillText(F[0].type.name, 20, 72);
    bar(ctx, 20, 78, bw, 10, F[0].hp / F[0].maxHp, '#e05060');
    ctx.textAlign = 'right';
    ctx.fillStyle = F[1].type.color;
    ctx.fillText(F[1].type.name, W - 20, 72);
    bar(ctx, W - 20 - bw, 78, bw, 10, F[1].hp / F[1].maxHp, '#e05060');
  };

  L.render = function (g, ctx, W, H, m) {
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

    // Chests: gold-coloured if you can pay, grey if not. The boss chest is free.
    var cost = L.chestCost(g);
    ctx.textAlign = 'center';
    ctx.font = '600 12px system-ui, sans-serif';
    g.chests.forEach(function (ch) {
      if (!visible(ch.x, ch.y, 30)) return;
      var free = ch.kind === 'boss', can = free || g.gold >= cost;
      ctx.fillStyle = free ? '#ff5a5a' : can ? '#d9a441' : '#5b5648';
      ctx.fillRect(ch.x - 16, ch.y - 12, 32, 24);
      ctx.fillStyle = '#0b0c10';
      ctx.fillRect(ch.x - 16, ch.y - 2, 32, 3);
      ctx.fillStyle = can ? '#ffe6a0' : '#9a958a';
      ctx.fillText(free ? 'GRATIS' : cost + ' oro', ch.x, ch.y - 18);
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
      circle(ctx, e.x, e.y, e.r, e.flash > 0 ? '#ffffff' : e.burnTtl > 0 ? '#ff8a3d' : e.type.color);
      if (e.type.boss) { ctx.strokeStyle = '#ffd27a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 4, 0, TAU); ctx.stroke(); }
      if (e.hp < e.maxHp && e.r >= 20 && !e.type.boss) bar(ctx, e.x - e.r, e.y - e.r - 8, e.r * 2, 4, e.hp / e.maxHp, '#e05060');
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
      } else if (fx.kind === 'chain') {
        ctx.strokeStyle = fx.color; ctx.lineWidth = 2;
        ctx.beginPath();
        fx.pts.forEach(function (pt) { ctx.moveTo(fx.x, fx.y); ctx.lineTo(pt.x, pt.y); });
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    });

    // Player (blinking while invulnerable, hidden while down).
    if (g.respawn <= 0) {
      if (p.invuln > 0 && Math.floor(g.time * 10) % 2) ctx.globalAlpha = 0.4;
      circle(ctx, p.x, p.y, p.r + 3, '#0b0c10');
      circle(ctx, p.x, p.y, p.r, p.hurt > 0 ? '#ffffff' : p.char.color);
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    if (g.respawn > 0) {
      ctx.fillStyle = 'rgba(10, 11, 15, 0.55)';
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff6b81';
      ctx.font = '700 30px system-ui, sans-serif';
      ctx.fillText('Perdiste una vida', W / 2, H / 2 - 20);
      ctx.fillStyle = '#e8e8ee';
      ctx.font = '600 18px system-ui, sans-serif';
      ctx.fillText('Volvés en ' + Math.ceil(g.respawn) + '…  (también perdiste la mitad del oro)', W / 2, H / 2 + 14);
    }

    // ---- HUD ----
    var need = L.xpToNext(p.level);
    bar(ctx, 0, 0, W, 10, p.xp / need, '#5fe0d0');
    ctx.font = '600 16px system-ui, sans-serif';
    ctx.fillStyle = '#e8e8ee';
    ctx.textAlign = 'left';
    ctx.fillText('Nivel ' + p.level, 16, 36);
    ctx.fillStyle = '#ff6b81';
    ctx.fillText(hearts(g.lives), 100, 36);
    ctx.fillStyle = '#e8e8ee';
    bar(ctx, 16, 46, 220, 14, p.hp / p.stats.maxHp, '#e05060');
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillStyle = '#e8e8ee'; // bar() leaves its own color behind
    ctx.fillText(Math.ceil(p.hp) + ' / ' + Math.round(p.stats.maxHp), 22, 57);
    ctx.textAlign = 'center';
    ctx.font = '700 26px system-ui, sans-serif';
    ctx.fillText(clock(g.time), W / 2, 44);
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.fillStyle = '#ff9a7a';
    ctx.fillText('Dificultad ' + L.difficulty(g), W / 2, 64);
    ctx.textAlign = 'right';
    ctx.font = '600 16px system-ui, sans-serif';
    ctx.fillStyle = '#e8e8ee';
    ctx.fillText('Bajas: ' + g.kills, W - 16, 36);
    ctx.fillStyle = '#ffd27a';
    ctx.fillText('Oro: ' + g.gold, W - 16, 58);

    if (m) { standings(ctx, m, W); duelStatus(ctx, m); betPanel(ctx, m, W, H); }

    // Boss health bar.
    if (g.boss && !g.boss.dead) {
      var bw = Math.min(420, W - 40);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd27a';
      ctx.font = '700 13px system-ui, sans-serif';
      ctx.fillText(g.boss.type.name, W / 2, 86);
      bar(ctx, W / 2 - bw / 2, 92, bw, 10, g.boss.hp / g.boss.maxHp, '#d4344f');
    }

    // Arrows at the screen edge pointing to the three closest chests you can't see.
    var off = g.chests.filter(function (ch) { return !visible(ch.x, ch.y, -pad); })
      .sort(function (a, b) { return Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y); })
      .slice(0, 3);
    off.forEach(function (ch) {
      var ang = Math.atan2(ch.y - p.y, ch.x - p.x), cx = W / 2, cy = H / 2;
      var t = Math.min((W / 2 - 30) / Math.abs(Math.cos(ang) || 1e-6), (H / 2 - 30) / Math.abs(Math.sin(ang) || 1e-6));
      var ax = cx + Math.cos(ang) * t, ay = cy + Math.sin(ang) * t;
      ctx.save();
      ctx.translate(ax, ay); ctx.rotate(ang);
      ctx.fillStyle = ch.kind === 'boss' ? '#ff5a5a' : g.gold >= cost ? '#d9a441' : '#6b6658';
      ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-8, -8); ctx.lineTo(-8, 8); ctx.fill();
      ctx.restore();
    });

    // Messages (new item, boss), newest at the bottom.
    ctx.textAlign = 'center';
    ctx.font = '600 15px system-ui, sans-serif';
    g.toasts.forEach(function (tt, i) {
      ctx.globalAlpha = Math.min(1, tt.ttl);
      ctx.fillStyle = tt.color;
      ctx.fillText(tt.text, W / 2, H - 40 - (g.toasts.length - 1 - i) * 22);
    });
    ctx.globalAlpha = 1;

    // Items, bottom right: name and copies, coloured by rarity.
    ctx.textAlign = 'right';
    ctx.font = '13px system-ui, sans-serif';
    p.itemOrder.forEach(function (id, i) {
      var def = L.findItem(id);
      ctx.fillStyle = L.data.rarities[def.rarity].color;
      ctx.fillText(def.name + (p.items[id] > 1 ? ' ×' + p.items[id] : ''), W - 16, H - 16 - (p.itemOrder.length - 1 - i) * 18);
    });

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
