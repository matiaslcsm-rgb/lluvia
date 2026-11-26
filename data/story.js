// How a game moves on (js/story.js, stage 74; the user's answer 6, 2026-11-25: "averiguar información de lo que
// pasa, interactuar con los demás refugios, ayudar gente; que la partida tenga disparadores"). Triggers fire once
// when their condition happens; the journal (J) keeps the goals, the clues and the refuges you know.
//   refuges: the other refuges: their building (by name on the map, else the nearest of `kinds` to the Catedral),
//   their name, their leader (who you talk to), what the leader asks for and gives, and how they trust you at first
//   clues: notes and recordings found in furniture (a `chance` per piece searched); each says a little of what happened
//   triggers: { id, when: { night | day | clues | visit | repBelow }, then: { text, goal, reveal, horde } }
//     night n: the morning after night n; day n: when day n begins; clues n: when you have found n; visit id: when
//     you walk into that refuge; repBelow v: when the Catedral's trust falls under v
//     text: what you are told; goal: a new goal for the journal; reveal: a refuge appears on your map with its
//     leader; horde: that night many more zombies come (`hordeMul` times)
(function (L) {
  'use strict';
  L.data = L.data || {};
  L.data.story = {
    refuges: {
      escuela: { building: 'Escuela Nº 1 - San Miguel', kinds: ['elementary_school', 'place_of_learning', 'education'], name: 'la Escuela',
        leader: 'Graciela', role: 'maestra', start: 40, want: ['comida', 4], give: ['balas', 30], rep: 10,
        line: 'Somos doce, casi todos chicos. Si la Catedral nos ayuda, nosotros ayudamos a la Catedral.' },
      sanatorio: { building: 'Sanatorio General Sarmiento', kinds: ['hospital', 'outpatient_care_facility', 'health_care'], name: 'el Sanatorio',
        leader: 'Doctor Ibáñez', role: 'médico', start: 30, want: ['alcohol', 3], give: ['antibiotico', 4], rep: 10,
        line: 'Acá atendemos a cualquiera que llegue entero. Lo que no hay es alcohol para limpiar.' }
    },
    clues: { chance: 0.06, list: [
      'Una nota en una heladera: "La tormenta no trajo agua. Trajo ESO. Mamá no volvió del patio."',
      'Un diario: "Día 3. La barrera está más cerca que ayer. O nosotros más lejos. Los relojes no andan igual."',
      'Un grabador: una voz repite números y después dice: "No miren al cielo cuando no hay estrellas."',
      'Una carta sin terminar: "Los que salen de la barrera no son los vecinos. Usan su cara, nada más."',
      'Un papel de la municipalidad: "Evacuación suspendida. Mantener la calma. No acercarse al borde del partido."',
      'Un dibujo de un chico: una casa, una familia y, arriba, un ojo negro enorme sin estrellas alrededor.',
      'Un cuaderno de un policía: "Nos ordenaron cuidar la Catedral. Nadie dijo de qué."',
      'Una radio a pilas, rota. Antes de apagarse se oye: "...el Sanatorio sigue abierto... repito..."'
    ] },
    hordeMul: 2.5,
    triggers: [
      { id: 'start', when: { day: 1 }, then: { goal: 'Conseguí comida y agua para la Catedral.' } },
      { id: 'radio', when: { night: 1 }, then: { text: 'A la mañana, la radio de la Catedral capta una voz: hay gente refugiada en la Escuela Nº 1. Piden ayuda.', reveal: 'escuela', goal: 'Andá a la Escuela y hablá con quien esté a cargo.' } },
      { id: 'escuela', when: { visit: 'escuela' }, then: { text: 'En la Escuela hay chicos y una maestra con un palo de escoba en la mano. Te miran como si fueras la última esperanza.', goal: 'Ayudá a la Escuela con lo que piden.' } },
      { id: 'pistas', when: { clues: 3 }, then: { text: 'Con lo que encontraste, algo se arma: la barrera no es una pared, y lo que sale de ella aprende. Alguien en el Sanatorio podría saber más.', reveal: 'sanatorio', goal: 'Encontrá el Sanatorio y averiguá qué saben ahí.' } },
      { id: 'sanatorio', when: { visit: 'sanatorio' }, then: { text: 'El Sanatorio huele a lavandina y a miedo. Un médico te dice que los mordidos no siempre se dan vuelta: a veces "se los llevan".', goal: 'Ayudá al Sanatorio y seguí juntando pistas.' } },
      { id: 'latido', when: { day: 5 }, then: { text: 'Esta noche la barrera late. Se siente en los dientes. Van a venir muchos: trabá todo.', horde: true, goal: 'Aguantá la noche del latido.' } },
      { id: 'echado', when: { repBelow: 25 }, then: { text: 'En la Catedral ya no te quieren: hablan de vos en voz baja. Si seguís así, no te van a abrir.', goal: 'Recuperá la confianza de la Catedral: ayudá, no lastimes a nadie.' } }
    ]
  };
})(this.Lluvia = this.Lluvia || {});
