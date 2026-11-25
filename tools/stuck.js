// Looks for spots where you get stuck: a bot walks around for a long time (streets, into houses, up and down their
// stairs) and every so often checks if it can still move in any of 8 directions. Prints every stuck spot.
// Usage: node tools/stuck.js [walks=20] [minutesEach=10] [real]
//   real: on the whole partido (slow); otherwise the small test map (tests/fixtures/map-prueba.js).
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const real = process.argv[4] === 'real';
const ctx = vm.createContext({ console });
for (const m of html.matchAll(/<script src="([^"]+)"/g)) {
  if (m[1].startsWith('js/view/')) continue;
  const f = m[1] === 'data/map-sanmiguel.js' && !real ? 'tests/fixtures/map-prueba.js' : m[1];
  vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
}
if (!real) vm.runInContext("Lluvia.data.city.home = 'prueba';", ctx);
ctx.walks = +(process.argv[2] || 20); ctx.minutes = +(process.argv[3] || 10);
vm.runInContext(`
  var L = Lluvia, city = L.cityHome(1), s = city.scale, found = [], seen = {}, inside = 0, upstairs = 0, steps = 0;
  var houses = [];
  for (var i = 0; i < city.map.buildings.length; i++) { var pl = L.cityHouse(city, i); if (pl && pl.exitsPx.length) houses.push(pl); }
  function canMove(g) {
    var p = g.player, out = {};
    for (var a = 0; a < 8; a++) {
      var ang = a * Math.PI / 4, save = { x: p.x, y: p.y, floor: p.floor, z: p.z, house: p.house, stairOn: p.stairOn };
      L.cityLevelMove(city, p, p.x + Math.cos(ang) * 0.3 * s, p.y + Math.sin(ang) * 0.3 * s, p.r, out);
      var moved = Math.hypot(out.x - save.x, out.y - save.y) > 0.05 * s;
      p.floor = save.floor; p.z = save.z; p.house = save.house; p.stairOn = save.stairOn;
      if (moved) return true;
    }
    return false;
  }
  for (var w = 0; w < walks; w++) {
    var g = L.createGame({ seed: 500 + w, city: city, explore: true, noSpawn: true, night: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
    g.spawning = false;
    var p = g.player, rng = L.makeRng(900 + w), sp = L.cityFree(city, city.start.x, city.start.y);
    p.x = sp.x; p.y = sp.y;
    var goal = null, hold = 0, dir = 0, dt = 1 / 30;
    for (var t = 0; t < minutes * 60; t += dt) {
      g.enemies.length = 0; p.hp = p.stats.maxHp; p.fed = p.watered = 100;
      // Head for a house's door (then wander inside), or wander.
      hold -= dt;
      if (hold <= 0) {
        hold = 0.5 + rng() * 2.5;
        if (rng() < 0.4) { var h = houses[Math.floor(rng() * houses.length)], e = h.exitsPx[0]; goal = { x: e.x, y: e.y }; }
        else { goal = null; dir = rng() * Math.PI * 2; }
      }
      var ix = Math.cos(dir), iy = Math.sin(dir);
      if (goal) {
        var gx = goal.x - p.x, gy = goal.y - p.y, gl = Math.hypot(gx, gy);
        if (gl < 2 * s || gl > 80 * s) goal = null; else { ix = gx / gl; iy = gy / gl; }
      }
      L.stepPlayer(g, ix * p.stats.speed * dt, iy * p.stats.speed * dt);
      steps++; if (p.floor) upstairs++; else if (L.cityHouseAt(city, p.x, p.y)) inside++;
      if (Math.floor(t * 2) !== Math.floor((t - dt) * 2) && !canMove(g)) {
        var key = Math.round(p.x / s) + ',' + Math.round(p.y / s) + ',' + (p.floor || 0);
        if (!seen[key]) {
          seen[key] = 1;
          var hh = p.floor ? p.house : L.cityHouseAt(city, p.x, p.y);
          found.push({ x: +(p.x / s).toFixed(1), y: +(p.y / s).toFixed(1), floor: p.floor || 0, house: hh ? hh.index : null, stair: !!p.stairOn, fits: L.cityFits(city, p.x, p.y, L.data.city.body) });
        }
        // Get it out to keep walking.
        var fr = L.cityFree(city, p.x, p.y); p.x = fr.x; p.y = fr.y; p.floor = 0; p.z = 0; p.house = null; p.stairOn = null;
      }
    }
  }
  console.log('Adentro de casas: ' + Math.round(inside / steps * 100) + '% del tiempo; en un piso de arriba: ' + Math.round(upstairs / steps * 100) + '%.');
  console.log(found.length ? found.length + ' lugares donde te trabás:' : 'No se trabó en ningún lado.');
  found.slice(0, 40).forEach(function (f) { console.log(JSON.stringify(f)); });
`, ctx);
