// How the zombies find you (js/senses.js, data/senses.js).

function senseSetup() {
  var L = Lluvia, city = L.cityHome(1), s = city.scale;
  var g = L.createGame({ seed: 11, city: city, explore: true, noSpawn: true, night: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
  g.spawning = false;
  var sp = L.cityFree(city, city.start.x, city.start.y);
  g.player.x = sp.x; g.player.y = sp.y;
  // Facing the longest open way from there, so there is room to see.
  var best = 0;
  for (var a = 0; a < 64; a++) { var ang = a / 64 * Math.PI * 2, d = L.sightRay(city, g.player, sp.x, sp.y, ang, 40 * s); if (d > best) { best = d; g.way = ang; } }
  g.room = best;
  return { L: L, g: g, s: s, city: city };
}

test('zombis: deambulan sin ir hacia vos, te ven en su cono de día y de noche menos', function () {
  var o = senseSetup(), L = o.L, g = o.g, s = o.s, p = g.player, K = L.data.clock;
  assert.ok(g.room > 10 * s, 'no hay lugar abierto para probar');
  var z = L.spawnEnemy(g, 'rastrero', p.x + Math.cos(g.way) * 9 * s, p.y + Math.sin(g.way) * 9 * s);
  z.floor = 0;
  var out = {};
  g.time = (12 - K.start) * K.hour; // noon
  z.face = g.way; L.zombieThink(g, z, 0.016, out);  // looking away from you
  z.look = 0; L.zombieThink(g, z, 0.3, out);
  assert.ok(!out.chase, 'te ve de espaldas');
  z.face = g.way + Math.PI; z.look = 0; L.zombieThink(g, z, 0.3, out);
  assert.ok(out.chase, 'de día no te ve a 9 m de frente');
  g.time = (24 - K.start) * K.hour; // midnight
  z.mind = 'wander'; z.look = 0; L.zombieThink(g, z, 0.3, out);
  assert.ok(!out.chase, 'de noche te ve a 9 m sin luz');
  p.flashlight = { on: true, battery: 1 };
  z.look = 0; L.zombieThink(g, z, 0.3, out);
  assert.ok(out.chase, 'la linterna no te delata');
});

test('zombis: oyen un tiro de lejos y van a ver; tus pasos solo de cerca; los que persiguen llaman a otros', function () {
  var o = senseSetup(), L = o.L, g = o.g, s = o.s, p = g.player, K = L.data.clock, N = L.data.senses.noise;
  g.time = (12 - K.start) * K.hour;
  var put = function (m) { var z = L.spawnEnemy(g, 'rastrero', p.x + Math.cos(g.way) * m * s, p.y + Math.sin(g.way) * m * s); z.floor = 0; z.face = g.way; z.mind = 'wander'; z.look = 0; z.turn = 9; return z; };
  var far = put(Math.min(20, g.room / s - 1)), out = {};
  L.makeNoise(g, p.x, p.y, N.walk, 0, p); L.swapNoises(g);
  L.zombieThink(g, far, 0.3, out);
  assert.strictEqual(far.mind, 'wander', 'oye tus pasos a 20 m');
  L.makeNoise(g, p.x, p.y, N.shot, 0, p); L.swapNoises(g);
  far.look = 0; L.zombieThink(g, far, 0.3, out);
  assert.strictEqual(far.mind, 'investigate', 'no oye un tiro a 20 m');
  assert.ok(Math.hypot(far.goX - p.x, far.goY - p.y) < 3 * s, 'no va hacia el tiro');
  // A chaser groans, and the one beside it comes to see.
  var chaser = put(6), mate = put(9);
  chaser.face = g.way + Math.PI; L.zombieThink(g, chaser, 0.3, out);
  assert.ok(out.chase, 'el de cerca no te ve');
  L.swapNoises(g);
  mate.look = 0; L.zombieThink(g, mate, 0.3, out);
  assert.ok(mate.mind === 'investigate' || mate.mind === 'chase', 'el gruñido no llama a los de al lado');
});
