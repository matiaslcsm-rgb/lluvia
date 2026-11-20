// Playable characters. `start` is the ability they begin with. Numbers are provisional.
(function (L) {
  'use strict';
  L.data.characters = [
    {
      id: 'brasa', name: 'Brasa', color: '#ff7a3d',
      desc: 'Equilibrada. Arranca con Chispa, que dispara al enemigo más cercano.',
      stats: { maxHp: 100, speed: 210, regen: 0, pickup: 70 },
      start: 'chispa'
    },
    {
      id: 'roca', name: 'Roca', color: '#c8a165',
      desc: 'Lenta y dura. Arranca con Temblor, que golpea todo a su alrededor.',
      stats: { maxHp: 150, speed: 180, regen: 0.3, pickup: 70 },
      start: 'temblor'
    },
    {
      id: 'filo', name: 'Filo', color: '#9fe3ff',
      desc: 'Rápida y frágil. Arranca con Cuchillas que giran a su alrededor.',
      stats: { maxHp: 85, speed: 240, regen: 0, pickup: 80 },
      start: 'cuchillas'
    }
  ];
})(this.Lluvia = this.Lluvia || {});
