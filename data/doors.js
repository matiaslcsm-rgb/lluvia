// Doors (js/doors.js; the user, 2026-11-26: "agreguemos puertas a todo, que tengan llave, se puedan forzar y
// romper"). Every doorway of a ground floor has a door: the front and back ones (to the street) and the ones between
// rooms. In the real game (the one that starts in the Catedral) most street doors are closed and some locked.
//   street / inner: of each kind, the share closed and, of the closed ones, the share locked (always the same doors)
//   tap: a press of E or X shorter than this (s) opens, closes, locks or unlocks; holding it does the long work
//   (nailing a plank, prying one, forcing the lock)
//   force: seconds to force a lock, with one of `tools` (in your hands or bags); noise: how far (m) it is heard
//   hp: how much hitting a door takes before it breaks (your blows and the zombies' banging); breakNoise: meters
(function (L) {
  'use strict';
  L.data = L.data || {};
  L.data.doors = {
    street: { closed: 0.85, locked: 0.45 },
    inner: { closed: 0.3, locked: 0 },
    tap: 0.3,
    force: 3, tools: ['barra', 'destornillador', 'fierro', 'llave', 'machete'], noise: 12,
    hp: 40, breakNoise: 25
  };
})(this.Lluvia = this.Lluvia || {});
