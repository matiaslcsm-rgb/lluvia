// Shared helpers. Every script attaches to the global Lluvia namespace.
(function (L) {
  'use strict';

  // Seeded RNG (mulberry32) so a game can be replayed exactly from its seed.
  L.makeRng = function (seed) {
    var a = seed >>> 0;
    var rng = function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    rng.int = function (n) { return Math.floor(rng() * n); };
    rng.pick = function (arr) { return arr[rng.int(arr.length)]; };
    return rng;
  };

  L.clamp = function (v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; };

  L.findById = function (list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  };

  // Spanish-style number: comma decimals, at most two of them.
  L.formatNumber = function (n) {
    return (Math.round(n * 100) / 100).toString().replace('.', ',');
  };

  L.data = L.data || {};
})(this.Lluvia = this.Lluvia || {});
