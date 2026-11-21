// Ultis: one per character, cast with Space toward the mouse. Long cooldown.
// Built from pieces (`kind`), like abilities. Damage grows 12% per player level.
// Numbers are provisional.
(function (L) {
  'use strict';
  L.data.ultis = [
    { id: 'meteoros', name: 'Lluvia de fuego', kind: 'meteors', color: '#ff6a3d', cooldown: 45,
      desc: 'Caen 6 meteoros alrededor de donde apuntás.',
      stats: { damage: 100, count: 6, spread: 130, splash: 80, range: 600 } },
    { id: 'terremoto', name: 'Terremoto', kind: 'quake', color: '#c8a165', cooldown: 50,
      desc: 'Golpea todo lo que tenés cerca y lo deja aturdido 2,5 segundos.',
      stats: { damage: 70, radius: 320, stun: 2.5 } },
    { id: 'corte', name: 'Corte', kind: 'dash', color: '#9fe3ff', cooldown: 30,
      desc: 'Saltás hacia donde apuntás y cortás todo lo que cruzás. Mientras saltás no te pegan.',
      stats: { damage: 110, distance: 380, width: 60 } },
    { id: 'haz', name: 'Haz', kind: 'beam', color: '#b9a3ff', cooldown: 40,
      desc: 'Una línea de energía larguísima hacia donde apuntás.',
      stats: { damage: 100, length: 900, width: 70 } },
    { id: 'raices', name: 'Raíces', kind: 'roots', color: '#7ddc6a', cooldown: 55,
      desc: 'Atrapa a todos los que tenés cerca 3 segundos y te cura un 30% de la vida.',
      stats: { damage: 30, radius: 350, stun: 3, heal: 0.3 } },
    { id: 'resaca', name: 'Resaca', kind: 'pull', color: '#4fa3e0', cooldown: 40,
      desc: 'Arrastra a todos los que están cerca hacia donde apuntás, los golpea y los aturde 1,5 segundos.',
      stats: { damage: 60, radius: 420, range: 400, stun: 1.5 } },
    { id: 'chatarra', name: 'Chatarra', kind: 'shrapnel', color: '#c07a45', cooldown: 35,
      desc: 'Una explosión de 20 esquirlas en todas direcciones que atraviesan enemigos.',
      stats: { damage: 55, count: 20, speed: 600, range: 500, pierce: 6 } },
    { id: 'destello', name: 'Destello', kind: 'flash', color: '#ffe08a', cooldown: 50,
      desc: 'Una luz enceguecedora: aturde 2 segundos a todo lo que se ve y le pega un poco.',
      stats: { damage: 40, radius: 700, stun: 2 } }
  ];
})(this.Lluvia = this.Lluvia || {});
