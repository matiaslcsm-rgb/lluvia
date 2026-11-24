// The city: a walkable map built from real streets (OpenStreetMap) or invented when there is no internet.
// You walk the streets, plazas and parks; the blocks between streets are walls. Buildings are kept for drawing
// (and, later, to go inside). Everything is in world pixels: `scale` pixels per meter.
// A coarse grid (`cell` pixels) says where you can walk, and a flow field over it lets the horde chase you along
// the streets instead of through the walls.
(function (L) {
  'use strict';

  L.data = L.data || {};
  L.data.city = {
    meters: 1000,        // side of the playable square, in meters
    scale: 3,            // pixels per meter (a 10 m street is 30 px)
    cell: 8,             // walk grid cell, in pixels
    // Street width in meters by OpenStreetMap highway type. Types not listed are left out (footpaths, stairs...).
    widths: { motorway: 22, trunk: 20, primary: 16, secondary: 14, tertiary: 12, residential: 10, unclassified: 10,
      living_street: 9, pedestrian: 9, service: 7, motorway_link: 12, trunk_link: 12, primary_link: 12, secondary_link: 10, tertiary_link: 10 },
    // Open areas you can walk across, by tag.
    open: { leisure: ['park', 'garden', 'playground', 'pitch', 'common', 'recreation_ground'], place: ['square'],
      landuse: ['grass', 'recreation_ground', 'village_green'], highway: ['pedestrian'] },
    flowEvery: 0.4,      // seconds between flow field updates
    body: 8              // radius used against walls (smaller than the drawing, which also covers the sidewalk)
  };

  function makeCity(size) {
    var C = L.data.city, cols = Math.ceil(size / C.cell);
    return { size: size, cell: C.cell, cols: cols, rows: cols, walk: new Uint8Array(cols * cols),
      roads: [], parks: [], buildings: [], flow: null, flowCell: -1, flowAt: -1 };
  }

  // ---- Painting the walk grid ----

  function paintSegment(city, ax, ay, bx, by, halfW) {
    var c = city.cell, pad = halfW + c;
    var x0 = Math.max(0, Math.floor((Math.min(ax, bx) - pad) / c)), x1 = Math.min(city.cols - 1, Math.floor((Math.max(ax, bx) + pad) / c));
    var y0 = Math.max(0, Math.floor((Math.min(ay, by) - pad) / c)), y1 = Math.min(city.rows - 1, Math.floor((Math.max(ay, by) + pad) / c));
    var dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy || 1;
    for (var cy = y0; cy <= y1; cy++) {
      for (var cx = x0; cx <= x1; cx++) {
        var px = (cx + 0.5) * c, py = (cy + 0.5) * c;
        var t = L.clamp(((px - ax) * dx + (py - ay) * dy) / len2, 0, 1);
        var qx = ax + dx * t - px, qy = ay + dy * t - py;
        if (qx * qx + qy * qy <= halfW * halfW) city.walk[cy * city.cols + cx] = 1;
      }
    }
  }

  function inPolygon(pts, x, y) {
    var inside = false;
    for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      var xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  L.inPolygon = inPolygon;

  function paintPolygon(city, pts) {
    var c = city.cell, minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    pts.forEach(function (p) { minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]); minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); });
    var x0 = Math.max(0, Math.floor(minX / c)), x1 = Math.min(city.cols - 1, Math.floor(maxX / c));
    var y0 = Math.max(0, Math.floor(minY / c)), y1 = Math.min(city.rows - 1, Math.floor(maxY / c));
    for (var cy = y0; cy <= y1; cy++) {
      for (var cx = x0; cx <= x1; cx++) if (inPolygon(pts, (cx + 0.5) * c, (cy + 0.5) * c)) city.walk[cy * city.cols + cx] = 1;
    }
  }

  function addRoad(city, pts, meters, kind, name) {
    var halfW = meters * L.data.city.scale / 2;
    for (var i = 1; i < pts.length; i++) paintSegment(city, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], halfW);
    city.roads.push({ pts: pts, w: halfW * 2, kind: kind, name: name || '' });
  }

  // ---- From OpenStreetMap ----

  // The Overpass queries for the square around (lat, lon), used by the browser (js/view/) to download the area.
  // Two parts: 'streets' (streets, plazas, parks: needed) and 'buildings' (only drawn: the game works without them).
  L.cityQuery = function (lat, lon, part) {
    var half = L.data.city.meters / 2 + 60, dLat = half / 110540, dLon = half / (111320 * Math.cos(lat * Math.PI / 180));
    var bb = (lat - dLat).toFixed(6) + ',' + (lon - dLon).toFixed(6) + ',' + (lat + dLat).toFixed(6) + ',' + (lon + dLon).toFixed(6);
    if (part === 'buildings') return '[out:json][timeout:25];way["building"](' + bb + ');out geom qt;';
    return '[out:json][timeout:25];(way["highway"](' + bb + ');way["leisure"~"park|garden|playground|pitch|common|recreation_ground"](' + bb +
      ');way["place"="square"](' + bb + ');way["landuse"~"grass|recreation_ground|village_green"](' + bb + '););out geom qt;';
  };

  // osm: the JSON Overpass answers. Returns a city, or null if there are almost no streets there.
  L.cityFromOSM = function (osm, lat, lon, name) {
    var C = L.data.city, size = C.meters * C.scale, city = makeCity(size);
    var kx = 111320 * Math.cos(lat * Math.PI / 180) * C.scale, ky = 110540 * C.scale;
    var project = function (g) { return [(g.lon - lon) * kx + size / 2, (lat - g.lat) * ky + size / 2]; };
    var isOpen = function (tags) {
      for (var k in C.open) if (tags[k] && C.open[k].indexOf(tags[k]) >= 0 && (k !== 'highway' || tags.area === 'yes')) return true;
      return false;
    };
    (osm.elements || []).forEach(function (el) {
      if (el.type !== 'way' || !el.geometry || el.geometry.length < 2) return;
      var t = el.tags || {}, pts = el.geometry.map(project);
      if (t.building) { if (pts.length >= 3) city.buildings.push(pts); return; }
      if (isOpen(t)) { if (pts.length >= 3) { paintPolygon(city, pts); city.parks.push({ pts: pts, kind: t.leisure || t.place || t.landuse || 'plaza' }); } return; }
      var w = C.widths[t.highway];
      if (w) addRoad(city, pts, w, t.highway, t.name);
    });
    if (city.roads.length < 5) return null;
    city.name = name || '';
    city.real = true;
    keepLargestArea(city);
    return city;
  };

  // ---- Invented city (no internet, or a place without streets) ----

  L.cityProcedural = function (seed) {
    var C = L.data.city, size = C.meters * C.scale, city = makeCity(size), rng = L.makeRng(seed >>> 0);
    var lines = function () {
      var out = [], pos = 40 + rng() * 120, i = 0;
      while (pos < C.meters) { out.push({ m: pos, w: i % 4 === 0 ? 16 : 10 }); pos += 90 + rng() * 60; i++; }
      return out;
    };
    var xs = lines(), ys = lines(), s = C.scale;
    xs.forEach(function (l) {
      var x = l.m * s, bend = (rng() - 0.5) * 60;
      addRoad(city, [[x, 0], [x + bend, size / 2], [x, size]], l.w, l.w > 12 ? 'primary' : 'residential');
    });
    ys.forEach(function (l) { addRoad(city, [[0, l.m * s], [size, l.m * s]], l.w, l.w > 12 ? 'primary' : 'residential'); });
    // Some blocks are plazas or parks; the rest get buildings (only drawn: the block is already a wall).
    for (var i = 0; i + 1 < xs.length; i++) {
      for (var j = 0; j + 1 < ys.length; j++) {
        var bx0 = xs[i].m * s + xs[i].w * s / 2, bx1 = xs[i + 1].m * s - xs[i + 1].w * s / 2;
        var by0 = ys[j].m * s + ys[j].w * s / 2, by1 = ys[j + 1].m * s - ys[j + 1].w * s / 2;
        if (bx1 - bx0 < 60 || by1 - by0 < 60) continue;
        var r = rng();
        if (r < 0.1) {
          var pk = [[bx0, by0], [bx1, by0], [bx1, by1], [bx0, by1]];
          paintPolygon(city, pk);
          city.parks.push({ pts: pk, kind: r < 0.05 ? 'park' : 'square' });
        } else {
          for (var lx = bx0 + 6; lx < bx1 - 30; lx += 40 + rng() * 50) {
            var lw = Math.min(bx1 - 6 - lx, 30 + rng() * 40);
            city.buildings.push([[lx, by0 + 6], [lx + lw, by0 + 6], [lx + lw, by0 + 6 + (by1 - by0) * 0.45], [lx, by0 + 6 + (by1 - by0) * 0.45]]);
            city.buildings.push([[lx, by1 - 6 - (by1 - by0) * 0.45], [lx + lw, by1 - 6 - (by1 - by0) * 0.45], [lx + lw, by1 - 6], [lx, by1 - 6]]);
          }
        }
      }
    }
    city.name = 'Ciudad sin nombre';
    city.real = false;
    keepLargestArea(city);
    return city;
  };

  // Streets that don't connect to the rest (a dead end cut by the square's edge) become walls, so nothing spawns
  // where it can never reach you.
  function keepLargestArea(city) {
    var n = city.walk.length, label = new Int32Array(n), best = 0, bestSize = 0, id = 0, stack = [];
    for (var s = 0; s < n; s++) {
      if (!city.walk[s] || label[s]) continue;
      id++; var size = 0; stack.push(s); label[s] = id;
      while (stack.length) {
        var c = stack.pop(); size++;
        var cx = c % city.cols, cy = (c - cx) / city.cols;
        if (cx > 0 && city.walk[c - 1] && !label[c - 1]) { label[c - 1] = id; stack.push(c - 1); }
        if (cx < city.cols - 1 && city.walk[c + 1] && !label[c + 1]) { label[c + 1] = id; stack.push(c + 1); }
        if (cy > 0 && city.walk[c - city.cols] && !label[c - city.cols]) { label[c - city.cols] = id; stack.push(c - city.cols); }
        if (cy < city.rows - 1 && city.walk[c + city.cols] && !label[c + city.cols]) { label[c + city.cols] = id; stack.push(c + city.cols); }
      }
      if (size > bestSize) { bestSize = size; best = id; }
    }
    for (var k = 0; k < n; k++) if (label[k] !== best) city.walk[k] = 0;
  }

  // ---- Using it ----

  L.cityWalkable = function (city, x, y) {
    var cx = Math.floor(x / city.cell), cy = Math.floor(y / city.cell);
    return cx >= 0 && cy >= 0 && cx < city.cols && cy < city.rows && city.walk[cy * city.cols + cx] === 1;
  };

  // A circle fits if its center and eight points on its edge are on walkable cells.
  function fits(city, x, y, r) {
    var W = L.cityWalkable, d = r * 0.7;
    return W(city, x, y) && W(city, x + r, y) && W(city, x - r, y) && W(city, x, y + r) && W(city, x, y - r) &&
      W(city, x + d, y + d) && W(city, x - d, y + d) && W(city, x + d, y - d) && W(city, x - d, y - d);
  }
  L.cityFits = fits;

  // Moves a circle from (x, y) to (nx, ny), sliding along walls. Returns the new position in `out`.
  // r is capped at the city's body size, so everyone fits in the narrow streets.
  L.cityMove = function (city, x, y, nx, ny, r, out) {
    out = out || {};
    r = Math.min(r, L.data.city.body);
    if (fits(city, nx, ny, r)) { out.x = nx; out.y = ny; }
    else if (fits(city, nx, y, r)) { out.x = nx; out.y = y; }
    else if (fits(city, x, ny, r)) { out.x = x; out.y = ny; }
    else if (slide(city, x, y, nx - x, ny - y, r, 0.785, out) || slide(city, x, y, nx - x, ny - y, r, -0.785, out)) { /* slid along a slanted wall */ }
    else if (!fits(city, x, y, r) && L.cityWalkable(city, nx, ny)) { out.x = nx; out.y = ny; } // stuck on an edge: slip out
    else { out.x = x; out.y = y; }
    return out;
  };

  // Tries the move turned by `ang` radians (a slanted street's stair-stepped edge blocks both straight axes).
  function slide(city, x, y, dx, dy, r, ang, out) {
    var c = Math.cos(ang), s = Math.sin(ang), tx = x + (dx * c - dy * s) * 0.75, ty = y + (dx * s + dy * c) * 0.75;
    if (!fits(city, tx, ty, r)) return false;
    out.x = tx; out.y = ty;
    return true;
  }

  // The nearest walkable cell center to (x, y), searching outward in rings.
  L.cityFree = function (city, x, y) {
    var c = city.cell, cx0 = L.clamp(Math.floor(x / c), 0, city.cols - 1), cy0 = L.clamp(Math.floor(y / c), 0, city.rows - 1);
    for (var ring = 0; ring < Math.max(city.cols, city.rows); ring++) {
      for (var dy = -ring; dy <= ring; dy++) {
        for (var dx = -ring; dx <= ring; dx++) {
          if (Math.abs(dx) !== ring && Math.abs(dy) !== ring) continue;
          var cx = cx0 + dx, cy = cy0 + dy;
          if (cx < 0 || cy < 0 || cx >= city.cols || cy >= city.rows || !city.walk[cy * city.cols + cx]) continue;
          // Prefer a spot where a body fits (the middle of the street); far away, any walkable cell.
          if (ring < 12 && !fits(city, (cx + 0.5) * c, (cy + 0.5) * c, L.data.city.body)) continue;
          return { x: (cx + 0.5) * c, y: (cy + 0.5) * c };
        }
      }
    }
    return { x: x, y: y };
  };

  // Flow field: steps from every walkable cell to the target cell (a breadth-first search over the grid).
  L.cityFlow = function (city, tx, ty) {
    var cols = city.cols, n = city.walk.length;
    var t = L.clamp(Math.floor(ty / city.cell), 0, city.rows - 1) * cols + L.clamp(Math.floor(tx / city.cell), 0, cols - 1);
    if (!city.flow) { city.flow = new Uint16Array(n); city._queue = new Int32Array(n); }
    var flow = city.flow, q = city._queue, head = 0, tail = 0;
    flow.fill(65535);
    flow[t] = 0; q[tail++] = t;
    while (head < tail) {
      var c = q[head++], cx = c % cols, d = flow[c] + 1;
      if (cx > 0 && city.walk[c - 1] && flow[c - 1] > d) { flow[c - 1] = d; q[tail++] = c - 1; }
      if (cx < cols - 1 && city.walk[c + 1] && flow[c + 1] > d) { flow[c + 1] = d; q[tail++] = c + 1; }
      if (c >= cols && city.walk[c - cols] && flow[c - cols] > d) { flow[c - cols] = d; q[tail++] = c - cols; }
      if (c + cols < n && city.walk[c + cols] && flow[c + cols] > d) { flow[c + cols] = d; q[tail++] = c + cols; }
    }
    city.flowCell = t;
  };

  // Direction (unit vector in `out`) to walk from (x, y) toward the flow target along the streets.
  // Returns false when there is no way (then the caller walks straight).
  L.cityDir = function (city, x, y, out) {
    if (!city.flow) return false;
    var c = city.cell, cols = city.cols, cx = Math.floor(x / c), cy = Math.floor(y / c);
    if (cx < 0 || cy < 0 || cx >= cols || cy >= city.rows) return false;
    var here = cy * cols + cx, best = city.flow[here], bx = 0, by = 0;
    if (best === 0) return false;
    for (var dy = -1; dy <= 1; dy++) {
      for (var dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        var nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= city.rows) continue;
        // Diagonals only when both sides are open, so creatures don't cut wall corners.
        if (dx && dy && (!city.walk[cy * cols + nx] || !city.walk[ny * cols + cx])) continue;
        var f = city.flow[ny * cols + nx];
        if (f < best) { best = f; bx = dx; by = dy; }
      }
    }
    if (!bx && !by) return false;
    // Aim at the center of the next cell, so they keep to the middle of the street.
    var tx = (cx + bx + 0.5) * c - x, ty = (cy + by + 0.5) * c - y, len = Math.sqrt(tx * tx + ty * ty) || 1;
    out.x = tx / len; out.y = ty / len;
    return true;
  };
})(this.Lluvia = this.Lluvia || {});
