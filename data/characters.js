// Playable characters. `start` is the ability they begin with and `ulti` the one they cast with Space.
// Numbers are provisional.
(function (L) {
  'use strict';
  L.data.characters = [
    {
      id: 'brasa', name: 'Brasa', color: '#ff7a3d',
      desc: 'Equilibrada. Arranca con Chispa. Ulti: Lluvia de fuego, meteoros donde apuntás.',
      stats: { maxHp: 105, speed: 210, regen: 0, pickup: 70 },
      start: 'chispa', ulti: 'meteoros'
    },
    {
      id: 'roca', name: 'Roca', color: '#c8a165',
      desc: 'Lenta y dura. Arranca con Temblor. Ulti: Terremoto, que aturde todo alrededor.',
      stats: { maxHp: 150, speed: 180, regen: 0.3, pickup: 70 },
      start: 'temblor', ulti: 'terremoto'
    },
    {
      id: 'filo', name: 'Filo', color: '#9fe3ff',
      desc: 'Rápida y frágil. Arranca con Cuchillas. Ulti: Corte, un salto que corta lo que cruza.',
      stats: { maxHp: 100, speed: 240, regen: 0, pickup: 80 },
      start: 'cuchillas', ulti: 'corte'
    },
    {
      id: 'ceniza', name: 'Ceniza', color: '#b9a3ff',
      desc: 'Lejos y con cuidado. Arranca con Rayo. Ulti: Haz, una línea de energía larguísima.',
      stats: { maxHp: 90, speed: 205, regen: 0, pickup: 90 },
      start: 'rayo', ulti: 'haz'
    },
    {
      id: 'musgo', name: 'Musgo', color: '#7ddc6a',
      desc: 'Aguanta y se cura. Arranca con Niebla ácida. Ulti: Raíces, que atrapan y te curan.',
      stats: { maxHp: 130, speed: 190, regen: 1.5, pickup: 70 },
      start: 'niebla', ulti: 'raices'
    }
  ];
})(this.Lluvia = this.Lluvia || {});
