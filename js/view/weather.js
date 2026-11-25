// The weather on screen (js/weather.js): the flooded low ground (under the people), and over everything the black
// rain, the storm's lightning, the fog, the heat haze, the cold, and the clouds darkening the day.
(function (L) {
  'use strict';

  var drops = [], dropW = 0, dropH = 0;

  // The water on the low ground, in the world (camera already applied): dark water where the ground is under the
  // flood level, sampled every meter.
  L.drawFlood = function (ctx, g, camX, camY, W, H) {
    if (!g.weather || g.weather.rise <= 0.02 || !g.city.map) return;
    var s = g.city.scale, step = s, t = g.time;
    var x0 = Math.floor(camX / step) * step, y0 = Math.floor(camY / step) * step;
    for (var y = y0; y < camY + H + step; y += step) for (var x = x0; x < camX + W + step; x += step) {
      var d = L.floodAt(g, x + step / 2, y + step / 2);
      if (d <= 0) continue;
      var a = Math.min(0.85, 0.35 + d * 0.35);
      ctx.fillStyle = 'rgba(14,16,20,' + a + ')';
      ctx.fillRect(x, y, step + 0.5, step + 0.5);
    }
    // A few rings where the black rain hits the water.
    var rain = L.wx(g, 'rain');
    if (rain > 0) {
      ctx.strokeStyle = 'rgba(150,150,160,0.25)'; ctx.lineWidth = 1;
      for (var i = 0; i < 40 * rain; i++) {
        var rx = camX + ((i * 9301 + Math.floor(t * 3) * 49297) % 233280) / 233280 * W, ry = camY + ((i * 4093 + Math.floor(t * 3) * 7919) % 233280) / 233280 * H;
        if (L.floodAt(g, rx, ry) <= 0) continue;
        var k = (t * 3) % 1;
        ctx.beginPath(); ctx.arc(rx, ry, 2 + k * 6, 0, Math.PI * 2); ctx.stroke();
      }
    }
  };

  // Over everything, in screen space: clouds, fog, heat, cold, rain and lightning.
  L.drawWeather = function (ctx, g, W, H, dt) {
    if (!g.weather) return;
    var dark = L.wx(g, 'dark'), rain = L.wx(g, 'rain'), sight = L.wx(g, 'sight'), W2 = g.weather;
    ctx.save();
    // Clouds: the day gets darker.
    if (dark > 0) { ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(70,72,80,' + dark + ')'; ctx.fillRect(0, 0, W, H); }
    ctx.globalCompositeOperation = 'source-over';
    // Fog: thick away from you.
    var fog = Math.max(0, 1 - sight / 0.85) * (W2.id === 'niebla' || W2.prev === 'niebla' ? 1 : 0);
    if (fog > 0) {
      var r0 = Math.min(W, H) * 0.12, r1 = Math.max(W, H) * 0.55, gr = ctx.createRadialGradient(W / 2, H / 2, r0, W / 2, H / 2, r1);
      gr.addColorStop(0, 'rgba(196,196,200,' + 0.15 * fog + ')'); gr.addColorStop(1, 'rgba(196,196,200,' + 0.85 * fog + ')');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    }
    // Heat: a warm haze. Cold: a blue chill.
    var heat = L.wx(g, 'thirst') - 1, cold = L.wx(g, 'cold');
    if (heat > 0) { ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = 'rgba(230,140,60,' + heat * 0.6 + ')'; ctx.fillRect(0, 0, W, H); }
    if (cold > 0) { ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = 'rgba(90,130,200,' + Math.min(0.5, cold * 0.1) + ')'; ctx.fillRect(0, 0, W, H); }
    ctx.globalCompositeOperation = 'source-over';
    // The black rain: dark streaks slanting down.
    if (rain > 0) {
      var want = Math.round(700 * rain);
      if (dropW !== W || dropH !== H) { drops = []; dropW = W; dropH = H; }
      while (drops.length < want) drops.push({ x: Math.random() * W, y: Math.random() * H, v: 900 + Math.random() * 500, l: 10 + Math.random() * 14 });
      if (drops.length > want) drops.length = want;
      ctx.strokeStyle = 'rgba(8,8,10,0.55)'; ctx.lineWidth = 1.2; ctx.beginPath();
      drops.forEach(function (d) {
        d.y += d.v * dt; d.x -= d.v * 0.18 * dt;
        if (d.y > H) { d.y = -d.l; d.x = Math.random() * (W + 60); }
        if (d.x < -20) d.x = W + 20;
        ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + d.l * 0.18, d.y - d.l);
      });
      ctx.stroke();
    }
    // Lightning: everything white for an instant.
    if (W2.flashT > 0) { ctx.fillStyle = 'rgba(235,235,255,' + Math.min(0.75, W2.flashT * 3) + ')'; ctx.fillRect(0, 0, W, H); }
    ctx.restore();
  };
})(this.Lluvia = this.Lluvia || {});
