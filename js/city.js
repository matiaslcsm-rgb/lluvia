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
    body: 9,             // radius used against walls (smaller than the drawing, which also covers the sidewalk)
    // The real map (L.cityFromMap) is at 1:1 with the characters: a person (28 px drawn) is ~0.55 m wide, runs at
    // ~4 m/s, and the screen shows ~25 m. Its walk grid comes in zones built when someone gets near.
    mapScale: 50,        // px per meter on the real map
    mapCell: 25,         // its walk cell, in px (0.5 m: doors and narrow passages fit)
    page: 64,            // cells per side of a walk zone (32 m)
    maxPages: 3000       // zones kept (~12 MB); the oldest are dropped and built again when needed
  };

  // w × h pixels (square when h is left out). `size` is the longer side: the game's play area (g.arena) is square,
  // and the walk grid already walls off whatever lies outside the city.
  function makeCity(w, h) {
    h = h || w;
    var C = L.data.city, cols = Math.ceil(w / C.cell), rows = Math.ceil(h / C.cell);
    return { size: Math.max(w, h), w: w, h: h, cell: C.cell, cols: cols, rows: rows, walk: new Uint8Array(cols * rows),
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
  // The whole Partido de San Miguel at 1:1 with the characters (\`mapScale\` px per meter): inside its border you walk
  // everywhere except through its real buildings (no house is invented) and the parked cars; past the border you
  // can't go. It is drawn by js/view/mapdraw.js.
  // At that size a single walk grid would have billions of cells, so it comes in zones of \`page\` × \`page\` cells,
  // each built the first time someone looks at it (from the border, the buildings that touch it and its cars) and
  // dropped when too many are kept. The footprints stay in the map data; nothing is copied.
  // Streets keep their real width: \`w\` is the carriageway, where cars park.
  L.cityFromMap = function (M) {
    var C = L.data.city, s = C.mapScale, k = M.unit * s, w = M.w * s, h = M.h * s, cell = C.mapCell, P = C.page;
    var cols = Math.ceil(w / cell), rows = Math.ceil(h / cell);
    var city = { size: Math.max(w, h), w: w, h: h, scale: s, k: k, cell: cell, cols: cols, rows: rows, walk: null,
      pages: new Map(), pcols: Math.ceil(cols / P), zoneB: new Map(), zoneCars: new Map(),
      roads: [], parks: [], buildings: [], houses: [], cars: [], trees: [], flow: null, flowCell: -1, flowAt: -1 };
    var pts = function (f) { var out = []; for (var i = 0; i + 1 < f.length; i += 2) out.push([f[i] * k, f[i + 1] * k]); return out; };
    M.parks.forEach(function (pk) { city.parks.push({ pts: pts(pk[2]), kind: pk[0], name: pk[1] }); });
    M.roads.forEach(function (r) { city.roads.push({ pts: pts(r[2]), w: L.cityStreet(r[0])[0] * s, kind: r[0], name: r[1] }); });
    city.border = M.border ? pts(M.border) : null;
    // Which buildings touch each zone.
    M.buildings.forEach(function (b, i) {
      var f = b[0], x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (var j = 0; j + 1 < f.length; j += 2) { x0 = Math.min(x0, f[j]); x1 = Math.max(x1, f[j]); y0 = Math.min(y0, f[j + 1]); y1 = Math.max(y1, f[j + 1]); }
      eachZone(city, x0 * k, y0 * k, x1 * k, y1 * k, function (z) { var l = city.zoneB.get(z); if (l) l.push(i); else city.zoneB.set(z, [i]); });
    });
    city.map = M;
    city.name = M.name;
    city.real = true;
    city.start = { x: M.start[0] * k, y: M.start[1] * k };
    parkCars(city, L.makeRng(0x5a17));
    bucket(city);
    return city;
  };

  // Calls fn(zone index) for every zone a box (in px) touches.
  function eachZone(city, x0, y0, x1, y1, fn) {
    var Z = city.cell * L.data.city.page, zr = Math.ceil(city.rows / L.data.city.page);
    for (var zy = Math.max(0, Math.floor(y0 / Z)); zy <= Math.min(zr - 1, Math.floor(y1 / Z)); zy++)
      for (var zx = Math.max(0, Math.floor(x0 / Z)); zx <= Math.min(city.pcols - 1, Math.floor(x1 / Z)); zx++) fn(zy * city.pcols + zx);
  }

  // Builds one zone of the walk grid: walkable inside the border, then walls where buildings and cars are.
  // Houses with a floor plan (js/interiors.js) are walkable inside, with their outer walls (open at the doors)
  // and their inside walls; every other building is solid.
  function buildPage(city, z) {
    var C = L.data.city, P = C.page, x0 = (z % city.pcols) * P, y0 = Math.floor(z / city.pcols) * P, a = new Uint8Array(P * P), M = city.map;
    if (city.border) fillZone(city, a, x0, y0, city.border, null, 1); else a.fill(1);
    var list = city.zoneB.get(z), cars = city.zoneCars.get(z), houses = [], i;
    if (list) for (i = 0; i < list.length; i++) {
      var plan = L.cityHouse ? L.cityHouse(city, list[i]) : null;
      if (plan) houses.push(plan); else fillZone(city, a, x0, y0, null, M.buildings[list[i]][0], 0);
    }
    houses.forEach(function (h) {
      for (var k = 0; k < h.outline.length; k++) {
        var q = h.outline[k], r = h.outline[(k + 1) % h.outline.length];
        stampWall(city, a, x0, y0, q[0], q[1], r[0], r[1], h.exitsPx);
      }
      var rails = (h.railsPx || []).map(String); // stamped later, see-through
      h.wallsPx.forEach(function (w) { if (rails.indexOf(String(w)) < 0) stampWall(city, a, x0, y0, w[0], w[1], w[2], w[3], null); });
    });
    // Then every doorway is cleared through the whole thickness of its wall (on a turned house the walls near a
    // corner can close a door's gap), but only inside its own house or outside every building: row houses share
    // walls, and a front door must not open a hole into the house next door.
    var others = function (h, x, y) {
      for (var j = 0; j < list.length; j++) if (list[j] !== h.index && insideFlat(M.buildings[list[j]][0], city.k, x, y)) return true;
      return false;
    };
    // (Footprints of neighbours sometimes overlap a little in the data: a spot inside two houses is never cleared.)
    houses.forEach(function (h) {
      var free = function (x, y) { return !others(h, x, y); };
      h.doorsPx.forEach(function (d) { clearDoor(city, a, x0, y0, d, function (x, y) { return inPolygon(h.outline, x, y) && free(x, y); }); });
      h.exitSegsPx.forEach(function (d) { clearDoor(city, a, x0, y0, d, free); });
    });
    // The ground floor's furniture is solid too (js/furnish.js).
    // A small or thin piece may cover no cell's center: its middle line is stamped too. Low furniture (most of it:
    // data/sight.js, tall) blocks bodies but you see over it: value 2, see-through.
    var tall = L.data.sight ? L.data.sight.tall : [], bar = city._bar;
    houses.forEach(function (h) {
      (h.solidPx || []).forEach(function (o, k) {
        if (bar && bar[h.index + ':f:' + k]) return; // dragged to a door, or broken (js/barricade.js)
        var v = tall.indexOf(h.furniture[k].t) >= 0 ? 0 : 2, only = v ? 1 : undefined;
        fillZone(city, a, x0, y0, o.pts, null, v, only);
        var long = o.hw >= o.hd, ux = long ? o.ax : o.fx, uy = long ? o.ay : o.fy, half = long ? o.hw : o.hd;
        stampWall(city, a, x0, y0, o.x - ux * half, o.y - uy * half, o.x + ux * half, o.y + uy * half, null, v, only);
        stampWall(city, a, x0, y0, o.x, o.y, o.x, o.y, null, v, only); // and its very middle
      });
      // Stair railings and windows: still in the way, but you see through them.
      (h.railsPx || []).forEach(function (w) { stampWall(city, a, x0, y0, w[0], w[1], w[2], w[3], null, 2, 1); });
      (h.windows || []).forEach(function (w) { stampWall(city, a, x0, y0, w[0] * city.scale, w[1] * city.scale, w[2] * city.scale, w[3] * city.scale, null, 2, 0); });
    });
    // Barricades (js/barricade.js): planks close a doorway or a window (you see between them), a piece of furniture
    // closes a doorway; a broken window lets bodies through.
    if (bar && L.planOpenings) houses.forEach(function (h) {
      L.planOpenings(h).forEach(function (o) {
        var b = bar[o.key], q = o.seg;
        if (!b) return;
        if (b.furn >= 0) stampWall(city, a, x0, y0, q[0], q[1], q[2], q[3], null, 0);
        else if (b.planks > 0) stampWall(city, a, x0, y0, q[0], q[1], q[2], q[3], null, 2);
        else if (o.kind === 'window' && b.broken) stampWall(city, a, x0, y0, q[0], q[1], q[2], q[3], null, 1, 2);
      });
    });
    // Parked cars: in the way, but you see over them.
    if (cars) for (i = 0; i < cars.length; i++) fillZone(city, a, x0, y0, cars[i].pts, null, 2, 1);
    if (city.pages.size >= C.maxPages) city.pages.delete(city.pages.keys().next().value); // the oldest goes
    city.pages.set(z, a);
    return a;
  }

  // Fills a polygon into a zone, row by row: a cell takes \`value\` when its center is inside. The polygon is either
  // points in px (\`pts\`) or the map's flat numbers (\`flat\`, times city.k).
  // `only`: if given, only cells that hold that value change (a car or low furniture over open ground, never over a
  // wall).
  function fillZone(city, a, x0, y0, pts, flat, value, only) {
    var c = city.cell, P = L.data.city.page, k = city.k, n = pts ? pts.length : flat.length >> 1, xs = [], i, j;
    var X = pts ? function (q) { return pts[q][0]; } : function (q) { return flat[q * 2] * k; };
    var Y = pts ? function (q) { return pts[q][1]; } : function (q) { return flat[q * 2 + 1] * k; };
    var minY = Infinity, maxY = -Infinity;
    for (i = 0; i < n; i++) { minY = Math.min(minY, Y(i)); maxY = Math.max(maxY, Y(i)); }
    var r0 = Math.max(y0, Math.ceil(minY / c - 0.5)), r1 = Math.min(y0 + P - 1, city.rows - 1, Math.floor(maxY / c - 0.5));
    for (var cy = r0; cy <= r1; cy++) {
      var py = (cy + 0.5) * c;
      xs.length = 0;
      for (i = 0, j = n - 1; i < n; j = i++) {
        var yi = Y(i), yj = Y(j);
        if ((yi > py) !== (yj > py)) { var xi = X(i), xj = X(j); xs.push(xi + (py - yi) * (xj - xi) / (yj - yi)); }
      }
      xs.sort(function (p, q) { return p - q; });
      for (var m = 0; m + 1 < xs.length; m += 2) {
        var ca = Math.max(x0, Math.ceil(xs[m] / c - 0.5)), cb = Math.min(x0 + P - 1, city.cols - 1, Math.floor(xs[m + 1] / c - 0.5));
        for (var cx = ca; cx <= cb; cx++) { var at = (cy - y0) * P + (cx - x0); if (only === undefined || a[at] === only) a[at] = value; }
      }
    }
  }

  // A wall from (ax, ay) to (bx, by) px into a zone: the cells the line goes through, one cell thick. On a slant
  // two of its cells may touch only at a corner, which is fine: a body can't squeeze through a corner (L.cityFits
  // looks around its center). `gaps` ({ x, y, r }) are doorways left open.
  // `value` (default 0) and `only` as in fillZone.
  function stampWall(city, a, x0, y0, ax, ay, bx, by, gaps, value, only) {
    var c = city.cell, P = L.data.city.page, len = Math.hypot(bx - ax, by - ay), steps = Math.max(1, Math.ceil(len / (c / 3)));
    for (var k = 0; k <= steps; k++) {
      var x = ax + (bx - ax) * k / steps, y = ay + (by - ay) * k / steps, open = false;
      if (gaps) for (var g = 0; g < gaps.length; g++) if (Math.hypot(x - gaps[g].x, y - gaps[g].y) < gaps[g].r) { open = true; break; }
      if (open) continue;
      var cx = Math.floor(x / c), cy = Math.floor(y / c);
      if (cx >= x0 && cx < x0 + P && cy >= y0 && cy < y0 + P) {
        var at = (cy - y0) * P + (cx - x0);
        if (only === undefined || a[at] === only) a[at] = value || 0;
      }
    }
  }

  // Makes walkable the cells of a doorway [ax, ay, bx, by] px: along the door (10 cm short of each end) and up to
  // DOOR_DEPTH cells on both sides of it, where `may(x, y)` allows it.
  var DOOR_DEPTH = 1.1;
  function clearDoor(city, a, x0, y0, d, may) {
    var c = city.cell, P = L.data.city.page, dx = d[2] - d[0], dy = d[3] - d[1], len = Math.hypot(dx, dy), half = DOOR_DEPTH * c;
    if (!len) return;
    var ux = dx / len, uy = dy / len, end = 0.1 * city.scale;
    var cx0 = Math.max(x0, Math.floor((Math.min(d[0], d[2]) - half) / c)), cx1 = Math.min(x0 + P - 1, Math.floor((Math.max(d[0], d[2]) + half) / c));
    var cy0 = Math.max(y0, Math.floor((Math.min(d[1], d[3]) - half) / c)), cy1 = Math.min(y0 + P - 1, Math.floor((Math.max(d[1], d[3]) + half) / c));
    for (var cy = cy0; cy <= cy1; cy++) for (var cx = cx0; cx <= cx1; cx++) {
      var px = (cx + 0.5) * c - d[0], py = (cy + 0.5) * c - d[1], t = px * ux + py * uy, n = Math.abs(px * uy - py * ux);
      if (t >= end && t <= len - end && n <= half && may((cx + 0.5) * c, (cy + 0.5) * c)) a[(cy - y0) * P + (cx - x0)] = 1;
    }
  }

  // Is (x, y) inside a building of the real map, or past its border?
  function blocked(city, x, y) {
    if (x < 0 || y < 0 || x >= city.w || y >= city.h) return true;
    if (city.border && !inPolygon(city.border, x, y)) return true;
    var P = L.data.city.page, z = Math.floor(y / city.cell / P) * city.pcols + Math.floor(x / city.cell / P), list = city.zoneB.get(z);
    if (!list) return false;
    for (var i = 0; i < list.length; i++) if (insideFlat(city.map.buildings[list[i]][0], city.k, x, y)) return true;
    return false;
  }
  function insideFlat(f, k, x, y) {
    var inside = false, n = f.length >> 1;
    for (var i = 0, j = n - 1; i < n; j = i++) {
      var xi = f[i * 2] * k, yi = f[i * 2 + 1] * k, xj = f[j * 2] * k, yj = f[j * 2 + 1] * k;
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  // Parked cars along the curb of the real streets (solid: they block bullets too), never close to a corner, on a
  // building, past the border or on another car. Worked out from the shapes, not the walk grid, so loading the map
  // doesn't build every zone.
  function parkCars(city, rng) {
    var C = L.data.city, CR = C.cars, s = city.scale;
    // Corners: points shared by two streets (or twice by one), in a 30 m bucket grid.
    var seen = new Map(), corners = new Map(), B = 30 * s, key = function (p) { return Math.round(p[0]) + ',' + Math.round(p[1]); };
    city.roads.forEach(function (r, ri) {
      r.pts.forEach(function (p) {
        var kk = key(p);
        if (!seen.has(kk)) { seen.set(kk, ri); return; }
        var bk = Math.floor(p[0] / B) + ',' + Math.floor(p[1] / B);
        if (!corners.has(bk)) corners.set(bk, []);
        corners.get(bk).push(p);
      });
    });
    var near = function (grid, x, y, d) {
      for (var gy = Math.floor((y - d) / B); gy <= Math.floor((y + d) / B); gy++) for (var gx = Math.floor((x - d) / B); gx <= Math.floor((x + d) / B); gx++) {
        var list = grid.get(gx + ',' + gy);
        if (list) for (var i = 0; i < list.length; i++) if (Math.abs(list[i][0] - x) < d && Math.abs(list[i][1] - y) < d) return true;
      }
      return false;
    };
    var parked = new Map();
    var range = function (a) { return (a[0] + rng() * (a[1] - a[0])) * s; };
    city.roads.forEach(function (r) {
      if (CR.kinds.indexOf(r.kind) < 0 || r.w < 8 * s) return;
      for (var k = 1; k < r.pts.length; k++) {
        var ax = r.pts[k - 1][0], ay = r.pts[k - 1][1], dx = r.pts[k][0] - ax, dy = r.pts[k][1] - ay, len = Math.sqrt(dx * dx + dy * dy);
        if (len < 10 * s) continue;
        var ux = dx / len, uy = dy / len;
        for (var side = -1; side <= 1; side += 2) {
          var nx = -uy * side, ny = ux * side;
          for (var t = 4 * s + rng() * 6 * s; t < len - 4 * s; t += range(CR.every)) {
            if (rng() > CR.chance) continue;
            var cx = ax + ux * t + nx * (r.w / 2 - 1.3 * s), cy = ay + uy * t + ny * (r.w / 2 - 1.3 * s), hl = CR.length * s / 2, hw = CR.width * s / 2;
            if (near(corners, cx, cy, r.w / 2 + 9 * s) || near(parked, cx, cy, 4.6 * s)) continue;
            var car = [[cx - ux * hl - nx * hw, cy - uy * hl - ny * hw], [cx + ux * hl - nx * hw, cy + uy * hl - ny * hw],
              [cx + ux * hl + nx * hw, cy + uy * hl + ny * hw], [cx - ux * hl + nx * hw, cy - uy * hl + ny * hw]];
            if (blocked(city, cx, cy) || car.some(function (q) { return blocked(city, q[0], q[1]); })) continue;
            var it = { pts: car, x: cx, y: cy, ang: Math.atan2(uy, ux), color: Math.floor(rng() * 7) };
            city.cars.push(it);
            var pk = Math.floor(cx / B) + ',' + Math.floor(cy / B);
            if (!parked.has(pk)) parked.set(pk, []);
            parked.get(pk).push([cx, cy]);
            eachZone(city, cx - hl - hw, cy - hl - hw, cx + hl + hw, cy + hl + hw, function (z) { var l = city.zoneCars.get(z); if (l) l.push(it); else city.zoneCars.set(z, [it]); });
          }
        }
      }
    });
  }

  // One cell of the walk grid (1 = walkable), whichever way the city keeps it: one flat grid, or zones (real map).
  function cellAt(city, cx, cy) {
    if (cx < 0 || cy < 0 || cx >= city.cols || cy >= city.rows) return 0;
    if (!city.pages) return city.walk[cy * city.cols + cx];
    var P = L.data.city.page, z = Math.floor(cy / P) * city.pcols + Math.floor(cx / P), a = city.pages.get(z) || buildPage(city, z);
    return a[(cy % P) * P + (cx % P)];
  }

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
    var S = L.data.city.chunk, cols = Math.ceil(city.w / S), rows = Math.ceil(city.h / S), b = new Array(cols * rows);
    var put = function (kind, item, x0, y0, x1, y1) {
      for (var cy = Math.max(0, Math.floor(y0 / S)); cy <= Math.min(rows - 1, Math.floor(y1 / S)); cy++) {
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
    city.chunks = b; city.chunkCols = cols; city.chunkRows = rows;
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

  // Forgets the zones of the walk grid a box (px) touches, so they are built again (a barricade went up or came
  // down, js/barricade.js), and the way to you is worked out again.
  L.cityForget = function (city, x0, y0, x1, y1) {
    if (!city.pages) return;
    eachZone(city, x0, y0, x1, y1, function (z) { city.pages.delete(z); });
    city.flowCell = -1;
  };

  // ---- Using it ----

  L.cityWalkable = function (city, x, y) {
    var cx = Math.floor(x / city.cell), cy = Math.floor(y / city.cell);
    return cellAt(city, cx, cy) === 1;
  };

  // A circle fits if its center and eight points on its edge are on walkable cells.
  function fits(city, x, y, r) {
    var W = L.cityWalkable, d = r * 0.7;
    return W(city, x, y) && W(city, x + r, y) && W(city, x - r, y) && W(city, x, y + r) && W(city, x, y - r) &&
      W(city, x + d, y + d) && W(city, x - d, y + d) && W(city, x + d, y - d) && W(city, x - d, y - d);
  }
  L.cityFits = fits;

  // A walk-grid cell for sight (js/sight.js): 1 open, 2 blocked but see-through, 0 hides what is behind.
  L.citySightCell = cellAt;

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
    // On the real map the wider search stops at 2000 cells (1 km): each zone it looks at gets built.
    return free(city, x, y, true, 400) || free(city, x, y, false, city.pages ? 2000 : Math.max(city.cols, city.rows)) || { x: x, y: y };
  };

  // needFit: only spots where a body fits (the middle of a street); searches up to maxRing cells away.
  // Only the edge of each ring is looked at (the real map is big: a spot past the border can be far from any street).
  function free(city, x, y, needFit, maxRing) {
    var c = city.cell, cx0 = L.clamp(Math.floor(x / c), 0, city.cols - 1), cy0 = L.clamp(Math.floor(y / c), 0, city.rows - 1);
    for (var ring = 0; ring < maxRing; ring++) {
      if (cx0 - ring < 0 && cy0 - ring < 0 && cx0 + ring >= city.cols && cy0 + ring >= city.rows) break;
      for (var dy = -ring; dy <= ring; dy++) {
        var edge = Math.abs(dy) === ring, step = edge || !ring ? 1 : ring * 2;
        for (var dx = -ring; dx <= ring; dx += step) {
          var cx = cx0 + dx, cy = cy0 + dy;
          if (cellAt(city, cx, cy) !== 1) continue;
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
      var c = q[head++], lx = c % W, ly = (c - lx) / W, d = flow[c] + 1, gx = ox + lx, gy = oy + ly;
      if (lx > 0 && gx > 0 && cellAt(city, gx - 1, gy) === 1 && flow[c - 1] > d) { flow[c - 1] = d; q[tail++] = c - 1; }
      if (lx < W - 1 && gx < cols - 1 && cellAt(city, gx + 1, gy) === 1 && flow[c + 1] > d) { flow[c + 1] = d; q[tail++] = c + 1; }
      if (ly > 0 && gy > 0 && cellAt(city, gx, gy - 1) === 1 && flow[c - W] > d) { flow[c - W] = d; q[tail++] = c - W; }
      if (ly < W - 1 && gy < city.rows - 1 && cellAt(city, gx, gy + 1) === 1 && flow[c + W] > d) { flow[c + W] = d; q[tail++] = c + W; }
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
        if (dx && dy && (cellAt(city, nx, cy) !== 1 || cellAt(city, cx, ny) !== 1)) continue;
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
