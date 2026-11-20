// Duels: every so often two players leave their arenas and fight; the loser loses a life.
// Numbers are provisional.
(function (L) {
  'use strict';

  L.data.duels = {
    every: 180,          // seconds of horde between duels
    maxTime: 60,         // a duel lasts at most this long; then the one with more % health wins
    arena: 1000,         // side of the duel arena
    hpMul: 3,            // duel health = max health × this × the enemy-health growth of the clock,
                         // so duels last about the same early and late
    prize: 30,           // gold for the winner, grows with the clock like gold per kill
    finalBreak: 5,       // seconds between duels when only two are left
    returnInvuln: 2      // seconds of invulnerability when you get back to your arena
  };

  // Crazy rules: each duel gets one at random.
  // poolMul: duel health ×; sizeMul: body size ×; speedMul: movement ×; timeScale: the whole duel runs faster;
  // shrink: the lava closes in; lifesteal: share of your damage you heal; bounce: projectiles bounce off walls.
  L.data.duelRules = [
    { id: 'gigantes', name: 'Gigantes', desc: 'Los dos son enormes: más vida y más lentos.', poolMul: 1.5, sizeMul: 2.2, speedMul: 0.7 },
    { id: 'lava', name: 'Piso de lava', desc: 'La lava se va cerrando. Afuera del círculo te quemás.', shrink: true },
    { id: 'velocidad', name: 'A toda velocidad', desc: 'Todo pasa al doble de rápido.', timeScale: 2 },
    { id: 'fragiles', name: 'De cristal', desc: 'Los dos tienen la mitad de vida.', poolMul: 0.5 },
    { id: 'vampiros', name: 'Vampiros', desc: 'Cada golpe te cura un cuarto del daño que hacés.', lifesteal: 0.25 },
    { id: 'rebote', name: 'Rebote', desc: 'Los proyectiles rebotan en las paredes.', bounce: true }
  ];
})(this.Lluvia = this.Lluvia || {});

// Bets: before each duel the players who are not fighting have a few seconds to bet on one of the two.
(function (L) {
  'use strict';
  L.data.bets = {
    window: 15,          // seconds to bet before the duel starts (none in the final, nobody is left to bet)
    maxShare: 0.5,       // you can bet up to this share of the gold you had when betting opened
    pressShare: 0.2,     // each key press bets this share of that limit (so 10% of your gold)
    free: 15             // free bet everyone gets on their first bet; grows with the clock like gold
  };
})(this.Lluvia = this.Lluvia || {});
