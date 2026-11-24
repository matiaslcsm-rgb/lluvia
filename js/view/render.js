// Draws your barrio (the arena) and the HUD. Camera follows you. The shapes themselves are in art.js,
// particles and shake in fx.js. L.frameDt (set by main.js) drives the animations.
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
  // Dash trail or beam: a thick line that fades.
  function drawLine(ctx, fx, k) {
    ctx.strokeStyle = fx.color; ctx.lineCap = 'round';
    ctx.lineWidth = fx.w * 2 * (0.4 + 0.6 * k);
    ctx.beginPath(); ctx.moveTo(fx.x, fx.y); ctx.lineTo(fx.x2, fx.y2); ctx.stroke();
    ctx.lineCap = 'butt';
  }

  // Bottom centre: your ulti and whether it is ready.
  function ultiBadge(ctx, p, W, H, y) {
    if (!p.ulti) return;
    var def = p.ulti.def, ready = p.ulti.cd <= 0;
    var text = 'ESPACIO · ' + def.name + (ready ? ' · ¡lista!' : ' · en ' + Math.ceil(p.ulti.cd) + ' s');
    ctx.font = '700 14px system-ui, sans-serif';
    var w = ctx.measureText(text).width + 28;
    ctx.fillStyle = ready ? 'rgba(40, 32, 14, 0.9)' : 'rgba(14, 15, 20, 0.8)';
    ctx.fillRect(W / 2 - w / 2, y - 18, w, 26);
    ctx.strokeStyle = ready ? def.color : '#343846'; ctx.lineWidth = 2;
    ctx.strokeRect(W / 2 - w / 2, y - 18, w, 26);
    ctx.fillStyle = ready ? '#fff2c8' : '#8a8d9a';
    ctx.textAlign = 'center';
    ctx.fillText(text, W / 2, y);
  }
  L.ultiBadge = ultiBadge;

  // Above the ulti: sending Anegados to the leader, its price and whether you can.
  function sendBadge(ctx, m, W, y) {
    L.sendBadgeRect = null;
    if (!m || m.final || m.human.out || m.human.inDuel) return;
    var to = L.sendTarget(m, m.human), why = L.cantSend(m, m.human);
    if (!to) return;
    var text = 'R · Mandar Anegados a ' + to.name + ' · ' + L.sendCost(m.human.game) + ' oro' + (why ? ' (' + why + ')' : '');
    ctx.font = '600 13px system-ui, sans-serif';
    var w = ctx.measureText(text).width + 24;
    ctx.fillStyle = why ? 'rgba(14, 15, 20, 0.7)' : 'rgba(40, 20, 50, 0.9)';
    ctx.fillRect(W / 2 - w / 2, y - 16, w, 22);
    ctx.strokeStyle = why ? '#343846' : '#c9b8ff'; ctx.lineWidth = 1.5;
    ctx.strokeRect(W / 2 - w / 2, y - 16, w, 22);
    ctx.fillStyle = why ? '#8a8d9a' : '#efe6ff';
    ctx.textAlign = 'center';
    ctx.fillText(text, W / 2, y);
    L.sendBadgeRect = { x: W / 2 - w / 2, y: y - 16, w: w, h: 22 };
  }

  // What your abilities leave on the floor or around you: blades, turrets, beams of light.
  function drawKit(ctx, f) {
    f.abilities.forEach(function (a) {
      if (a.def.kind === 'orbit') a.blades.forEach(function (b) { if (b) circle(ctx, b.x, b.y, a.bladeSize || a.stats.size, a.def.color); });
      else if (a.def.kind === 'turret' && a.turrets) a.turrets.forEach(function (t) {
        ctx.fillStyle = '#3a2a1e'; ctx.fillRect(t.x - 10, t.y - 10, 20, 20);
        ctx.fillStyle = a.def.color; ctx.fillRect(t.x - 7, t.y - 7, 14, 14);
        circle(ctx, t.x, t.y, 4, '#ffe0b0');
      });
      else if (a.def.kind === 'sweep' && a.beams) a.beams.forEach(function (b) {
        if (!b) return;
        ctx.globalAlpha = 0.55;
        drawLine(ctx, { x: f.x, y: f.y, x2: b.x2, y2: b.y2, w: b.w / 2, color: a.def.color }, 1);
        ctx.globalAlpha = 1;
      });
    });
  }

  function hearts(n) { var s = ''; for (var i = 0; i < n; i++) s += '♥'; return s; }

  // Everyone's position: name, lives and level. Highlights you; those out show their place.
  // Bottom right: the gun, bullets left and the reload bar. Plus the crosshair at the mouse.
  function gunHud(ctx, g, W, H) {
    var gun = g.player.gun, mag = L.gunMag(gun), x = W - 20, y = H - 26;
    ctx.textAlign = 'right';
    ctx.font = '700 22px system-ui, sans-serif';
    ctx.fillStyle = gun.reload > 0 ? '#9a9db0' : gun.ammo <= mag * 0.25 ? '#ff9a7a' : '#ffe9a8';
    ctx.fillText(gun.reload > 0 ? 'Recargando...' : gun.ammo + ' / ' + mag, x, y);
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.fillStyle = '#c4c6d2';
    ctx.fillText(gun.def.name + (gun.level ? ' +' + gun.level : '') + ' · R recarga', x, y - 26);
    if (gun.reload > 0) bar(ctx, x - 160, y + 8, 160, 5, 1 - gun.reload / (gun.def.reload * Math.max(0.4, g.player.stats.cooldownMul)), '#ffe9a8');
    var ms = L.input && L.input.mouse;
    if (ms && !L.ui.current) {
      ctx.strokeStyle = 'rgba(255,233,168,0.9)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(ms.x, ms.y, 9, 0, Math.PI * 2);
      ctx.moveTo(ms.x - 15, ms.y); ctx.lineTo(ms.x - 5, ms.y); ctx.moveTo(ms.x + 5, ms.y); ctx.lineTo(ms.x + 15, ms.y);
      ctx.moveTo(ms.x, ms.y - 15); ctx.lineTo(ms.x, ms.y - 5); ctx.moveTo(ms.x, ms.y + 5); ctx.lineTo(ms.x, ms.y + 15);
      ctx.stroke();
    }
  }

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
      if (pl === m.rival && !pl.out) { ctx.fillStyle = '#ff6b81'; ctx.textAlign = 'left'; ctx.fillText('⚔', x - 192, yy); ctx.textAlign = 'right'; }
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
  // me: your index among the two fighters (to show your ulti), or -1.
  L.renderDuel = function (d, ctx, W, H, me) {
    var size = d.size, top = 96, scale = Math.min(W / (size + 40), (H - top - 20) / (size + 40));
    var ox = (W - size * scale) / 2, oy = top + (H - top - size * scale) / 2;
    L.duelView = { ox: ox, oy: oy, scale: scale }; // main.js turns the mouse into arena coordinates with it
    ctx.fillStyle = '#100d14';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);
    var t = d.time, dt = L.frameDt || 1 / 60;
    L.drawFloor(ctx, -20, -20, size + 40, size + 40, size, 777, t, '#1d1828');
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

    d.creeps.forEach(function (c) {
      if (c.dead) return;
      var f = d.fighters[0], g2 = d.fighters[1];
      var near = (f.x - c.x) * (f.x - c.x) + (f.y - c.y) * (f.y - c.y) <= (g2.x - c.x) * (g2.x - c.x) + (g2.y - c.y) * (g2.y - c.y) ? f : g2;
      L.drawCreature(ctx, c, near.x, near.y, t);
    });
    d.fighters.forEach(function (f, i) {
      var v = d.views[i];
      f.abilities.forEach(function (a) {
        if (a.def.kind === 'aura') { ctx.globalAlpha = 0.16; circle(ctx, f.x, f.y, a.stats.radius, a.def.color); ctx.globalAlpha = 1; }
      });
      v.projectiles.forEach(function (pr) { L.drawShot(ctx, pr); });
      f.abilities.forEach(function (a) {
      });
      drawKit(ctx, f);
    });
    d.effects.forEach(function (fx) {
      var k = Math.max(0, fx.ttl / fx.max);
      ctx.globalAlpha = k;
      ctx.strokeStyle = fx.color; ctx.lineWidth = 4;
      if (fx.kind === 'chain') { ctx.beginPath(); fx.pts.forEach(function (pt) { ctx.moveTo(fx.x, fx.y); ctx.lineTo(pt.x, pt.y); }); ctx.stroke(); }
      else if (fx.kind === 'line') drawLine(ctx, fx, k);
      else if (fx.kind === 'bolt') circle(ctx, fx.x, fx.y, fx.r * (1 - k * 0.5), fx.color);
      else { ctx.beginPath(); ctx.arc(fx.x, fx.y, fx.r * (1.1 - k * 0.3), 0, TAU); ctx.stroke(); }
      ctx.globalAlpha = 1;
    });
    ctx.textAlign = 'center';
    ctx.font = '600 22px system-ui, sans-serif';
    d.fighters.forEach(function (f) {
      L.drawHero(ctx, f, t, f.flash > 0);
      if (f.stun > 0) { ctx.fillStyle = '#ffd166'; ctx.fillText('✦', f.x, f.y - f.r - 4); }
      ctx.fillStyle = '#e8e8ee';
      ctx.fillText(f.type.name, f.x, f.y - f.r - 22);
      bar(ctx, f.x - 40, f.y - f.r - 16, 80, 8, f.hp / f.maxHp, '#e05060');
    });
    L.fx.draw(ctx, dt);
    if (d.rule.rangeMul) {
      ctx.fillStyle = 'rgba(200, 210, 225, 0.55)';
      ctx.beginPath(); ctx.rect(-20, -20, size + 40, size + 40);
      d.fighters.forEach(function (f) { ctx.moveTo(f.x + 170, f.y); ctx.arc(f.x, f.y, 170, 0, TAU, true); });
      ctx.fill('evenodd');
    }
    if (d.rule.wind) {
      var wa = d.time * 0.35;
      ctx.strokeStyle = 'rgba(220, 235, 255, 0.25)'; ctx.lineWidth = 2; ctx.beginPath();
      for (var w = 0; w < 24; w++) {
        var sx = (w * 137 + d.time * 300 * Math.cos(wa)) % size, sy = (w * 251 + d.time * 300 * Math.sin(wa)) % size;
        sx = (sx + size) % size; sy = (sy + size) % size;
        ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(wa) * 40, sy + Math.sin(wa) * 40);
      }
      ctx.stroke();
    }
    ctx.restore();
    L.drawRain(ctx, W, H, dt, true);

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
    if (me >= 0) ultiBadge(ctx, F[me], W, H, H - 16);
    // Juez del Trueno (final only): a banner when it walks in, and its health bar while it stands.
    if (d.judge && !d.judge.dead) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd27a';
      ctx.font = '600 13px system-ui, sans-serif';
      ctx.fillText('Juez del Trueno', W / 2, 104);
      bar(ctx, W / 2 - 120, 110, 240, 8, d.judge.hp / d.judge.maxHp, '#ffd27a');
    }
    if (d.judgeBanner > 0) {
      ctx.textAlign = 'center';
      ctx.globalAlpha = Math.min(1, d.judgeBanner);
      ctx.fillStyle = '#ffd27a';
      ctx.font = '800 28px system-ui, sans-serif';
      ctx.fillText('¡Entró el Juez del Trueno!', W / 2, H / 2 - 80);
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText('Ataca al que tenga más cerca. Bajarlo cura la mitad de tu vida.', W / 2, H / 2 - 56);
      ctx.globalAlpha = 1;
    }
  };

  L.render = function (g, ctx, W, H, m) {
    ctx.fillStyle = '#14161c';
    ctx.fillRect(0, 0, W, H);
    if (!g) return;
    var dt = L.frameDt || 1 / 60, shake = L.fx.offset(dt);
    var p = g.player, camX = p.x - W / 2 + shake.x, camY = p.y - H / 2 + shake.y;
    var pad = 40, t = g.time;
    function visible(x, y, r) { return x + r > camX - pad && x - r < camX + W + pad && y + r > camY - pad && y - r < camY + H + pad; }

    ctx.save();
    ctx.translate(-camX, -camY);

    if (g.city) L.drawCity(ctx, g.city, camX, camY, W, H, t);
    else L.drawFloor(ctx, camX, camY, W, H, g.arena, g.seed, t);

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
      var free = ch.kind !== 'normal', can = free || g.gold >= cost;
      L.drawChest(ctx, ch, can, t);
      ctx.fillStyle = can ? '#ffe6a0' : '#9a958a';
      ctx.fillText(free ? 'GRATIS' : cost + ' oro', ch.x, ch.y - 20);
    });

    // Lluvia de oro: a golden patch on the ground, coins falling, and the cloud's puffs on top.
    var cl = g.cloud;
    if (cl && visible(cl.x, cl.y, cl.r + 40)) {
      var fade = Math.min(1, cl.life / 2);
      ctx.globalAlpha = (g.underCloud ? 0.22 : 0.14) * fade; circle(ctx, cl.x, cl.y, cl.r, '#ffd27a');
      ctx.globalAlpha = 0.8 * fade; ctx.fillStyle = '#ffd86a';
      for (var ci = 0; ci < 14; ci++) {
        var ca = ci * 2.399, cr = cl.r * Math.sqrt((ci + 0.5) / 14), fall = ((t * 1.3 + ci * 0.37) % 1);
        ctx.fillRect(cl.x + Math.cos(ca) * cr - 2, cl.y + Math.sin(ca) * cr - 40 + fall * 40, 4, 4);
      }
      ctx.globalAlpha = 0.4 * fade;
      for (var pi = 0; pi < 5; pi++) circle(ctx, cl.x + (pi - 2) * cl.r * 0.28, cl.y - cl.r - 30 + Math.abs(pi - 2) * 6, cl.r * 0.2, '#f2d27a');
      ctx.globalAlpha = fade; ctx.fillStyle = '#ffd27a'; ctx.fillText('LLUVIA DE ORO', cl.x, cl.y - cl.r - 62);
      ctx.globalAlpha = 1;
    }

    // Shrines: a stone altar with a glowing top; the active challenge shows its countdown.
    (g.shrines || []).forEach(function (s) {
      if (!visible(s.x, s.y, 40)) return;
      ctx.fillStyle = '#3a3550'; ctx.fillRect(s.x - 18, s.y - 6, 36, 20);
      ctx.fillStyle = '#524a70'; ctx.fillRect(s.x - 14, s.y - 22, 28, 18);
      var glow = { trueno: '#c9b8ff', pozo: '#6fdcd0', mercader: '#ffd27a' }[s.kind];
      ctx.globalAlpha = 0.4 + 0.3 * Math.sin(t * 4); circle(ctx, s.x, s.y - 26, 12, glow); ctx.globalAlpha = 1;
      circle(ctx, s.x, s.y - 26, 6, glow);
      ctx.fillStyle = glow;
      ctx.fillText(s.active ? Math.ceil(s.timer) + ' s' : { trueno: 'DESAFÍO', pozo: 'POZO', mercader: 'MERCADER' }[s.kind], s.x, s.y - 44);
    });

    // Experience gems.
    g.gems.forEach(function (gem) { if (visible(gem.x, gem.y, 8)) L.drawGem(ctx, gem, t); });

    // Enemies.
    g.enemies.forEach(function (e) {
      if (!visible(e.x, e.y, e.r)) return;
      L.drawCreature(ctx, e, p.x, p.y, t);
      if (e.fuse > 0) { ctx.globalAlpha = 0.25; circle(ctx, e.x, e.y, e.type.bomb.radius, '#ff5a3d'); ctx.globalAlpha = 1; }
      if (e.mode === 'wind') {
        // The Leviatán shows where it is about to charge.
        ctx.strokeStyle = 'rgba(255, 90, 60, 0.6)'; ctx.lineWidth = e.r * 1.6; ctx.lineCap = 'round';
        var ca = Math.atan2(p.y - e.y, p.x - e.x);
        ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(ca) * 400, e.y + Math.sin(ca) * 400); ctx.stroke();
        ctx.lineCap = 'butt';
      }
      if (e.hp < e.maxHp && (e.r >= 20 || e.elite) && !e.type.boss) bar(ctx, e.x - e.r, e.y - e.r - 8, e.r * 2, 4, e.hp / e.maxHp, '#e05060');
    });

    // Mud, projectiles and spinning blades.
    g.enemyShots.forEach(function (s) {
      circle(ctx, s.x, s.y, s.r + 2, s.hail ? '#3a6a8a' : '#2c3318');
      circle(ctx, s.x, s.y, s.r, s.hail ? '#e8f6ff' : '#8aa04a');
    });
    g.projectiles.forEach(function (pr) { L.drawShot(ctx, pr); });
    drawKit(ctx, p);

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
      } else if (fx.kind === 'line') {
        drawLine(ctx, fx, k);
      }
      ctx.globalAlpha = 1;
    });

    // Player (blinking while invulnerable, hidden while down).
    if (g.respawn <= 0) {
      if (p.invuln > 0 && Math.floor(g.time * 10) % 2) ctx.globalAlpha = 0.4;
      // Stance items glow while they are on: gold ring when planted (Ancla/Raíz), blue streak when rushing (Racha).
      var st = p.stats, planted = (st.stillDamage || st.stillRegen) ? p.still || 0 : 0, rush = st.rushDamage ? p.rush || 0 : 0;
      if (planted > 0.05) { ctx.globalAlpha = 0.5 * planted; ctx.strokeStyle = '#ffd27a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 10, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
      if (rush > 0.05) { ctx.globalAlpha = 0.45 * rush; ctx.strokeStyle = '#7ad0ff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - (p.dirX || 0) * 40 * rush, p.y - (p.dirY || 0) * 40 * rush); ctx.stroke(); ctx.globalAlpha = 1; }
      // Mastery aura: the rank's color, softly pulsing under you (only looks).
      var aura = L.profile && L.masteryRank(L.profile, p.char.id).rank.color;
      if (aura) { var a0 = ctx.globalAlpha; ctx.globalAlpha = a0 * (0.18 + 0.08 * Math.sin(t * 3)); ctx.fillStyle = aura; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 6, 0, TAU); ctx.fill(); ctx.globalAlpha = a0; }
      L.drawHero(ctx, p, t, p.hurt > 0);
      ctx.globalAlpha = 1;
    }
    L.fx.draw(ctx, dt);
    ctx.restore();
    if (!g.city) L.drawRain(ctx, W, H, dt, !!g.surge);

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
    // Only the map for now (L.data.mode.explore): no clock, difficulty, kills or gold.
    if (!g.explore) {
      ctx.font = '700 26px system-ui, sans-serif';
      ctx.fillText(clock(g.time), W / 2, 44);
      ctx.font = '600 13px system-ui, sans-serif';
      ctx.fillStyle = '#ff9a7a';
      ctx.fillText('Dificultad ' + L.difficulty(g), W / 2, 64);
    }
    if (g.forecast) {
      ctx.font = '600 12px system-ui, sans-serif';
      ctx.fillStyle = g.forecast.color;
      ctx.fillText(g.forecast.name, W / 2, 81);
    }
    if (g.errand) {
      var er = g.errand, have = L.errandProgress(g, er);
      ctx.font = '700 13px system-ui, sans-serif';
      ctx.fillStyle = '#9fe0c0';
      ctx.fillText('Encargo: ' + er.text + (er.goal ? ' (' + Math.min(have, er.goal) + '/' + er.goal + ')' : '') + ' · ' + Math.ceil(Math.max(0, er.timer)) + ' s', W / 2, g.boss && !g.boss.dead ? 122 : 99);
    }
    ctx.textAlign = 'right';
    if (!g.explore) {
      ctx.font = '600 16px system-ui, sans-serif';
      ctx.fillStyle = '#e8e8ee';
      ctx.fillText('Bajas: ' + g.kills, W - 16, 36);
      ctx.fillStyle = '#ffd27a';
      ctx.fillText('Oro: ' + g.gold, W - 16, 58);
    }

    if (m && !m.solo) { standings(ctx, m, W); duelStatus(ctx, m); betPanel(ctx, m, W, H); }
    if (p.gun) gunHud(ctx, g, W, H);
    if (g.city) L.drawMinimap(ctx, g, W);

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

    ultiBadge(ctx, p, W, H, H - 16);
    if (!m.solo) sendBadge(ctx, m, W, H - 44);

    // The touch stick, where your finger is.
    var st = L.input && L.input.stick && L.input.stick();
    if (st) {
      ctx.globalAlpha = 0.3; circle(ctx, st.sx, st.sy, 50, '#9fd8ff');
      ctx.globalAlpha = 0.6; circle(ctx, st.sx + L.clamp(st.x - st.sx, -50, 50), st.sy + L.clamp(st.y - st.sy, -50, 50), 22, '#e8f4ff');
      ctx.globalAlpha = 1;
    }

    // Messages (new item, boss), newest at the bottom.
    ctx.textAlign = 'center';
    ctx.font = '600 15px system-ui, sans-serif';
    g.toasts.forEach(function (tt, i) {
      ctx.globalAlpha = Math.min(1, tt.ttl);
      ctx.fillStyle = tt.color;
      ctx.fillText(tt.text, W / 2, H - 44 - (g.toasts.length - 1 - i) * 22);
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
