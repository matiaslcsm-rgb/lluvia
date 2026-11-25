// The black barrier (docs/LORE.md, the user's answer 2 a, 2026-11-25): a black wall around San Miguel, on the
// partido's border. It can't be crossed, and they come out of it: the closer you are, the more zombies.
//   near: within this many meters of the barrier there are more zombies (all of it at the wall, none at `near`)
//   more: at the wall itself, this many times the zombies (how many come at once and how many walk around)
//   emerge: at the wall, this share of the new ones come out of the barrier in front of you (fewer the farther)
//   spread: they come out up to this many meters to each side of the spot of the wall nearest to you
//   out: and this many meters inside it   warn: the first time you get this close, you are told what it is
//   every: how often (seconds) your distance to it is looked at again
(function (L) {
  'use strict';
  L.data = L.data || {};
  L.data.barrier = {
    near: 150, more: 2.5, emerge: 0.6, spread: 35, out: 3, warn: 50, every: 0.5,
    text: 'La barrera negra. No se puede cruzar, y de ahí salen ellos.'
  };
})(this.Lluvia = this.Lluvia || {});
