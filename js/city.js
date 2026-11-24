// The city: a walkable map built from real streets (OpenStreetMap) or invented when there is no internet.
// Streets, sidewalks, plazas, parks and back yards can be walked; buildings, houses and parked cars are solid.
// Where OpenStreetMap has no building drawn, every block gets houses along its streets (L.cityBuild), so the
// city looks full, like the towns in SAS or Project Zomboid. Everything is in world pixels: `scale` px per meter.
// A coarse grid (`cell` pixels) says where you can walk, and a flow field over it lets the horde chase you along
// the streets instead of through the walls.
(function (L) {
  'use strict';

  L.data = L.data || {};
  L.data.city = {
    meters: 1000,        // side of the playable square when downloading a place, in meters
    scale: 10,           // pixels per meter: to scale with the characters (a 10 m street is 100 px, ~3-4 people)
    cell: 16,            // walk grid cell, in pixels (1.6 m)
    // Street width in meters by OpenStreetMap highway type. Types not listed are left out (footpaths, stairs...).
    // Real map (data/map-*.js): carriageway and each sidewalk in meters, by OpenStreetMap type. Shared with the
    // drawing (js/view/mapdraw.js), so what you see is what you walk.
    streets: {
      motorway: [24, 0], trunk: [20, 4.5], primary: [18, 4.5], secondary: [15, 4], tertiary: [13, 3.5],
      residential: [11, 3.5], unclassified: [11, 3.5], living_street: [9, 3], service: [6, 1.5], pedestrian: [0, 7],
      footway: [0, 2.5], path: [0, 2], cycleway: [0, 2.5], steps: [0, 2.5], track: [5, 0],
      motorway_link: [10, 0], trunk_link: [10, 2], primary_link: [10, 3], secondary_link: [10, 3], tertiary_link: [9, 3]
    },
    widths: { motorway: 22, trunk: 20, primary: 16, secondary: 14, tertiary: 12, residential: 10, unclassified: 10,
      living_street: 9, pedestrian: 9, service: 7, motorway_link: 12, trunk_link: 12, primary_link: 12, secondary_link: 10, tertiary_link: 10 },
    // Open areas you can walk across, by tag.
    open: { leisure: ['park', 'garden', 'playground', 'pitch', 'common', 'recreation_ground'], place: ['square'],
      landuse: ['grass', 'recreation_ground', 'village_green'], highway: ['pedestrian'] },
    flowEvery: 0.4,      // seconds between flow field updates
    flowRange: 120,      // the flow field covers a square this many cells around you (a whole city is too big)
    home: 'sanmiguel',   // the city you start in (data/map-*.js, else data/city-*.js)
    // Houses along every street where OpenStreetMap has none (meters). Commercial streets get wider, deeper lots.
    lots: { kinds: ['residential', 'living_street', 'unclassified', 'tertiary', 'secondary', 'primary', 'trunk'],
      sidewalk: 2.5, front: [8, 12], depth: [10, 18], wideFront: [10, 16], wideDepth: [14, 22], gap: 0.8,
      passage: 0.15, passageWidth: 3.5 },
    cars: { kinds: ['residential', 'living_street', 'unclassified', 'tertiary'], every: [7, 14], chance: 0.22, length: 4.4, width: 1.9 },
    trees: { every: [9, 15], chance: 0.55, radius: [2.2, 3.4] },
    chunk: 640,          // drawing buckets, in pixels
    body: 9              // radius used against walls (smaller than the drawing, which also covers the sidewalk)
  };

  function makeCity(size) {
    var C = L.data.city, cols = Math.ceil(size / C.cell);
    return { size: size, cell: C.cell, cols: cols, rows: cols, walk: new Uint8Array(cols * cols),
      roads: [], parks: [], buildings: [], houses: [], cars: [], trees: [], flow: null, flowCell: -1, flowAt: -1 };
  }

  // ---- Painting the walk grid ----

  function paintSegment(city, ax, ay, bx, by, halfW, count) {
    var c = city.cell, pad = halfW + c;
    var x0 = Math.max(0, Math.floor((Math.min(ax, bx) - pad) / c)), x1 = Math.min(city.cols - 1, Math.floor((Math.max(ax, bx) + pad) / c));
    var y0 = Math.max(0, Math.floor((Math.min(ay, by) - pad) / c)), y1 = Math.min(city.rows - 1, Math.floor((Math.max(ay, by) + pad) / c));
    var dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy || 1;
    for (var cy = y0; cy <= y1; cy++) {
      for (var cx = x0; cx <= x1; cx++) {
        var px = (cx + 0.5) * c, py = (cy + 0.5) * c;
        var t = L.clamp(((px - ax) * dx + (py - ay) * dy) / len2, 0, 1);
        var qx = ax + dx * t - px, qy = ay + dy * t - py;
        if (qx * qx + qy * qy <= halfW * halfW) {
          var k = cy * city.cols + cx;
          if (count) { if (count[k] < 255 && count.stamp[k] !== count.id) { count[k]++; count.stamp[k] = count.id; } }
          else city.walk[k] = 1;
        }
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

  function paintPolygon(city, pts, grid, value) {
    grid = grid || city.walk; value = value === undefined ? 1 : value;
    var c = city.cell, minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    pts.forEach(function (p) { minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]); minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); });
    var x0 = Math.max(0, Math.floor(minX / c)), x1 = Math.min(city.cols - 1, Math.floor(maxX / c));
    var y0 = Math.max(0, Math.floor(minY / c)), y1 = Math.min(city.rows - 1, Math.floor(maxY / c));
    for (var cy = y0; cy <= y1; cy++) {
      for (var cx = x0; cx <= x1; cx++) if (inPolygon(pts, (cx + 0.5) * c, (cy + 0.5) * c)) grid[cy * city.cols + cx] = value;
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
  L.cityFromOSM = function (osm, lat, lon, name, meters) {
    var C = L.data.city, size = (meters || C.meters) * C.scale, city = makeCity(size);
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
    L.cityBuild(city, 0x5a17);
    return city;
  };

  // ---- Baked into the game (data/city-*.js, made with tools/bake-city.js): no internet needed ----
  L.cityFromBaked = function (data) {
    var C = L.data.city, s = C.scale, city = makeCity(data.meters * s);
    var pts = function (f) { var out = []; for (var i = 0; i + 1 < f.length; i += 2) out.push([f[i] * s, f[i + 1] * s]); return out; };
    data.parks.forEach(function (pk) { var p = pts(pk[2]); paintPolygon(city, p); city.parks.push({ pts: p, kind: pk[0], name: pk[1] }); });
    data.roads.forEach(function (r) {
      var w = C.widths[r[0]];
      if (r[0] === 'pedestrian' || r[0] === 'footway') w = w || 6; // walkways inside plazas join them to the streets
      if (w) addRoad(city, pts(r[2]), w, r[0], r[1]);
    });
    city.buildings = data.buildings.map(pts);
    city.name = data.name;
    city.real = true;
    city.start = { x: data.start[0] * s, y: data.start[1] * s };
    L.cityBuild(city, 0x5a17);
    return city;
  };

  // Carriageway and sidewalk widths of a street type, in meters.
  L.cityStreet = function (kind) { return L.data.city.streets[kind] || [6, 1.5]; };

  // ---- The real map (data/map-*.js, made with tools/bake-map.js; see docs/MAPA.md) ----
  // Every real building footprint is a wall (no houses are invented) and the city is drawn by js/view/mapdraw.js.
  // Streets keep their real width: `w` is the carriageway, where cars park.
  L.cityFromMap = function (M) {
    var C = L.data.city, s = C.scale, k = M.unit * s, city = makeCity(M.meters * s);
    var pts = function (f) { var out = []; for (var i = 0; i + 1 < f.length; i += 2) out.push([f[i] * k, f[i + 1] * k]); return out; };
    M.parks.forEach(function (pk) { var p = pts(pk[2]); paintPolygon(city, p); city.parks.push({ pts: p, kind: pk[0], name: pk[1] }); });
    M.roads.forEach(function (r) {
      var w = L.cityStreet(r[0]), p = pts(r[2]), half = (w[0] + w[1] * 2) * s / 2;
      for (var i = 1; i < p.length; i++) paintSegment(city, p[i - 1][0], p[i - 1][1], p[i][0], p[i][1], half);
      city.roads.push({ pts: p, w: w[0] * s, kind: r[0], name: r[1] });
    });
    city.buildings = M.buildings.map(function (b) { return pts(b[0]); });
    city.map = M;
    city.name = M.name;
    city.real = true;
    city.start = { x: M.start[0] * k, y: M.start[1] * k };
    L.cityBuild(city, 0x5a17, { lots: false, trees: false });
    return city;
  };

  // The home city: the real map if it is baked in, else the older baked streets, else an invented one.
  L.cityHome = function (seed) {
    var home = L.data.city.home, m = L.data.maps && L.data.maps[home], d = L.data.cities && L.data.cities[home];
    return m ? L.cityFromMap(m) : d ? L.cityFromBaked(d) : L.cityProcedural(seed);
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
    L.cityBuild(city, seed, { lots: false });
    return city;
  };

  // ---- Filling the blocks ----
  // Up to here `walk` marks streets, plazas and parks. This turns it around: that becomes `street` (where houses
  // can't go), every other spot is a yard you can walk, and buildings, houses and parked cars are solid.
  // opt.lots / opt.trees: false to skip the invented houses or the street trees (the real map draws its own).
  L.cityBuild = function (city, seed, opt) {
    var C = L.data.city, s = C.scale, n = city.walk.length, rng = L.makeRng((seed >>> 0) || 1);
    var street = city.walk, solid = new Uint8Array(n);
    var count = new Uint8Array(n); count.stamp = new Uint16Array(n);
    city.roads.forEach(function (r, i) {
      count.id = (i % 65535) + 1;
      for (var k = 1; k < r.pts.length; k++) paintSegment(city, r.pts[k - 1][0], r.pts[k - 1][1], r.pts[k][0], r.pts[k][1], r.w / 2 + C.lots.sidewalk * s, count);
    });
    city.buildings.forEach(function (b) { paintPolygon(city, b, solid, 1); });
    var at = function (grid, x, y) {
      var cx = Math.floor(x / city.cell), cy = Math.floor(y / city.cell);
      return cx < 0 || cy < 0 || cx >= city.cols || cy >= city.rows ? 1 : grid[cy * city.cols + cx];
    };
    var range = function (a) { return (a[0] + rng() * (a[1] - a[0])) * s; };
    if (!opt || opt.lots !== false) {
      var LT = C.lots;
      city.roads.forEach(function (r) {
        if (LT.kinds.indexOf(r.kind) < 0) return;
        var wide = r.kind === 'primary' || r.kind === 'secondary' || r.kind === 'trunk';
        for (var k = 1; k < r.pts.length; k++) {
          var ax = r.pts[k - 1][0], ay = r.pts[k - 1][1], dx = r.pts[k][0] - ax, dy = r.pts[k][1] - ay, len = Math.sqrt(dx * dx + dy * dy);
          if (len < 6 * s) continue;
          var ux = dx / len, uy = dy / len;
          for (var side = -1; side <= 1; side += 2) {
            var nx = -uy * side, ny = ux * side, off = r.w / 2 + LT.sidewalk * s + 0.3 * s;
            for (var t = rng() * 3 * s; t < len; ) {
              var f = range(wide ? LT.wideFront : LT.front), d = range(wide ? LT.wideDepth : LT.depth);
              var gap = (rng() < LT.passage ? LT.passageWidth : LT.gap) * s;
              if (t + f > len) break;
              var x0 = ax + ux * t + nx * off, y0 = ay + uy * t + ny * off, w = f - gap;
              var q = [[x0, y0], [x0 + ux * w, y0 + uy * w], [x0 + ux * w + nx * d, y0 + uy * w + ny * d], [x0 + nx * d, y0 + ny * d]];
              var ok = true;
              // Check the corners, the middle and the edges: no street, no plaza, no other building.
              for (var a = 0; a <= 2 && ok; a++) for (var b = 0; b <= 2 && ok; b++) {
                var fa = [0.05, 0.5, 0.95][a], fb = [0.12, 0.5, 0.95][b];
                var px = x0 + ux * w * fa + nx * d * fb, py = y0 + uy * w * fa + ny * d * fb;
                if (at(street, px, py) || at(solid, px, py) || at(count, px, py)) ok = false;
              }
              if (ok) {
                paintPolygon(city, q, solid, 1);
                var long = w >= d;
                city.houses.push({ pts: q, roof: Math.floor(rng() * 8), shop: wide && rng() < 0.5,
                  ridge: long ? [x0 + nx * d / 2, y0 + ny * d / 2, x0 + ux * w + nx * d / 2, y0 + uy * w + ny * d / 2]
                    : [x0 + ux * w / 2, y0 + uy * w / 2, x0 + ux * w / 2 + nx * d, y0 + uy * w / 2 + ny * d] });
              }
              t += f;
            }
          }
        }
      });
    }
    // Parked cars along the curb (solid: they block bullets too) and trees on the sidewalks (only drawn).
    var CR = C.cars, TR = C.trees;
    city.roads.forEach(function (r) {
      var parks = CR.kinds.indexOf(r.kind) >= 0 && r.w >= 8 * s, lined = (!opt || opt.trees !== false) && LT_has(r.kind);
      if (!parks && !lined) return;
      for (var k = 1; k < r.pts.length; k++) {
        var ax = r.pts[k - 1][0], ay = r.pts[k - 1][1], dx = r.pts[k][0] - ax, dy = r.pts[k][1] - ay, len = Math.sqrt(dx * dx + dy * dy);
        if (len < 10 * s) continue;
        var ux = dx / len, uy = dy / len;
        for (var side = -1; side <= 1; side += 2) {
          var nx = -uy * side, ny = ux * side;
          if (parks) {
            for (var t = 4 * s + rng() * 6 * s; t < len - 4 * s; t += range(CR.every)) {
              if (rng() > CR.chance) continue;
              var cx = ax + ux * t + nx * (r.w / 2 - 1.3 * s), cy = ay + uy * t + ny * (r.w / 2 - 1.3 * s), hl = CR.length * s / 2, hw = CR.width * s / 2;
              if (at(count, cx + ux * hl, cy + uy * hl) > 1 || at(count, cx - ux * hl, cy - uy * hl) > 1 || at(count, cx, cy) > 1) continue;
              var car = [[cx - ux * hl - nx * hw, cy - uy * hl - ny * hw], [cx + ux * hl - nx * hw, cy + uy * hl - ny * hw],
                [cx + ux * hl + nx * hw, cy + uy * hl + ny * hw], [cx - ux * hl + nx * hw, cy - uy * hl + ny * hw]];
              paintPolygon(city, car, solid, 1);
              city.cars.push({ pts: car, x: cx, y: cy, ang: Math.atan2(uy, ux), color: Math.floor(rng() * 7) });
            }
          }
          if (lined) {
            for (var t2 = rng() * 8 * s; t2 < len; t2 += range(TR.every)) {
              if (rng() > TR.chance) continue;
              var tx = ax + ux * t2 + nx * (r.w / 2 + 1.3 * s), ty = ay + uy * t2 + ny * (r.w / 2 + 1.3 * s);
              if (at(count, tx, ty) > 1 || at(solid, tx, ty)) continue;
              city.trees.push({ x: tx, y: ty, r: range(TR.radius), shade: rng() });
            }
          }
        }
      }
    });
    function LT_has(kind) { return C.lots.kinds.indexOf(kind) >= 0; }
    // Everything not solid can be walked; then keep only the part that connects to the rest.
    var walk = new Uint8Array(n);
    for (var i = 0; i < n; i++) walk[i] = solid[i] ? 0 : 1;
    city.walk = walk;
    city.street = street;
    keepLargestArea(city);
    bucket(city);
  };

  // Drawing buckets: which houses, buildings, cars and trees touch each chunk of the map.
  function bucket(city) {
    var S = L.data.city.chunk, cols = Math.ceil(city.size / S), b = new Array(cols * cols);
    var put = function (kind, item, x0, y0, x1, y1) {
      for (var cy = Math.max(0, Math.floor(y0 / S)); cy <= Math.min(cols - 1, Math.floor(y1 / S)); cy++) {
        for (var cx = Math.max(0, Math.floor(x0 / S)); cx <= Math.min(cols - 1, Math.floor(x1 / S)); cx++) {
          var k = cy * cols + cx, slot = b[k] || (b[k] = { houses: [], buildings: [], cars: [], trees: [] });
          slot[kind].push(item);
        }
      }
    };
    var box = function (pts) {
      var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      pts.forEach(function (p) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); });
      return [x0, y0, x1, y1];
    };
    city.houses.forEach(function (h) { var q = box(h.pts); put('houses', h, q[0], q[1], q[2], q[3]); });
    city.buildings.forEach(function (bd) { var q = box(bd); put('buildings', bd, q[0], q[1], q[2], q[3]); });
    city.cars.forEach(function (c) { put('cars', c, c.x - 30, c.y - 30, c.x + 30, c.y + 30); });
    city.trees.forEach(function (t) { put('trees', t, t.x - t.r, t.y - t.r, t.x + t.r, t.y + t.r); });
    city.chunks = b; city.chunkCols = cols;
  }

  // Streets that don't connect to the rest (a dead end cut by the square's edge) become walls, so nothing spawns
  // where it can never reach you.
  function keepLargestArea(city) {
    var n = city.walk.length, seen = new Uint8Array(n), best = -1, bestSize = 0;
    var flood = function (s, mark) {
      var stack = [s], size = 0, cols = city.cols;
      mark[s] = 1;
      while (stack.length) {
        var c = stack.pop(); size++;
        var cx = c % cols;
        if (cx > 0 && city.walk[c - 1] && !mark[c - 1]) { mark[c - 1] = 1; stack.push(c - 1); }
        if (cx < cols - 1 && city.walk[c + 1] && !mark[c + 1]) { mark[c + 1] = 1; stack.push(c + 1); }
        if (c >= cols && city.walk[c - cols] && !mark[c - cols]) { mark[c - cols] = 1; stack.push(c - cols); }
        if (c + cols < n && city.walk[c + cols] && !mark[c + cols]) { mark[c + cols] = 1; stack.push(c + cols); }
      }
      return size;
    };
    for (var s = 0; s < n; s++) {
      if (!city.walk[s] || seen[s]) continue;
      var size = flood(s, seen);
      if (size > bestSize) { bestSize = size; best = s; }
    }
    if (best < 0) return;
    var keep = new Uint8Array(n);
    flood(best, keep);
    for (var k = 0; k < n; k++) if (!keep[k]) city.walk[k] = 0;
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
    return free(city, x, y, true, 400) || free(city, x, y, false, Math.max(city.cols, city.rows)) || { x: x, y: y };
  };

  // needFit: only spots where a body fits (the middle of a street); searches up to maxRing cells away.
  function free(city, x, y, needFit, maxRing) {
    var c = city.cell, cx0 = L.clamp(Math.floor(x / c), 0, city.cols - 1), cy0 = L.clamp(Math.floor(y / c), 0, city.rows - 1);
    for (var ring = 0; ring < maxRing; ring++) {
      for (var dy = -ring; dy <= ring; dy++) {
        for (var dx = -ring; dx <= ring; dx++) {
          if (Math.abs(dx) !== ring && Math.abs(dy) !== ring) continue;
          var cx = cx0 + dx, cy = cy0 + dy;
          if (cx < 0 || cy < 0 || cx >= city.cols || cy >= city.rows || !city.walk[cy * city.cols + cx]) continue;
          if (needFit && !fits(city, (cx + 0.5) * c, (cy + 0.5) * c, L.data.city.body)) continue;
          return { x: (cx + 0.5) * c, y: (cy + 0.5) * c };
        }
      }
    }
    return null;
  }

  // Flow field: steps from every walkable cell to the target cell (a breadth-first search over the grid).
  // It only covers a square window of flowRange cells around the target (you), so a whole city stays cheap.
  L.cityFlow = function (city, tx, ty) {
    var R = L.data.city.flowRange, W = 2 * R + 1, cols = city.cols;
    var tcx = L.clamp(Math.floor(tx / city.cell), 0, cols - 1), tcy = L.clamp(Math.floor(ty / city.cell), 0, city.rows - 1);
    if (!city.flow) { city.flow = new Uint16Array(W * W); city._queue = new Int32Array(W * W); city.flowW = W; }
    var flow = city.flow, q = city._queue, head = 0, tail = 0, ox = tcx - R, oy = tcy - R;
    city.flowX = ox; city.flowY = oy;
    flow.fill(65535);
    flow[R * W + R] = 0; q[tail++] = R * W + R;
    while (head < tail) {
      var c = q[head++], lx = c % W, ly = (c - lx) / W, d = flow[c] + 1, gx = ox + lx, gy = oy + ly, gi = gy * cols + gx;
      if (lx > 0 && gx > 0 && city.walk[gi - 1] && flow[c - 1] > d) { flow[c - 1] = d; q[tail++] = c - 1; }
      if (lx < W - 1 && gx < cols - 1 && city.walk[gi + 1] && flow[c + 1] > d) { flow[c + 1] = d; q[tail++] = c + 1; }
      if (ly > 0 && gy > 0 && city.walk[gi - cols] && flow[c - W] > d) { flow[c - W] = d; q[tail++] = c - W; }
      if (ly < W - 1 && gy < city.rows - 1 && city.walk[gi + cols] && flow[c + W] > d) { flow[c + W] = d; q[tail++] = c + W; }
    }
    city.flowCell = tcy * cols + tcx;
  };

  // Steps to you from cell (cx, cy); 65535 if it's outside the window or there's no way.
  function flowAt(city, cx, cy) {
    var lx = cx - city.flowX, ly = cy - city.flowY, W = city.flowW;
    return lx < 0 || ly < 0 || lx >= W || ly >= W ? 65535 : city.flow[ly * W + lx];
  }

  // Direction (unit vector in `out`) to walk from (x, y) toward the flow target along the streets.
  // Returns false when there is no way (then the caller walks straight).
  L.cityDir = function (city, x, y, out) {
    if (!city.flow) return false;
    var c = city.cell, cols = city.cols, cx = Math.floor(x / c), cy = Math.floor(y / c);
    if (cx < 0 || cy < 0 || cx >= cols || cy >= city.rows) return false;
    var best = flowAt(city, cx, cy), bx = 0, by = 0;
    if (best === 0 || best === 65535) return false;
    for (var dy = -1; dy <= 1; dy++) {
      for (var dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        var nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= city.rows) continue;
        // Diagonals only when both sides are open, so creatures don't cut wall corners.
        if (dx && dy && (!city.walk[cy * cols + nx] || !city.walk[ny * cols + cx])) continue;
        var f = flowAt(city, nx, ny);
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
