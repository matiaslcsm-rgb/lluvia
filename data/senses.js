// How the zombies find you (js/senses.js), as the user asked (docs/ZOMBOID.md, section 2): they don't walk
// straight at you. They wander, go to see where a noise came from, and chase you when they see you; if they lose
// you, they look around the last place they saw you. Lengths in meters, times in seconds.
(function (L) {
  'use strict';
  L.data = L.data || {};
  L.data.senses = {
    // Sight: a cone ahead of them. By day they see farther, at night less (answer 9), but a flashlight on gives you
    // away from `lit` meters. Walls and tall furniture hide you, as they hide them from you.
    sight: { cone: 120, day: 16, night: 6, lit: 24 },
    // Hearing: how far each noise reaches (answer 6). At night they hear `night` times farther (answer 9); a wall in
    // between halves it.
    noise: { shot: 35, hit: 10, run: 8, walk: 3, search: 2, groan: 12 },
    hearing: { night: 1.6, wall: 0.5 },
    wander: { speed: 0.3, turn: [2, 6], stop: 0.35 },  // share of their speed; seconds between turns; chance to stand
    investigate: { speed: 0.75, linger: 6 },          // goes to the noise, stays looking around this long
    chase: { lose: 4, search: 7, groanEvery: 3 },     // seconds without seeing you before it goes to the last spot;
                                                       // how long it looks around there; a groan every so often
    look: 0.25                                         // seconds between looks (each zombie, staggered)
  };
})(this.Lluvia = this.Lluvia || {});
