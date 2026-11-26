// Survivors (js/people.js, stage 69; the user's answers 2 c and 3, 2026-11-25): some locked in their houses with the
// door nailed (you talk to them from outside), some walking the streets by day. Each asks for something and gives
// something back.
//   house: share of homes with somebody inside (always the same houses); scan: houses within this many meters of you
//   get decided as you walk
//   street: people on the streets: at most `max` at once, one every `every` seconds of daylight at most, between
//   `near` and `far` meters from you, out of sight; they leave when you are `leave` meters away; `speed` m/s
//   talk: how close (m) to be to talk; through a door from a little farther (`door`)
//   wants / gives: what they may ask for and give back ([id, how many]); w: weapons, r: clothes
//   rep: how much helping somebody raises the Catedral's trust (word gets around)
//   names, coats: who they are and the color of what they wear
(function (L) {
  'use strict';
  L.data = L.data || {};
  L.data.survivors = {
    house: 0.05, scan: 90,
    street: { max: 2, every: 150, near: 22, far: 40, leave: 120, speed: 0.9 },
    talk: 1.8, door: 3.2,
    wants: [['comida', 2], ['agua', 2], ['vendas', 2], ['tablas', 2], ['clavos', 6], ['antibiotico', 1], ['paracetamol', 2],
      ['alcohol', 1], ['trapos', 3], ['w:cuchillo', 1], ['w:martillo', 1], ['balas', 10]],
    gives: [['balas', 12], ['comida', 2], ['agua', 2], ['vendas', 2], ['alcohol', 1], ['antibiotico', 1], ['clavos', 10],
      ['tablas', 2], ['molotov', 1], ['r:camperon', 1], ['r:guantesCuero', 1], ['r:botas', 1], ['w:machete', 1], ['w:barra', 1]],
    rep: 4,
    names: ['Marta', 'Raúl', 'Graciela', 'Héctor', 'Silvia', 'Ezequiel', 'Norma', 'Walter', 'Lorena', 'Claudio', 'Mirta',
      'Darío', 'Susana', 'Gustavo', 'Analía', 'Rubén', 'Viviana', 'Sergio', 'Patricia', 'Matías', 'Celeste', 'Omar',
      'Romina', 'Jorge', 'Estela', 'Facundo', 'Liliana', 'Hugo', 'Daiana', 'Nicolás'],
    coats: ['#6a5a48', '#4a5a6a', '#6a4a4a', '#5a6a4a', '#5a4a6a', '#6a6a5a', '#3f5560', '#705238'],
    lines: {
      house: ['¿Quién anda ahí? Ah, sos el policía de la Catedral.', '¡No abro! ...Bueno, te escucho desde acá.',
        'Hace días que no veo a nadie vivo. Hablá bajo.'],
      street: ['¡Pará, pará! No me tires, estoy vivo.', 'Ey, policía. Ando buscando cosas, como vos.',
        'No te acerques mucho... bueno, ¿qué querés?'],
      ask: 'Necesito {want}. Si me lo traés, te doy {give}.',
      thanks: 'Gracias, en serio. Tomá: {give}.',
      done: 'Ya me ayudaste. Cuidate allá afuera.'
    }
  };
})(this.Lluvia = this.Lluvia || {});
