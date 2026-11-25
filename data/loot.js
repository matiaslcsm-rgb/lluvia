// Gathering (js/loot.js), after Darkwood (docs/DARKWOOD.md): you search the furniture of the houses (hold E next to
// a piece) and what you find goes into your backpack, which has few slots. Bullets come from there too: the gun no
// longer reloads out of nothing.
(function (L) {
  'use strict';
  L.data = L.data || {};
  L.data.loot = {
    slots: 10,             // slots in the backpack
    search: 1.4,           // seconds holding E to search a piece
    reach: 0.9,            // meters from a piece's edge to search it
    startAmmo: 17,         // bullets in the backpack at the start (one more magazine)
    heal: 30,              // life a bandage gives back (H)
    // What can go in the backpack: name (one, many) and how many fit in one slot.
    items: {
      balas: { name: ['bala', 'balas'], stack: 34, color: '#d9b45a' },
      vendas: { name: ['venda', 'vendas'], stack: 5, color: '#e8e2d6' },
      trapos: { name: ['trapo', 'trapos'], stack: 10, color: '#9a8f7e' },
      tablas: { name: ['tabla', 'tablas'], stack: 6, color: '#8b6a45' },
      clavos: { name: ['clavo', 'clavos'], stack: 30, color: '#9aa1a8' },
      nafta: { name: ['bidón de nafta', 'bidones de nafta'], stack: 3, color: '#c0533a' },
      chatarra: { name: ['pieza de chatarra', 'piezas de chatarra'], stack: 10, color: '#6f767c' },
      botella: { name: ['botella', 'botellas'], stack: 4, color: '#6f9a6a' },
      comida: { name: ['lata de comida', 'latas de comida'], stack: 5, color: '#c9a640' },
      molotov: { name: ['molotov', 'molotovs'], stack: 3, color: '#d8713a' }
    },
    // What each piece of furniture may have: [item, chance, fewest, most]. Each line is rolled once. "w:..." is a
    // hand weapon (data/melee.js), always one.
    // Pieces not listed (beds, pews, toilets...) have nothing to search.
    pieces: {
      ropero: [['trapos', 0.6, 1, 3], ['vendas', 0.2, 1, 1], ['balas', 0.12, 3, 8], ['w:cinturon', 0.25, 1, 1], ['w:hockey', 0.04, 1, 1]],
      mesita: [['balas', 0.15, 2, 6], ['vendas', 0.2, 1, 1], ['w:americano', 0.04, 1, 1], ['w:destornillador', 0.06, 1, 1]],
      mesada: [['botella', 0.4, 1, 1], ['trapos', 0.3, 1, 2], ['comida', 0.35, 1, 1], ['w:tenedor', 0.3, 1, 1], ['w:cuchillo', 0.25, 1, 1],
        ['w:cuchilla', 0.08, 1, 1], ['w:rodillo', 0.1, 1, 1], ['w:sarten', 0.12, 1, 1], ['w:pava', 0.1, 1, 1]],
      heladera: [['comida', 0.5, 1, 2], ['botella', 0.3, 1, 1], ['w:sifon', 0.1, 1, 1]],
      estante: [['chatarra', 0.4, 1, 3], ['clavos', 0.4, 4, 10], ['botella', 0.2, 1, 1], ['tablas', 0.2, 1, 1], ['w:martillo', 0.12, 1, 1],
        ['w:destornillador', 0.12, 1, 1], ['w:llave', 0.08, 1, 1], ['w:barra', 0.05, 1, 1], ['w:cadena', 0.04, 1, 1], ['w:machete', 0.03, 1, 1]],
      cajas: [['tablas', 0.3, 1, 2], ['clavos', 0.3, 3, 8], ['chatarra', 0.3, 1, 2], ['trapos', 0.3, 1, 2], ['w:ladrillo', 0.15, 1, 1], ['w:fierro', 0.05, 1, 1]],
      escritorio: [['balas', 0.1, 2, 6], ['chatarra', 0.2, 1, 1], ['w:hockey', 0.04, 1, 1]],
      archivero: [['chatarra', 0.3, 1, 1], ['balas', 0.1, 2, 5]],
      gondola: [['comida', 0.5, 1, 2], ['botella', 0.3, 1, 1], ['vendas', 0.15, 1, 1], ['w:sifon', 0.06, 1, 1]],
      mostrador: [['balas', 0.15, 3, 8], ['comida', 0.2, 1, 1], ['w:americano', 0.04, 1, 1], ['w:matafuegos', 0.06, 1, 1]],
      maquina: [['chatarra', 0.6, 2, 4], ['nafta', 0.2, 1, 1], ['w:barra', 0.2, 1, 1], ['w:llave', 0.15, 1, 1], ['w:hacha', 0.04, 1, 1]],
      motor: [['nafta', 0.5, 1, 1], ['chatarra', 0.3, 1, 2], ['w:matafuegos', 0.3, 1, 1], ['w:llave', 0.15, 1, 1]],
      auto: [['nafta', 0.5, 1, 1], ['chatarra', 0.4, 1, 2], ['w:llave', 0.2, 1, 1], ['w:cadena', 0.1, 1, 1]],
      lavatorio: [['vendas', 0.35, 1, 2]],
      lavarropas: [['trapos', 0.4, 1, 2], ['w:escoba', 0.3, 1, 1], ['w:palita', 0.3, 1, 1]],
      pileta: [['trapos', 0.3, 1, 1], ['w:escoba', 0.2, 1, 1]],
      tanque: [['chatarra', 0.3, 1, 1]],
      taller: [['w:martillo', 0.3, 1, 1], ['w:destornillador', 0.2, 1, 1], ['w:llave', 0.2, 1, 1], ['w:pala', 0.1, 1, 1], ['w:rastrillo', 0.1, 1, 1],
        ['w:machete', 0.06, 1, 1], ['w:hacha', 0.05, 1, 1], ['clavos', 0.4, 4, 12]]
    }
  };
})(this.Lluvia = this.Lluvia || {});
