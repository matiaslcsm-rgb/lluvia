// The weather (data/weather.js): what it is now, how strong (a change blends in over half an hour), its effects as
// multipliers the rest of the game asks for, lightning, and the water that floods the low ground of the real
// terrain while it rains.
(function (L) {
  'use strict';

  function D() { return L.data.weather; }

  L.makeWeather = function (g) {
    var id = D().start;
    g.weather = { id: id, prev: id, left: rand(g, D().kinds[id].hours), blend: 1, rise: 0, flashT: 0, nextFlash: 10 };
  };
  function rand(g, r) { return r[0] + g.rng() * (r[1] - r[0]); }

  // The next kind: by weight, never the same twice in a row.
  function pick(g, not) {
    var K = D().kinds, ids = Object.keys(K).filter(function (k) { return k !== not; }), total = 0;
    ids.forEach(function (k) { total += K[k].weight; });
    var r = g.rng() * total;
    for (var i = 0; i < ids.length; i++) { r -= K[ids[i]].weight; if (r < 0) return ids[i]; }
    return ids[0];
  }

  // An effect now, blended between the last kind and this one (1 if neither has it; `rain`, `dark`, `cold`: 0).
  L.wx = function (g, key) {
    var W = g.weather;
    if (!W) return key === 'rain' || key === 'dark' || key === 'cold' ? 0 : 1;
    var base = key === 'rain' || key === 'dark' || key === 'cold' ? 0 : 1, K = D().kinds;
    var a = K[W.prev][key], b = K[W.id][key];
    a = a === undefined ? base : a; b = b === undefined ? base : b;
    return a + (b - a) * W.blend;
  };
  L.weatherName = function (g) { return g.weather ? D().kinds[g.weather.id].name : ''; };

  // The ground's height at (x, y) px, in meters (the real terrain, data/map-*.js; 0 without one).
  L.groundAt = function (city, x, y) {
    var M = city.map, T = M && M.terrain;
    if (!T) return 0;
    var gx = x / city.scale / M.unit / T.step - 0.5, gy = y / city.scale / M.unit / T.step - 0.5;
    gx = Math.max(0, Math.min(T.nx - 1.001, gx)); gy = Math.max(0, Math.min(T.ny - 1.001, gy));
    var i = Math.floor(gx), j = Math.floor(gy), fx = gx - i, fy = gy - j, d = T.dm, n = T.nx;
    return (d[j * n + i] * (1 - fx) * (1 - fy) + d[j * n + i + 1] * fx * (1 - fy) + d[(j + 1) * n + i] * (1 - fx) * fy + d[(j + 1) * n + i + 1] * fx * fy) / 10;
  };
  function lowest(city) {
    if (city._lowest !== undefined) return city._lowest;
    var T = city.map && city.map.terrain;
    city._lowest = T ? Math.min.apply(null, T.dm) / 10 : 0;
    return city._lowest;
  }
  // How deep the water is at (x, y) px, in meters (0: dry).
  L.floodAt = function (g, x, y) {
    if (!g.weather || g.weather.rise <= 0 || !g.city.map) return 0;
    return Math.max(0, lowest(g.city) + g.weather.rise - L.groundAt(g.city, x, y));
  };
  L.floodLevel = function (g) { return g.weather ? lowest(g.city) + g.weather.rise : 0; };
  // How much wading at (x, y) slows you down (0 none).
  L.floodSlow = function (g, x, y) { var F = D().flood; return Math.min(F.maxSlow, L.floodAt(g, x, y) * F.slowPerM); };

  L.updateWeather = function (g, dt) {
    if (!g.weather) L.makeWeather(g);
    var W = g.weather, hours = dt / L.data.clock.hour, F = D().flood;
    W.left -= hours;
    if (W.left <= 0) {
      W.prev = W.id; W.id = pick(g, W.id); W.left = rand(g, D().kinds[W.id].hours); W.blend = 0;
      L.toast(g, 'El tiempo cambia: ' + D().kinds[W.id].name.toLowerCase() + '.', '#b9ad86');
    }
    if (W.blend < 1) W.blend = Math.min(1, W.blend + hours / D().blend);
    // The water: up while it rains, down when it stops.
    var rain = L.wx(g, 'rain');
    W.rise = rain > 0.05 ? Math.min(F.max, W.rise + F.rise * rain * hours) : Math.max(0, W.rise - F.fall * hours);
    // Lightning.
    if (W.flashT > 0) W.flashT -= dt;
    if (W.id === 'tormenta' && W.blend > 0.5) {
      W.nextFlash -= dt;
      if (W.nextFlash <= 0) {
        W.nextFlash = rand(g, D().lightning.every); W.flashT = D().lightning.flash;
        L.emit(g, 'thunder', g.player.x, g.player.y);
      }
    }
    // Cold: outdoors at night you lose life little by little.
    var cold = L.wx(g, 'cold'), p = g.player;
    if (cold > 0 && L.clockOf(g).light < 0.3 && !(p.floor || L.cityHouseAt(g.city, p.x, p.y)) && !(g.respawn > 0)) p.hp -= cold * hours;
  };
})(this.Lluvia = this.Lluvia || {});
