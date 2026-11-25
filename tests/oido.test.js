// What you hear (stage 63, the user's answer 6 b): a sound comes from its side, quieter the farther, muffled behind
// a wall.

test('oído: el ruido suena del lado de donde viene, más bajo cuanto más lejos y tapado detrás de una pared', function () {
  var L = Lluvia, E = L.data.senses.ears, city = L.cityHome(1), s = city.scale;
  var g = L.createGame({ seed: 91, city: city, explore: true, noSpawn: true, night: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
  var p = g.player, sp = L.cityFree(city, city.start.x, city.start.y);
  p.x = sp.x; p.y = sp.y;
  var here = L.soundPlace(g, p.x, p.y);
  assert.ok(here.vol === 1 && here.pan === 0, 'lo tuyo no suena al medio y fuerte');
  var left = L.soundPlace(g, p.x - 8 * s, p.y), right = L.soundPlace(g, p.x + 8 * s, p.y);
  assert.ok(left.pan < -0.5 && right.pan > 0.5, 'no suena del costado: ' + left.pan + ' / ' + right.pan);
  assert.ok(Math.abs(left.pan) <= E.pan, 'el otro oído no oye nada');
  var near = L.soundPlace(g, p.x, p.y + 4 * s).vol, far = L.soundPlace(g, p.x, p.y + 20 * s).vol;
  assert.ok(near > far && far > 0, 'lejos no suena más bajo: ' + near + ' / ' + far);
  assert.strictEqual(L.soundPlace(g, p.x, p.y + (E.far + 1) * s).vol, 0, 'muy lejos se oye');
  // Behind a wall: half. Look around for a spot with a wall in between and one without, at the same distance.
  var open = null, walled = null;
  for (var tries = 0; tries < 40 && !(open && walled); tries++) {
    var at = L.cityFree(city, city.start.x + (tries % 7 - 3) * 25 * s, city.start.y + (Math.floor(tries / 7) - 3) * 25 * s);
    p.x = at.x; p.y = at.y;
    for (var d = 8; d < 26 && !(open && walled); d += 3) {
      open = null; walled = null;
      for (var a = 0; a < Math.PI * 2 && !(open && walled); a += 0.05) {
        var x = p.x + Math.cos(a) * d * s, y = p.y + Math.sin(a) * d * s, ray = L.sightRay(city, p, p.x, p.y, a, d * s);
        if (ray < d * s - city.cell) walled = walled || L.soundPlace(g, x, y); else open = open || L.soundPlace(g, x, y);
      }
    }
  }
  assert.ok(open && walled, 'no hay pared cerca de la plaza para probar');
  assert.ok(Math.abs(walled.vol - open.vol * E.wall) < 1e-9, 'la pared no tapa: ' + walled.vol + ' / ' + open.vol);
});
