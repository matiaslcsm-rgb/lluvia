// The city in the browser: drawing it, picking where you start on a world map, and downloading the streets.
(function (L) {
  'use strict';

  // ---- Drawing ----
  var ROAD = { motorway: '#4a4d57', trunk: '#4a4d57', primary: '#454852', secondary: '#42454e', tertiary: '#3f424b' };

  function bboxOf(pts) {
    var b = [Infinity, Infinity, -Infinity, -Infinity];
    pts.forEach(function (p) { b[0] = Math.min(b[0], p[0]); b[1] = Math.min(b[1], p[1]); b[2] = Math.max(b[2], p[0]); b[3] = Math.max(b[3], p[1]); });
    return b;
  }

  function path(ctx, pts, close) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    if (close) ctx.closePath();
  }

  var ROOFS = ['#8c4b3a', '#7a6a58', '#5f6670', '#9a7b55', '#6b4f45', '#56604f', '#8a8a80', '#a0603f'];
  var SHOPS = ['#c9b79c', '#b8c2c9', '#d1c3a6'];
  var CARS = ['#b03a3a', '#e6e6e6', '#2f3b52', '#3d3d3d', '#c9a227', '#4f6f8f', '#8a8f96'];

  function poly(ctx, pts) {
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
  }

  // Calls fn(item) once for every item of a kind (houses, cars, trees...) in the chunks that touch a box (in px).
  // One walker shares its "already drawn" list across kinds, like a frame does.
  function chunkWalker(city, x0, y0, x1, y1) {
    var S = L.data.city.chunk, cols = city.chunkCols, seen = [];
    if (city.chunks) {
      for (var cy = Math.max(0, Math.floor(y0 / S)); cy <= Math.min(city.chunkRows - 1, Math.floor(y1 / S)); cy++) {
        for (var cx = Math.max(0, Math.floor(x0 / S)); cx <= Math.min(cols - 1, Math.floor(x1 / S)); cx++) {
          var c = city.chunks[cy * cols + cx];
          if (c) seen.push(c);
        }
      }
    }
    var drawn = new Set();
    var each = function (kind, fn) { seen.forEach(function (c) { c[kind].forEach(function (it) { if (!drawn.has(it)) { drawn.add(it); fn(it); } }); }); };
    each.clear = function () { drawn.clear(); };
    return each;
  }

  // ---- The real map, drawn once per tile ----
  // At 1:1 a screen of the real map is hundreds of paths and textures, too slow to paint every frame. So each
  // TILE × TILE meters is drawn once into its own picture (ground, streets, parked cars, roofs, trees, relief) and
  // then only copied. The tiles around the screen are made ahead, one per frame, and the oldest are dropped.
  var TILE = 16;
  L.mapTile = TILE;

  // A tile of one layer: 'ground' (everything under the people) or 'over' (the treetops). An 'over' tile with no
  // treetop is just `false`, to keep no empty picture.
  function makeTile(city, tx, ty, layer) {
    var s = city.scale, size = Math.ceil(TILE * s), X = tx * TILE, Y = ty * TILE, pad = 20;
    var c = document.createElement('canvas');
    c.width = c.height = size + 2; // a pixel of overlap on every side, so no seam shows between tiles
    var x = c.getContext('2d');
    x.translate(1, 1); x.scale(s, s); x.translate(-X, -Y);
    // Things just outside the tile still reach into it (a shadow, a tree), so the drawing looks a bit around it.
    var each = chunkWalker(city, (X - pad) * s, (Y - pad) * s, (X + TILE + pad) * s, (Y + TILE + pad) * s);
    var drawn = L.mapdraw.draw(x, city.map, { layer: layer, view: [X - pad, Y - pad, X + TILE + pad, Y + TILE + pad], scale: s, terrain: L.mapdraw.terrain(city.map),
      under: function () { x.save(); x.scale(1 / s, 1 / s); drawCars(x, each, s); x.restore(); } });
    return layer === 'over' && !drawn ? false : c;
  }

  function tileCache(city, layer) {
    var all = city._tiles || (city._tiles = {});
    return all[layer] || (all[layer] = new Map()); // Map order = least recently used first
  }

  // Tiles around the screen are made ahead between frames, when the browser is idle, at most one every
  // AHEAD_EVERY ms: making one takes about 16 ms, and walking across a whole tile takes about 4 s.
  var AHEAD_EVERY = 200, aheadAt = 0, aheadQueued = false;
  function makeAhead(city, layer, key, tx, ty) {
    var now = Date.now();
    if (aheadQueued || now - aheadAt < AHEAD_EVERY) return;
    aheadQueued = true; aheadAt = now;
    var run = function () {
      aheadQueued = false;
      var tiles = tileCache(city, layer);
      if (!tiles.has(key)) tiles.set(key, makeTile(city, tx, ty, layer));
    };
    if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 1000 }); else setTimeout(run, 0);
  }

  // Draws one layer's tiles that cover the screen (camera in px) and asks for one missing tile around it.
  // Returns how many tiles had to be made right away this frame.
  L.drawMapTiles = function (ctx, city, camX, camY, W, H, layer) {
    layer = layer || 'ground';
    var s = city.scale, T = TILE * s, tiles = tileCache(city, layer);
    var cols = Math.ceil(city.map.w / TILE), rows = Math.ceil(city.map.h / TILE);
    var tx0 = Math.floor(camX / T), ty0 = Math.floor(camY / T), tx1 = Math.floor((camX + W) / T), ty1 = Math.floor((camY + H) / T);
    var made = 0;
    var get = function (tx, ty) {
      var key = ty * cols + tx, c = tiles.get(key);
      if (c !== undefined) { tiles.delete(key); tiles.set(key, c); return c; }
      c = makeTile(city, tx, ty, layer); made++;
      tiles.set(key, c);
      return c;
    };
    for (var ty = Math.max(0, ty0); ty <= Math.min(rows - 1, ty1); ty++) {
      for (var tx = Math.max(0, tx0); tx <= Math.min(cols - 1, tx1); tx++) {
        var c = get(tx, ty);
        if (c) ctx.drawImage(c, tx * T - 1, ty * T - 1);
      }
    }
    // One tile ahead, from the ring around the screen.
    search: for (ty = Math.max(0, ty0 - 1); ty <= Math.min(rows - 1, ty1 + 1); ty++) {
      for (tx = Math.max(0, tx0 - 1); tx <= Math.min(cols - 1, tx1 + 1); tx++) {
        if (!tiles.has(ty * cols + tx)) { makeAhead(city, layer, ty * cols + tx, tx, ty); break search; }
      }
    }
    // Keep the screen, its ring and a few more (each tile is about 2.5 MB at 1:1).
    var keep = (tx1 - tx0 + 3) * (ty1 - ty0 + 3) + 6;
    while (tiles.size > keep) tiles.delete(tiles.keys().next().value);
    return made;
  };

  // ---- Buildings standing up ----
  // Seen from a camera CAMERA_H meters over the middle of the screen (m), a point h meters up lands at
  // m + (point - m) × CAMERA_H / (CAMERA_H - h): the roof is the footprint grown from the middle of the screen,
  // and you see the walls that face you. Lower buildings go first, so taller ones cover them.
  // 30 m reads well on screen: a two-floor house shows a wall of about a third of its distance to you.
  var CAMERA_H = 30, MAX_H = 0.6 * CAMERA_H, FLOOR_H = 3;
  var WALLS = {
    house: ['#d8cdb9', '#cbbfa8', '#e2d8c6', '#bfae94', '#9c5a3f', '#d9c7a3'], // whitewash and some brick
    concrete: ['#c9c4bb', '#b9b4ab', '#d2cdc2'],
    metal: ['#9aa0a3', '#8a9094', '#a8adb0']
  };
  var LIGHT = [-Math.SQRT1_2, -Math.SQRT1_2]; // sun from the north-west, like the shadows

  function wallColor(bd) {
    var set = /galp|indus|garage|estaci/.test(bd.kind) ? WALLS.metal : /depart|edificio|oficina|salud|escuela|p[uú]blico/.test(bd.kind) ? WALLS.concrete : WALLS.house;
    return set[bd.i % set.length];
  }

  function shade(hex, k) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgb(' + Math.round((n >> 16) * k) + ',' + Math.round(((n >> 8) & 255) * k) + ',' + Math.round((n & 255) * k) + ')';
  }

  function insideBorder(P, x, y) {
    var p = P.border, c = false;
    for (var i = 0, j = p.length - 1; i < p.length; j = i++) {
      if ((p[i][1] > y) !== (p[j][1] > y) && x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) c = !c;
    }
    return c;
  }

  // ---- Inside a house ----
  // The building you are in (js/interiors.js) loses its roof: you see its rooms, each with its floor, its walls and
  // doors, the stairs and the rooms' names. Walking up or down a stair the floor you leave fades out and the next
  // one fades in, by how high you are. Drawn under the people. L.drawCityBuildings then darkens the city outside.
  L.drawCityInterior = function (ctx, city, who) {
    var plan = who.house && (who.floor || who.z) ? who.house : city.map && L.cityHouseAt ? L.cityHouseAt(city, who.x, who.y) : null;
    city._inside = plan;
    if (!plan) return;
    var z = L.clamp(who.z || 0, plan.bottom || 0, plan.top || 0), lo = Math.floor(z), k = z - lo;
    ctx.save(); ctx.scale(city.scale, city.scale);
    if (k < 1 && L.planLevel(plan, lo)) drawLevel(ctx, city, plan, lo);
    if (k > 0 && L.planLevel(plan, lo + 1)) { ctx.globalAlpha = k; drawLevel(ctx, city, plan, lo + 1); ctx.globalAlpha = 1; }
    ctx.restore();
  };

  // Floor `fl` of a building (0 the ground floor).
  function drawLevel(ctx, city, plan, fl) {
    var Hd = L.data.houses, s = city.scale, f = plan.frame, cs = plan.cell, W = plan.W, level = L.planLevel(plan, fl), upper = fl !== 0;
    // In the house's own frame, in cells: floors room by room (in rows of cells), the stair, then the walls.
    ctx.save(); ctx.transform(f.ux * cs, f.uy * cs, f.vx * cs, f.vy * cs, f.ox, f.oy);
    level.rooms.forEach(function (r, k) {
      if (!r.cells) return;
      ctx.fillStyle = (Hd.rooms[r.type] || Hd.rooms.living).floor;
      ctx.beginPath();
      for (var y = 0; y < plan.D; y++) {
        for (var x = 0; x < W;) {
          if (level.lab[y * W + x] !== k) { x++; continue; }
          var x0 = x;
          while (x < W && level.lab[y * W + x] === k) x++;
          ctx.rect(x0 - 0.02, y - 0.02, x - x0 + 0.04, 1.04);
        }
      }
      ctx.fill();
    });
    var searched = city._searched, left = city._leftover;
    (level.furniture || []).forEach(function (q, k) {
      var key = plan.index + ':' + fl + ':' + k, done = searched && searched.has(key) && !(left && left.has(key));
      if (done) ctx.globalAlpha *= 0.55; // searched: emptied, faded
      drawPiece(ctx, q, cs);
      if (done) ctx.globalAlpha /= 0.55;
    });
    (level.doors || []).forEach(function (g) { drawDoor(ctx, plan, level, g, null); });
    if (!upper) plan.exits.forEach(function (e) { drawDoor(ctx, plan, level, e.seg, e.dir); });
    (plan.stairs || []).forEach(function (st) {
      if (st.from === fl) drawStair(ctx, st, false);
      else if (st.from + 1 === fl) drawStair(ctx, st, true);
    });
    ctx.lineCap = 'square';
    ctx.beginPath();
    level.walls.forEach(function (w) { ctx.moveTo(w[0], w[1]); ctx.lineTo(w[2], w[3]); });
    ctx.strokeStyle = Hd.wallEdge; ctx.lineWidth = 0.45; ctx.stroke();
    ctx.strokeStyle = Hd.wall; ctx.lineWidth = 0.28; ctx.stroke();
    // The fog of war inside: what you haven't seen of this floor is dark (js/explored.js), with soft edges.
    var fog = insideFog(city._explored, plan, fl);
    if (fog) { ctx.imageSmoothingEnabled = true; ctx.drawImage(fog, -1, -1, W + 2, plan.D + 2); }
    ctx.restore();
    // The outer wall, then (on the ground floor) the front and back doorways cut into it.
    ctx.lineJoin = 'miter';
    ctx.beginPath();
    plan.outline.forEach(function (q, i) { if (i) ctx.lineTo(q[0] / s, q[1] / s); else ctx.moveTo(q[0] / s, q[1] / s); });
    ctx.closePath();
    ctx.strokeStyle = Hd.wallEdge; ctx.lineWidth = 0.34; ctx.stroke();
    ctx.strokeStyle = Hd.wall; ctx.lineWidth = 0.2; ctx.stroke();
    if (!upper) plan.exits.forEach(function (e) {
      var a = L.housePoint(plan, e.seg[0], e.seg[1]), b = L.housePoint(plan, e.seg[2], e.seg[3]);
      ctx.strokeStyle = '#6b6158'; ctx.lineWidth = 0.3; ctx.lineCap = 'butt';
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    });
    // Windows: a pane of glass in the outer wall, with its frame.
    ctx.lineCap = 'butt';
    (level.windows || []).forEach(function (w) {
      ctx.beginPath(); ctx.moveTo(w[0], w[1]); ctx.lineTo(w[2], w[3]);
      ctx.strokeStyle = '#f2efe8'; ctx.lineWidth = 0.3; ctx.stroke();
      ctx.strokeStyle = '#8fc3d8'; ctx.lineWidth = 0.1; ctx.stroke();
    });
    // Room names, upright.
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '600 0.42px system-ui, sans-serif'; ctx.fillStyle = 'rgba(40,30,20,0.5)';
    var X = city._explored, mem = X && X.inside[plan.index + ':' + fl];
    level.rooms.forEach(function (r) {
      var name = (Hd.rooms[r.type] || {}).name;
      if (!name || r.cells < 12) return;
      if (X && !(mem && mem[Math.floor(r.cy) * W + Math.floor(r.cx)])) return; // a room you haven't seen: no name
      var m = L.housePoint(plan, r.cx, r.cy);
      ctx.fillText(name, m[0], m[1]);
    });
  }

  // The fog of a building's floor: a picture with one pixel per cell (and a border of one), dark where you haven't
  // seen. Made again only when what you saw there changed. Null if you saw it all or there is no memory.
  var fogs = new Map();
  function insideFog(X, plan, fl) {
    if (!X) return null;
    var key = plan.index + ':' + fl, mem = X.inside[key], ver = X.ver[key] || 0, f = fogs.get(key);
    if (f && f.ver === ver && f.X === X) return f.any ? f.cv : null;
    var W = plan.W, D = plan.D, level = L.planLevel(plan, fl), cv = f ? f.cv : document.createElement('canvas');
    cv.width = W + 2; cv.height = D + 2;
    var c = cv.getContext('2d'), img = c.createImageData(W + 2, D + 2), d = img.data, any = false;
    for (var y = 0; y < D; y++) for (var x = 0; x < W; x++) {
      var k = y * W + x;
      if (mem && mem[k] || !level.lab || level.lab[k] < 0) continue;
      var o = ((y + 1) * (W + 2) + x + 1) * 4;
      d[o] = 12; d[o + 1] = 12; d[o + 2] = 10; d[o + 3] = 255; any = true;
    }
    c.putImageData(img, 0, 0);
    fogs.set(key, { ver: ver, X: X, cv: cv, any: any });
    return any ? cv : null;
  }

  // A door between rooms (or, with `out`, a doorway to the street: it opens inward), seen from above: the leaf open
  // a right angle into the room (not into a corridor) and the arc it swings. In cells of the house's frame.
  function drawDoor(ctx, plan, level, g, out) {
    var dx = g[2] - g[0], dy = g[3] - g[1], len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
    if (out) { if (nx * out[0] + ny * out[1] > 0) { nx = -nx; ny = -ny; } } else {
      var mx = (g[0] + g[2]) / 2, my = (g[1] + g[3]) / 2, W = plan.W;
      var roomAt = function (k) {
        var x = Math.floor(mx + nx * k), y = Math.floor(my + ny * k), r = x >= 0 && y >= 0 && x < W && y < plan.D ? level.rooms[level.lab[y * W + x]] : null;
        return r ? r.type : '';
      };
      if (/pasillo|palier|hall/.test(roomAt(0.5)) && !/pasillo|palier|hall/.test(roomAt(-0.5))) { nx = -nx; ny = -ny; }
    }
    var hx = g[0], hy = g[1], ex = hx + nx * len, ey = hy + ny * len, a0 = Math.atan2(dy, dx), a1 = Math.atan2(ny, nx);
    var d = a1 - a0;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    ctx.strokeStyle = 'rgba(60,45,30,0.35)'; ctx.lineWidth = 0.05;
    ctx.beginPath(); ctx.arc(hx, hy, len, a0, a1, d < 0); ctx.stroke();
    ctx.strokeStyle = out ? '#6e4a2c' : '#8a6440'; ctx.lineWidth = 0.14; ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(ex, ey); ctx.stroke();
  }

  // Furniture (js/furnish.js), each piece drawn in meters with its back at y = -d/2 and its front toward +y.
  var WOOD = '#6f4f33', DARK = '#4a3b2e', WHITE = '#ece9e2', STEEL = '#8d949a';
  function box(c, x, y, w, h, fill, line) {
    c.fillStyle = fill; c.fillRect(x, y, w, h);
    if (line) { c.strokeStyle = line; c.lineWidth = 0.03; c.strokeRect(x, y, w, h); }
  }
  function dot(c, x, y, r, fill) { c.fillStyle = fill; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
  function goods(c, x0, x1, y, h, k) {
    var COL = ['#c0533a', '#e0b13a', '#3a7bbf', '#5a9a4a'];
    for (var x = x0, i = k; x < x1 - 0.2; x += 0.3, i++) box(c, x, y, 0.22, h, COL[i % 4]);
  }
  var PIECES = {
    cama: function (c, w, d) {
      box(c, -w / 2, -d / 2, w, d, '#e6dfd2', DARK);
      box(c, -w / 2, -d / 2 + d * 0.3, w, d * 0.7, '#7d93a8'); // the blanket
      var n = w > 1.1 ? 2 : 1, pw = w / n - 0.12;
      for (var i = 0; i < n; i++) box(c, -w / 2 + 0.06 + i * (pw + 0.12), -d / 2 + 0.06, pw, 0.3, WHITE, '#bdb6a8');
    },
    ropero: function (c, w, d) { box(c, -w / 2, -d / 2, w, d, WOOD, DARK); c.beginPath(); c.moveTo(0, -d / 2); c.lineTo(0, d / 2); c.stroke(); },
    mesita: function (c, w, d) { box(c, -w / 2, -d / 2, w, d, WOOD, DARK); dot(c, 0, 0, 0.1, '#e8d9a0'); },
    sillon: function (c, w, d) {
      box(c, -w / 2, -d / 2, w, d, '#5e6b5a', DARK);
      box(c, -w / 2 + 0.18, -d / 2 + 0.25, w - 0.36, d - 0.3, '#738270');
    },
    tele: function (c, w, d) { box(c, -w / 2, -d / 2, w, d, WOOD); box(c, -w * 0.4, -d / 2 + 0.05, w * 0.8, 0.08, '#1d1f22'); },
    mesa: function (c, w, d) {
      var tw = Math.max(0.6, w - 0.9), td = Math.max(0.6, d - 0.9);
      for (var i = 0; i < 2; i++) { // chairs on the long sides
        box(c, -tw / 4 - 0.2 + i * tw / 2, -td / 2 - 0.42, 0.4, 0.38, '#7b5a3c', DARK);
        box(c, -tw / 4 - 0.2 + i * tw / 2, td / 2 + 0.04, 0.4, 0.38, '#7b5a3c', DARK);
      }
      box(c, -tw / 2, -td / 2, tw, td, '#9a7148', DARK);
    },
    mesada: function (c, w, d) {
      box(c, -w / 2, -d / 2, w, d, '#cfcac0', '#7c766c');
      box(c, -w / 2 + 0.15, -d / 2 + 0.1, 0.5, d - 0.2, STEEL); // the sink
      if (w > 1.5) for (var i = 0; i < 4; i++) dot(c, w / 2 - 0.45 + (i % 2) * 0.25, -d / 2 + 0.18 + (i >> 1) * 0.25, 0.08, '#3b3b3b');
    },
    heladera: function (c, w, d) { box(c, -w / 2, -d / 2, w, d, WHITE, '#9a968e'); },
    lavarropas: function (c, w, d) { box(c, -w / 2, -d / 2, w, d, WHITE, '#9a968e'); dot(c, 0, 0, w * 0.3, '#9fb3bf'); },
    pileta: function (c, w, d) { box(c, -w / 2, -d / 2, w, d, '#cfcac0', '#7c766c'); box(c, -w / 2 + 0.08, -d / 2 + 0.08, w - 0.16, d - 0.16, STEEL); },
    inodoro: function (c, w, d) {
      box(c, -w / 2, -d / 2, w, 0.2, WHITE, '#9a968e');
      c.fillStyle = WHITE; c.strokeStyle = '#9a968e'; c.lineWidth = 0.03;
      c.beginPath(); c.ellipse(0, d / 2 - 0.25, w / 2 - 0.02, 0.25, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    },
    lavatorio: function (c, w, d) {
      box(c, -w / 2, -d / 2, w, d, WHITE, '#9a968e');
      c.fillStyle = '#c4d1d8'; c.beginPath(); c.ellipse(0, 0.03, w * 0.3, d * 0.3, 0, 0, Math.PI * 2); c.fill();
    },
    ducha: function (c, w, d) {
      box(c, -w / 2, -d / 2, w, d, '#c9d6dc', '#8aa0aa');
      c.beginPath(); c.moveTo(-w / 2, -d / 2); c.lineTo(w / 2, d / 2); c.moveTo(w / 2, -d / 2); c.lineTo(-w / 2, d / 2); c.stroke();
      dot(c, 0, 0, 0.05, '#5d6b72');
    },
    tanque: function (c, w) { dot(c, 0, 0, w / 2, '#2f3b46'); dot(c, 0, 0, w / 2 - 0.12, '#3d4b58'); },
    soga: function (c, w) {
      c.strokeStyle = '#d8d2c4'; c.lineWidth = 0.03; c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(w / 2, 0); c.stroke();
      dot(c, -w / 2, 0, 0.05, STEEL); dot(c, w / 2, 0, 0.05, STEEL);
    },
    motor: function (c, w, d) { box(c, -w / 2, -d / 2, w, d, '#5c6168', '#2e3236'); dot(c, 0, 0, d * 0.3, '#3d4146'); },
    estante: function (c, w, d) { box(c, -w / 2, -d / 2, w, d, '#7a6a55', DARK); goods(c, -w / 2 + 0.1, w / 2, -d / 2 + 0.08, d - 0.16, 0); },
    cajas: function (c, w, d) {
      box(c, -w / 2, -d / 2, w * 0.55, d * 0.55, '#b48f5c', '#6e5232');
      box(c, -w / 2 + w * 0.4, -d / 2 + d * 0.35, w * 0.6, d * 0.65, '#a7834f', '#6e5232');
    },
    banco: function (c, w, d) { box(c, -w / 2, -d / 2, w, d, '#8b6a45', DARK); },
    // A workbench, with a vise and a few tools on it.
    taller: function (c, w, d) {
      box(c, -w / 2, -d / 2, w, d, '#7a5a3c', DARK);
      box(c, w / 2 - 0.35, -d / 2 + 0.08, 0.25, 0.3, '#5c6168');
      box(c, -w / 2 + 0.2, -d / 2 + 0.15, 0.5, 0.06, '#8d949a'); box(c, -w / 2 + 0.3, -d / 2 + 0.3, 0.35, 0.05, '#6b4a2e');
    },
    auto: function (c, w, d) {
      c.fillStyle = '#7d2f2a'; c.beginPath();
      if (c.roundRect) c.roundRect(-w / 2, -d / 2, w, d, 0.4); else c.rect(-w / 2, -d / 2, w, d);
      c.fill();
      box(c, -w / 2 + 0.2, d / 2 - 1.5, w - 0.4, 0.6, '#2b3138'); // windshield
      box(c, -w / 2 + 0.25, -d / 2 + 0.5, w - 0.5, 0.4, '#2b3138');
    },
    mostrador: function (c, w, d) { box(c, -w / 2, -d / 2, w, d, '#8a6a4b', DARK); box(c, w / 2 - 0.5, -d / 2 + 0.12, 0.35, 0.3, '#3a3a3a'); },
    gondola: function (c, w, d) {
      box(c, -w / 2, -d / 2, w, d, '#bfc3c6', '#6c7176');
      goods(c, -w / 2 + 0.08, w / 2, -d / 2 + 0.06, d / 2 - 0.1, 0);
      goods(c, -w / 2 + 0.08, w / 2, 0.04, d / 2 - 0.1, 2);
    },
    maquina: function (c, w, d) {
      box(c, -w / 2, -d / 2, w, d, '#5f7a6a', '#2d3a32');
      box(c, -w / 2 + 0.2, -d / 2 + 0.2, w * 0.4, d - 0.4, '#4b6254');
      dot(c, w / 4, 0, d * 0.25, '#c9a640');
    },
    escritorio: function (c, w, d) {
      box(c, -w / 2, -d / 2, w, 0.7, '#7a5a3c', DARK);
      box(c, -0.25, -d / 2 + 0.1, 0.5, 0.06, '#1d1f22'); // a screen
      dot(c, 0, -d / 2 + 0.95, 0.22, '#3b3f44');        // the chair
    },
    archivero: function (c, w, d) { box(c, -w / 2, -d / 2, w, d, '#7c848a', '#43494e'); },
    altar: function (c, w, d) {
      box(c, -w / 2, -d / 2, w, d, '#e8e2d2', '#8a7a5a');
      box(c, -0.04, -d / 2 + 0.1, 0.08, 0.5, '#b08d3c'); box(c, -0.18, -d / 2 + 0.22, 0.36, 0.08, '#b08d3c');
    },
    pizarron: function (c, w, d) { box(c, -w / 2, -d / 2, w, Math.max(d, 0.12), '#2f4a3a', '#1c2a22'); },
    pupitre: function (c, w, d) { box(c, -w / 2, -d / 2, w, 0.45, '#a07a50', DARK); dot(c, 0, d / 2 - 0.18, 0.17, '#4d5b68'); },
    camilla: function (c, w, d) { box(c, -w / 2, -d / 2, w, d, '#a9c0bf', '#5f7574'); box(c, -w / 2 + 0.05, -d / 2 + 0.05, w - 0.1, 0.35, WHITE); }
  };
  function drawPiece(ctx, q, cs) {
    var draw = PIECES[q.t];
    if (!draw) return;
    ctx.save();
    ctx.translate(q.cx, q.cy);
    ctx.rotate(Math.atan2(-q.face[0], q.face[1])); // its front (+y) toward `face`
    ctx.scale(1 / cs, 1 / cs);
    draw(ctx, q.w, q.d);
    ctx.restore();
  }

  // A flight of steps (in cells of the house's frame), a step every 20 cm. From below, the steps get lighter toward
  // the top; from above (the stairwell) they get darker going down.
  function drawStair(ctx, st, fromAbove) {
    var along = st.axis === 'y' ? st.y1 - st.y0 : st.x1 - st.x0, steps = Math.round(along * 0.5 / 0.2);
    for (var i = 0; i < steps; i++) {
      var t = (i + 0.5) / steps, a0 = i / steps, a1 = (i + 1) / steps;
      if (st.up < 0) { a0 = 1 - (i + 1) / steps; a1 = 1 - i / steps; }
      var light = fromAbove ? 0.85 - t * 0.55 : 0.55 + t * 0.4;
      ctx.fillStyle = 'rgb(' + Math.round(170 * light) + ',' + Math.round(135 * light) + ',' + Math.round(95 * light) + ')';
      if (st.axis === 'y') ctx.fillRect(st.x0, st.y0 + along * a0, st.x1 - st.x0, along * (a1 - a0) + 0.02);
      else ctx.fillRect(st.x0 + along * a0, st.y0, along * (a1 - a0) + 0.02, st.y1 - st.y0);
    }
    // The nosing of every step.
    ctx.strokeStyle = 'rgba(40,25,15,0.45)'; ctx.lineWidth = 0.06; ctx.beginPath();
    for (i = 1; i < steps; i++) {
      var k = i / steps * along;
      if (st.axis === 'y') { ctx.moveTo(st.x0, st.y0 + k); ctx.lineTo(st.x1, st.y0 + k); } else { ctx.moveTo(st.x0 + k, st.y0); ctx.lineTo(st.x0 + k, st.y1); }
    }
    ctx.stroke();
  }

  // A doormat outside every doorway of a house you can walk into, so you can tell from the street.
  function doormats(ctx, plan, s) {
    plan.exitsPx.forEach(function (e) {
      ctx.save(); ctx.translate(e.x / s + e.nx * 0.35, e.y / s + e.ny * 0.35); ctx.rotate(Math.atan2(e.ny, e.nx));
      ctx.fillStyle = '#5b4330'; ctx.fillRect(-0.25, -0.55, 0.5, 1.1);
      ctx.restore();
    });
  }

  L.drawCityBuildings = function (ctx, city, camX, camY, W, H) {
    if (!city.map) return;
    var s = city.scale, P = L.mapdraw.prepare(city.map), mx = (camX + W / 2) / s, my = (camY + H / 2) / s;
    // A tall building whose base is off screen can still lean into it: look a bit around the screen.
    var pad = 30, vb = [camX / s - pad, camY / s - pad, (camX + W) / s + pad, (camY + H) / s + pad], list = [], seen = new Set();
    for (var cy = Math.max(0, Math.floor(vb[1] / P.CH)); cy <= Math.min(P.rows - 1, Math.floor(vb[3] / P.CH)); cy++) {
      for (var cx = Math.max(0, Math.floor(vb[0] / P.CH)); cx <= Math.min(P.cols - 1, Math.floor(vb[2] / P.CH)); cx++) {
        var c = P.chunks[cy * P.cols + cx];
        if (!c) continue;
        c.buildings.forEach(function (bd) {
          if (seen.has(bd) || bd.b[2] < vb[0] || bd.b[0] > vb[2] || bd.b[3] < vb[1] || bd.b[1] > vb[3]) return;
          seen.add(bd);
          // Past the partido's border buildings stay flat, in the dark.
          if (bd.inBorder === undefined) bd.inBorder = !P.border || insideBorder(P, (bd.b[0] + bd.b[2]) / 2, (bd.b[1] + bd.b[3]) / 2);
          // The house you are in has no roof now (L.drawCityInterior).
          if (bd.inBorder && !(city._inside && city._inside.index === bd.i)) list.push(bd);
        });
      }
    }
    list.sort(function (a, b) { return L.mapdraw.height(a) - L.mapdraw.height(b); });
    ctx.save(); ctx.scale(s, s);
    ctx.lineJoin = 'round';
    list.forEach(function (bd) { var plan = L.cityHouse && L.cityHouse(city, bd.i); if (plan) doormats(ctx, plan, s); });
    list.forEach(function (bd) {
      var real = L.mapdraw.height(bd), h = Math.min(MAX_H, real), k = h / (CAMERA_H - h), p = bd.p, n = p.length;
      if (bd.area === undefined) { bd.area = 0; for (var i = 0; i < n; i++) { var q = p[i], r = p[(i + 1) % n]; bd.area += q[0] * r[1] - r[0] * q[1]; } }
      var sign = bd.area > 0 ? 1 : -1, base = wallColor(bd);
      // Where a point at height `part` of the wall lands (part 1 = the roof).
      var up = function (v, part) { return [v[0] + (v[0] - mx) * k * part, v[1] + (v[1] - my) * k * part]; };
      // The walls that face the middle of the screen, lit by how much they face the sun.
      for (i = 0; i < n; i++) {
        var a = p[i], b = p[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
        if (len < 0.05) continue;
        var nx = sign * dy / len, ny = -sign * dx / len;
        if (nx * ((a[0] + b[0]) / 2 - mx) + ny * ((a[1] + b[1]) / 2 - my) >= 0) continue;
        var at = up(a, 1), bt = up(b, 1);
        ctx.fillStyle = shade(base, 0.7 + 0.3 * Math.max(0, nx * LIGHT[0] + ny * LIGHT[1]));
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(bt[0], bt[1]); ctx.lineTo(at[0], at[1]); ctx.closePath();
        ctx.fill();
        // A line at every floor, so a tall building reads as tall.
        if (bd.floors > 1) {
          ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 0.12; ctx.beginPath();
          for (var f = 1; f < bd.floors; f++) {
            var t = Math.min(1, f * FLOOR_H / real), af = up(a, t), bf = up(b, t);
            ctx.moveTo(af[0], af[1]); ctx.lineTo(bf[0], bf[1]);
          }
          ctx.stroke();
        }
      }
      // The roof: the footprint grown from the middle of the screen.
      ctx.save(); ctx.translate(mx, my); ctx.scale(1 + k, 1 + k); ctx.translate(-mx, -my);
      L.mapdraw.roof(ctx, bd, s * (1 + k));
      ctx.restore();
    });
    // Inside a house, the city outside it goes darker.
    var inside = city._inside;
    if (inside) {
      ctx.beginPath();
      ctx.rect(vb[0], vb[1], vb[2] - vb[0], vb[3] - vb[1]);
      inside.outline.forEach(function (q, i) { if (i) ctx.lineTo(q[0] / s, q[1] / s); else ctx.moveTo(q[0] / s, q[1] / s); });
      ctx.closePath();
      ctx.fillStyle = 'rgba(8,9,14,0.45)'; ctx.fill('evenodd');
    }
    ctx.restore();
  };

  // The layer over the people (treetops), with a soft see-through circle around (px, py): under a tree you still
  // see yourself. Drawn into a screen-sized picture first, so the circle only clears the treetops.
  var SEE_THROUGH = 1.8; // meters
  var overCanvas = null;
  L.drawCityOver = function (ctx, city, camX, camY, W, H, px, py) {
    if (!city.map) return;
    if (!overCanvas) overCanvas = document.createElement('canvas');
    if (overCanvas.width !== W || overCanvas.height !== H) { overCanvas.width = W; overCanvas.height = H; }
    var o = overCanvas.getContext('2d'), r = SEE_THROUGH * city.scale;
    o.setTransform(1, 0, 0, 1, 0, 0);
    o.clearRect(0, 0, W, H);
    o.translate(-camX, -camY);
    L.drawMapTiles(o, city, camX, camY, W, H, 'over');
    o.globalCompositeOperation = 'destination-out';
    var hole = o.createRadialGradient(px, py, r * 0.55, px, py, r);
    hole.addColorStop(0, 'rgba(0,0,0,0.85)'); hole.addColorStop(1, 'rgba(0,0,0,0)');
    o.fillStyle = hole; o.fillRect(px - r, py - r, r * 2, r * 2);
    o.globalCompositeOperation = 'source-over';
    ctx.drawImage(overCanvas, camX, camY);
  };

  // Yards, plazas, sidewalks with their curb, asphalt; then parked cars, buildings with their shadow, and trees.
  // Only what is on screen is drawn: roads by their box, the rest by chunks (js/city.js).
  L.drawCity = function (ctx, city, camX, camY, W, H, t) {
    var s = city.scale || L.data.city.scale;
    if (!city._boxes) {
      city.roads.forEach(function (r) { r.box = bboxOf(r.pts); });
      city.parks.forEach(function (p) { p.box = bboxOf(p.pts); });
      city._boxes = true;
    }
    var x0 = camX - 60, y0 = camY - 60, x1 = camX + W + 60, y1 = camY + H + 60;
    var on = function (b, pad) { return b[2] + pad > x0 && b[0] - pad < x1 && b[3] + pad > y0 && b[1] - pad < y1; };
    ctx.fillStyle = '#0b0c10';
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    // The real map is drawn like the viewer (js/view/mapdraw.js, in meters), in tiles made once.
    if (city.map) {
      L.drawMapTiles(ctx, city, camX, camY, W, H);
      sunGlare(ctx, x0, y0, x1, y1, t);
      return;
    }
    var each = chunkWalker(city, x0, y0, x1, y1);
    ctx.fillStyle = '#3c4630'; // back yards: grass and dirt
    ctx.fillRect(Math.max(0, x0), Math.max(0, y0), Math.min(city.size, x1) - Math.max(0, x0), Math.min(city.size, y1) - Math.max(0, y0));
    city.parks.forEach(function (p) {
      if (!on(p.box, 0)) return;
      var paved = p.kind === 'square' || p.kind === 'plaza' || p.kind === 'pedestrian';
      ctx.fillStyle = paved ? '#77736a' : '#335e2e'; path(ctx, p.pts, true); ctx.fill();
    });
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    var visible = city.roads.filter(function (r) { return on(r.box, r.w + 8 * s); });
    var sw = L.data.city.lots.sidewalk * s;
    visible.forEach(function (r) { ctx.strokeStyle = '#8c8980'; ctx.lineWidth = r.w + sw * 2; path(ctx, r.pts); ctx.stroke(); });   // sidewalk
    visible.forEach(function (r) { ctx.strokeStyle = '#5d5b55'; ctx.lineWidth = r.w + 0.5 * s; path(ctx, r.pts); ctx.stroke(); }); // curb
    visible.forEach(function (r) { ctx.strokeStyle = ROAD[r.kind] || '#3a3c42'; ctx.lineWidth = r.w; path(ctx, r.pts); ctx.stroke(); });
    ctx.setLineDash([3 * s, 3 * s]); ctx.lineWidth = 0.25 * s; ctx.strokeStyle = 'rgba(240,230,200,0.45)';
    visible.forEach(function (r) { if (r.w >= 12 * s) { path(ctx, r.pts); ctx.stroke(); } });
    ctx.setLineDash([]);
    drawCars(ctx, each, s);
    // Buildings: a shadow to the south-east, the roof, its edge, and a ridge on houses.
    var sh = 1.2 * s;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    each('houses', function (h) { ctx.save(); ctx.translate(sh, sh); poly(ctx, h.pts); ctx.fill(); ctx.restore(); });
    each('buildings', function (b) { ctx.save(); ctx.translate(sh * 1.6, sh * 1.6); poly(ctx, b); ctx.fill(); ctx.restore(); });
    each.clear();
    ctx.lineWidth = 2; ctx.strokeStyle = '#1d1a17';
    each('buildings', function (b) { ctx.fillStyle = ROOFS[Math.abs(Math.floor(b[0][0] * 7 + b[0][1] * 3)) % ROOFS.length]; poly(ctx, b); ctx.fill(); ctx.stroke(); });
    each('houses', function (h) {
      ctx.fillStyle = h.shop ? SHOPS[h.roof % 3] : ROOFS[h.roof]; poly(ctx, h.pts); ctx.fill(); ctx.stroke();
      if (!h.shop) {
        ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(h.ridge[0], h.ridge[1]); ctx.lineTo(h.ridge[2], h.ridge[3]); ctx.stroke();
        ctx.lineWidth = 2; ctx.strokeStyle = '#1d1a17';
      }
    });
    // Trees over the sidewalk.
    each('trees', function (tr) {
      circle(ctx, tr.x + 0.6 * s, tr.y + 0.8 * s, tr.r, 'rgba(0,0,0,0.3)');
      circle(ctx, tr.x, tr.y, tr.r, tr.shade < 0.5 ? '#2f5527' : '#3a6a2c');
      circle(ctx, tr.x - tr.r * 0.3, tr.y - tr.r * 0.3, tr.r * 0.45, 'rgba(140,190,90,0.35)');
    });
    sunGlare(ctx, x0, y0, x1, y1, t);
  };

  // Parked cars: body, roof and windshields.
  function drawCars(ctx, each, s) {
    each('cars', function (c) {
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.ang);
      var hl = L.data.city.cars.length * s / 2, hw = L.data.city.cars.width * s / 2;
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-hl + 0.3 * s, -hw + 0.4 * s, hl * 2, hw * 2); // shadow 30-40 cm off
      ctx.fillStyle = CARS[c.color]; ctx.fillRect(-hl, -hw, hl * 2, hw * 2);
      ctx.fillStyle = 'rgba(20,28,36,0.85)'; ctx.fillRect(-hl * 0.45, -hw * 0.8, hl * 1.05, hw * 1.6);
      ctx.fillStyle = CARS[c.color]; ctx.fillRect(-hl * 0.25, -hw * 0.8, hl * 0.6, hw * 1.6);
      ctx.restore();
    });
  }

  // The yellow sun's glare over everything.
  function sunGlare(ctx, x0, y0, x1, y1, t) {
    ctx.fillStyle = 'rgba(255,214,60,' + (0.05 + Math.sin(t * 0.4) * 0.015) + ')';
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  }

  function circle(ctx, x, y, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }

  // What the map remembers (js/explored.js) as a picture: one pixel per square of the city, opaque where you saw.
  // Kept up to date with the squares marked since the last look.
  function exploredMask(g) {
    var X = g.explored;
    if (!X) return null;
    if (!X._mask) { X._mask = document.createElement('canvas'); X._mask.width = X.cols; X._mask.height = X.rows; X.all = true; }
    var mc = X._mask.getContext('2d');
    if (X.all) {
      var img = mc.createImageData(X.cols, X.rows), d = img.data;
      for (var k = 0; k < X.grid.length; k++) if (X.grid[k]) { d[k * 4] = d[k * 4 + 1] = d[k * 4 + 2] = 255; d[k * 4 + 3] = 255; }
      mc.putImageData(img, 0, 0);
      X.all = false; X.dirty.length = 0;
    } else if (X.dirty.length) {
      mc.fillStyle = '#fff';
      X.dirty.forEach(function (k) { mc.fillRect(k % X.cols, Math.floor(k / X.cols), 1, 1); });
      X.dirty.length = 0;
    }
    return X._mask;
  }
  L.exploredMask = exploredMask;

  // Draws the city's streets and plazas inside the box (bx, by, bw, bh) of `ctx`, at k screen px per world px,
  // centered on the world point (cx, cy).
  function drawStreets(ctx, city, cx, cy, k, bx, by, bw, bh) {
    var s = city.scale || L.data.city.scale, rx = bw / 2 / k, ry = bh / 2 / k;
    var mx = function (x) { return bx + bw / 2 + (x - cx) * k; }, my = function (y) { return by + bh / 2 + (y - cy) * k; };
    var near = function (b) { return b[2] > cx - rx && b[0] < cx + rx && b[3] > cy - ry && b[1] < cy + ry; };
    city.parks.forEach(function (pk) {
      if (!near(pk.box)) return;
      ctx.fillStyle = '#2f5a2a'; ctx.beginPath();
      pk.pts.forEach(function (q, i) { if (i) ctx.lineTo(mx(q[0]), my(q[1])); else ctx.moveTo(mx(q[0]), my(q[1])); });
      ctx.fill();
    });
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    city.roads.forEach(function (r) {
      if (!near(r.box)) return;
      ctx.strokeStyle = r.w >= 12 * s ? '#c9c2a8' : '#8a877d'; ctx.lineWidth = Math.max(1, r.w * k * 1.6);
      ctx.beginPath();
      r.pts.forEach(function (q, i) { if (i) ctx.lineTo(mx(q[0]), my(q[1])); else ctx.moveTo(mx(q[0]), my(q[1])); });
      ctx.stroke();
    });
    return { mx: mx, my: my };
  }
  // The buildings in the box (same view as drawStreets): their footprints, and inside the ones you walked into, the
  // rooms you saw (lit, with their walls) on the floor you are on there, or the ground floor.
  function drawBuildings(ctx, g, cx, cy, k, bx, by, bw, bh) {
    var city = g.city, M = city.map, s = city.scale, P = L.data.city.page, zs = city.cell * P;
    if (!M || !city.zoneB) return;
    var rx = bw / 2 / k, ry = bh / 2 / k, fp = city._fp || (city._fp = new Map()), done = new Set();
    var ox = bx + bw / 2 - cx * k, oy = by + bh / 2 - cy * k;
    var zx0 = Math.max(0, Math.floor((cx - rx) / zs)), zx1 = Math.min(city.pcols - 1, Math.floor((cx + rx) / zs));
    var zy0 = Math.max(0, Math.floor((cy - ry) / zs)), zy1 = Math.floor((cy + ry) / zs);
    ctx.fillStyle = '#4a463e'; ctx.beginPath();
    for (var zy = zy0; zy <= zy1; zy++) for (var zx = zx0; zx <= zx1; zx++) {
      (city.zoneB.get(zy * city.pcols + zx) || []).forEach(function (i) {
        if (done.has(i)) return;
        done.add(i);
        var f = fp.get(i);
        if (!f) { var raw = M.buildings[i][0], u = M.unit * s; f = []; for (var j = 0; j + 1 < raw.length; j += 2) f.push(raw[j] * u, raw[j + 1] * u); fp.set(i, f); }
        for (var q = 0; q + 1 < f.length; q += 2) { var X = ox + f[q] * k, Y = oy + f[q + 1] * k; if (q) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
        ctx.closePath();
      });
    }
    ctx.fill();
    // Inside: the rooms you saw.
    var E = g.explored, houses = city._houses, p = g.player, here = L.planHere(city, p);
    if (!E || !houses) return;
    Object.keys(E.inside).forEach(function (key) {
      var parts = key.split(':'), plan = houses.get(+parts[0]), fl = +parts[1];
      if (!plan || !done.has(plan.index) && plan !== here) return;
      if (fl !== (plan === here ? p.floor || 0 : 0)) return;
      var mem = E.inside[key], level = L.planLevel(plan, fl), f = plan.frame, cs = plan.cell, W = plan.W;
      if (!level || !level.lab) return;
      ctx.save();
      ctx.translate(ox, oy); ctx.scale(k * s, k * s);
      ctx.transform(f.ux * cs, f.uy * cs, f.vx * cs, f.vy * cs, f.ox, f.oy);
      ctx.beginPath();
      for (var y = 0; y < plan.D; y++) for (var x = 0; x < W; x++) { var c = y * W + x; if (mem[c] && level.lab[c] >= 0) ctx.rect(x - 0.03, y - 0.03, 1.06, 1.06); }
      ctx.fillStyle = '#9c927c'; ctx.fill();
      ctx.clip();
      ctx.beginPath();
      level.walls.forEach(function (w) { ctx.moveTo(w[0], w[1]); ctx.lineTo(w[2], w[3]); });
      ctx.strokeStyle = '#2a2622'; ctx.lineWidth = Math.max(0.25, 1.2 / (k * s * cs)); ctx.stroke();
      ctx.restore();
    });
  }

  // Leaves in `ctx` only what the map remembers, over the box (the same view as drawStreets).
  function keepExplored(ctx, g, cx, cy, k, bx, by, bw, bh) {
    var mask = exploredMask(g), X = g.explored;
    if (!mask) return;
    var c = X.cell, sw = bw / k / c, sh = bh / k / c;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(mask, cx / c - sw / 2, cy / c - sh / 2, sw, sh, bx, by, bw, bh);
    ctx.restore();
  }

  // Minimap (top right): the streets around you that you have seen, plazas, you in the middle, plus the name of
  // the street you are on. `range`: 260 m of city fit from the center to the edge.
  var mm = null;
  L.drawMinimap = function (ctx, g, W) {
    var city = g.city, p = g.player, s = city.scale || L.data.city.scale, size = 190, range = 260 * s, k = size / 2 / range, x0 = W - size - 14, y0 = 72;
    if (!city._boxes) return;
    if (!mm) { mm = document.createElement('canvas'); mm.width = size; mm.height = size; }
    var m = mm.getContext('2d');
    m.clearRect(0, 0, size, size);
    var at = drawStreets(m, city, p.x, p.y, k, 0, 0, size, size);
    drawBuildings(m, g, p.x, p.y, k, 0, 0, size, size);
    m.fillStyle = '#ff5a5a';
    // With the field of view (js/sight.js) the map doesn't give away the zombies: you only know what you see.
    if (!g.night) g.enemies.forEach(function (e) {
      var ex = at.mx(e.x), ey = at.my(e.y);
      if (ex > 0 && ex < size && ey > 0 && ey < size) m.fillRect(ex - 1.5, ey - 1.5, e.type.boss ? 6 : 3, e.type.boss ? 6 : 3);
    });
    m.fillStyle = '#ffd27a';
    g.chests.forEach(function (c) { var cx = at.mx(c.x), cy = at.my(c.y); m.fillRect(cx - 2.5, cy - 2.5, 5, 5); });
    keepExplored(m, g, p.x, p.y, k, 0, 0, size, size);
    ctx.save();
    ctx.globalAlpha = 0.88;
    ctx.fillStyle = '#1b1f17'; ctx.fillRect(x0, y0, size, size);
    ctx.drawImage(mm, x0, y0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x0 + size / 2, y0 + size / 2, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,233,168,0.6)'; ctx.lineWidth = 2; ctx.strokeRect(x0, y0, size, size);
    // The street you are on (checked a few times per second: it walks the nearby streets).
    if (!g._streetT || g.time - g._streetT > 0.5) { g._streetT = g.time; g._street = L.cityStreetAt(city, p.x, p.y); }
    ctx.textAlign = 'center'; ctx.font = '700 14px system-ui, sans-serif'; ctx.fillStyle = '#ffe9a8';
    ctx.fillText(g._street || (city.name || ''), x0 + size / 2, y0 + size + 20);
    if (g.explored) { ctx.font = '600 11px system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,233,168,0.6)'; ctx.fillText('M: mapa', x0 + size / 2, y0 + size + 36); }
  };

  // The big map (M): everything you have seen of the city, zoomable with the wheel and draggable, with you, where you
  // last slept and your body. `cv`: a canvas on the map screen; `view`: { cx, cy, k } (kept between draws).
  L.drawBigMap = function (cv, g, view) {
    var ctx = cv.getContext('2d'), city = g.city, p = g.player, W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    var at = drawStreets(ctx, city, view.cx, view.cy, view.k, 0, 0, W, H);
    drawBuildings(ctx, g, view.cx, view.cy, view.k, 0, 0, W, H);
    keepExplored(ctx, g, view.cx, view.cy, view.k, 0, 0, W, H);
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = '#14160f'; ctx.fillRect(0, 0, W, H); // what you haven't seen: dark
    ctx.restore();
    var mark = function (x, y, color, label) {
      var X = at.mx(x), Y = at.my(y);
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(X, Y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.font = '600 13px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = color; ctx.fillText(label, X + 10, Y + 4);
    };
    if (p.bed) mark(p.bed.x, p.bed.y, '#9fc3e8', 'Dormiste acá');
    (g.bodies || []).forEach(function (b) { mark(b.x, b.y, '#c26a4a', 'Tu cuerpo'); });
    mark(p.x, p.y, '#ffffff', 'Vos');
  };

  // Street names under you, for the HUD.
  L.cityStreetAt = function (city, x, y) {
    var near = 20 * (city.scale || L.data.city.scale), best = null, bd = near * near; // within 20 m
    city.roads.forEach(function (r) {
      if (!r.name || !r.box || x < r.box[0] - near || x > r.box[2] + near || y < r.box[1] - near || y > r.box[3] + near) return;
      for (var i = 1; i < r.pts.length; i++) {
        var a = r.pts[i - 1], b = r.pts[i], dx = b[0] - a[0], dy = b[1] - a[1], len2 = dx * dx + dy * dy || 1;
        var k = L.clamp(((x - a[0]) * dx + (y - a[1]) * dy) / len2, 0, 1), qx = a[0] + dx * k - x, qy = a[1] + dy * k - y;
        if (qx * qx + qy * qy < bd) { bd = qx * qx + qy * qy; best = r.name; }
      }
    });
    return best;
  };

  // ---- Downloading ----
  // Overpass servers, tried in order. Free and without an account; we ask little and only when you press play.
  var SERVERS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];

  // Tries the servers from i up to `last`, each for `wait` ms.
  function ask(query, i, last, wait, done) {
    if (i > last) { done(null); return; }
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, wait);
    fetch(SERVERS[i], { method: 'POST', body: 'data=' + encodeURIComponent(query), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (json) { clearTimeout(timer); done(json); })
      .catch(function () { clearTimeout(timer); ask(query, i + 1, last, wait, done); });
  }

  // Calls done(city, message). The city is invented if the streets can't be downloaded.
  L.loadCity = function (place, seed, done) {
    if (!place) { done(L.cityProcedural(seed), null); return; }
    ask(L.cityQuery(place.lat, place.lon, 'streets'), 0, SERVERS.length - 1, 25000, function (streets) {
      var city = streets && L.cityFromOSM(streets, place.lat, place.lon, place.name);
      if (!city) { done(L.cityProcedural(seed), 'No se pudieron bajar las calles de ese lugar: jugás en una ciudad inventada.'); return; }
      // Buildings are only drawn: if they don't come, play without them.
      // Buildings are only drawn: one server, a short wait, and if they don't come, play without them.
      ask(L.cityQuery(place.lat, place.lon, 'buildings'), 0, 0, 12000, function (b) {
        if (b) {
          var extra = L.cityFromOSM({ elements: (streets.elements || []).concat(b.elements || []) }, place.lat, place.lon, place.name);
          if (extra) city = extra;
        }
        done(city, null);
      });
    });
  };

  // ---- Picking the place ----
  L.data.places = [
    { name: 'Plaza de San Miguel, Buenos Aires', lat: -34.5430, lon: -58.7125 },
    { name: 'Obelisco, Buenos Aires', lat: -34.6037, lon: -58.3816 },
    { name: 'Plaza San Martín, Córdoba', lat: -31.4166, lon: -64.1838 },
    { name: 'Monumento a la Bandera, Rosario', lat: -32.9477, lon: -60.6305 },
    { name: 'Plaza Independencia, Mendoza', lat: -32.8895, lon: -68.8458 },
    { name: 'Plaza Independencia, Montevideo', lat: -34.9068, lon: -56.1994 },
    { name: 'Zócalo, Ciudad de México', lat: 19.4326, lon: -99.1332 },
    { name: 'Puerta del Sol, Madrid', lat: 40.4169, lon: -3.7035 }
  ];

  var LEAFLET = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
  function loadLeaflet(done) {
    if (window.L_leaflet) { done(window.L_leaflet); return; }
    var s = document.createElement('script');
    s.src = LEAFLET;
    s.onload = function () { window.L_leaflet = window.L; done(window.L); };
    s.onerror = function () { done(null); };
    document.head.appendChild(s);
  }

  function lastPlace() { try { return JSON.parse(localStorage.getItem('lluvia.place') || 'null'); } catch (e) { return null; } }
  function savePlace(p) { try { localStorage.setItem('lluvia.place', JSON.stringify(p)); } catch (e) { /* not saved */ } }

  // onPick(place or null for an invented city).
  L.ui.mapPick = function (onPick, onBack) {
    var ov = document.getElementById('overlay');
    var chosen = lastPlace() || L.data.places[0];
    ov.innerHTML = '';
    ov.classList.remove('hidden');
    var box = document.createElement('div'); box.className = 'panel mappick';
    box.innerHTML = '<h2>¿Dónde te agarró el Sol Amarillo?</h2><p class="tagline">Tocá el mapa para elegir dónde arrancás. Se juega en las calles de verdad de ese lugar.</p>';
    var map = document.createElement('div'); map.className = 'worldmap'; map.textContent = 'Cargando el mapa...';
    var label = document.createElement('p'); label.className = 'hint';
    var setLabel = function () { label.textContent = 'Arrancás en: ' + (chosen.name || (chosen.lat.toFixed(4) + ', ' + chosen.lon.toFixed(4))); };
    setLabel();
    var list = document.createElement('div'); list.className = 'places';
    var marker = null, lmap = null;
    var choose = function (p) { chosen = p; setLabel(); if (lmap) { lmap.setView([p.lat, p.lon], 15); if (marker) marker.setLatLng([p.lat, p.lon]); } };
    L.data.places.forEach(function (p) {
      var b = document.createElement('button'); b.className = 'btn ghost small'; b.textContent = p.name;
      b.onclick = function () { choose(p); }; list.appendChild(b);
    });
    if (navigator.geolocation) {
      var here = document.createElement('button'); here.className = 'btn ghost small'; here.textContent = '📍 Donde estoy';
      here.onclick = function () {
        navigator.geolocation.getCurrentPosition(function (pos) { choose({ name: 'Donde estás', lat: pos.coords.latitude, lon: pos.coords.longitude }); },
          function () { label.textContent = 'No se pudo saber dónde estás: elegí en el mapa.'; });
      };
      list.appendChild(here);
    }
    var row = document.createElement('div'); row.className = 'row';
    var go = document.createElement('button'); go.className = 'btn'; go.textContent = 'Jugar acá';
    go.onclick = function () { savePlace(chosen); onPick(chosen); };
    var inv = document.createElement('button'); inv.className = 'btn ghost'; inv.textContent = 'Ciudad inventada';
    inv.onclick = function () { onPick(null); };
    row.appendChild(go); row.appendChild(inv);
    if (onBack) { var back = document.createElement('button'); back.className = 'btn ghost'; back.textContent = 'Volver'; back.onclick = onBack; row.appendChild(back); }
    [map, label, list, row].forEach(function (n) { box.appendChild(n); });
    ov.appendChild(box);
    L.ui.current = 'mappick';
    var gaveUp = false;
    var slow = setTimeout(function () { gaveUp = true; map.textContent = 'El mapa no cargó: elegí uno de los lugares de abajo.'; }, 8000);
    loadLeaflet(function (LF) {
      clearTimeout(slow);
      if (gaveUp && LF && map.isConnected) gaveUp = false; // it came late: show it anyway
      if (!LF || !map.isConnected) { map.textContent = 'El mapa no cargó: elegí uno de los lugares de abajo.'; return; }
      map.textContent = '';
      lmap = LF.map(map, { zoomControl: true, attributionControl: true }).setView([chosen.lat, chosen.lon], 15);
      LF.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(lmap);
      marker = LF.circleMarker([chosen.lat, chosen.lon], { radius: 9, color: '#ffd23f', fillColor: '#ffd23f', fillOpacity: 0.7 }).addTo(lmap);
      lmap.on('click', function (e) { choose({ name: '', lat: e.latlng.lat, lon: e.latlng.lng }); });
    });
  };

  L.ui.loading = function (text) {
    var ov = document.getElementById('overlay');
    ov.innerHTML = '<div class="panel"><h2>' + text + '</h2><p class="tagline">Esto tarda unos segundos la primera vez.</p></div>';
    ov.classList.remove('hidden');
    L.ui.current = 'loading';
  };
})(this.Lluvia = this.Lluvia || {});
