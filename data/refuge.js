// The refuge you start in (js/refuge.js; the user's answers 3 and 6, 2026-11-25): you were a policeman of the
// province guarding the Catedral de San Miguel during the storm; now it is a refuge, its windows nailed shut, and
// they like you there. If you are knocked out you wake up where you last slept, but the refuge trusts you less.
//   home: the building (its name on the map) and the refuge's name; kit: what you start with besides the pistol
//   rep: how much the refuge trusts you (0 to 100): start; knocked: what being knocked out takes off; seen: what it
//   takes off on top when it happens near the refuge (somebody saw you fall), within seenRange meters; heal: what a
//   whole day without being knocked out gives back (provisional, until the user says what is profane)
//   levels: the words for how much they trust you, from the top
(function (L) {
  'use strict';
  L.data = L.data || {};
  L.data.refuge = {
    home: { building: 'Catedral de San Miguel', name: 'la Catedral' },
    kit: [['c:mochila'], ['w:martillo'], ['tablas', 3], ['clavos', 8]],
    rep: { start: 70, knocked: 8, seen: 7, seenRange: 60, heal: 3 },
    levels: [[85, 'te quieren'], [65, 'confían en vos'], [45, 'te toleran'], [25, 'desconfían de vos'], [0, 'no te quieren ahí']],
    intro: ['Sos policía de la provincia. En la tormenta te quedaste cuidando la Catedral de San Miguel.',
      'Ahora es un refugio: las ventanas están trabadas y la puerta es tuya. Conseguí cosas y cuidalo.']
  };
})(this.Lluvia = this.Lluvia || {});
