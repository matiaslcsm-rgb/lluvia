// Guns: you aim with the mouse and shoot (hold the left button). Each character starts with one (see `gun` in
// data/characters.js); more are bought at the Armería. Numbers are provisional; the bench decides them.
//   damage: per bullet      rate: shots per second     mag: bullets before reloading   reload: seconds
//   pellets: bullets per shot (shotgun)   spread: radians of scatter   speed: px/s   range: px   pierce: enemies a
//   bullet goes through   size: bullet radius   flame: short-lived, goes through everything (flamethrower)
(function (L) {
  'use strict';

  // How the game is played for now (user's decision, 2026-11-23): one player, zombies, and only a Glock.
  // solo: no rivals, duels or bets. gunsOnly: no automatic abilities or ulti; level-ups improve you and the gun.
  // horde: with only a gun the horde is gentler and slower to grow (like Risk of Rain: it builds up).
  //   pace: how fast the difficulty clock runs (0.5 = one step every 2 minutes); the rest multiply the horde.
  // explore: building the map (2026-11-24, the user's call): no waves, chests, shrines or weather, no old clock on
  //   screen; you walk the city.
  // night: the zombies live by the clock of the day and find you by noise and sight (js/senses.js). Without it
  //   (and without explore) the old horde by minutes comes back.
  //   day / dark: zombies born per second and the most alive at once by day and at night. For now the same (the
  //   user's answer 9, docs/ZOMBOID.md): what changes at night are their senses (data/senses.js).
  //   perNight: each night after the first adds that much to both (0 for now); level: difficulty steps per night.
  //   near / far: they are born this many meters away, out of your sight; recycle: one farther than this that
  //   isn't after you goes away (the city keeps its zombies around you); leave: by day, the extra ones past this
  //   go, one every `leaveEvery` s. type: only plain zombies for now (the user's answer: "zombis normales").
  L.data.mode = { solo: true, gunsOnly: true, startGun: 'glock', explore: true, night: true,
    horde: { pace: 0.5, hpMul: 0.65, dpsMul: 0.5, spawnMul: 0.5, bossFirst: 300, miniFirst: 450, waveFirst: 240 },
    nights: { day: { rate: 0.25, alive: 30 }, dark: { rate: 0.25, alive: 30 }, perNight: 0, leave: 30, leaveEvery: 1.5, level: 0,
      near: 25, far: 60, recycle: 90, type: 'rastrero' } };

  L.data.guns = [
    { id: 'glock', name: 'Glock 17', desc: 'Pistola de 17 balas. Mantené el clic para disparar.', color: '#ffe9a8',
      damage: 16, rate: 4.5, mag: 17, reload: 1.2, pellets: 1, spread: 0.035, speed: 900, range: 650, pierce: 0, size: 3.5, price: 0 },
    { id: 'pistola', name: 'Pistola', desc: 'Confiable: precisa, cargador mediano, recarga rápida.', color: '#ffe08a',
      damage: 14, rate: 4, mag: 12, reload: 1.0, pellets: 1, spread: 0.04, speed: 760, range: 620, pierce: 0, size: 4, price: 0 },
    { id: 'escopeta', name: 'Escopeta', desc: 'Siete perdigones de cerca: barre lo que tenés enfrente.', color: '#ffb347',
      damage: 9, rate: 1.4, mag: 6, reload: 1.7, pellets: 7, spread: 0.38, speed: 700, range: 380, pierce: 0, size: 3.5, price: 3 },
    { id: 'subfusil', name: 'Subfusil', desc: 'Una lluvia de balas chicas. Cargador grande.', color: '#9fd8ff',
      damage: 7, rate: 11, mag: 32, reload: 1.5, pellets: 1, spread: 0.13, speed: 820, range: 560, pierce: 0, size: 3, price: 3 },
    { id: 'rifle', name: 'Rifle', desc: 'Lento y certero: cada bala atraviesa tres bichos.', color: '#c9b8ff',
      damage: 34, rate: 2, mag: 8, reload: 1.6, pellets: 1, spread: 0.01, speed: 1150, range: 900, pierce: 3, size: 4, price: 4 },
    { id: 'lanzallamas', name: 'Lanzallamas', desc: 'Fuego que atraviesa todo, pero de cerca.', color: '#ff7a2f',
      damage: 3.2, rate: 26, mag: 90, reload: 2.2, pellets: 1, spread: 0.32, speed: 420, range: 230, pierce: 99, size: 7, flame: true, price: 5 }
  ];

  L.data.gunScaling = {
    perLevel: 0.15,      // +15% gun damage per character level (the horde grows with the clock)
    perUpgrade: 0.3,     // +30% per upgrade bought at the Armería
    upgradeMag: 0.15,    // and +15% bullets per magazine
    maxUpgrade: 8
  };
})(this.Lluvia = this.Lluvia || {});
