// Skills that grow with use (js/skills.js), as in Project Zomboid (docs/ZOMBOID.md, section 3). Every skill has 10
// levels (the user's answer 13: "por ahora todo escala en 10 niveles"); `need` is the experience for each next level.
(function (L) {
  'use strict';
  L.data = L.data || {};
  L.data.skills = {
    levels: 10,
    need: [10, 20, 35, 50, 70, 90, 115, 140, 170, 200],
    list: {
      // Aim: every headshot teaches a lot, a body shot a little.
      punteria: { name: 'Puntería', headshot: 10, body: 2 },
      // Close combat (the user's answer 3): a tree. Every blow teaches `cuerpo` a little (it makes all blows hurt
      // more and cost less air) and the weapon's own branch more: mano (fists), corta (short weapons) or media
      // (middle reach). A kill teaches more than a blow.
      cuerpo: { name: 'Cuerpo a cuerpo', hit: 1, kill: 3 },
      mano: { name: 'Combate a mano', hit: 2, kill: 8 },
      corta: { name: 'Arma corta', hit: 2, kill: 8 },
      media: { name: 'Media distancia', hit: 2, kill: 8 }
    },
    // Aiming (right mouse button held: you stand still and the sight closes). Extra spread in radians, added to the
    // gun's own: from the hip, walking, and aimed at level 0 and at level 10; seconds it takes to close at level 0
    // and 10; spread each shot adds (recoil); how much bigger the zombies' heads are for your bullets at 0 and 10.
    aim: { hip: 0.1, walk: 0.18, aimed: [0.045, 0.0], settle: [0.9, 0.35], recoil: 0.05, head: [1, 1.6] }
  };
})(this.Lluvia = this.Lluvia || {});
