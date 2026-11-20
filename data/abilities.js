// Abilities are built from reusable pieces (`kind`): projectile, nova, orbit, aura, strike.
// `base` is level 1; each entry of `perLevel` is added on top for levels 2 to 5.
// Passives change one player stat by `perLevel` for each level.
// Numbers are provisional until the simulated-game bench exists.
(function (L) {
  'use strict';

  L.data.abilities = [
    {
      id: 'chispa', name: 'Chispa', kind: 'projectile', color: '#ffb347',
      desc: 'Dispara al enemigo más cercano.',
      base: { damage: 12, cooldown: 0.8, count: 1, speed: 450, pierce: 0, radius: 5, range: 500 },
      perLevel: [{ damage: 4 }, { count: 1 }, { cooldown: -0.15 }, { damage: 6, pierce: 1 }]
    },
    {
      id: 'lanza', name: 'Lanza', kind: 'projectile', color: '#cfe8ff',
      desc: 'Una lanza rápida que atraviesa varios enemigos.',
      base: { damage: 22, cooldown: 1.6, count: 1, speed: 650, pierce: 3, radius: 6, range: 700 },
      perLevel: [{ pierce: 2 }, { damage: 10 }, { count: 1 }, { cooldown: -0.3, damage: 10 }]
    },
    {
      id: 'temblor', name: 'Temblor', kind: 'nova', color: '#c8a165',
      desc: 'Cada tanto golpea todo lo que tenés alrededor.',
      base: { damage: 18, cooldown: 2.0, radius: 110 },
      perLevel: [{ radius: 20 }, { damage: 8 }, { cooldown: -0.4 }, { damage: 12, radius: 25 }]
    },
    {
      id: 'cuchillas', name: 'Cuchillas', kind: 'orbit', color: '#e6e6e6',
      desc: 'Hojas que giran a tu alrededor y cortan lo que tocan.',
      base: { damage: 9, count: 2, radius: 70, spin: 3.2, hitEvery: 0.5, size: 9 },
      perLevel: [{ count: 1 }, { damage: 5 }, { count: 1, radius: 10 }, { damage: 8, spin: 1 }]
    },
    {
      id: 'niebla', name: 'Niebla ácida', kind: 'aura', color: '#7ddc6a',
      desc: 'Una nube que daña sin parar a los que se acercan.',
      base: { dps: 10, radius: 80, tick: 0.5 },
      perLevel: [{ radius: 15 }, { dps: 6 }, { radius: 15 }, { dps: 10 }]
    },
    {
      id: 'rayo', name: 'Rayo', kind: 'strike', color: '#9ad0ff',
      desc: 'Rayos que caen sobre enemigos al azar cerca tuyo.',
      base: { damage: 30, cooldown: 1.5, count: 1, range: 350, splash: 40 },
      perLevel: [{ count: 1 }, { damage: 15 }, { cooldown: -0.3 }, { count: 2 }]
    }
  ];

  L.data.passives = [
    { id: 'botas', name: 'Botas', desc: '+8% de velocidad.', stat: 'speedMul', perLevel: 0.08 },
    { id: 'corazon', name: 'Corazón', desc: '+20 de vida máxima.', stat: 'maxHpAdd', perLevel: 20 },
    { id: 'iman', name: 'Imán', desc: '+30% de radio para juntar experiencia.', stat: 'pickupMul', perLevel: 0.3 },
    { id: 'furia', name: 'Furia', desc: '-8% de recarga en todas tus habilidades.', stat: 'cooldownMul', perLevel: -0.08 },
    { id: 'poder', name: 'Poder', desc: '+10% de daño.', stat: 'damageMul', perLevel: 0.1 },
    { id: 'sangre', name: 'Sangre', desc: 'Recuperás 0,5 de vida por segundo.', stat: 'regenAdd', perLevel: 0.5 }
  ];

  // How each stat reads in an upgrade's description ("+4 de daño").
  L.data.statLabels = {
    damage: 'de daño', cooldown: 's de recarga', count: 'de cantidad', pierce: 'enemigos atravesados',
    radius: 'de radio', dps: 'de daño por segundo', spin: 'de velocidad de giro', splash: 'de área'
  };
})(this.Lluvia = this.Lluvia || {});
