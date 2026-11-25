// How the city looks (data/look.js): amounts between 0 and 1, colors that a canvas reads.

test('estética: los valores de color, grano y bordes oscuros están en rango', function () {
  var K = Lluvia.data.look, hex = /^#[0-9a-f]{6}$/i;
  assert.ok(K, 'falta data/look.js');
  ['desaturate', 'tintAmount', 'grimeAmount'].forEach(function (k) { assert.ok(K[k] >= 0 && K[k] <= 1, k + ' fuera de 0 a 1'); });
  assert.ok(K.grain.amount >= 0 && K.grain.amount <= 0.4, 'el grano tapa todo');
  assert.ok(K.grain.size >= 32 && K.grain.fps > 0 && K.grain.fps <= 60);
  assert.ok(K.vignette.amount >= 0 && K.vignette.amount <= 1 && K.vignette.inner < K.vignette.outer, 'los bordes oscuros al revés');
  [K.tint, K.grime].concat(Object.keys(K.hud).map(function (k) { return K.hud[k]; })).forEach(function (c) { assert.ok(hex.test(c), 'color raro: ' + c); });
});
