// Abilities are built from reusable pieces (`kind`): projectile, nova, orbit, aura, strike.
// `base` is level 1; each entry of `perLevel` is added on top for levels 2 to 5.
// `proc` scales the chance of item effects on hit (fast, weak hits get a lower one).
// Passives change one player stat by `perLevel` for each level.
// Numbers are provisional until the simulated-game bench exists.
(function (L) {
  'use strict';

  L.data.abilities = [
    {
      id: 'chispa', name: 'Chispa', kind: 'projectile', proc: 1, color: '#ffb347',
      desc: 'Dispara al enemigo más cercano.',
      base: { damage: 14, cooldown: 0.8, count: 1, speed: 450, pierce: 0, radius: 5, range: 500 },
      perLevel: [{ damage: 4 }, { count: 1 }, { cooldown: -0.15 }, { damage: 6, pierce: 1 }]
    },
    {
      id: 'lanza', name: 'Lanza', kind: 'projectile', proc: 1, color: '#cfe8ff',
      desc: 'Una lanza rápida que atraviesa varios enemigos.',
      base: { damage: 22, cooldown: 1.6, count: 1, speed: 650, pierce: 3, radius: 6, range: 700 },
      perLevel: [{ pierce: 2 }, { damage: 10 }, { count: 1 }, { cooldown: -0.3, damage: 10 }]
    },
    {
      id: 'temblor', name: 'Temblor', kind: 'nova', proc: 1, color: '#c8a165',
      desc: 'Cada tanto golpea todo lo que tenés alrededor.',
      base: { damage: 18, cooldown: 2.0, radius: 110 },
      perLevel: [{ radius: 20 }, { damage: 8 }, { cooldown: -0.4 }, { damage: 12, radius: 25 }]
    },
    {
      id: 'cuchillas', name: 'Cuchillas', kind: 'orbit', proc: 0.5, color: '#e6e6e6',
      desc: 'Hojas que giran a tu alrededor y cortan lo que tocan.',
      base: { damage: 10, count: 3, radius: 65, spin: 3.2, hitEvery: 0.5, size: 10 },
      perLevel: [{ count: 1 }, { damage: 5 }, { count: 1, radius: 10 }, { damage: 8, spin: 1 }]
    },
    {
      id: 'niebla', name: 'Niebla ácida', kind: 'aura', proc: 0.2, color: '#7ddc6a',
      desc: 'Una nube que daña sin parar a los que se acercan.',
      base: { dps: 10, radius: 80, tick: 0.5 },
      perLevel: [{ radius: 15 }, { dps: 6 }, { radius: 15 }, { dps: 10 }]
    },
    {
      id: 'rayo', name: 'Rayo', kind: 'strike', proc: 1, color: '#9ad0ff',
      desc: 'Rayos que caen sobre enemigos al azar cerca tuyo.',
      base: { damage: 30, cooldown: 1.5, count: 1, range: 350, splash: 40 },
      perLevel: [{ count: 1 }, { damage: 15 }, { cooldown: -0.3 }, { count: 2 }]
    },
    {
      id: 'escarcha', name: 'Escarcha', kind: 'nova', proc: 0.8, color: '#9fd8ff',
      desc: 'Una onda de frío que daña poco pero deja lentos a los enemigos.',
      base: { damage: 10, cooldown: 2.4, radius: 130, slow: 1.5 },
      perLevel: [{ radius: 20 }, { damage: 6 }, { slow: 0.5, cooldown: -0.4 }, { damage: 10, radius: 20 }]
    },
    {
      id: 'meteoro', name: 'Meteoro', kind: 'strike', proc: 1, color: '#ff6a3d',
      desc: 'Cada tanto cae un meteoro enorme sobre un enemigo cercano.',
      base: { damage: 70, cooldown: 3.2, count: 1, range: 420, splash: 85 },
      perLevel: [{ damage: 30 }, { splash: 20 }, { cooldown: -0.7 }, { count: 1, damage: 30 }]
    },

    {
      id: 'ola', name: 'Ola', kind: 'projectile', proc: 1, color: '#4fa3e0', boomerang: true,
      desc: 'Una ola que se aleja, vuelve hacia vos y atraviesa todo en los dos viajes.',
      base: { damage: 12, cooldown: 1.6, count: 1, speed: 380, pierce: 99, radius: 12, range: 360 },
      perLevel: [{ damage: 5 }, { count: 1 }, { radius: 4, damage: 6 }, { count: 1, cooldown: -0.3 }]
    },
    {
      id: 'torreta', name: 'Torreta', kind: 'turret', proc: 0.7, color: '#c07a45',
      desc: 'Planta una torreta donde estás. Dispara sola a lo más cercano durante un rato.',
      base: { damage: 12, cooldown: 4, life: 9, fireEvery: 0.55, range: 320, speed: 520, max: 2 },
      perLevel: [{ damage: 4 }, { max: 1 }, { fireEvery: -0.15 }, { max: 1, damage: 6 }]
    },
    {
      id: 'faro', name: 'Haz giratorio', kind: 'sweep', proc: 0.5, color: '#ffe08a',
      desc: 'Un haz de luz gira a tu alrededor y quema lo que barre.',
      base: { damage: 14, length: 170, width: 14, spin: 2.2, hitEvery: 0.5, count: 1 },
      perLevel: [{ length: 30 }, { damage: 6 }, { count: 1 }, { damage: 8, length: 30 }]
    },

    // Fusions: never offered as new abilities. They replace their base ability (see L.data.fusions) and are
    // already at their top level, so they have no perLevel steps.
    { id: 'enjambre', name: 'Enjambre de chispas', kind: 'projectile', proc: 1, color: '#ffd166', fused: true,
      desc: 'Cinco chispas por disparo que atraviesan enemigos.',
      base: { damage: 28, cooldown: 0.45, count: 5, speed: 520, pierce: 2, radius: 6, range: 560 }, perLevel: [] },
    { id: 'lanza_real', name: 'Lanza real', kind: 'projectile', proc: 1, color: '#e0f0ff', fused: true,
      desc: 'Tres lanzas que atraviesan todo.',
      base: { damage: 90, cooldown: 1.0, count: 3, speed: 800, pierce: 99, radius: 8, range: 900 }, perLevel: [] },
    { id: 'cataclismo', name: 'Cataclismo', kind: 'nova', proc: 1, color: '#e0b070', fused: true,
      desc: 'Un temblor enorme y seguido.',
      base: { damage: 75, cooldown: 1.4, radius: 250 }, perLevel: [] },
    { id: 'torbellino', name: 'Torbellino', kind: 'orbit', proc: 0.6, color: '#ffffff', fused: true,
      desc: 'Siete hojas grandes girando rapidísimo.',
      base: { damage: 32, count: 7, radius: 105, spin: 5, hitEvery: 0.3, size: 14 }, perLevel: [] },
    { id: 'pantano', name: 'Pantano', kind: 'aura', proc: 0.3, color: '#5fcf50', fused: true,
      desc: 'Una niebla ácida enorme que derrite todo.',
      base: { dps: 65, radius: 190, tick: 0.4 }, perLevel: [] },
    { id: 'tormenta', name: 'Tormenta', kind: 'strike', proc: 1, color: '#bfe3ff', fused: true,
      desc: 'Seis rayos por descarga, casi sin pausa.',
      base: { damage: 95, cooldown: 0.8, count: 6, range: 460, splash: 70 }, perLevel: [] },
    { id: 'glaciar', name: 'Glaciar', kind: 'nova', proc: 0.8, color: '#d8f0ff', fused: true,
      desc: 'Una onda helada enorme que deja a todos casi quietos.',
      base: { damage: 40, cooldown: 1.8, radius: 220, slow: 3 }, perLevel: [] },
    { id: 'apocalipsis', name: 'Apocalipsis', kind: 'strike', proc: 1, color: '#ff3d2e', fused: true,
      desc: 'Tres meteoros gigantes a la vez.',
      base: { damage: 220, cooldown: 2, count: 3, range: 500, splash: 130 }, perLevel: [] },
    { id: 'tsunami', name: 'Tsunami', kind: 'projectile', proc: 1, color: '#7fc4ff', boomerang: true, fused: true,
      desc: 'Cuatro olas gigantes que van y vuelven.',
      base: { damage: 60, cooldown: 1.2, count: 4, speed: 420, pierce: 99, radius: 22, range: 460 }, perLevel: [] },
    { id: 'fortaleza', name: 'Fortaleza', kind: 'turret', proc: 0.8, color: '#e09a5a', fused: true,
      desc: 'Cinco torretas que disparan sin parar.',
      base: { damage: 30, cooldown: 2, life: 14, fireEvery: 0.25, range: 380, speed: 600, max: 5 }, perLevel: [] },
    { id: 'faro_mayor', name: 'Faro mayor', kind: 'sweep', proc: 0.6, color: '#fff2b0', fused: true,
      desc: 'Tres haces enormes girando a toda velocidad.',
      base: { damage: 34, length: 300, width: 22, spin: 3.4, hitEvery: 0.3, count: 3 }, perLevel: [] }
  ];

  // Ability at level 5 + at least one copy of the item = the fusion shows up as a level-up option.
  L.data.fusions = [
    { ability: 'chispa', item: 'eco', into: 'enjambre' },
    { ability: 'lanza', item: 'afilador', into: 'lanza_real' },
    { ability: 'temblor', item: 'vendas', into: 'cataclismo' },
    { ability: 'cuchillas', item: 'pluma', into: 'torbellino' },
    { ability: 'niebla', item: 'colmillo', into: 'pantano' },
    { ability: 'rayo', item: 'arpa', into: 'tormenta' },
    { ability: 'escarcha', item: 'escudo', into: 'glaciar' },
    { ability: 'meteoro', item: 'mecha', into: 'apocalipsis' },
    { ability: 'ola', item: 'ascua', into: 'tsunami' },
    { ability: 'torreta', item: 'cristal', into: 'fortaleza' },
    { ability: 'faro', item: 'lupa', into: 'faro_mayor' }
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
    radius: 'de radio', dps: 'de daño por segundo', spin: 'de velocidad de giro', splash: 'de área',
    slow: 's de lentitud', length: 'de largo', max: 'torreta más', fireEvery: 's entre disparos', life: 's de vida'
  };
})(this.Lluvia = this.Lluvia || {});
