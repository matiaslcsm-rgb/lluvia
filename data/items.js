// Items bought from chests. They stack without limit: every copy adds `perStack` on top of `base`.
// kind 'stat'  : changes a player stat (see recalcStats in js/game.js); `also` adds other stats per copy.
// kind 'onHit' : may trigger when one of your hits lands; `chance` is scaled by the ability's proc coefficient.
// kind 'onKill': triggers when you kill an enemy.
// Numbers are provisional until the simulated-game bench exists.
(function (L) {
  'use strict';

  L.data.rarities = {
    comun: { name: 'Común', color: '#e8e8ee' },
    raro: { name: 'Raro', color: '#6fdc6a' },
    legendario: { name: 'Legendario', color: '#ff5a5a' },
    maldito: { name: 'Maldito', color: '#b07aff' }   // a lot of power with a price
  };

  L.data.items = [
    // Common
    { id: 'pluma', name: 'Pluma', rarity: 'comun', kind: 'stat', stat: 'speedMul', perStack: 0.1,
      desc: '+10% de velocidad.' },
    { id: 'afilador', name: 'Afilador', rarity: 'comun', kind: 'stat', stat: 'damageMul', perStack: 0.12,
      desc: '+12% de daño.' },
    { id: 'arena', name: 'Reloj de arena', rarity: 'comun', kind: 'stat', stat: 'cooldownHyper', perStack: 0.1,
      desc: 'Menos recarga (cada copia rinde un poco menos que la anterior).' },
    { id: 'vendas', name: 'Vendas', rarity: 'comun', kind: 'stat', stat: 'regenAdd', perStack: 1,
      desc: '+1 de vida por segundo.' },
    { id: 'cristal', name: 'Cristal', rarity: 'comun', kind: 'stat', stat: 'crit', perStack: 0.1,
      desc: '+10% de chance de golpe crítico (doble daño).' },
    { id: 'lupa', name: 'Lupa', rarity: 'comun', kind: 'stat', stat: 'areaMul', perStack: 0.12,
      desc: '+12% de área en tus habilidades (ondas, auras, órbitas y rayos).' },
    { id: 'escudo', name: 'Escudo', rarity: 'comun', kind: 'stat', stat: 'armorHyper', perStack: 0.1,
      desc: 'Recibís menos daño (cada copia rinde un poco menos que la anterior).' },
    { id: 'raiz', name: 'Raíz', rarity: 'comun', kind: 'stat', stat: 'stillRegen', perStack: 3, also: { regenAdd: 1 },
      desc: '+1 de vida por segundo, y quieto te curás 3 más (se enciende de a poco).' },
    { id: 'charco', name: 'Charco de oro', rarity: 'comun', kind: 'stat', stat: 'goldMul', perStack: 0.1,
      desc: '+10% del oro que sueltan las criaturas.' },
    { id: 'mecha', name: 'Mecha', rarity: 'comun', kind: 'onKill', effect: 'explode',
      base: { mult: 1.5, radius: 60 }, perStack: { mult: 0.75, radius: 10 },
      desc: 'Los enemigos que matás explotan: 150% del golpe a los de al lado (+75% por copia).' },

    // Rare
    { id: 'arpa', name: 'Arpa de chispas', rarity: 'raro', kind: 'onHit', effect: 'chain', chance: 0.25,
      base: { targets: 3, mult: 0.8, range: 160 }, perStack: { targets: 2 },
      desc: '25% de chance al pegar: un rayo salta a 3 enemigos cercanos (+2 por copia).' },
    { id: 'ascua', name: 'Ascua', rarity: 'raro', kind: 'onHit', effect: 'burn', chance: 0.2,
      base: { mult: 0.6, duration: 2 }, perStack: { mult: 0.6 },
      desc: '20% de chance al pegar: prende fuego al enemigo.' },
    { id: 'colmillo', name: 'Colmillo', rarity: 'raro', kind: 'onHit', effect: 'heal', chance: 1,
      base: { amount: 1 }, perStack: { amount: 1 },
      desc: 'Cada golpe te cura 1 de vida.' },
    { id: 'eco', name: 'Eco', rarity: 'raro', kind: 'stat', stat: 'extraProjectiles', perStack: 1,
      desc: '+1 proyectil en tus habilidades que disparan.' },
    { id: 'ancla', name: 'Ancla', rarity: 'raro', kind: 'stat', stat: 'stillDamage', perStack: 0.35, also: { damageMul: 0.1 },
      desc: '+10% de daño, y plantado sube hasta +35% más en un segundo y medio. Moverte lo apaga rápido.' },
    { id: 'racha', name: 'Racha', rarity: 'raro', kind: 'stat', stat: 'rushDamage', perStack: 0.3,
      desc: 'No pares: moviéndote, tu daño sube hasta +30% en tres segundos. Frenar lo corta.' },
    { id: 'trebol', name: 'Trébol', rarity: 'raro', kind: 'stat', stat: 'extraChoices', perStack: 1,
      desc: 'Al subir de nivel elegís entre una opción más.' },

    // Legendary
    { id: 'corona', name: 'Corona de tormenta', rarity: 'legendario', kind: 'onHit', effect: 'bigStrike', chance: 0.1,
      base: { mult: 3, radius: 80 }, perStack: { mult: 3 },
      desc: '10% de chance al pegar: cae un rayo enorme que hace el triple del golpe.' },
    { id: 'espejo', name: 'Espejo', rarity: 'legendario', kind: 'onHit', effect: 'repeat', chance: 0.2, chancePerStack: 0.2,
      base: {}, perStack: {},
      desc: '20% de chance de que cada golpe se repita (+20% por copia).' },
    { id: 'fenix', name: 'Fénix', rarity: 'legendario', kind: 'special',
      desc: 'La próxima vez que caigas en la horda, volvés ahí mismo con media vida en vez de perder una vida. Se gasta.' },

    // Cursed: a big bonus with a price you carry for the rest of the match (stacks too, price included).
    { id: 'vidrio', name: 'Paraguas de vidrio', rarity: 'maldito', kind: 'stat', stat: 'damageMul', perStack: 0.5, also: { maxHpMul: -0.2 },
      desc: '+50% de daño, pero -20% de vida máxima.' },
    { id: 'gotanegra', name: 'Gota negra', rarity: 'maldito', kind: 'stat', stat: 'goldMul', perStack: 0.4, also: { speedMul: -0.08 },
      desc: '+40% de oro, pero -8% de velocidad.' },
    { id: 'reloj', name: 'Reloj torcido', rarity: 'maldito', kind: 'stat', stat: 'cooldownHyper', perStack: 0.45, also: { regenAdd: -1.5 },
      desc: 'Mucha menos recarga, pero perdés 1,5 de vida por segundo (nunca te mata: te deja en 1).' }
  ];

  // Chests: `cost` grows with each difficulty step. Weights pick the rarity of what comes out.
  L.data.chests = {
    count: 6,              // chests lying around the arena at any time
    base: 40,              // gold at difficulty 1
    growth: 0.25,          // ×1.25 per difficulty step (compounding, like enemy health)
    weights: { comun: 78, raro: 20, legendario: 1, maldito: 1 },
    bossWeights: { raro: 80, legendario: 20 }  // the free chest a boss drops
  };
})(this.Lluvia = this.Lluvia || {});
