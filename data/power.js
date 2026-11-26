// Electricity (js/power.js; the user, 2026-11-26: "si un edificio tiene electricidad está bien que una sala esté
// iluminada; interruptores de luz para probar si hay electricidad"). Some buildings still have power (always the
// same ones); each room has a light switch next to its door.
//   share: of the buildings you can walk into, how many have power
//   reach: how close (m) to a switch to flip it
//   noise: meters a flipped switch is heard (a click)
(function (L) {
  'use strict';
  L.data = L.data || {};
  L.data.power = { share: 0.35, reach: 0.9, noise: 2 };
})(this.Lluvia = this.Lluvia || {});
