// The Cuaderno del Paraguas: what you keep between matches. Sun coins, permanent upgrades and achievements.
// Upgrades only apply to you (the rivals don't have them): it is your progress, not the rivals'.
(function (L) {
  'use strict';
  L.data.meta = {
    // Sun coins for your place (index 0 = 1st), plus extras.
    placeCoins: [60, 35, 25, 18, 13, 9, 6, 4],
    perDuelWon: 4,
    per100Kills: 1,

    // Each level costs `cost` × level. `per` is what one level adds.
    upgrades: [
      { id: 'vida', name: 'Piel de lluvia', desc: '+5% de vida máxima por nivel.', stat: 'maxHpMul', per: 0.05, max: 5, cost: 20 },
      { id: 'dano', name: 'Fragua', desc: '+4% de daño por nivel.', stat: 'damageMul', per: 0.04, max: 5, cost: 25 },
      { id: 'veloz', name: 'Botas de charco', desc: '+3% de velocidad por nivel.', stat: 'speedMul', per: 0.03, max: 5, cost: 15 },
      { id: 'iman', name: 'Embudo', desc: '+12% de radio para juntar experiencia por nivel.', stat: 'pickupMul', per: 0.12, max: 5, cost: 10 },
      { id: 'oro', name: 'Alcancía', desc: 'Arrancás con 20 de oro más por nivel.', stat: 'startGold', per: 20, max: 5, cost: 15 },
      { id: 'recarga', name: 'Reloj de la Torre', desc: '-3% de recarga por nivel.', stat: 'cooldownMul', per: -0.03, max: 5, cost: 30 },
      { id: 'suerte', name: 'Trébol seco', desc: 'Más chance de raros y legendarios en los cofres.', stat: 'luck', per: 1, max: 3, cost: 40 }
    ],

    // Achievements: checked at the end of each match. `coins` is the one-time reward.
    achievements: [
      { id: 'primera', name: 'Primera tormenta', desc: 'Terminá una partida.', coins: 10 },
      { id: 'podio', name: 'Podio', desc: 'Terminá entre los 3 primeros.', coins: 25 },
      { id: 'sol', name: 'Un día de sol', desc: 'Ganá una partida.', coins: 80 },
      { id: 'juicio', name: 'Juez del Trueno', desc: 'Ganá 3 Juicios en una partida.', coins: 30 },
      { id: 'fusion', name: 'Alquimista', desc: 'Hacé una fusión.', coins: 20 },
      { id: 'dosfusiones', name: 'Gran alquimista', desc: 'Tené 2 fusiones a la vez.', coins: 40 },
      { id: 'coloso', name: 'Rompeolas', desc: 'Bajá un jefe (Coloso, Reina o Leviatán).', coins: 20 },
      { id: 'mil', name: 'Mil gotas', desc: 'Llegá a 1.000 bajas en una partida.', coins: 25 },
      { id: 'legendario', name: 'Tesoro del barro', desc: 'Conseguí un ítem legendario.', coins: 20 },
      { id: 'apostador', name: 'Ojo de halcón', desc: 'Acertá 3 apuestas en una partida.', coins: 25 },
      { id: 'todos', name: 'Todos los paraguas', desc: 'Jugá una partida con cada personaje.', coins: 50 },
      { id: 'invicto', name: 'Ni una gota', desc: 'Ganá sin perder ninguna vida.', coins: 150 },
      { id: 'eterna', name: 'Sol en la tormenta', desc: 'Ganá una partida en Tormenta eterna.', coins: 200 }
    ],

    // Content you unlock: three Paraguas and the hard mode. Each opens with an achievement, or earlier with coins
    // (cost 0 = only the achievement opens it). The rivals always use every Paraguas.
    unlocks: [
      { id: 'marea', kind: 'char', achievement: 'fusion', cost: 60 },
      { id: 'oxido', kind: 'char', achievement: 'coloso', cost: 80 },
      { id: 'faro', kind: 'char', achievement: 'podio', cost: 100 },
      { id: 'tormenta', kind: 'mode', name: 'Tormenta eterna', achievement: 'sol', cost: 0 }
    ],

    // Tormenta eterna: the hard mode. Tougher horde in every arena, sharper rivals, double coins.
    storm: { hpMul: 1.5, dpsMul: 1.25, botSkill: 0.15, coinMul: 2 }
  };
})(this.Lluvia = this.Lluvia || {});
