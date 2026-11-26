// The collective conscience (js/morale.js, stage 73; the user's answer 5, 2026-11-25: "lugares donde la moral sea
// baja y haya más locura: esas zonas son más inestables y peligrosas"). The city is split into square zones; each
// has a morale (0 to 100), moved by what happens there.
//   cell: the side of a zone (m); base: the morale of a zone where nothing happened; drift: how much each day brings
//   a zone back toward `base`
//   events: what each thing does to the zone's morale where it happens
//   low / cursed: below these a zone is unstable / cursed (the words in `words`)
//   zombies: at 0 morale, this many times more zombies (in between, in proportion below `low`)
//   sanity: what each day in a zone below `low` takes off the sanity of the people there (at 0 morale; in
//   proportion above)
//   omens: at night in a zone below `low`: a voice or a shadow every `every` seconds at most (more often lower)
(function (L) {
  'use strict';
  L.data = L.data || {};
  L.data.morale = {
    cell: 200, base: 60, drift: 3,
    events: { death: -10, odd: -4, turned: -8, hit: -4, kill: -12, zombie: 0.15, help: 5, calm: 4 },
    low: 35, cursed: 15,
    words: { calm: 'tranquila', low: 'inestable', cursed: 'maldita' },
    zombies: 1.5,
    sanity: 6,
    omens: { every: 45, voices: ['Alguien dice tu nombre, muy cerca.', 'Se oye un llanto que no viene de ningún lado.',
      'Una risa, atrás tuyo. No hay nadie.', 'Golpes en una pared, como si alguien quisiera salir.',
      'Una voz de chico te llama desde una casa vacía.'] }
  };
})(this.Lluvia = this.Lluvia || {});
