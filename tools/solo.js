// Solo bench: a bot plays the solo game (one player, only the gun) in San Miguel. How long does it last?
// Usage: node tools/solo.js [games=10] [maxMinutes=30] [noche]
//   noche: with the clock of the day (L.data.mode.night): few zombies by day, the horde at night. Times are shown
//   as the game's day and hour too.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const ctx = vm.createContext({ console });
for (const m of html.matchAll(/<script src="([^"]+)"/g)) {
  if (!m[1].startsWith('js/view/')) vm.runInContext(fs.readFileSync(path.join(root, m[1]), 'utf8'), ctx, { filename: m[1] });
}
const games = +(process.argv[2] || 10), maxMin = +(process.argv[3] || 30);
ctx.games = games; ctx.maxMin = maxMin; ctx.night = process.argv[4] === 'noche';
vm.runInContext(`
  var L = Lluvia, city = L.cityHome(1), out = [], chars = L.data.characters.filter(function (c) { return !c.locked; });
  for (var i = 0; i < games; i++) {
    var mode = L.data.mode, ch = chars[i % chars.length].id;
    var m = L.createMatch({ seed: 1000 + i, characterId: ch, humanBot: true, city: city, solo: true, gunsOnly: true, gun: mode.startGun, explore: night, night: night });
    var g = m.human.game, sp = L.cityFree(city, city.start.x, city.start.y), deaths = [];
    g.player.x = sp.x; g.player.y = sp.y;
    var lives = g.lives;
    while (!m.over && g.time < maxMin * 60) {
      L.updateMatch(m, 1 / 30, {});
      if (g.lives < lives) { deaths.push(Math.round(g.time)); lives = g.lives; }
    }
    out.push({ ch: ch, t: g.time, lvl: g.player.level, kills: g.kills, gun: g.player.gun.level, deaths: deaths });
  }
  out.sort(function (a, b) { return a.t - b.t; });
  var clock = function (s) {
    var k = L.clockAt(s), hh = (k.hh < 10 ? '0' : '') + k.hh + ':' + (k.mm < 10 ? '0' : '') + k.mm;
    s = Math.round(s);
    return Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + s % 60 + (night ? ' (día ' + k.day + ' ' + hh + ')' : '');
  };
  out.forEach(function (r) { console.log(r.ch.padEnd(7), 'aguantó', clock(r.t).padStart(5), ' nivel', String(r.lvl).padStart(3), ' bajas', String(r.kills).padStart(5), ' Glock +' + r.gun, ' vidas perdidas a', r.deaths.map(clock).join(', ')); });
  console.log('mediana', clock(out[Math.floor(out.length / 2)].t));
`, ctx);
