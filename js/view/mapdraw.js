// Draws the real city (data/map-*.js, from tools/bake-map.js) so it looks like a city: asphalt, sidewalks with
// their curb, grass in the yards, textured roofs with shadows by height, water tanks, trees, crosswalks, railway.
// Shared by the map viewer (mapa/) and the game. Works in meters: the caller sets the transform.
// Street widths come from js/city.js (L.cityStreet), the same ones the game walks on.
(function (L) {
  'use strict';
  L.mapdraw = {};

  var TERRACE_TINTS = [null, 'rgba(255,255,255,0.25)', 'rgba(90,90,95,0.25)', 'rgba(170,80,60,0.28)', null, 'rgba(40,40,45,0.3)', 'rgba(255,255,255,0.12)', 'rgba(120,130,110,0.2)'];
  var ROOF = {
    terraza: ['#c9c2b4', '#b3ab9c'], tejas: ['#b4553a', '#9a4430'], chapa: ['#9aa6ae', '#7f8b93']
  };

  // Small repeating textures, made once.
  function pattern(size, paint) {
    var c = document.createElement('canvas'); c.width = c.height = size;
    paint(c.getContext('2d'), size);
    return c;
  }
  function noise(ctx, size, base, spots, alpha, rnd) {
    ctx.fillStyle = base; ctx.fillRect(0, 0, size, size);
    for (var i = 0; i < spots.n; i++) {
      ctx.globalAlpha = alpha * (0.4 + rnd() * 0.6);
      ctx.fillStyle = spots.colors[Math.floor(rnd() * spots.colors.length)];
      var r = spots.r[0] + rnd() * (spots.r[1] - spots.r[0]);
      ctx.beginPath(); ctx.arc(rnd() * size, rnd() * size, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function rng(seed) { var s = seed >>> 0 || 1; return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }; }

  // Two sets: the coarse one (12 texture pixels per meter) for the viewer zoomed out, and a fine one (FINE pixels
  // per meter) for close up, where the game plays at 1:1 and a sidewalk tile or a roof tile is its real size.
  var FINE = 50, FINE_FROM = 20;
  var tex = null, fine = null;
  function fineTextures() {
    if (fine) return fine;
    var r = rng(11), m = FINE;
    var speckle = function (base, colors, n, rmin, rmax, alpha, clumps) {
      return function (c, size) {
        noise(c, size, base, { n: clumps || 0, colors: colors, r: [rmin * 4, rmax * 5] }, alpha * 0.35, r);
        for (var i = 0; i < n; i++) {
          c.globalAlpha = alpha * (0.4 + r() * 0.6);
          c.fillStyle = colors[Math.floor(r() * colors.length)];
          var s = rmin + r() * (rmax - rmin);
          c.fillRect(r() * size, r() * size, s, s);
        }
        c.globalAlpha = 1;
      };
    };
    // Baldosas: 40 cm tiles with a thin joint, each a shade lighter or darker.
    var tiles = function (base, step, joint) {
      return function (c, n) {
        c.fillStyle = base; c.fillRect(0, 0, n, n);
        for (var y = 0; y < n; y += step) for (var x = 0; x < n; x += step) {
          var v = r();
          c.fillStyle = v < 0.5 ? 'rgba(0,0,0,' + (v * 0.08) + ')' : 'rgba(255,255,255,' + ((v - 0.5) * 0.12) + ')';
          c.fillRect(x, y, step, step);
        }
        c.fillStyle = joint;
        for (var i = 0; i < n; i += step) { c.fillRect(i, 0, 1, n); c.fillRect(0, i, n, 1); }
      };
    };
    fine = {
      grass: pattern(5 * m, speckle('#4f6b38', ['#5d7a42', '#43602f', '#6b8a4a', '#57703c', '#3e5a2c'], 9000, 1, 3, 0.75, 120)),
      park: pattern(5 * m, speckle('#4d7a3a', ['#5a8a44', '#447033', '#62944a', '#3f6a30'], 9000, 1, 3, 0.75, 120)),
      asphalt: pattern(5 * m, speckle('#3d3f45', ['#45474e', '#35373c', '#4a4c52', '#2f3135'], 12000, 0.6, 1.6, 0.7, 60)),
      sidewalk: pattern(Math.round(3.2 * m), tiles('#a9a59c', Math.round(0.4 * m), 'rgba(0,0,0,0.16)')),
      paving: pattern(Math.round(2 * m), tiles('#b9ae98', Math.round(0.2 * m), 'rgba(80,60,40,0.22)')),
      tejas: pattern(Math.round(3 * m), function (c, n) {
        // Rows of tiles 30 cm apart, each row offset by half a tile, with the shadow of the row above.
        var row = Math.round(0.3 * m), w = Math.round(0.25 * m);
        c.fillStyle = ROOF.tejas[0]; c.fillRect(0, 0, n, n);
        for (var y = 0, k = 0; y < n; y += row, k++) {
          for (var x = (k % 2) * w / 2 - w; x < n; x += w) {
            c.fillStyle = 'rgba(' + (r() < 0.5 ? '255,200,170,' : '60,20,10,') + (r() * 0.12) + ')'; c.fillRect(x + 1, y, w - 1, row);
            c.fillStyle = 'rgba(60,20,10,0.3)'; c.fillRect(x, y, 1, row);
          }
          c.fillStyle = 'rgba(60,20,10,0.35)'; c.fillRect(0, y, n, 2);
        }
      }),
      chapa: pattern(Math.round(1 * m), function (c, n) {
        // Corrugated sheet: a ridge every 10 cm.
        var step = Math.round(0.1 * m);
        c.fillStyle = ROOF.chapa[0]; c.fillRect(0, 0, n, n);
        for (var x = 0; x < n; x += step) { c.fillStyle = 'rgba(255,255,255,0.2)'; c.fillRect(x, 0, 1.5, n); c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(x + step / 2, 0, 1.5, n); }
      }),
      terraza: pattern(5 * m, function (c, n) {
        // Concrete slab: fine speckle and a joint every meter.
        speckle(ROOF.terraza[0], ['#bdb6a8', '#d3ccbe', '#aca595'], 3000, 0.8, 2, 0.5, 40)(c, n);
        c.fillStyle = 'rgba(90,80,70,0.12)';
        for (var i = 0; i < n; i += m) { c.fillRect(i, 0, 1, n); c.fillRect(0, i, n, 1); }
      })
    };
    return fine;
  }
  function textures() {
    if (tex) return tex;
    var r = rng(7);
    tex = {
      grass: pattern(128, function (c, n) { noise(c, n, '#4f6b38', { n: 420, colors: ['#5d7a42', '#43602f', '#6b8a4a', '#57703c'], r: [1, 4] }, 0.7, r); }),
      park: pattern(128, function (c, n) { noise(c, n, '#4d7a3a', { n: 380, colors: ['#5a8a44', '#447033', '#62944a'], r: [1, 4] }, 0.7, r); }),
      asphalt: pattern(128, function (c, n) { noise(c, n, '#3d3f45', { n: 700, colors: ['#45474e', '#35373c', '#4a4c52'], r: [0.5, 1.5] }, 0.6, r); }),
      sidewalk: pattern(64, function (c, n) {
        c.fillStyle = '#a9a59c'; c.fillRect(0, 0, n, n); c.strokeStyle = 'rgba(0,0,0,0.12)'; c.lineWidth = 1;
        for (var i = 0; i <= n; i += 16) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, n); c.moveTo(0, i); c.lineTo(n, i); c.stroke(); }
      }),
      paving: pattern(64, function (c, n) {
        c.fillStyle = '#b9ae98'; c.fillRect(0, 0, n, n); c.strokeStyle = 'rgba(80,60,40,0.18)';
        for (var i = 0; i <= n; i += 8) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, n); c.moveTo(0, i); c.lineTo(n, i); c.stroke(); }
      }),
      tejas: pattern(32, function (c, n) {
        c.fillStyle = ROOF.tejas[0]; c.fillRect(0, 0, n, n); c.fillStyle = 'rgba(60,20,10,0.25)';
        for (var i = 0; i < n; i += 6) c.fillRect(0, i, n, 1.5);
        for (var j = 0; j < n; j += 6) for (var k = 0; k < n; k += 8) c.fillRect(k + (j % 12 ? 4 : 0), j, 1, 6);
      }),
      chapa: pattern(32, function (c, n) {
        c.fillStyle = ROOF.chapa[0]; c.fillRect(0, 0, n, n); c.fillStyle = 'rgba(255,255,255,0.18)';
        for (var i = 0; i < n; i += 4) c.fillRect(i, 0, 1.5, n);
      }),
      terraza: pattern(64, function (c, n) { noise(c, n, ROOF.terraza[0], { n: 160, colors: ['#bdb6a8', '#d3ccbe', '#aca595'], r: [1, 3] }, 0.5, r); })
    };
    return tex;
  }

  // ---- Preparing a map once: shapes in meters, chunks, trees, crosswalks ----
  L.mapdraw.prepare = function (M) {
    if (M._prep) return M._prep;
    var U = M.unit, pts = function (f) { var o = []; for (var i = 0; i + 1 < f.length; i += 2) o.push([f[i] * U, f[i + 1] * U]); return o; };
    var box = function (p) { var b = [Infinity, Infinity, -Infinity, -Infinity]; p.forEach(function (q) { b[0] = Math.min(b[0], q[0]); b[1] = Math.min(b[1], q[1]); b[2] = Math.max(b[2], q[0]); b[3] = Math.max(b[3], q[1]); }); return b; };
    var P = {
      w: M.w, h: M.h, border: M.border ? pts(M.border) : null,
      buildings: M.buildings.map(function (r, i) { var p = pts(r[0]); return { i: i, p: p, b: box(p), kind: M.kinds[r[1]], floors: r[2], roof: M.roofs[r[3]], basement: r[4], est: r[5], src: r[6], place: r[7] }; }),
      roads: M.roads.map(function (r) { var p = pts(r[2]), w = L.cityStreet(r[0]); return { kind: r[0], name: r[1], p: p, b: box(p), road: w[0], walk: w[1] }; }),
      parks: M.parks.map(function (r) { var p = pts(r[2]); return { kind: r[0], name: r[1], p: p, b: box(p) }; }),
      land: M.landuse.map(function (r) { var p = pts(r[2]); return { cls: r[0], p: p, b: box(p) }; }),
      water: M.water.map(function (r) { var p = pts(r[2]); return { cls: r[0], p: p, b: box(p), closed: p.length > 3 && p[0][0] === p[p.length - 1][0] && p[0][1] === p[p.length - 1][1] }; }),
      rail: M.rail.map(function (r) { var p = pts(r[2]); return { p: p, b: box(p) }; }),
      trees: [], crossings: []
    };
    // Chunks of 100 m.
    var CH = 100, cols = Math.ceil(M.w / CH), rows = Math.ceil(M.h / CH), chunks = [];
    var put = function (kind, it, b) {
      for (var cy = Math.max(0, Math.floor(b[1] / CH)); cy <= Math.min(rows - 1, Math.floor(b[3] / CH)); cy++)
        for (var cx = Math.max(0, Math.floor(b[0] / CH)); cx <= Math.min(cols - 1, Math.floor(b[2] / CH)); cx++) {
          var c = chunks[cy * cols + cx] || (chunks[cy * cols + cx] = { buildings: [], trees: [] });
          c[kind].push(it);
        }
    };
    P.buildings.forEach(function (bd) { put('buildings', bd, bd.b); });
    var inside = function (p, x, y) { var c = false; for (var i = 0, j = p.length - 1; i < p.length; j = i++) { if ((p[i][1] > y) !== (p[j][1] > y) && x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) c = !c; } return c; };
    var built = function (x, y) {
      if (x < 0 || y < 0 || x >= M.w || y >= M.h) return false;
      var c = chunks[Math.floor(y / CH) * cols + Math.floor(x / CH)];
      if (!c) return false;
      for (var i = 0; i < c.buildings.length; i++) { var bd = c.buildings[i]; if (x > bd.b[0] && x < bd.b[2] && y > bd.b[1] && y < bd.b[3] && inside(bd.p, x, y)) return true; }
      return false;
    };
    // Street trees: along the sidewalk, every 9-15 m, not on a building or a corner.
    var nodes = new Map(), key = function (q) { return Math.round(q[0]) + ',' + Math.round(q[1]); };
    P.roads.forEach(function (r) { r.p.forEach(function (q, k) { var kk = key(q), n = nodes.get(kk); if (!n) nodes.set(kk, n = { x: q[0], y: q[1], roads: [] }); n.roads.push({ r: r, k: k }); }); });
    var rnd = rng(1234);
    P.roads.forEach(function (r) {
      if (r.road < 9 || r.walk < 2.5) return;
      for (var k = 1; k < r.p.length; k++) {
        var a = r.p[k - 1], b = r.p[k], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
        if (len < 20) continue;
        var ux = dx / len, uy = dy / len;
        for (var side = -1; side <= 1; side += 2) {
          var off = r.road / 2 + r.walk * 0.55, nx = -uy * side, ny = ux * side;
          for (var t = 8 + rnd() * 6; t < len - 8; t += 9 + rnd() * 6) {
            if (rnd() < 0.35) continue;
            var x = a[0] + ux * t + nx * off, y = a[1] + uy * t + ny * off;
            if (built(x, y)) continue;
            var tr = { x: x, y: y, r: 2.2 + rnd() * 1.6, s: rnd() };
            P.trees.push(tr); put('trees', tr, [x - 4, y - 4, x + 4, y + 4]);
          }
        }
      }
    });
    // Trees in the parks.
    P.parks.forEach(function (pk) {
      if (pk.kind === 'square' || pk.kind === 'plaza' || pk.kind === 'pitch') return;
      var area = (pk.b[2] - pk.b[0]) * (pk.b[3] - pk.b[1]), n = Math.min(400, Math.floor(area / 180));
      for (var i = 0; i < n; i++) {
        var x = pk.b[0] + rnd() * (pk.b[2] - pk.b[0]), y = pk.b[1] + rnd() * (pk.b[3] - pk.b[1]);
        if (!inside(pk.p, x, y)) continue;
        var tr = { x: x, y: y, r: 2.8 + rnd() * 2.4, s: rnd() };
        P.trees.push(tr); put('trees', tr, [x - 6, y - 6, x + 6, y + 6]);
      }
    });
    // Crosswalks where a street with traffic meets another one: across each street, just before the corner.
    nodes.forEach(function (n) {
      if (n.roads.length < 2) return;
      var big = n.roads.filter(function (e) { return e.r.road >= 9; });
      if (big.length < 2 || !big.some(function (e) { return e.r.road >= 13; })) return;
      var widest = Math.max.apply(null, big.map(function (e) { return e.r.road; }));
      big.forEach(function (e) {
        [e.k - 1, e.k + 1].forEach(function (k2) {
          var q = e.r.p[k2];
          if (!q) return;
          var dx = q[0] - n.x, dy = q[1] - n.y, len = Math.hypot(dx, dy);
          if (len < widest / 2 + 6) return;
          var ux = dx / len, uy = dy / len, d = widest / 2 + 3.5;
          P.crossings.push({ x: n.x + ux * d, y: n.y + uy * d, ux: ux, uy: uy, w: e.r.road });
        });
      });
    });
    P.chunks = chunks; P.cols = cols; P.rows = rows; P.CH = CH; P.built = built;
    M._prep = P;
    return P;
  };

  // Terrain image: heights → hillshade (light from the north-west), a bit lighter up high, contour lines every
  // 2 m. Drawn over the map with multiply, so it is a soft relief, not a color. Made once per map.
  L.mapdraw.terrain = function (M) {
    if (M._terrain) return M._terrain;
    var T = M.terrain, NX = T.nx, NY = T.ny, zmin = Infinity, zmax = -Infinity;
    T.dm.forEach(function (v) { zmin = Math.min(zmin, v); zmax = Math.max(zmax, v); });
    var RX = 1000, RY = Math.round(RX * M.h / M.w), timg = document.createElement('canvas'); timg.width = RX; timg.height = RY;
    var tc = timg.getContext('2d'), img = tc.createImageData(RX, RY);
    var zAt = function (x, y) { // bilinear, in decimeters; x, y in grid units
      x = Math.max(0, Math.min(NX - 1.001, x)); y = Math.max(0, Math.min(NY - 1.001, y));
      var i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, a = T.dm[j * NX + i], b = T.dm[j * NX + i + 1], c = T.dm[(j + 1) * NX + i], d = T.dm[(j + 1) * NX + i + 1];
      return a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy;
    };
    for (var y = 0; y < RY; y++) for (var x = 0; x < RX; x++) {
      var gx = x / RX * M.w / T.step - 0.5, gy = y / RY * M.h / T.step - 0.5, z = zAt(gx, gy), t = (z - zmin) / (zmax - zmin || 1);
      var dzx = (zAt(gx + 0.3, gy) - zAt(gx - 0.3, gy)) / 10, dzy = (zAt(gx, gy + 0.3) - zAt(gx, gy - 0.3)) / 10;
      var shade = Math.max(0.6, Math.min(1, 1 - (dzx + dzy) * 0.3)) * (0.88 + t * 0.12);
      var r = 255 * shade, g = 255 * shade, bl = 250 * shade, k = (y * RX + x) * 4;
      var px = M.w / T.step / RX, band = Math.floor(z / 20), bandR = Math.floor(zAt(gx + px, gy) / 20), bandD = Math.floor(zAt(gx, gy + px) / 20);
      if (band !== bandR || band !== bandD) { r *= 0.86; g *= 0.86; bl *= 0.86; }
      img.data[k] = r; img.data[k + 1] = g; img.data[k + 2] = bl; img.data[k + 3] = 255;
    }
    tc.putImageData(img, 0, 0);
    M._terrain = timg;
    return timg;
  };

  // ---- Drawing ----
  function path(ctx, p, close) { ctx.beginPath(); for (var i = 0; i < p.length; i++) { if (i) ctx.lineTo(p[i][0], p[i][1]); else ctx.moveTo(p[i][0], p[i][1]); } if (close) ctx.closePath(); }

  // opt: { view: [x0, y0, x1, y1] in meters, scale: px per meter, terrain: canvas or null, buildings: true,
  //        color: fn(building) → fill (optional, replaces the roof), dim: fn(building) → true to fade it,
  //        under: fn() called after the streets and before the buildings (the game draws its parked cars there) }
  L.mapdraw.draw = function (ctx, M, opt) {
    var close = opt.scale >= FINE_FROM, P = L.mapdraw.prepare(M), T = close ? fineTextures() : textures(), vb = opt.view, s = opt.scale, detail = s > 0.7;
    var on = function (b, pad) { return b[2] + pad > vb[0] && b[0] - pad < vb[2] && b[3] + pad > vb[1] && b[1] - pad < vb[3]; };
    var pat = function (c) { var p = ctx.createPattern(c, 'repeat'); if (p.setTransform && typeof DOMMatrix !== 'undefined') p.setTransform(new DOMMatrix().scale(1 / (close ? FINE : 12))); return p; };
    ctx.save();
    // Everything stays inside the map's square.
    ctx.beginPath(); ctx.rect(0, 0, P.w, P.h); ctx.clip();
    ctx.fillStyle = detail ? pat(T.grass) : '#4f6b38';
    ctx.fillRect(Math.max(0, vb[0]), Math.max(0, vb[1]), Math.min(P.w, vb[2]) - Math.max(0, vb[0]), Math.min(P.h, vb[3]) - Math.max(0, vb[1]));
    // Land use and water.
    P.land.forEach(function (l) {
      if (!on(l.b, 0) || l.p.length < 3) return;
      if (/park|grass|recreation|garden|pitch/.test(l.cls)) ctx.fillStyle = detail ? pat(T.park) : '#4d7a3a';
      else if (/cemetery/.test(l.cls)) ctx.fillStyle = '#5c7448';
      else if (/industrial|railway/.test(l.cls)) ctx.fillStyle = 'rgba(120,115,110,0.45)';
      else return;
      path(ctx, l.p, true); ctx.fill();
    });
    P.parks.forEach(function (pk) {
      if (!on(pk.b, 0)) return;
      ctx.fillStyle = pk.kind === 'square' || pk.kind === 'plaza' ? (detail ? pat(T.paving) : '#b9ae98') : (detail ? pat(T.park) : '#4d7a3a');
      path(ctx, pk.p, true); ctx.fill();
    });
    P.water.forEach(function (w) {
      if (!on(w.b, 20)) return;
      if (w.closed) { ctx.fillStyle = '#3b6f99'; path(ctx, w.p, true); ctx.fill(); }
      else { ctx.strokeStyle = '#3b6f99'; ctx.lineWidth = 5; ctx.lineCap = 'round'; path(ctx, w.p); ctx.stroke(); }
    });
    // Streets: sidewalk, curb, asphalt, then markings.
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    var roads = P.roads.filter(function (r) { return on(r.b, r.road + r.walk * 2); });
    var walkFill = detail ? pat(T.sidewalk) : '#a9a59c', asph = detail ? pat(T.asphalt) : '#3d3f45';
    roads.forEach(function (r) { if (r.walk) { ctx.strokeStyle = r.road ? walkFill : (detail ? pat(T.paving) : '#b9ae98'); ctx.lineWidth = r.road + r.walk * 2; path(ctx, r.p); ctx.stroke(); } });
    roads.forEach(function (r) { if (r.road) { ctx.strokeStyle = '#6e6a62'; ctx.lineWidth = r.road + 0.6; path(ctx, r.p); ctx.stroke(); } });
    roads.forEach(function (r) { if (r.road) { ctx.strokeStyle = asph; ctx.lineWidth = r.road; path(ctx, r.p); ctx.stroke(); } });
    if (detail) {
      roads.forEach(function (r) {
        if (r.road >= 15) { ctx.strokeStyle = '#d9b44a'; ctx.lineWidth = 0.35; ctx.setLineDash([]); path(ctx, r.p); ctx.stroke(); }
        else if (r.road >= 11) { ctx.strokeStyle = 'rgba(240,240,230,0.7)'; ctx.lineWidth = 0.25; ctx.setLineDash([3, 4]); path(ctx, r.p); ctx.stroke(); }
      });
      ctx.setLineDash([]);
      // Crosswalks: white stripes across the street.
      ctx.fillStyle = 'rgba(245,245,240,0.85)';
      P.crossings.forEach(function (c) {
        if (c.x < vb[0] - 20 || c.x > vb[2] + 20 || c.y < vb[1] - 20 || c.y > vb[3] + 20) return;
        ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(Math.atan2(c.uy, c.ux));
        for (var o = -c.w / 2 + 0.6; o < c.w / 2 - 0.4; o += 1.1) ctx.fillRect(-1.5, o, 3, 0.55);
        ctx.restore();
      });
    }
    // Railway: ballast, sleepers, rails.
    P.rail.forEach(function (r) {
      if (!on(r.b, 10)) return;
      ctx.strokeStyle = '#6b655c'; ctx.lineWidth = 4.5; path(ctx, r.p); ctx.stroke();
      if (detail) {
        ctx.strokeStyle = '#4a3a2c'; ctx.lineWidth = 2.6; ctx.setLineDash([0.25, 0.65]); path(ctx, r.p); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = '#c9c4ba'; ctx.lineWidth = 1.7; path(ctx, r.p); ctx.stroke();
        ctx.strokeStyle = '#4a3a2c'; ctx.lineWidth = 1.3; path(ctx, r.p); ctx.stroke();
      }
    });
    if (opt.under) opt.under();
    // Chunks on screen.
    var seen = [], x0 = Math.max(0, Math.floor(vb[0] / P.CH)), x1 = Math.min(P.cols - 1, Math.floor(vb[2] / P.CH));
    var y0 = Math.max(0, Math.floor(vb[1] / P.CH)), y1 = Math.min(P.rows - 1, Math.floor(vb[3] / P.CH));
    for (var cy = y0; cy <= y1; cy++) for (var cx = x0; cx <= x1; cx++) if (P.chunks[cy * P.cols + cx]) seen.push(P.chunks[cy * P.cols + cx]);
    var once = function (kind, fn) { var done = new Set(); seen.forEach(function (c) { c[kind].forEach(function (it) { if (!done.has(it)) { done.add(it); fn(it); } }); }); };
    var shown = 0;
    if (opt.buildings !== false) {
      var list = []; once('buildings', function (bd) { if (on(bd.b, 0)) list.push(bd); });
      // Shadows: longer for taller buildings (sun from the north-west).
      if (detail) {
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        list.forEach(function (bd) {
          if (opt.dim && opt.dim(bd)) return;
          var h = Math.min(40, bd.floors * 3 + (bd.roof === 'tejas' ? 1.5 : 0.6)), d = h * 0.45;
          ctx.save(); ctx.translate(d, d * 0.8); path(ctx, bd.p, true); ctx.fill(); ctx.restore();
        });
      }
      list.forEach(function (bd) {
        var faded = opt.dim && opt.dim(bd);
        ctx.globalAlpha = faded ? 0.25 : 1;
        if (opt.color) ctx.fillStyle = opt.color(bd);
        else ctx.fillStyle = detail ? pat(T[bd.roof] || T.terraza) : ROOF[bd.roof][0];
        path(ctx, bd.p, true); ctx.fill();
        // Flat roofs vary: whitewashed, grey concrete, reddish waterproofing, dark tar.
        if (detail && !opt.color && bd.roof === 'terraza') {
          var tint = TERRACE_TINTS[bd.i % TERRACE_TINTS.length];
          if (tint) { ctx.fillStyle = tint; ctx.fill(); }
        }
        if (detail) {
          // Edge: parapet on terraces, eaves on pitched roofs.
          ctx.strokeStyle = bd.roof === 'terraza' ? '#8f887b' : 'rgba(0,0,0,0.45)'; ctx.lineWidth = bd.roof === 'terraza' ? 0.45 : 0.25;
          ctx.stroke();
          // Terraces get a water tank (black or grey), like every roof in town.
          if (bd.roof === 'terraza' && !opt.color && (bd.b[2] - bd.b[0]) > 6) {
            var tx = bd.b[0] + (bd.b[2] - bd.b[0]) * (0.25 + (bd.i % 5) * 0.1), ty = bd.b[1] + (bd.b[3] - bd.b[1]) * (0.3 + (bd.i % 3) * 0.15);
            ctx.fillStyle = bd.i % 3 ? '#2a2a2a' : '#8a9096';
            ctx.beginPath(); ctx.arc(tx, ty, 0.6 + Math.min(0.6, bd.floors * 0.1), 0, Math.PI * 2); ctx.fill();
          }
        } else if (s > 0.3) { ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1 / s; ctx.stroke(); }
        if (!faded) shown++;
      });
      ctx.globalAlpha = 1;
    }
    // Trees on top.
    if (s > 0.35) {
      once('trees', function (tr) {
        if (tr.x < vb[0] - 6 || tr.x > vb[2] + 6 || tr.y < vb[1] - 6 || tr.y > vb[3] + 6) return;
        if (detail) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.arc(tr.x + tr.r * 0.5, tr.y + tr.r * 0.45, tr.r, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = tr.s < 0.5 ? '#2f5a27' : '#3b6b2e'; ctx.beginPath(); ctx.arc(tr.x, tr.y, tr.r, 0, Math.PI * 2); ctx.fill();
        if (detail) { ctx.fillStyle = 'rgba(150,200,100,0.3)'; ctx.beginPath(); ctx.arc(tr.x - tr.r * 0.3, tr.y - tr.r * 0.3, tr.r * 0.5, 0, Math.PI * 2); ctx.fill(); }
      });
    }
    // Terrain as a soft relief on top (multiply), not a color of its own.
    if (opt.terrain) {
      ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.35;
      // Only the part on screen: the image covers the whole map.
      var RX = opt.terrain.width / P.w, RY = opt.terrain.height / P.h, ax = Math.max(0, vb[0]), ay = Math.max(0, vb[1]), bx = Math.min(P.w, vb[2]), by = Math.min(P.h, vb[3]);
      if (bx > ax && by > ay) ctx.drawImage(opt.terrain, ax * RX, ay * RY, (bx - ax) * RX, (by - ay) * RY, ax, ay, bx - ax, by - ay);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    }
    // Past the partido's border: dark, with a soft edge (you can't go there).
    if (P.border) {
      ctx.beginPath();
      ctx.rect(vb[0] - 10, vb[1] - 10, vb[2] - vb[0] + 20, vb[3] - vb[1] + 20);
      P.border.forEach(function (q, i) { if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); });
      ctx.closePath();
      ctx.fillStyle = 'rgba(6,7,10,0.86)'; ctx.fill('evenodd');
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(6,7,10,0.45)'; ctx.lineWidth = 8; path(ctx, P.border, true); ctx.stroke();
      ctx.strokeStyle = 'rgba(6,7,10,0.6)'; ctx.lineWidth = 3; ctx.stroke();
    }
    ctx.restore();
    return shown;
  };
})(this.Lluvia = this.Lluvia || {});
