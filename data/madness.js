// The survivors' madness (js/madness.js, stage 72; the user's answer 4, 2026-11-25: "se pueden volver locos,
// alucinar, y eso genera muchas cosas: sabotear el campamento, pedirme compañía y tratar de matarme en el camino,
// atraer zombis, controlar a las criaturas"). Each one has a sanity (0 to 100).
//   start: the sanity they have when you find them (between these two)
//   daily: what each new day does to it: living in the Catedral with yesterday's need met (refugeFed) or not
//   (refugeHungry), locked alone in a house or on the street (alone), walking with you (follow)
//   sawHit / sawDeath: seeing you hit somebody, or somebody die
//   odd: below this they hallucinate (what they say changes); act: below this they do things; trance: below this
//   the creatures obey them
//   every: game hours between the chances to do something; chance: of doing it each time
//   calm: giving them `item` raises their sanity by `gain`
//   scream: a mad one outside screams at night, heard this many meters away, every `every` seconds
//   betray: one walking with you, mad, with nobody else within `alone` meters, turns on you: hits for `dmg` every
//   `every` seconds, coming at `speed` times your walking speed
//   control: in a trance, the zombies within `range` meters of them are sent at you (if you are within `reach`)
(function (L) {
  'use strict';
  L.data = L.data || {};
  L.data.madness = {
    start: [55, 90],
    daily: { refugeFed: 6, refugeHungry: -10, alone: -6, follow: -3 },
    sawHit: -8, sawDeath: -25,
    odd: 35, act: 20, trance: 8,
    every: 1, chance: 0.3,
    calm: { item: ['paracetamol', 2], gain: 35 },
    scream: { meters: 35, every: 20 },
    betray: { alone: 20, dmg: 7, every: 1.2, speed: 1.05 },
    control: { range: 20, reach: 45 },
    lines: {
      odd: ['¿Vos también los oís? Dicen tu nombre.', 'La barrera me habla de noche. Me pide cosas.',
        'No sos vos. Te cambiaron. Te vi cuando dormías.'],
      calm: 'Gracias... Ya está, ya se callaron. Por ahora.',
      betray: '¡Ellos me dijeron que eras vos! ¡Vos los trajiste!',
      sabotage: 'Alguien sacó una tabla de una ventana de la Catedral.',
      trance: 'Te mira sin parpadear. Atrás, en la oscuridad, algo se mueve con él.'
    }
  };
})(this.Lluvia = this.Lluvia || {});
