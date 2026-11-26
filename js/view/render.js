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
  // Where the player looks: where they aim, or the way they face.
  function aimOf(p) { return p.aim !== undefined ? p.aim : Math.atan2(p.dirY || 0, p.dirX || 1); }

  // The half-light: the screen darkened except inside the edge of what you see (L.sightPolygon), soft at the edge.
  var shadeCv = null;
  function drawShade(ctx, poly, camX, camY, W, H) {
    var D = L.data.sight;
    if (!shadeCv) shadeCv = document.createElement('canvas');
    if (shadeCv.width !== W || shadeCv.height !== H) { shadeCv.width = W; shadeCv.height = H; }
    var x = shadeCv.getContext('2d');
    x.globalCompositeOperation = 'source-over';
    x.clearRect(0, 0, W, H);
    x.fillStyle = 'rgba(6,6,9,' + D.shade + ')';
    x.fillRect(0, 0, W, H);
    x.globalCompositeOperation = 'destination-out';
    if (D.soft) x.filter = 'blur(' + D.soft + 'px)';
    x.fillStyle = '#000';
    x.beginPath();
    poly.forEach(function (q, i) { if (i) x.lineTo(q[0] - camX, q[1] - camY); else x.moveTo(q[0] - camX, q[1] - camY); });
    x.closePath(); x.fill();
    x.filter = 'none';
    ctx.drawImage(shadeCv, 0, 0);
  }

  // The hand weapon out (js/melee.js), bottom right: its name, how worn it is, and a small sight.
  function meleeHud(ctx, g, p, W, H) {
    var C = L.data.look.hud, def = L.mainDef(p), sl = L.mainSlot(p), x = W - 20, y = H - 26, h = p.hands || {};
    // What each button does: the left one, your right hand; the right one, your left hand (or readies a long blow).
    var nameOf = function (s) { var q = h[s]; return !q ? 'Puño' : q.id.indexOf('w:') === 0 ? L.meleeDef(q.id.slice(2)).name : L.slotName(q); };
    var text = h.l && h.l === h.r ? def.name + ' (dos manos)' : 'Clic izq.: ' + nameOf('r') + ' · Clic der.: ' + nameOf('l');
    ctx.textAlign = 'right'; ctx.font = '700 15px system-ui, sans-serif'; ctx.fillStyle = C.ammo;
    ctx.fillText(text, x, y);
    ctx.font = '600 11px system-ui, sans-serif'; ctx.fillStyle = C.dim;
    ctx.fillText((L.data.skills.list[def.skill] || {}).name + ' ' + L.skillLevel(p, def.skill) + ' · 1: pistola · 2: manos', x, y - 20);
    if (def.dur && sl) bar(ctx, x - 120, y + 7, 120, 3, sl.dur / def.dur, sl.dur / def.dur < 0.25 ? C.low : C.ammo);
    var ms = L.input && L.input.mouse;
    if (ms && !L.ui.current) { ctx.fillStyle = 'rgba(217,207,166,0.8)'; ctx.beginPath(); ctx.arc(ms.x, ms.y, 2.5, 0, Math.PI * 2); ctx.fill(); }
  }

  // One slot's thing: a colored mark (a slanted bar for a weapon) and how many.
  function slotIcon(ctx, sl, x, y, sz, C) {
    if (sl.id === 'gun') { ctx.fillStyle = '#151515'; ctx.fillRect(x + 4, y + sz / 2 - 3, sz - 8, 5); ctx.fillRect(x + 5, y + sz / 2, 4, 7); return; } // the pistol
    var wd = sl.id.indexOf('w:') === 0 ? L.meleeDef(sl.id.slice(2)) : null;
    ctx.fillStyle = wd ? wd.color : sl.id.indexOf('r:') === 0 ? L.clothColor(sl.id) : L.data.loot.items[sl.id].color;
    if (wd) { ctx.save(); ctx.translate(x + sz / 2, y + sz / 2); ctx.rotate(-0.7); ctx.fillRect(-sz * 0.38, -2, sz * 0.76, 4); ctx.restore(); }
    else ctx.fillRect(x + 5, y + 4, sz - 10, sz - 12);
    if (!wd) { ctx.fillStyle = C.text; ctx.font = '600 9px system-ui, sans-serif'; ctx.textAlign = 'right'; ctx.fillText(sl.n, x + sz - 2, y + sz - 2); }
  }

  // What you carry (js/loot.js), bottom left: a slot per item with how many; and, next to you, what E would search
  // and how far along the search is.
  function packHud(ctx, g, p, camX, camY, W, H) {
    var C = L.data.look.hud, Dl = L.data.loot, sz = 22, x = 18, y0 = H - 18 - sz;
    ctx.globalAlpha = 0.85;
    var box = function (sx, sl) {
      ctx.fillStyle = 'rgba(12,11,9,0.62)'; ctx.fillRect(sx, y0, sz, sz);
      ctx.strokeStyle = 'rgba(207,198,168,0.22)'; ctx.lineWidth = 1; ctx.strokeRect(sx + 0.5, y0 + 0.5, sz - 1, sz - 1);
      if (sl) slotIcon(ctx, sl, sx, y0, sz, C);
    };
    // Your two hands (left, right): a long weapon spans both; with the gun out they wait aside (dimmed).
    var h = p.hands || {};
    ctx.textAlign = 'left'; ctx.fillStyle = C.dim; ctx.font = '600 10px system-ui, sans-serif';
    ctx.fillText('Manos', x, y0 - 5);
    if (p.hand === 'gun') ctx.globalAlpha = 0.4;
    box(x, h.l === h.r ? null : h.l); box(x + sz + 3, h.l === h.r ? null : h.r);
    if (h.l && h.l === h.r) { ctx.save(); ctx.translate(x + sz + 1.5, y0 + sz / 2); ctx.rotate(-0.35); ctx.fillStyle = L.mainDef(p).color; ctx.fillRect(-sz * 0.85, -2, sz * 1.7, 4); ctx.restore(); }
    ctx.globalAlpha = 0.85;
    x += 2 * (sz + 3) + 12;
    // Food and water as the time they last you (the user: not as loose cans).
    var st = L.suppliesTime(g);
    ctx.fillStyle = C.dim; ctx.fillText('Agua para ' + st.agua + ' h · comida para ' + st.comida + ' h', 18, y0 - 33);
    // Each place you carry things (pockets, riñonera, bolso, mochila), its name over its slots.
    g.pack.places.forEach(function (pl) {
      var spec = Dl.containers[pl.id];
      ctx.textAlign = 'left'; ctx.fillStyle = C.dim; ctx.font = '600 10px system-ui, sans-serif';
      ctx.fillText(spec.name, x, y0 - 5);
      for (var i = 0; i < spec.slots; i++) box(x + i * (sz + 3), pl.slots[i]);
      x += spec.slots * (sz + 3) + 12;
    });
    ctx.textAlign = 'left'; ctx.fillStyle = C.dim; ctx.font = '600 10px system-ui, sans-serif';
    ctx.fillText('I inventario · K estado · E revisar/juntar/trabar · X destrabar · H venda · Z dormir · Tab fabricar', 18, y0 - 19);
    ctx.globalAlpha = 1;
    if (g.bodyTarget >= 0) {
      ctx.textAlign = 'center'; ctx.font = '600 11px system-ui, sans-serif'; ctx.fillStyle = C.text;
      ctx.fillText('E: recuperar tus cosas', p.x - camX, p.y - camY - p.r - 14);
    }
    // Something on the floor within reach (js/loot.js): E picks it up.
    if (g.groundTarget >= 0 && g.ground[g.groundTarget]) {
      ctx.textAlign = 'center'; ctx.font = '600 11px system-ui, sans-serif'; ctx.fillStyle = C.text;
      ctx.fillText('E: juntar ' + L.slotName(g.ground[g.groundTarget].slot), p.x - camX, p.y - camY - p.r - 14);
    }
    if (g.talkTarget) {
      var tq = g.talkTarget;
      ctx.textAlign = 'center'; ctx.font = '600 11px system-ui, sans-serif'; ctx.fillStyle = C.text;
      ctx.fillText((tq.door && g.barricades[tq.door] ? 'E: golpear y hablar con ' : 'E: hablar con ') + tq.name, p.x - camX, p.y - camY - p.r - 14);
    }
    var tg = g.lootTarget;
    if (tg) {
      var sx = p.x - camX, sy = p.y - camY - p.r - 14;
      ctx.textAlign = 'center'; ctx.font = '600 11px system-ui, sans-serif'; ctx.fillStyle = C.text;
      ctx.fillText(g.search ? 'Revisando...' : tg.seen && g.lootMenu && !tg.fill ? 'E: abrir ' + L.pieceName(tg.t).toLowerCase() : 'E: revisar', sx, sy);
      if (g.search) {
        ctx.strokeStyle = C.ammo; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(p.x - camX, p.y - camY, p.r + 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, g.search.t / Dl.search)); ctx.stroke();
      }
    }
    // At a doorway or a window (js/barricade.js): E nails a plank or drags furniture, X undoes; or what is missing.
    var bt = g.barTarget;
    if (bt && g.bodyTarget < 0 && g.groundTarget < 0) {
      var by = p.y - camY - p.r - (tg ? 28 : 14), parts = [];
      if (bt.add) parts.push('E: ' + bt.addLabel);
      if (bt.rem) parts.push('X: ' + bt.remLabel);
      ctx.textAlign = 'center'; ctx.font = '600 11px system-ui, sans-serif';
      if (g.barWork) { ctx.fillStyle = C.text; ctx.fillText(/pry|back/.test(g.barWork.key) ? 'Sacando...' : 'Trabando...', p.x - camX, by); }
      else if (parts.length) { ctx.fillStyle = C.text; ctx.fillText(parts.join(' · '), p.x - camX, by); }
      else if (bt.need) { ctx.fillStyle = C.dim; ctx.fillText(bt.need, p.x - camX, by); }
      if (g.barWork) {
        ctx.strokeStyle = '#c9a46a'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(p.x - camX, p.y - camY, p.r + 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, g.barWork.t / g.barWork.need)); ctx.stroke();
      }
    }
  }

  // The quiet HUD of the city (data/look.js, hud): small, muted, top left. Life as a thin bar with your lives as
  // marks under it, the level and its progress as a thinner line.
  function quietHud(ctx, g, p, need) {
    var C = L.data.look.hud, x = 18, y = 20;
    ctx.globalAlpha = 0.85;
    bar(ctx, x, y, 150, 6, p.hp / p.stats.maxHp, C.life);
    // The life the wounds took away (js/health.js): the end of the bar, blocked.
    if (p.capLost > 0) {
      var lost = Math.min(1, p.stats.maxHp - L.lifeCap(g) > 0 ? 1 - L.lifeCap(g) / p.stats.maxHp : 0);
      ctx.fillStyle = 'rgba(60,14,12,0.9)'; ctx.fillRect(x + 150 * (1 - lost), y, 150 * lost, 6);
      ctx.strokeStyle = 'rgba(160,60,50,0.7)'; ctx.lineWidth = 1;
      for (var hx = x + 150 * (1 - lost); hx < x + 150; hx += 4) { ctx.beginPath(); ctx.moveTo(hx, y + 6); ctx.lineTo(hx + 4, y); ctx.stroke(); }
    }
    bar(ctx, x, y + 9, 150, 2, p.xp / need, C.xp);
    if (p.air !== undefined) bar(ctx, x + 156, y, 40, 6, p.air / L.data.melee.air.max, '#8aa7b5'); // your air (js/melee.js)
    // Your energy (js/rest.js): a full bar is 100; after sleeping well fed the extra shows brighter over it.
    if (p.energy !== undefined) {
      var R = L.data.rest;
      bar(ctx, x + 202, y, 40, 6, Math.min(1, p.energy / R.max), p.energy < R.sightLow ? C.low : '#b9a35a');
      if (p.energy > R.max) { ctx.fillStyle = '#f0dc8a'; ctx.fillRect(x + 202, y + 7, 40 * Math.min(1, (p.energy - R.max) / (R.fedMax - R.max)), 2); }
    }
    for (var i = 0; i < g.lives; i++) { ctx.fillStyle = C.life; ctx.fillRect(x + i * 9, y + 16, 6, 6); }
    ctx.font = '600 11px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = C.dim;
    ctx.fillText('Nivel ' + p.level, x + Math.max(3, g.lives) * 9 + 6, y + 22);
    // The clock of the day (js/clock.js) and, if it isn't full or it is on, the flashlight's battery.
    if (L.clockOf) {
      var k = L.clockOf(g), icon = k.phase === 'noche' ? '☾' : k.phase === 'dia' ? '☀' : '◐';
      ctx.fillStyle = C.text;
      ctx.fillText(icon + ' Día ' + k.day + (k.season ? ' · ' + k.season.name : '') + ' · ' + (k.hh < 10 ? '0' : '') + k.hh + ':' + (k.mm < 10 ? '0' : '') + k.mm + (L.weatherName ? ' · ' + L.weatherName(g) : ''), x, y + 38);
      // Your aim (js/skills.js): its level and how far to the next.
      if (L.skillOf && g.night) {
        var sk = L.skillOf(p, 'punteria'), need = L.data.skills.need[sk.level];
        ctx.fillStyle = C.dim; ctx.fillText('Puntería ' + sk.level, x + 250, y + 38);
        if (need) bar(ctx, x + 312, y + 33, 40, 3, sk.xp / need, C.xp);
      }
      // Hunger, thirst and how heavy you go (js/needs.js, js/loot.js).
      if (g.night && p.fed !== undefined) {
        var Nd = L.data.needs, bits = [];
        if (p.watered >= Nd.drink.every) bits.push('Sed');
        if (p.fed >= Nd.eat.every) bits.push('Hambre');
        if (p.unease > 0) bits.push('Malestar ' + p.unease.toFixed(1));
        var over = g.pack ? L.packOver(g) : 0;
        bits.push('Peso ' + L.packWeight(g).toFixed(1) + '/' + L.data.loot.carry.cap + ' kg');
        ctx.fillStyle = p.unease > 0 || over > 0 ? C.low : C.dim;
        ctx.fillText(bits.join(' · '), x, y + 68);
      }
      // How the refuge sees you (js/refuge.js).
      if (g.refuge && g.rep) { ctx.fillStyle = g.rep.catedral < 45 ? C.low : C.dim; var live = (g.people || []).filter(function (q) { return q.mode === 'refuge'; }).length, withYou = (g.people || []).filter(function (q) { return q.mode === 'follow'; }).length;
        ctx.fillText('En ' + g.refuge.name + ' ' + L.repWord(g.rep.catedral) + (live ? ' · viven ' + live : '') + (withYou ? ' · te acompaña' + (withYou > 1 ? 'n ' + withYou : ' 1') : ''), x, y + 113); }
      if (p.faint > 0) { ctx.fillStyle = C.low; ctx.fillText('Desmayado...', x, y + 83); }
      else if (p.energy !== undefined && p.energy < L.data.rest.sightLow && !p.asleep) { ctx.fillStyle = C.low; ctx.fillText('Sueño (Z: dormir)', x, y + 83); }
      // What your body has (js/health.js): K opens the status window.
      if (p.wounds) {
        var hb = [];
        if (L.bleeding(p).length) hb.push('Sangrando');
        if (p.infection) hb.push(p.infection.fever ? 'Fiebre' : 'Infección' + (p.infection.started ? ' ' + p.infection.doses + '/' + p.infection.need : ''));
        if (p.bluntSlow > 0) hb.push('Golpeado');
        if (p.kitT > 0) hb.push('Kit ' + Math.ceil(p.kitT) + ' h');
        if (p.recovering) hb.push('Recuperándote');
        var WS = { helado: 'Helado', frio: 'Frío', calor: 'Calor', muchoCalor: 'Mucho calor' }; // your clothes (js/clothes.js)
        if (p.clothes && WS[p.warmState]) hb.push(WS[p.warmState]);
        if (hb.length) { ctx.fillStyle = L.bleeding(p).length || p.infection || p.warmState === 'helado' ? C.low : C.dim; ctx.fillText(hb.join(' · ') + ' (K: estado)', x, y + 98); }
      }
      else if (p.blocking) { ctx.fillStyle = C.text; ctx.fillText('Cubriéndote', x, y + 83); }
      if (g.weather && L.floodAt(g, p.x, p.y) > 0.05) { ctx.fillStyle = C.dim; ctx.fillText('En el agua: ' + L.floodAt(g, p.x, p.y).toFixed(1) + ' m', x + 120, y + 83); }
      var fl = p.flashlight;
      if (fl && (fl.on || fl.battery < 1 || k.light < 0.5)) {
        ctx.fillStyle = C.dim; ctx.fillText(fl.on ? 'Linterna' : 'Linterna (F)', x, y + 53);
        bar(ctx, x + 62, y + 48, 50, 4, fl.battery, fl.on ? C.ammo : C.dim);
      }
    }
    ctx.globalAlpha = 1;
  }

  function gunHud(ctx, g, W, H) {
    var gun = g.player.gun, mag = L.gunMag(gun), x = W - 20, y = H - 26, C = g.city && L.data.look ? L.data.look.hud : null;
    ctx.textAlign = 'right';
    ctx.font = C ? '700 16px system-ui, sans-serif' : '700 22px system-ui, sans-serif';
    ctx.fillStyle = gun.reload > 0 ? (C ? C.dim : '#9a9db0') : gun.ammo <= mag * 0.25 ? (C ? C.low : '#ff9a7a') : (C ? C.ammo : '#ffe9a8');
    ctx.fillText(gun.reload > 0 ? 'Recargando...' : gun.ammo + ' / ' + mag + (g.pack ? '  ·  ' + L.packCount(g, 'balas') : ''), x, y);
    ctx.font = C ? '600 11px system-ui, sans-serif' : '600 13px system-ui, sans-serif';
    ctx.fillStyle = C ? C.dim : '#c4c6d2';
    ctx.fillText(gun.def.name + (gun.level ? ' +' + gun.level : '') + (C ? '' : ' · R recarga'), x, y - (C ? 20 : 26));
    if (gun.reload > 0) bar(ctx, x - 160, y + 8, 160, C ? 3 : 5, 1 - gun.reload / (gun.def.reload * Math.max(0.4, g.player.stats.cooldownMul)), C ? C.ammo : '#ffe9a8');
    var ms = L.input && L.input.mouse;
    if (ms && !L.ui.current) {
      // The sight's circle shows where the bullets may go: it closes while you aim (js/skills.js).
      var cr = 9;
      if (g.night && g.player.spread !== undefined) cr = Math.max(5, Math.hypot(ms.x - W / 2, ms.y - H / 2) * Math.tan((gun.def.spread + g.player.spread) / 2));
      ctx.strokeStyle = C ? (g.player.aiming ? 'rgba(230,220,180,0.95)' : 'rgba(217,207,166,0.75)') : 'rgba(255,233,168,0.9)'; ctx.lineWidth = C ? 1.5 : 2;
      ctx.beginPath(); ctx.arc(ms.x, ms.y, cr, 0, Math.PI * 2);
      ctx.moveTo(ms.x - cr - 6, ms.y); ctx.lineTo(ms.x - cr + 4, ms.y); ctx.moveTo(ms.x + cr - 4, ms.y); ctx.lineTo(ms.x + cr + 6, ms.y);
      ctx.moveTo(ms.x, ms.y - cr - 6); ctx.lineTo(ms.x, ms.y - cr + 4); ctx.moveTo(ms.x, ms.y + cr - 4); ctx.lineTo(ms.x, ms.y + cr + 6);
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

  // The black barrier up close (js/barrier.js): its edge breathes, a violet glow that comes and goes, with wisps.
  function drawBarrier(ctx, P, camX, camY, W, H, t, s) {
    var pad = 4 * s, x0 = camX - pad, y0 = camY - pad, x1 = camX + W + pad, y1 = camY + H + pad;
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (var i = 0, j = P.length - 1; i < P.length; j = i++) {
      var a = P[j], b = P[i];
      if (Math.max(a[0], b[0]) < x0 || Math.min(a[0], b[0]) > x1 || Math.max(a[1], b[1]) < y0 || Math.min(a[1], b[1]) > y1) continue;
      for (var w = 0; w < 3; w++) {
        var pulse = 0.5 + 0.5 * Math.sin(t * (1.3 + w * 0.7) + i * 1.7 + w);
        ctx.strokeStyle = 'rgba(' + (90 + w * 30) + ',50,' + (150 + w * 20) + ',' + (0.08 + 0.12 * pulse) + ')';
        ctx.lineWidth = (4 - w * 1.4) * s;
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      }
      // Wisps of black smoke rising from the wall.
      var len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.min(5000, Math.floor(len / (1.2 * s)));
      // Only the stretch of the wall on screen: where the screen's corners fall along it.
      var tmin = 1, tmax = 0, ddx = b[0] - a[0], ddy = b[1] - a[1], l2 = len * len || 1;
      [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].forEach(function (c) { var tt = ((c[0] - a[0]) * ddx + (c[1] - a[1]) * ddy) / l2; tmin = Math.min(tmin, tt); tmax = Math.max(tmax, tt); });
      var k0 = Math.max(0, Math.floor(tmin * n) - 1), k1 = Math.min(n, Math.ceil(tmax * n) + 1);
      for (var k = k0; k < k1; k++) {
        var f = (k + 0.5) / n, ph = (t * 0.35 + k * 0.618 + i * 0.37) % 1, x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f;
        if (x < x0 || x > x1 || y < y0 || y > y1) continue;
        ctx.fillStyle = 'rgba(10,6,18,' + (0.55 * (1 - ph)) + ')';
        ctx.beginPath(); ctx.arc(x + Math.sin(ph * 6 + k) * 0.3 * s, y - ph * 2 * s, (0.25 + ph * 0.6) * s, 0, TAU); ctx.fill();
      }
    }
    ctx.restore();
  }

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

    if (g.city) {
      g.city._searched = g.searched || null; g.city._leftover = g.leftover || null; // searched furniture looks emptied
      g.city._explored = g.explored || null; // what you saw inside: the rest is hidden (js/explored.js)
      L.drawCity(ctx, g.city, camX, camY, W, H, t);
      if (L.drawFlood) L.drawFlood(ctx, g, camX, camY, W, H); // flood water on the low ground (js/view/weather.js)
      L.drawCityInterior(ctx, g.city, p); // the house you are in, without its roof, on the floor you are on
    } else L.drawFloor(ctx, camX, camY, W, H, g.arena, g.seed, t);

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
    // In the city you only see what is in your cone and not behind a wall (js/sight.js).
    // At night only as far as your light reaches, or where a lamp or a lit house lights it (js/clock.js).
    var reach = g.city && L.sightReach ? L.sightReach(g) : Infinity;
    var sees = g.city && L.canSee && L.data.sight ? function (x, y, fl) {
      if (!L.canSee(g.city, p, aimOf(p), x, y, fl)) return false;
      return Math.hypot(x - p.x, y - p.y) <= reach || (L.lightAt && L.lightAt(g, x, y, fl) > 0.35);
    } : null;
    g.enemies.forEach(function (e) {
      if (!visible(e.x, e.y, e.r)) return;
      if (sees && !sees(e.x, e.y, e.floor)) return;
      // One on another floor (below you or above) shows faded.
      var otherFloor = g.city && (e.floor || 0) !== (p.floor || 0);
      if (otherFloor) ctx.globalAlpha = 0.3;
      else if (e.downT > 0) ctx.globalAlpha = 0.65; // knocked down
      // A zombie that thinks for itself looks where it is going (js/senses.js); the rest look at you.
      if (e.face !== undefined) L.drawCreature(ctx, e, e.x + Math.cos(e.face) * 100, e.y + Math.sin(e.face) * 100, t);
      else L.drawCreature(ctx, e, p.x, p.y, t);
      if (otherFloor || e.downT > 0) ctx.globalAlpha = 1;
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

    // Survivors (js/people.js), where you see them; the name over the ones close by.
    (g.people || []).forEach(function (q) {
      if (q.dead || (q.floor || 0) !== (p.floor || 0) || !visible(q.x, q.y, 30)) return;
      var close = Math.hypot(q.x - p.x, q.y - p.y) < 8 * (g.city ? g.city.scale : 50);
      if (sees && !sees(q.x, q.y, q.floor || 0) && !(close && q.door)) return; // the one behind a door: you hear them
      if (q.dead) {
        ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(1.1);
        ctx.fillStyle = q.coat || '#4d5646'; ctx.beginPath(); ctx.ellipse(0, 0, q.r * 1.4, q.r * 0.6, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#5a1a14'; ctx.beginPath(); ctx.ellipse(-q.r * 0.3, q.r * 0.4, q.r * 0.9, q.r * 0.4, 0.3, 0, TAU); ctx.fill();
        ctx.fillStyle = '#c99b7a'; ctx.beginPath(); ctx.arc(q.r * 1.4, 0, q.r * 0.45, 0, TAU); ctx.fill();
        ctx.restore();
        return;
      }
      L.drawPerson(ctx, q, t, q.flash > 0);
      if (close) { ctx.textAlign = 'center'; ctx.font = '600 11px system-ui, sans-serif'; ctx.fillStyle = q.done ? '#9fc3a0' : '#e8dcb8'; ctx.fillText(q.name, q.x, q.y - q.r - 10); }
    });

    // Mud, projectiles and spinning blades.
    g.enemyShots.forEach(function (s) {
      if (sees && !sees(s.x, s.y, s.floor || 0)) return;
      circle(ctx, s.x, s.y, s.r + 2, s.hail ? '#3a6a8a' : '#2c3318');
      circle(ctx, s.x, s.y, s.r, s.hail ? '#e8f6ff' : '#8aa04a');
    });
    g.projectiles.forEach(function (pr) { L.drawShot(ctx, pr); });
    // Your bodies (js/death.js): where you died, with your things.
    (g.bodies || []).forEach(function (b) {
      if ((b.floor || 0) !== (p.floor || 0) || sees && !sees(b.x, b.y, b.floor || 0)) return;
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(0.6);
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(2, 3, 16, 8, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#3d4434'; ctx.beginPath(); ctx.ellipse(0, 0, 14, 6, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#5a1a14'; ctx.beginPath(); ctx.ellipse(-4, 4, 9, 4, 0.3, 0, TAU); ctx.fill();
      ctx.fillStyle = '#c99b7a'; ctx.beginPath(); ctx.arc(14, 0, 4.5, 0, TAU); ctx.fill();
      ctx.restore();
    });
    // Things on the floor (js/loot.js): what you threw away, where you can see it.
    (g.ground || []).forEach(function (it) {
      if ((it.floor || 0) !== (p.floor || 0) || sees && !sees(it.x, it.y, it.floor || 0)) return;
      var sl = it.slot, wd = sl.id.indexOf('w:') === 0 ? L.meleeDef(sl.id.slice(2)) : null, gs = g.city ? g.city.scale : 50, q = 0.13 * gs;
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(it.x + 2, it.y + 3, q * 1.5, q, 0, 0, TAU); ctx.fill();
      if (wd) { ctx.save(); ctx.translate(it.x, it.y); ctx.rotate((it.x * 7 + it.y) % 3); ctx.fillStyle = wd.color; var ln = Math.max(0.25, wd.len || 0.2) * gs; ctx.fillRect(-ln / 2, -2, ln, 4); ctx.restore(); }
      else { ctx.fillStyle = sl.id.indexOf('r:') === 0 ? L.clothColor(sl.id) : L.data.loot.items[sl.id].color; ctx.fillRect(it.x - q, it.y - q, 2 * q, 2 * q); ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1; ctx.strokeRect(it.x - q, it.y - q, 2 * q, 2 * q); }
    });
    // Molotov fires (flickering) and bottles in the air (js/craft.js).
    (g.fires || []).forEach(function (f) {
      if ((f.floor || 0) !== (p.floor || 0)) return;
      var fl = 0.85 + Math.sin(t * 17 + f.x) * 0.1, gr = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * fl);
      gr.addColorStop(0, 'rgba(255,200,90,0.85)'); gr.addColorStop(0.5, 'rgba(230,110,40,0.6)'); gr.addColorStop(1, 'rgba(120,40,10,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * fl, 0, TAU); ctx.fill();
    });
    (g.throws || []).forEach(function (th) {
      var k = Math.min(1, th.t / L.data.craft.molotov.flight), x = th.x + (th.tx - th.x) * k, y = th.y + (th.ty - th.y) * k - Math.sin(k * Math.PI) * 30;
      circle(ctx, x, y, 4, '#6f9a6a'); circle(ctx, x, y - 4, 2.5, '#ffb347');
    });
    drawKit(ctx, p);

    // Buildings standing up, then treetops over the people (see-through around you).
    if (g.city) {
      L.drawCityBuildings(ctx, g.city, camX, camY, W, H);
      L.drawCityOver(ctx, g.city, camX, camY, W, H, p.x, p.y);
    }

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
      if (g.city && L.drawPerson) L.drawPerson(ctx, p, t, p.hurt > 0); else L.drawHero(ctx, p, t, p.hurt > 0);
      ctx.globalAlpha = 1;
    }
    L.fx.draw(ctx, dt);
    ctx.restore();
    if (!g.city) L.drawRain(ctx, W, H, dt, !!g.surge);
    else {
      var poly = sees ? L.sightPolygon(g.city, p, aimOf(p)) : null;
      if (L.drawNight) L.drawNight(ctx, g, p, camX, camY, W, H, poly, t); // night, dusk, dawn and lights (js/view/night.js)
      if (sees) drawShade(ctx, poly, camX, camY, W, H); // half-light outside what you see
      // The black barrier glows through the dark: you see where the city ends from afar (js/barrier.js).
      if (g.barrier && g.barrier.d < Math.max(W, H)) { ctx.save(); ctx.translate(-camX, -camY); drawBarrier(ctx, g.city.border, camX, camY, W, H, t, g.city.scale); ctx.restore(); }
      if (L.drawWeather) L.drawWeather(ctx, g, W, H, dt);  // black rain, fog, lightning (js/view/weather.js)
      // The edges of the screen (docs/CUERPO.md section 5): a red pulse while bleeding without a bandage, a green
      // sickly haze while an infection moves on.
      if (p.wounds && L.bleeding(p).length) {
        var pulse = 0.25 + 0.2 * Math.sin(t * 5), rg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.65);
        rg.addColorStop(0, 'rgba(140,10,10,0)'); rg.addColorStop(1, 'rgba(140,10,10,' + pulse + ')');
        ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
      }
      if (p.infection && (p.infection.fever || p.infection.h > 8)) {
        var k2 = p.infection.fever ? 0.4 : 0.22, gg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.7);
        gg.addColorStop(0, 'rgba(90,120,40,0)'); gg.addColorStop(1, 'rgba(90,120,40,' + (k2 + 0.06 * Math.sin(t * 1.3)) + ')');
        ctx.fillStyle = gg; ctx.fillRect(0, 0, W, H);
      }
      if (p.asleep) {                                        // asleep (js/rest.js): eyes closed, the clock running
        ctx.fillStyle = 'rgba(4,4,8,0.82)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#b9ad86'; ctx.textAlign = 'center'; ctx.font = '600 18px system-ui, sans-serif';
        ctx.fillText(p.asleep.bed ? 'Durmiendo en la cama…' : 'Durmiendo en el piso…', W / 2, H / 2 - 8);
        ctx.font = '13px system-ui, sans-serif'; ctx.fillStyle = '#8d8672';
        ctx.fillText('Energía ' + Math.round(p.energy) + ' · Z para despertarte', W / 2, H / 2 + 16);
      }
      if (L.drawLook) L.drawLook(ctx, W, H, t);        // muted colors, grain and dark corners (data/look.js)
    }

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
    if (g.city) quietHud(ctx, g, p, need);
    else {
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
    }
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
    if (p.gun && p.hand !== 'melee') gunHud(ctx, g, W, H);
    else if (p.hands) meleeHud(ctx, g, p, W, H);
    if (g.pack) packHud(ctx, g, p, camX, camY, W, H);
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
