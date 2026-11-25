// Art drawn with code: characters, creatures, chests, gems, the flooded floor and the rain. No image files.
// Every shape is a few path operations so hundreds of creatures still draw fast.
(function (L) {
  'use strict';
  var TAU = Math.PI * 2;

  function circle(ctx, x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }

  function eyes(ctx, x, y, r, ang, size) {
    var ex = Math.cos(ang), ey = Math.sin(ang), px = -ey, py = ex, s = size || r * 0.22;
    for (var k = -1; k <= 1; k += 2) {
      var cx = x + ex * r * 0.35 + px * r * 0.32 * k, cy = y + ey * r * 0.35 + py * r * 0.32 * k;
      circle(ctx, cx, cy, s, '#f4f1e8');
      circle(ctx, cx + ex * s * 0.4, cy + ey * s * 0.4, s * 0.5, '#101014');
    }
  }

  function polygon(ctx, x, y, r, ang, pts) {
    ctx.beginPath();
    for (var i = 0; i < pts.length; i++) {
      var a = ang + pts[i][0], d = r * pts[i][1];
      if (i) ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); else ctx.moveTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
    }
    ctx.closePath();
  }

  // ---- Paraguas (the playable characters) ----
  // f: anything with x, y, r, dirX, dirY, char (a player or a duel fighter). t: time, for small animations.
  // You in the city: a person seen from above, facing where you aim. Shoulders and arms, the head with its hair, the
  // gun held in both hands, and the feet stepping when you walk.
  L.drawPerson = function (ctx, f, t, flash) {
    var x = f.x, y = f.y, r = f.r, ang = Math.atan2(f.dirY || 0, f.dirX || 1), moving = 1 - (f.still || 0);
    var coat = flash ? '#ffffff' : '#4d5646', dark = flash ? '#dddddd' : '#2f352b', skin = '#c99b7a', hair = '#2b211a';
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang); // +x: where you face
    // Shadow.
    ctx.globalAlpha = 0.3; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(2, 3, r * 0.9, r * 1.25, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    // Feet, one ahead of the other when walking.
    var step = Math.sin(t * 11) * r * 0.45 * moving;
    ctx.fillStyle = '#1e1f22';
    ctx.beginPath(); ctx.ellipse(step, -r * 0.42, r * 0.38, r * 0.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-step, r * 0.42, r * 0.38, r * 0.2, 0, 0, Math.PI * 2); ctx.fill();
    // Arms reaching forward to the gun.
    ctx.strokeStyle = coat; ctx.lineWidth = r * 0.42; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, -r * 0.8); ctx.lineTo(r * 1.15, -r * 0.12); ctx.moveTo(0, r * 0.8); ctx.lineTo(r * 1.15, r * 0.12); ctx.stroke();
    // A hand weapon out: swung across in front of you while you hit (js/melee.js).
    if (f.hand === 'melee' && f.melee) {
      var wd = L.meleeDef(f.melee.id), k = f.swingT > 0 ? 1 - f.swingT / (f.swingMax || 1) : 0, sw = (k > 0 ? -1 + 2 * k : 0.3) * 0.9;
      var hx = r * 1.05 * Math.cos(sw), hy = r * 1.05 * Math.sin(sw);
      if (wd.len) {
        var lpx = wd.len * 50 * (r / 10) * 0.6; // looks about its size
        ctx.strokeStyle = wd.color; ctx.lineWidth = Math.max(2, r * 0.22); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + Math.cos(sw) * lpx, hy + Math.sin(sw) * lpx); ctx.stroke();
      } else if (k > 0) { ctx.fillStyle = wd.color; ctx.beginPath(); ctx.arc(r * (1 + 0.6 * Math.sin(k * Math.PI)), 0, r * 0.28, 0, Math.PI * 2); ctx.fill(); }
    } else if (f.gun) {
      ctx.fillStyle = '#151515'; ctx.fillRect(r * 1.05, -r * 0.13, r * 0.95, r * 0.26);
      if (f.gun.cd > 1 / f.gun.def.rate - 0.05) { ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(r * 2.15, 0, r * 0.35, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(r * 1.12, 0, r * 0.24, 0, Math.PI * 2); ctx.fill();
    // Shoulders (the torso seen from above).
    ctx.fillStyle = coat; ctx.strokeStyle = dark; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(-r * 0.05, 0, r * 0.55, r * 1.05, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Head: hair, with a bit of face toward the front.
    ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(r * 0.12, 0, r * 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = hair; ctx.beginPath(); ctx.arc(r * 0.02, 0, r * 0.47, Math.PI * 0.42, Math.PI * 1.58); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.0, 0, r * 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };

  L.drawHero = function (ctx, f, t, flash) {
    var c = f.char, x = f.x, y = f.y, r = f.r, ang = Math.atan2(f.dirY || 0, f.dirX || 1);
    var body = flash ? '#ffffff' : c.color;
    // Shadow and the umbrella every Paraguas carries over their head.
    ctx.globalAlpha = 0.35; circle(ctx, x + 3, y + 5, r, '#000'); ctx.globalAlpha = 1;
    switch (c.id) {
      case 'roca':
        ctx.fillStyle = body;
        polygon(ctx, x, y, r * 1.15, ang, [[0.4, 1], [1.3, 0.9], [2.2, 1], [3.1, 0.95], [4.0, 1], [5.1, 0.9]]);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x - r * 0.4, y - r * 0.2); ctx.lineTo(x + r * 0.1, y + r * 0.2); ctx.lineTo(x + r * 0.3, y - r * 0.4); ctx.stroke();
        break;
      case 'filo':
        ctx.fillStyle = 'rgba(159, 227, 255, 0.35)';
        polygon(ctx, x, y, r * 1.5, ang + Math.PI, [[-0.5, 0.9], [0, 1.1], [0.5, 0.9]]); ctx.fill(); // cape
        ctx.fillStyle = body;
        polygon(ctx, x, y, r * 1.2, ang, [[0, 1.2], [2.2, 0.85], [Math.PI, 0.5], [4.08, 0.85]]); ctx.fill();
        break;
      case 'ceniza':
        ctx.strokeStyle = 'rgba(185, 163, 255, ' + (0.35 + 0.25 * Math.sin(t * 4)) + ')'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(x, y, r * 1.45, 0, TAU); ctx.stroke();
        circle(ctx, x, y, r, body);
        circle(ctx, x - Math.cos(ang) * r * 0.25, y - Math.sin(ang) * r * 0.25, r * 0.7, flash ? '#fff' : '#5b4c8a'); // hood
        break;
      case 'musgo':
        circle(ctx, x, y, r, body);
        ctx.fillStyle = flash ? '#fff' : '#3f9b39';
        for (var k = 0; k < 3; k++) {
          var la = ang + Math.PI + (k - 1) * 0.8;
          ctx.beginPath(); ctx.ellipse(x + Math.cos(la) * r * 0.9, y + Math.sin(la) * r * 0.9, r * 0.55, r * 0.25, la, 0, TAU); ctx.fill();
        }
        break;
      case 'marea':
        circle(ctx, x, y, r, body);
        ctx.fillStyle = flash ? '#fff' : '#cfeaff';
        ctx.beginPath(); ctx.arc(x - Math.cos(ang) * r * 0.2, y - Math.sin(ang) * r * 0.2, r * 0.9, ang + 1.9, ang + 4.4); ctx.fill();
        break;
      case 'oxido':
        ctx.fillStyle = body;
        var teeth = [];
        for (var tt = 0; tt < 16; tt++) teeth.push([tt / 16 * TAU, tt % 2 ? 0.95 : 1.15]);
        polygon(ctx, x, y, r, t * 1.5, teeth); ctx.fill();
        circle(ctx, x, y, r * 0.4, flash ? '#fff' : '#5a3a22');
        break;
      case 'faro':
        ctx.globalAlpha = 0.25 + 0.15 * Math.sin(t * 3); circle(ctx, x, y, r * 2, '#ffe08a'); ctx.globalAlpha = 1;
        circle(ctx, x, y, r, body);
        circle(ctx, x, y, r * 0.45, flash ? '#fff' : '#fff8d8');
        break;
      default: // brasa
        circle(ctx, x, y, r, body);
        for (var i = 0; i < 3; i++) {
          var fl = 0.6 + 0.4 * Math.sin(t * 12 + i * 2);
          ctx.fillStyle = i === 1 ? '#ffd166' : '#ff9a3d';
          polygon(ctx, x - Math.cos(ang) * r * 0.5, y - Math.sin(ang) * r * 0.5, r * (0.9 + 0.5 * fl), ang + Math.PI + (i - 1) * 0.5, [[0, 1.1], [0.35, 0.4], [-0.35, 0.4]]);
          ctx.fill();
        }
    }
    eyes(ctx, x, y, r, ang, r * 0.2);
    ctx.strokeStyle = '#0b0c10'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, r + 1, 0, TAU); ctx.stroke();
    if (f.gun) {
      // The gun in your hand, pointing where you aim; a flash right after a shot.
      var gx = x + Math.cos(ang) * r * 0.9, gy = y + Math.sin(ang) * r * 0.9;
      ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + Math.cos(ang) * r * 0.9, gy + Math.sin(ang) * r * 0.9); ctx.stroke();
      if (f.gun.cd > 1 / f.gun.def.rate - 0.05) circle(ctx, gx + Math.cos(ang) * r * 1.9, gy + Math.sin(ang) * r * 1.9, 5, '#fff3b0');
    }
  };

  // A zombie seen from above: shoulders, arms reaching for you, a head. `kind` changes the build.
  function zombie(ctx, e, x, y, r, ang, shirt, t) {
    var skin = e.flash > 0 ? '#ffffff' : e.burnTtl > 0 ? '#ff8a3d' : e.slow > 0 ? '#9fd8ff' : '#7f9a6a', id = e.type.id;
    var sway = Math.sin(t * 5 + e.id) * 0.25, fat = id === 'divisor' ? 1.35 : id === 'bruto' ? 1.25 : id === 'cazador' || id === 'veloz' ? 0.85 : 1;
    ctx.globalAlpha = 0.3; circle(ctx, x + 2, y + 4, r, '#000'); ctx.globalAlpha = 1;
    // Arms.
    ctx.strokeStyle = skin; ctx.lineWidth = r * 0.32; ctx.lineCap = 'round';
    for (var s = -1; s <= 1; s += 2) {
      var sx = x + Math.cos(ang + s * 1.3) * r * 0.75 * fat, sy = y + Math.sin(ang + s * 1.3) * r * 0.75 * fat;
      var reach = r * (1.1 + (s > 0 ? sway : -sway) * 0.4);
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(ang + s * 0.15) * reach, sy + Math.sin(ang + s * 0.15) * reach); ctx.stroke();
    }
    // Shoulders (torn clothes) and head.
    ctx.fillStyle = e.flash > 0 ? '#ffffff' : shirt;
    ctx.beginPath(); ctx.ellipse(x, y, r * 0.62 * fat, r * 0.95 * fat, ang, 0, TAU); ctx.fill();
    if (id === 'tronador') circle(ctx, x - Math.cos(ang) * r * 0.2, y - Math.sin(ang) * r * 0.2, r * 0.45, e.fuse > 0 && Math.floor(t * 12) % 2 ? '#ffffff' : '#ff5a2a');
    if (id === 'divisor') circle(ctx, x, y, r * 0.5, '#b8a35a');
    circle(ctx, x + Math.cos(ang) * r * 0.25, y + Math.sin(ang) * r * 0.25, r * 0.48, skin);
    circle(ctx, x + Math.cos(ang) * r * 0.3 + Math.cos(ang + 1.57) * r * 0.16, y + Math.sin(ang) * r * 0.3 + Math.sin(ang + 1.57) * r * 0.16, r * 0.08, '#c8262b');
    circle(ctx, x + Math.cos(ang) * r * 0.3 - Math.cos(ang + 1.57) * r * 0.16, y + Math.sin(ang) * r * 0.3 - Math.sin(ang + 1.57) * r * 0.16, r * 0.08, '#c8262b');
    if (id === 'escupidor') circle(ctx, x + Math.cos(ang) * r * 0.6, y + Math.sin(ang) * r * 0.6, r * 0.18, '#9be05a');
  }

  // ---- Anegados (the horde) ----
  L.drawCreature = function (ctx, e, tx, ty, t) {
    var x = e.x, y = e.y, r = e.r, ang = Math.atan2(ty - y, tx - x), type = e.type;
    var color = e.flash > 0 ? '#ffffff' : e.burnTtl > 0 ? '#ff8a3d' : e.slow > 0 ? '#9fd8ff' : type.color;
    var wob = Math.sin(t * 6 + e.id) * 0.08;
    if (e.elite) {
      ctx.strokeStyle = '#ffd27a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, y, r + 4 + Math.sin(t * 5) * 1.5, 0, TAU); ctx.stroke();
    }
    if (type.slam && e.mode === 'slam') {
      // The ring fills up while the Golem winds up: get out before it closes.
      var fill = 1 - Math.max(0, e.cd) / type.slam.windup;
      ctx.strokeStyle = 'rgba(255,90,70,0.8)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, y, type.slam.radius, 0, TAU); ctx.stroke();
      ctx.fillStyle = 'rgba(255,90,70,0.18)';
      ctx.beginPath(); ctx.arc(x, y, type.slam.radius * fill, 0, TAU); ctx.fill();
    }
    if (e.phased) {
      // Enraged: a pulsing red halo.
      ctx.strokeStyle = 'rgba(255,60,60,' + (0.45 + Math.sin(t * 8) * 0.25) + ')'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(x, y, r + 9, 0, TAU); ctx.stroke();
    }
    if (type.mini) {
      // Golden horns: a champion of the Mad God.
      ctx.fillStyle = '#ffd27a';
      polygon(ctx, x - r * 0.55, y - r * 0.8, r * 0.6, -Math.PI / 2 - 0.4, [[0, 1], [2.5, 0.4], [3.8, 0.4]]); ctx.fill();
      polygon(ctx, x + r * 0.55, y - r * 0.8, r * 0.6, -Math.PI / 2 + 0.4, [[0, 1], [2.5, 0.4], [3.8, 0.4]]); ctx.fill();
    }
    if (!type.boss && type.shape !== 'swirl' && !type.mini) { zombie(ctx, e, x, y, r, ang, color, t); return; }
    switch (type.shape) {
      case 'tri':
        ctx.fillStyle = color; polygon(ctx, x, y, r * 1.3, ang, [[0, 1.2], [2.4, 0.9], [3.88, 0.9]]); ctx.fill();
        break;
      case 'arrow':
        ctx.fillStyle = color; polygon(ctx, x, y, r * 1.4, ang, [[0, 1.2], [2.5, 1], [Math.PI, 0.35], [3.78, 1]]); ctx.fill();
        break;
      case 'square':
        ctx.fillStyle = color; polygon(ctx, x, y, r * 1.25, ang + Math.PI / 4, [[0, 1], [1.57, 1], [3.14, 1], [4.71, 1]]); ctx.fill();
        circle(ctx, x, y, r * 0.55, 'rgba(0,0,0,0.25)');
        eyes(ctx, x, y, r, ang, r * 0.18);
        break;
      case 'spitter':
        circle(ctx, x, y, r, color);
        circle(ctx, x + Math.cos(ang) * r * 0.55, y + Math.sin(ang) * r * 0.55, r * 0.35, '#1d2a14'); // mouth
        eyes(ctx, x - Math.cos(ang) * r * 0.2, y - Math.sin(ang) * r * 0.2, r, ang, r * 0.2);
        break;
      case 'swirl': {
        // A spinning drain: dark mouth with arms curling in, and a faint ring where its pull reaches.
        ctx.strokeStyle = 'rgba(120,170,230,0.12)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, type.pull.radius, 0, TAU); ctx.stroke();
        circle(ctx, x, y, r, color);
        ctx.strokeStyle = '#bcd6ff'; ctx.lineWidth = 2.5;
        for (var s = 0; s < 3; s++) {
          var a0 = t * 4 + s * TAU / 3;
          ctx.beginPath(); ctx.arc(x, y, r * 0.75, a0, a0 + 1.6); ctx.stroke();
        }
        circle(ctx, x, y, r * 0.38, '#0d1424');
        break;
      }
      case 'bomber':
        circle(ctx, x, y, r, e.fuse > 0 && Math.floor(t * 12) % 2 ? '#ffffff' : color);
        ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + 4, y - r - 6); ctx.stroke();
        circle(ctx, x + 4, y - r - 7, 2.5 + Math.sin(t * 20), '#ffef9a');
        break;
      case 'queen':
        ctx.fillStyle = color;
        polygon(ctx, x, y, r, t * 0.3, [[0, 1], [1.05, 1], [2.1, 1], [3.14, 1], [4.19, 1], [5.24, 1]]); ctx.fill();
        ctx.fillStyle = '#ffffff';
        for (var q = 0; q < 5; q++) { polygon(ctx, x + (q - 2) * r * 0.3, y - r * 0.85, r * 0.45, -Math.PI / 2, [[0, 1], [2.6, 0.5], [3.68, 0.5]]); ctx.fill(); }
        eyes(ctx, x, y, r, ang, r * 0.15);
        break;
      case 'hydra':
        // A body with three necks and heads swaying.
        circle(ctx, x, y, r, color);
        for (var hh = -1; hh <= 1; hh++) {
          var na = ang + hh * 0.7 + Math.sin(t * 3 + hh) * 0.15, hx = x + Math.cos(na) * r * 1.1, hy = y + Math.sin(na) * r * 1.1;
          ctx.strokeStyle = color; ctx.lineWidth = r * 0.35;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(hx, hy); ctx.stroke();
          circle(ctx, hx, hy, r * 0.38, '#5fc07a');
          eyes(ctx, hx, hy, r * 0.38, na, r * 0.09);
        }
        break;
      case 'avatar':
        // A burning star with one eye: the Mad God looking at you.
        ctx.fillStyle = color;
        var rays = [];
        for (var ry = 0; ry < 12; ry++) rays.push([ry / 12 * TAU, ry % 2 ? 0.8 : 1.3 + Math.sin(t * 6 + ry) * 0.08]);
        polygon(ctx, x, y, r, t * 0.6, rays); ctx.fill();
        circle(ctx, x, y, r * 0.55, '#ffe2a0');
        circle(ctx, x + Math.cos(ang) * r * 0.18, y + Math.sin(ang) * r * 0.18, r * 0.25, '#2a0c00');
        break;
      case 'leviathan':
        var la = e.mode === 'dash' ? Math.atan2(e.dashY, e.dashX) : ang;
        ctx.fillStyle = e.mode === 'wind' && Math.floor(t * 14) % 2 ? '#ffffff' : color;
        ctx.beginPath(); ctx.ellipse(x, y, r * 1.35, r * 0.85, la, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        for (var fn = -1; fn <= 1; fn += 2) { polygon(ctx, x - Math.cos(la) * r * 0.3, y - Math.sin(la) * r * 0.3, r * 1.1, la + fn * 1.9, [[0, 1], [0.3, 0.5], [-0.3, 0.5]]); ctx.fill(); }
        eyes(ctx, x, y, r, la, r * 0.15);
        break;
      case 'boss':
        ctx.fillStyle = color;
        var spikes = [];
        for (var s = 0; s < 16; s++) spikes.push([s / 16 * TAU, s % 2 ? 1 : 1.25]);
        polygon(ctx, x, y, r, t * 0.4, spikes); ctx.fill();
        circle(ctx, x, y, r * 0.75, 'rgba(0,0,0,0.25)');
        eyes(ctx, x, y, r, ang, r * 0.16);
        break;
      default: // blob, splitter, droplet
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.ellipse(x, y, r * (1 + wob), r * (1 - wob), 0, 0, TAU); ctx.fill();
        if (type.shape === 'splitter') circle(ctx, x - r * 0.3, y - r * 0.3, r * 0.3, 'rgba(255,255,255,0.35)');
        eyes(ctx, x, y, r, ang);
    }
  };

  L.drawChest = function (ctx, ch, can, t) {
    var x = ch.x, y = ch.y, boss = ch.kind === 'boss';
    var base = boss ? '#c23b4a' : can ? '#b07a2a' : '#4d473b', lid = boss ? '#ff6b6b' : can ? '#e0a83c' : '#625b4c';
    ctx.globalAlpha = 0.35; ctx.fillStyle = '#000'; ctx.fillRect(x - 15, y - 8, 34, 24); ctx.globalAlpha = 1;
    ctx.fillStyle = base; ctx.fillRect(x - 17, y - 10, 34, 22);
    ctx.fillStyle = lid; ctx.fillRect(x - 18, y - 14, 36, 8);
    ctx.fillStyle = can || boss ? '#fff2c8' : '#8a8475'; ctx.fillRect(x - 3, y - 8, 6, 7);
    if (can || boss) {
      ctx.globalAlpha = 0.25 + 0.2 * Math.sin(t * 4);
      circle(ctx, x, y, 28, boss ? '#ff5a5a' : '#ffd27a');
      ctx.globalAlpha = 1;
    }
  };

  L.drawGem = function (ctx, gem, t) {
    var s = gem.v >= 5 ? 7 : 4.5, x = gem.x, y = gem.y + Math.sin(t * 5 + x) * 1.5;
    ctx.fillStyle = gem.v >= 5 ? '#9ff0ff' : '#5fe0d0';
    ctx.beginPath(); ctx.moveTo(x, y - s * 1.3); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s * 1.3); ctx.lineTo(x - s, y); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.moveTo(x, y - s * 1.3); ctx.lineTo(x + s * 0.4, y - s * 0.2); ctx.lineTo(x - s * 0.2, y - s * 0.2); ctx.fill();
  };

  L.drawShot = function (ctx, pr) {
    ctx.globalAlpha = 0.35; circle(ctx, pr.x - pr.vx * 0.02, pr.y - pr.vy * 0.02, pr.r * 1.6, pr.color); ctx.globalAlpha = 1;
    circle(ctx, pr.x, pr.y, pr.r, pr.color);
    circle(ctx, pr.x, pr.y, pr.r * 0.45, '#ffffff');
  };

  // ---- The flooded floor: dark tiles and puddles that ripple when it rains ----
  var puddleCache = {};
  function puddles(seed, arena) {
    if (puddleCache[seed]) return puddleCache[seed];
    var rng = L.makeRng(seed ^ 0x9e3779b9), list = [];
    for (var i = 0; i < 90; i++) list.push({ x: rng() * arena, y: rng() * arena, rx: 30 + rng() * 90, ry: 15 + rng() * 40, a: rng() * Math.PI });
    return (puddleCache[seed] = list);
  }

  L.drawFloor = function (ctx, camX, camY, W, H, arena, seed, t, tint) {
    ctx.fillStyle = tint || '#161a22';
    ctx.fillRect(Math.max(0, camX), Math.max(0, camY), Math.min(arena, camX + W) - Math.max(0, camX), Math.min(arena, camY + H) - Math.max(0, camY));
    var step = 96;
    ctx.strokeStyle = 'rgba(255,255,255,0.035)'; ctx.lineWidth = 2; ctx.beginPath();
    for (var x = Math.max(0, Math.floor(camX / step) * step); x < Math.min(arena, camX + W); x += step) { ctx.moveTo(x, Math.max(0, camY)); ctx.lineTo(x, Math.min(arena, camY + H)); }
    for (var y = Math.max(0, Math.floor(camY / step) * step); y < Math.min(arena, camY + H); y += step) { ctx.moveTo(Math.max(0, camX), y); ctx.lineTo(Math.min(arena, camX + W), y); }
    ctx.stroke();
    puddles(seed, arena).forEach(function (pd) {
      if (pd.x + pd.rx < camX || pd.x - pd.rx > camX + W || pd.y + pd.ry < camY || pd.y - pd.ry > camY + H) return;
      ctx.fillStyle = 'rgba(70, 110, 160, 0.13)';
      ctx.beginPath(); ctx.ellipse(pd.x, pd.y, pd.rx, pd.ry, pd.a, 0, TAU); ctx.fill();
      var k = (t * 0.7 + pd.x * 0.01) % 1;
      ctx.strokeStyle = 'rgba(160, 200, 255, ' + (0.18 * (1 - k)) + ')'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(pd.x + pd.rx * 0.2, pd.y, pd.rx * 0.4 * k, pd.ry * 0.4 * k, pd.a, 0, TAU); ctx.stroke();
    });
    // The edge of the barrio: a low wall.
    ctx.strokeStyle = '#3a4a5e'; ctx.lineWidth = 10;
    ctx.strokeRect(-5, -5, arena + 10, arena + 10);
  };

  // ---- Rain over everything, in screen space ----
  var drops = [];
  L.drawRain = function (ctx, W, H, dt, heavy) {
    var want = heavy ? 220 : 140;
    while (drops.length < want) drops.push({ x: Math.random() * W, y: Math.random() * H, v: 600 + Math.random() * 400, l: 10 + Math.random() * 14 });
    if (drops.length > want) drops.length = want;
    ctx.strokeStyle = 'rgba(170, 200, 255, 0.22)'; ctx.lineWidth = 1; ctx.beginPath();
    for (var i = 0; i < drops.length; i++) {
      var d = drops[i];
      d.y += d.v * dt; d.x -= d.v * 0.25 * dt;
      if (d.y > H + 20 || d.x < -20) { d.y = -20; d.x = Math.random() * (W + 200); }
      ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + d.l * 0.25, d.y - d.l);
    }
    ctx.stroke();
  };
})(this.Lluvia = this.Lluvia || {});
