// Shelter and barricades (js/barricade.js, the user's answer 3 a, 2026-11-25): planks and nails on doors and
// windows, a piece of furniture dragged against a door, and zombies that bang on them until they break.
//   reach: how close (m) to a doorway or a window you have to be to work on it
//   planks: how many planks fit on a doorway / a window; plankHp: how much banging each one takes
//   nails: nails per plank (and a hammer, in your hands or in the backpack)
//   nail, pry, move: seconds to nail a plank, to pry one off (you get the plank back, the nails are lost) and to
//   drag a piece of furniture (or put it back)
//   moveReach: the piece must be this close (m) to the door; heavy: the pieces you can drag there, with how much
//   banging each takes and its name
//   glassHp: banging a window takes before the glass breaks (then bodies get through)
//   bang: banging per second of each zombie; bangReach: how close (m) it has to be; seek: a zombie looking for you
//   inside a house goes to its nearest closed doorway or window within this many meters
//   noise: how loud nailing is (meters, js/senses.js) and how loud a zombie banging is
(function (L) {
  'use strict';
  L.data = L.data || {};
  L.data.barricade = {
    reach: 1.3,
    planks: { door: 3, window: 2 }, plankHp: 30, nails: 2,
    nail: 1.6, pry: 1.2, move: 2.5,
    moveReach: 5,
    heavy: {
      ropero: { hp: 70, name: 'el ropero' }, heladera: { hp: 80, name: 'la heladera' }, estante: { hp: 45, name: 'el estante' },
      sillon: { hp: 40, name: 'el sillón' }, mesa: { hp: 35, name: 'la mesa' }, escritorio: { hp: 45, name: 'el escritorio' },
      cama: { hp: 40, name: 'la cama' }, archivero: { hp: 55, name: 'el archivero' }, mostrador: { hp: 60, name: 'el mostrador' },
      lavarropas: { hp: 50, name: 'el lavarropas' }
    },
    glassHp: 6,
    bang: 2, bangReach: 1.2, seek: 8,
    noise: { nail: 22, bang: 14 }
  };
})(this.Lluvia = this.Lluvia || {});
