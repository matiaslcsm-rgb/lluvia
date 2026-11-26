// The clock of the day and the lights (data/clock.js). The hour comes from the game's time; from it, how much
// daylight there is (1 at noon, 0 at night, in between at dawn and dusk). At night you see far only where there is
// light: your flashlight's cone, the street lamps that still work and the houses with the lights on.
(function (L) {
  'use strict';

  function C() { return L.data.clock; }

  // Daylight at a given hour: 0 at night, 1 by day, a smooth step through dawn and dusk. `rise` and `set`: the
  // season's (data/seasons.js); without them, data/clock.js's.
  function daylight(h, rise, set) {
    var K = C(), half = K.twilight / 2, smooth = function (t) { t = L.clamp(t, 0, 1); return t * t * (3 - 2 * t); };
    if (rise === undefined) { rise = K.sunrise; set = K.sunset; }
    if (h < rise - half || h > set + half) return 0;
    if (h < rise + half) return smooth((h - (rise - half)) / K.twilight);
    if (h > set - half) return 1 - smooth((h - (set - half)) / K.twilight);
    return 1;
  }
  L.daylight = daylight;

  // The season of a day (data/seasons.js): { id, name, def, dayIn (1-7) }, or null without seasons.
  L.seasonOf = function (day) {
    var S = L.data.seasons;
    if (!S) return null;
    var k = Math.floor((day - 1) / S.days), id = S.order[k % S.order.length];
    return { id: id, name: S.kinds[id].name, def: S.kinds[id], dayIn: (day - 1) % S.days + 1 };
  };

  // The clock at `time` seconds into the game: { day (1, 2...), hour (0-24, with fractions), hh, mm, light, phase,
  // season }. phase: 'dia', 'atardecer', 'noche' or 'amanecer'.
  L.clockAt = function (time) {
    var K = C(), total = K.start + time / K.hour, day = Math.floor(total / 24) + 1, h = total - (day - 1) * 24, half = K.twilight / 2;
    var season = L.seasonOf(day), rise = season ? season.def.sunrise : K.sunrise, set = season ? season.def.sunset : K.sunset;
    var phase = h >= rise - half && h < rise + half ? 'amanecer' : h >= set - half && h < set + half ? 'atardecer' :
      h >= rise + half && h < set - half ? 'dia' : 'noche';
    return { day: day, hour: h, hh: Math.floor(h), mm: Math.floor((h % 1) * 60), light: daylight(h, rise, set), phase: phase, season: season };
  };
  L.clockOf = function (g) { return L.clockAt((g.time || 0) + (g.slept || 0)); }; // g.slept: what sleeping skipped (js/rest.js)

  // Which night it is (1 the first): a night runs from the evening of one day to the morning of the next; the
  // morning of day 1 is night 0.
  L.nightOf = function (k) { return k.hour < 12 ? k.day - 1 : k.day; };

  // ---- The flashlight ----
  // F (input.light) turns it on or off. On, its battery runs down; off, it winds up again.
  L.updateClock = function (g, dt, input) {
    var p = g.player, F = C().flashlight, fl = p.flashlight || (p.flashlight = { on: false, battery: F.battery });
    if (input && input.light && !fl.held) fl.on = !fl.on;
    fl.held = !!(input && input.light);
    var hours = dt / C().hour;
    if (fl.on) { fl.battery = Math.max(0, fl.battery - F.drain * hours); if (!fl.battery) fl.on = false; }
    else fl.battery = Math.min(F.battery, fl.battery + F.recharge * hours);
  };

  // How far you see in your cone right now, in px: all the way by day; at night, as far as your flashlight reaches
  // (or the moon, if it is off).
  L.sightReach = function (g) {
    var s = g.city.scale, D = L.data.sight, K = C(), light = L.clockOf(g).light, fl = g.player.flashlight;
    if (g.weather && g.weather.flashT > 0) return D.range * s; // a lightning lights everything
    var dark = fl && fl.on ? Math.max(K.moon, K.flashlight.range) : K.moon;
    return (dark + (D.range - dark) * light) * s * (L.wx ? L.wx(g, 'sight') : 1) * (g.player.sightMul || 1); // fog and rain see less (js/weather.js), and sleepy too (js/rest.js)
  };

  // ---- Street lamps ----
  // Made once per city: along every street wide enough, one every `every` m on alternate sides, on the sidewalk.
  // Seeded by their place, so a lamp that works always works. Kept in buckets of 64 m to find the near ones.
  var BUCKET = 64;
  function lampsOf(city) {
    if (city._lamps) return city._lamps;
    var K = C().lamps, s = city.scale, step = K.every * s, out = { list: [], cells: new Map(), size: BUCKET * s };
    city.roads.forEach(function (r) {
      if (r.w < K.minRoad * s || r.pts.length < 2) return;
      var carry = step / 2, side = 1;
      for (var i = 0; i + 1 < r.pts.length; i++) {
        var a = r.pts[i], b = r.pts[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (!len) continue;
        var ux = (b[0] - a[0]) / len, uy = (b[1] - a[1]) / len;
        for (var t = carry; t < len; t += step) {
          var off = r.w / 2 + 0.8 * s, x = a[0] + ux * t - uy * off * side, y = a[1] + uy * t + ux * off * side;
          side = -side;
          var h = Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
          if (h >= K.working) continue;
          var lamp = { x: x, y: y, flicker: h < K.working * 0.15 };
          var key = Math.floor(x / out.size) + ',' + Math.floor(y / out.size);
          if (!out.cells.has(key)) out.cells.set(key, []);
          out.cells.get(key).push(lamp);
          out.list.push(lamp);
        }
        carry = t - len;
      }
    });
    city._lamps = out;
    return out;
  }
  L.cityLamps = lampsOf;

  // The working lamps within the box [x0, y0, x1, y1] px.
  L.lampsIn = function (city, x0, y0, x1, y1) {
    var Lm = lampsOf(city), out = [], z = Lm.size;
    for (var cy = Math.floor(y0 / z); cy <= Math.floor(y1 / z); cy++) for (var cx = Math.floor(x0 / z); cx <= Math.floor(x1 / z); cx++) {
      var list = Lm.cells.get(cx + ',' + cy);
      if (list) list.forEach(function (l) { if (l.x >= x0 && l.x <= x1 && l.y >= y0 && l.y <= y1) out.push(l); });
    }
    return out;
  };

  // Does a house still have the lights on? Seeded by the building: always the same ones.
  L.houseLit = function (plan) {
    var h = Math.abs(Math.sin((plan.index + 1) * 91.17) * 24634.6345) % 1;
    return h < C().houses.lit && (!L.hasPower || L.hasPower(plan)); // only where there is power (js/power.js)
  };

  // How lit a spot is by something other than the sun: 1 under a lamp or inside a lit house, 0 in the dark.
  L.lightAt = function (g, x, y, floor) {
    var city = g.city, K = C().lamps, r = K.radius * city.scale, best = 0;
    if (!floor) L.lampsIn(city, x - r, y - r, x + r, y + r).forEach(function (l) { best = Math.max(best, 1 - Math.hypot(l.x - x, l.y - y) / r); });
    var plan = L.cityHouseAt && L.cityHouseAt(city, x, y);
    if (plan && L.houseLit(plan)) best = Math.max(best, 0.8);
    if (L.litRoomAt && L.litRoomAt(g, x, y, floor)) best = 1; // a room you lit (js/power.js)
    return L.clamp(best * 1.6, 0, 1);
  };
})(this.Lluvia = this.Lluvia || {});
