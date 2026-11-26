// Night, dusk and dawn on screen (data/clock.js, js/clock.js): the city darkens as the sun goes down, with holes of
// light where your flashlight points, under the street lamps that still work and in the houses with the lights on.
// Dawn and dusk tint everything orange. Drawn after the world, before the half-light of what you don't see.
(function (L) {
  'use strict';

  var cv = null;

  function hex(c, a) { var n = parseInt(c.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }

  // `poly`: the edge of what you see (L.sightPolygon), in px of the world.
  L.drawNight = function (ctx, g, p, camX, camY, W, H, poly, t) {
    var K = L.data.clock, clk = L.clockOf(g), city = g.city, s = city.scale;
    // Dawn and dusk: an orange wash, strongest halfway through.
    if (clk.phase === 'amanecer' || clk.phase === 'atardecer') {
      var tw = clk.phase === 'amanecer' ? K.dawn : K.dusk, k = 1 - Math.abs(clk.light - 0.5) * 2;
      ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = tw.amount * k;
      ctx.fillStyle = tw.color; ctx.fillRect(0, 0, W, H); ctx.restore();
    }
    var dark = (1 - clk.light) * K.night.dark;
    if (dark < 0.01) return;
    if (!cv) cv = document.createElement('canvas');
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    var x = cv.getContext('2d');
    x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
    x.clearRect(0, 0, W, H);
    x.fillStyle = hex(K.night.color, dark); x.fillRect(0, 0, W, H);
    x.globalCompositeOperation = 'destination-out';
    var px = p.x - camX, py = p.y - camY, grad;
    // Close by, you always make things out a little.
    grad = x.createRadialGradient(px, py, 0, px, py, L.data.sight.near * s * 1.3);
    grad.addColorStop(0, 'rgba(0,0,0,0.55)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = grad; x.fillRect(0, 0, W, H);
    // The flashlight: bright near you, fading to its reach, only inside what you see.
    var fl = p.flashlight;
    if (fl && fl.on && poly && poly.length > 2) {
      var reach = K.flashlight.range * s * (0.6 + 0.4 * Math.min(1, fl.battery * 3));
      // Only the cone part of what you see (its first points, js/sight.js), not the circle around you.
      var n = L.data.sight.rays, cone = Math.max(24, Math.round(n * 0.75)) + 1;
      x.save();
      x.beginPath(); x.moveTo(px, py);
      poly.slice(0, cone).forEach(function (q) { x.lineTo(q[0] - camX, q[1] - camY); });
      x.closePath(); x.clip();
      grad = x.createRadialGradient(px, py, 0, px, py, reach);
      grad.addColorStop(0, 'rgba(0,0,0,1)'); grad.addColorStop(0.6, 'rgba(0,0,0,0.85)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = grad; x.fillRect(0, 0, W, H);
      x.restore();
    }
    // Street lamps (on the ground floor), a few flickering.
    var r = K.lamps.radius * s, lamps = (p.floor || 0) ? [] : L.lampsIn(city, camX - r, camY - r, camX + W + r, camY + H + r);
    lamps.forEach(function (l) {
      var on = l.flicker ? (Math.sin(t * 23 + l.x) + Math.sin(t * 7.3 + l.y) > -0.6 ? 1 : 0.25) : 1;
      var lx = l.x - camX, ly = l.y - camY;
      grad = x.createRadialGradient(lx, ly, 0, lx, ly, r);
      grad.addColorStop(0, 'rgba(0,0,0,' + 0.95 * on + ')'); grad.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = grad; x.fillRect(lx - r, ly - r, r * 2, r * 2);
    });
    // Houses with the lights on: the one you are in is lit inside; from outside their windows glow.
    var lit = [];
    if (city._houses) city._houses.forEach(function (plan) {
      if (!plan || !L.houseLit(plan)) return;
      var o = plan.outline[0];
      if (o[0] < camX - 60 * s || o[0] > camX + W + 60 * s || o[1] < camY - 60 * s || o[1] > camY + H + 60 * s) return;
      lit.push(plan);
    });
    lit.forEach(function (plan) {
      if (city._inside === plan) {
        x.fillStyle = 'rgba(0,0,0,0.8)'; x.beginPath();
        plan.outline.forEach(function (q, i) { if (i) x.lineTo(q[0] - camX, q[1] - camY); else x.moveTo(q[0] - camX, q[1] - camY); });
        x.closePath(); x.fill();
      }
      (L.planLevel(plan, p.floor || 0) || plan).windows.forEach(function (w) {
        var wx = (w[0] + w[2]) / 2 * s - camX, wy = (w[1] + w[3]) / 2 * s - camY, wr = 2.2 * s;
        grad = x.createRadialGradient(wx, wy, 0, wx, wy, wr);
        grad.addColorStop(0, 'rgba(0,0,0,0.7)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = grad; x.fillRect(wx - wr, wy - wr, wr * 2, wr * 2);
      });
    });
    // Rooms you lit, with power (js/power.js): their cells, without darkness.
    if (g.lights && city._houses) Object.keys(g.lights).forEach(function (k) {
      var parts = k.split(':'), plan = city._houses.get(+parts[0]), fl = +parts[1], room = +parts[2];
      if (!plan || fl !== (p.floor || 0) || !L.hasPower(plan)) return;
      var level = L.planLevel(plan, fl), f = plan.frame, cs = plan.cell, W = plan.W;
      if (!level || !level.lab) return;
      x.save();
      x.translate(-camX, -camY); x.scale(s, s);
      x.transform(f.ux * cs, f.uy * cs, f.vx * cs, f.vy * cs, f.ox, f.oy);
      x.beginPath();
      for (var cy = 0; cy < plan.D; cy++) for (var cx = 0; cx < W; cx++) if (level.lab[cy * W + cx] === room) x.rect(cx - 0.05, cy - 0.05, 1.1, 1.1);
      x.fillStyle = 'rgba(0,0,0,0.92)'; x.fill();
      x.restore();
    });
    ctx.drawImage(cv, 0, 0);
    // A warm tint under the lamps.
    if (lamps.length) {
      ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = Math.min(1, dark * 1.2);
      lamps.forEach(function (l) {
        var lx = l.x - camX, ly = l.y - camY, gr = ctx.createRadialGradient(lx, ly, 0, lx, ly, r);
        gr.addColorStop(0, hex(K.lamps.color, 0.8)); gr.addColorStop(1, hex(K.lamps.color, 0));
        ctx.fillStyle = gr; ctx.fillRect(lx - r, ly - r, r * 2, r * 2);
      });
      ctx.restore();
    }
  };
})(this.Lluvia = this.Lluvia || {});
