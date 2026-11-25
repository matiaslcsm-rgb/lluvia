// Hand weapons (js/melee.js), as the user asked (docs/ZOMBOID.md, section 1 and answers 2 to 4): fists and whatever
// you find in a house of an Argentine city. Each one belongs to a combat skill (data/skills.js):
//   mano: fists; corta: short weapons (knives, forks, small things); media: middle reach (machetes, sticks, bars).
// Its damage splits into contundente (c), cortante (k) and punzante (p), each weapon with its own mix (a hammer:
// 80% c, 15% k, 5% p); each kind of zombie takes each kind of damage differently (data/enemies.js, `resist`).
//   dmg: damage of one blow (a plain zombie has 10 of life)   reach: meters   speed: blows per second
//   dur: blows before it breaks (how fragile it is; 0 never)   knock: chance to drop the zombie   noise: meters it is
//   heard   air: air a blow costs   hurt: chance to hurt your hands (bare fists)   color: how it looks in your hands
//   len: how long it looks (m)   kg: weight (if not given: mano 0.2, corta 0.6, media 2; data/loot.js `carry`)
//   Holding the right button with a middle-reach weapon readies the blow (the user's answer 5): up to `ready` s,
//   the next blow hurts up to `readyDmg` more and drops more; you walk at half speed meanwhile.
(function (L) {
  'use strict';
  L.data = L.data || {};
  L.data.melee = {
    air: { max: 100, regen: 18, rest: 0.6, low: 15, slow: 1.7 }, // your air: refills after `rest` s; below `low`, blows `slow`x slower
    run: { mul: 1.6, cost: 14 },       // Shift: running, this many times faster, air per second (the user: "necesita correr")
    // Both mouse buttons at once: a shove (the user: "si usa los dos al mismo tiempo empuja"). Pushes the zombies in
    // front back `back` m and stops them `stun` s, may drop them; no damage. With fists each button is one hand.
    push: { reach: 0.9, back: 0.8, stun: 0.8, knock: 0.3, air: 12, every: 0.8, noise: 4, both: 0.12 },
    arc: 100,          // degrees in front of you a blow reaches
    downBonus: 2,      // a zombie lying on the floor takes this many times the damage
    ready: 0.8, readyDmg: 0.6, readyKnock: 1,
    // Covering yourself (Space held; the user's answer 5: "una mecánica para cubrirse"): how much of a zombie's
    // blow you stop, by what is in your hands; each point stopped costs `air` air; you walk at `slow` speed; only
    // what comes from the front (`arc` degrees).
    block: { mano: 0.5, corta: 0.65, media: 0.8, gun: 0.4, air: 0.8, slow: 0.5, arc: 140 },
    kgBySkill: { mano: 0.2, corta: 0.6, media: 2 },
    hurtLife: 3,       // life you lose when you hurt your hands
    weapons: [
      { id: 'pinas', name: 'Piñas', skill: 'mano', dmg: 0.7, mix: { c: 1 }, reach: 0.55, speed: 2.2, dur: 0, knock: 0.03, noise: 4, air: 6, hurt: 0.08, color: '#c99b7a', len: 0 },
      { id: 'vendados', name: 'Puños vendados', skill: 'mano', dmg: 0.9, mix: { c: 1 }, reach: 0.55, speed: 2.2, dur: 40, knock: 0.04, noise: 4, air: 6, hurt: 0, color: '#e8e2d6', len: 0 },
      { id: 'cinturon', name: 'Puño con cinturón', skill: 'mano', dmg: 1.3, mix: { c: 0.85, k: 0.15 }, reach: 0.6, speed: 1.9, dur: 60, knock: 0.06, noise: 5, air: 7, hurt: 0.02, color: '#5a3a24', len: 0 },
      { id: 'americano', name: 'Puño americano', skill: 'mano', dmg: 2.0, mix: { c: 0.9, p: 0.1 }, reach: 0.55, speed: 2.2, dur: 300, knock: 0.1, noise: 5, air: 6, hurt: 0, color: '#a8adb2', len: 0 },
      { id: 'botellarota', name: 'Botella rota', skill: 'corta', dmg: 2.6, mix: { k: 0.8, p: 0.2 }, reach: 0.6, speed: 1.8, dur: 8, knock: 0, noise: 3, air: 6, color: '#6f9a6a', len: 0.22 },
      { id: 'tenedor', name: 'Tenedor', skill: 'corta', dmg: 1.0, mix: { p: 0.9, k: 0.1 }, reach: 0.6, speed: 2.2, dur: 12, knock: 0, noise: 2, air: 5, color: '#c8cdd2', len: 0.2 },
      { id: 'cuchillo', name: 'Cuchillo de cocina', skill: 'corta', dmg: 2.4, mix: { k: 0.7, p: 0.3 }, reach: 0.65, speed: 2.0, dur: 40, knock: 0.02, noise: 3, air: 6, color: '#d4d8dc', len: 0.3 },
      { id: 'cuchilla', name: 'Cuchilla de asado', skill: 'corta', dmg: 3.2, mix: { k: 0.8, c: 0.1, p: 0.1 }, reach: 0.7, speed: 1.6, dur: 60, knock: 0.05, noise: 4, air: 8, color: '#bfc4c8', len: 0.38 },
      { id: 'rodillo', name: 'Rodillo de amasar', skill: 'corta', dmg: 1.8, mix: { c: 1 }, reach: 0.7, speed: 1.6, dur: 50, knock: 0.12, noise: 6, air: 8, color: '#c9a77a', len: 0.4 },
      { id: 'sarten', name: 'Sartén', skill: 'corta', kg: 1.5, dmg: 3.0, mix: { c: 1 }, reach: 0.75, speed: 1.0, dur: 80, knock: 0.3, noise: 12, air: 12, color: '#2f2f31', len: 0.45 },
      { id: 'pava', name: 'Pava', skill: 'corta', dmg: 1.6, mix: { c: 1 }, reach: 0.65, speed: 1.4, dur: 25, knock: 0.1, noise: 9, air: 8, color: '#8a9096', len: 0.3 },
      { id: 'sifon', name: 'Sifón de soda', skill: 'corta', dmg: 2.2, mix: { c: 1 }, reach: 0.7, speed: 1.2, dur: 10, knock: 0.15, noise: 10, air: 10, color: '#5f8fa8', len: 0.38 },
      { id: 'ladrillo', name: 'Ladrillo', skill: 'corta', kg: 2.5, dmg: 3.4, mix: { c: 1 }, reach: 0.55, speed: 0.9, dur: 15, knock: 0.2, noise: 8, air: 12, color: '#a5533a', len: 0.22 },
      { id: 'martillo', name: 'Martillo', skill: 'corta', dmg: 3.2, mix: { c: 0.8, k: 0.15, p: 0.05 }, reach: 0.7, speed: 1.4, dur: 150, knock: 0.2, noise: 8, air: 10, color: '#6b4a2e', len: 0.35 },
      { id: 'destornillador', name: 'Destornillador', skill: 'corta', dmg: 2.2, mix: { p: 0.95, c: 0.05 }, reach: 0.65, speed: 2.0, dur: 70, knock: 0, noise: 3, air: 6, color: '#d0a030', len: 0.25 },
      { id: 'llave', name: 'Llave inglesa', skill: 'corta', dmg: 2.8, mix: { c: 1 }, reach: 0.75, speed: 1.3, dur: 200, knock: 0.2, noise: 9, air: 10, color: '#8d949a', len: 0.35 },
      { id: 'barra', name: 'Barra de metal', skill: 'media', kg: 2.5, dmg: 3.6, mix: { c: 0.95, p: 0.05 }, reach: 1.25, speed: 1.0, dur: 300, knock: 0.35, noise: 10, air: 14, color: '#7c848a', len: 0.9 },
      { id: 'fierro', name: 'Fierro de construcción', skill: 'media', kg: 3, dmg: 3.4, mix: { c: 0.9, p: 0.1 }, reach: 1.5, speed: 0.85, dur: 260, knock: 0.35, noise: 10, air: 15, color: '#8a5a3a', len: 1.1 },
      { id: 'palita', name: 'Palita de barrer', skill: 'media', kg: 0.3, dmg: 0.8, mix: { c: 0.9, k: 0.1 }, reach: 1.0, speed: 1.4, dur: 10, knock: 0.15, noise: 6, air: 9, color: '#c0533a', len: 0.7 },
      { id: 'escoba', name: 'Palo de escoba', skill: 'media', kg: 0.6, dmg: 1.2, mix: { c: 1 }, reach: 1.4, speed: 1.3, dur: 18, knock: 0.25, noise: 6, air: 10, color: '#b5935f', len: 1.2 },
      { id: 'hockey', name: 'Palo de hockey', skill: 'media', dmg: 2.6, mix: { c: 1 }, reach: 1.3, speed: 1.3, dur: 45, knock: 0.3, noise: 8, air: 11, color: '#3f6c8f', len: 0.95 },
      { id: 'matafuegos', name: 'Matafuegos', skill: 'media', kg: 4, dmg: 4.0, mix: { c: 1 }, reach: 1.0, speed: 0.7, dur: 120, knock: 0.45, noise: 14, air: 18, color: '#c0302a', len: 0.55 },
      { id: 'pala', name: 'Pala', skill: 'media', dmg: 3.8, mix: { c: 0.7, k: 0.3 }, reach: 1.5, speed: 0.8, dur: 120, knock: 0.35, noise: 9, air: 15, color: '#6f767c', len: 1.2 },
      { id: 'rastrillo', name: 'Rastrillo', skill: 'media', dmg: 2.4, mix: { p: 0.7, c: 0.3 }, reach: 1.5, speed: 0.9, dur: 25, knock: 0.2, noise: 7, air: 12, color: '#7a6a55', len: 1.2 },
      { id: 'cadena', name: 'Cadena de bicicleta', skill: 'media', dmg: 2.6, mix: { c: 0.9, k: 0.1 }, reach: 1.3, speed: 1.6, dur: 200, knock: 0.2, noise: 8, air: 9, color: '#4a4d52', len: 0.8 },
      { id: 'machete', name: 'Machete', skill: 'media', dmg: 6.0, mix: { k: 0.9, c: 0.1 }, reach: 1.1, speed: 1.2, dur: 120, knock: 0.2, noise: 6, air: 11, color: '#c8cdd2', len: 0.7 },
      { id: 'hacha', name: 'Hacha', skill: 'media', kg: 2.5, dmg: 9.0, mix: { k: 0.8, c: 0.2 }, reach: 1.1, speed: 0.7, dur: 150, knock: 0.35, noise: 9, air: 17, color: '#8b6a45', len: 0.75 }
    ]
  };
})(this.Lluvia = this.Lluvia || {});
