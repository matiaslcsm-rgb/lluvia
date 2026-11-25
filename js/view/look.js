// The city's mood on screen (data/look.js): washes the world drawn so far in muted, dirty, yellowed colors, then
// adds moving film grain and dark corners. Called after the world and before the HUD.
(function (L) {
  'use strict';

  var noise = null, vignette = null, vigKey = '', grainAt = 0, gx = 0, gy = 0;

  // A tile of gray noise, made once.
  function noiseTile(size) {
    var c = document.createElement('canvas'), x = c.getContext('2d'), img = x.createImageData(size, size), d = img.data;
    for (var i = 0; i < d.length; i += 4) { var v = 128 + (Math.random() - 0.5) * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    c.width = c.height = size;
    x.putImageData(img, 0, 0);
    return c;
  }

  L.drawLook = function (ctx, W, H, t) {
    var K = L.data.look;
    if (!K) return;
    ctx.save();
    // Washed out: blend toward gray.
    ctx.globalCompositeOperation = 'saturation';
    ctx.globalAlpha = K.desaturate; ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, W, H);
    // The Sun's yellow, soft.
    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha = K.tintAmount; ctx.fillStyle = K.tint; ctx.fillRect(0, 0, W, H);
    // Grime: a little darker and dirtier.
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = K.grimeAmount; ctx.fillStyle = K.grime; ctx.fillRect(0, 0, W, H);
    // Film grain, jumping a few times a second.
    var G = K.grain;
    if (G.amount > 0) {
      if (!noise || noise.width !== G.size) noise = noiseTile(G.size);
      if (t - grainAt > 1 / G.fps || t < grainAt) { grainAt = t; gx = Math.floor(Math.random() * G.size); gy = Math.floor(Math.random() * G.size); }
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = G.amount;
      ctx.translate(-gx, -gy);
      ctx.fillStyle = ctx.createPattern(noise, 'repeat');
      ctx.fillRect(gx, gy, W, H);
      ctx.translate(gx, gy);
    }
    // Dark corners.
    var V = K.vignette, key = W + 'x' + H + ':' + V.inner + ':' + V.outer + ':' + V.amount;
    if (V.amount > 0) {
      if (key !== vigKey) {
        var r = Math.hypot(W, H) / 2;
        vignette = ctx.createRadialGradient(W / 2, H / 2, r * V.inner, W / 2, H / 2, r * V.outer);
        vignette.addColorStop(0, 'rgba(8,7,5,0)');
        vignette.addColorStop(1, 'rgba(8,7,5,' + V.amount + ')');
        vigKey = key;
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1; ctx.fillStyle = vignette; ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  };
})(this.Lluvia = this.Lluvia || {});
