// Gathering (js/loot.js), after Darkwood and Project Zomboid: you search the furniture of the houses (hold E next
// to a piece) and what you find goes on you: your pockets, and the bags you wear (a riñonera at the waist, a bolso
// on the shoulder, a mochila on the back). Bullets come from there too: the gun no longer reloads out of nothing.
(function (L) {
  'use strict';
  L.data = L.data || {};
  L.data.loot = {
    // What you can carry (the user asked: what a normal person carries on the body, plus mochilas, bolsos and
    // riñoneras). Each place has its slots; `big`: whether big things fit (planks, a jerrycan, a long weapon);
    // `slow`: how much it slows you down (a bolso in your hand gets in the way). You find bags in the furniture
    // and put them on if you don't have one of that kind yet.
    containers: {
      // 2 pockets for small things of quick use (the user, docs/CUERPO.md section 4: the Glock, a stone, a knife).
      // `supplies`: whether food and water go in it (the user: "siempre van a la mochila"; the other bags too:
      // my call).
      bolsillos: { name: 'Bolsillos', slots: 2, big: false, slow: 0, kg: 0, supplies: false },
      rinonera: { name: 'Riñonera', slots: 4, big: false, slow: 0, kg: 0.3, supplies: true },
      bolso: { name: 'Bolso', slots: 8, big: true, slow: 0.06, kg: 0.8, supplies: true },
      mochila: { name: 'Mochila', slots: 12, big: true, slow: 0.03, kg: 1, supplies: true }
    },
    supplies: ['comida', 'agua'], // what counts as food and water (shown as the time it lasts you)
    wearing: ['bolsillos'], // what you start with: only your pockets (the user's answer 1)
    // Weight (the user's answer 3: "lugares y peso; lo que más lo restringe es ir pesado"). Everything weighs (`kg`
    // per unit, weapons in data/melee.js, the gun `gun`). Up to `cap` kg you go as usual; past it every kg slows you
    // down (`slowPerKg`, up to `maxSlow`) and running costs more air.
    carry: { cap: 8, slowPerKg: 0.06, maxSlow: 0.6, gun: 0.8 },
    search: 1.4,           // seconds holding E to search a piece
    reach: 0.9,            // meters from a piece's edge to search it
    startAmmo: 17,         // bullets in the backpack at the start (one more magazine)
    heal: 30,              // life a bandage gives back without wounds (only without js/health.js; with it: data/health.js)
    // What can go in the backpack: name (one, many) and how many fit in one slot.
    items: {
      balas: { name: ['bala', 'balas'], stack: 34, color: '#d9b45a', kg: 0.012 },
      vendas: { name: ['venda', 'vendas'], stack: 5, color: '#e8e2d6', kg: 0.05 },
      trapos: { name: ['trapo', 'trapos'], stack: 10, color: '#9a8f7e', kg: 0.1 },
      tablas: { name: ['tabla', 'tablas'], stack: 6, color: '#8b6a45', big: true, kg: 1.5 },
      clavos: { name: ['clavo', 'clavos'], stack: 30, color: '#9aa1a8', kg: 0.01 },
      nafta: { name: ['bidón de nafta', 'bidones de nafta'], stack: 3, color: '#c0533a', big: true, kg: 3 },
      chatarra: { name: ['pieza de chatarra', 'piezas de chatarra'], stack: 10, color: '#6f767c', kg: 0.5 },
      botella: { name: ['botella vacía', 'botellas vacías'], stack: 4, color: '#6f9a6a', kg: 0.3 },
      comida: { name: ['lata de comida', 'latas de comida'], stack: 5, color: '#c9a640', kg: 0.4 },
      agua: { name: ['botella de agua', 'botellas de agua'], stack: 3, color: '#7fb3c9', kg: 1 },
      molotov: { name: ['molotov', 'molotovs'], stack: 3, color: '#d8713a', kg: 0.6 },
      // First aid and medicine (js/health.js, docs/CUERPO.md section 5).
      curitas: { name: ['curita', 'curitas'], stack: 10, color: '#e0b89a', kg: 0.01 },
      alcohol: { name: ['alcohol', 'alcoholes'], stack: 2, color: '#cfe3ea', kg: 0.3 },
      sanitizante: { name: ['sanitizante', 'sanitizantes'], stack: 3, color: '#a9d6c2', kg: 0.15 },
      kitCasero: { name: ['kit casero de primeros auxilios', 'kits caseros de primeros auxilios'], stack: 2, color: '#d9c7a0', kg: 0.2 },
      kitFarmacia: { name: ['kit de primeros auxilios', 'kits de primeros auxilios'], stack: 4, color: '#e8e8e8', kg: 0.25 },
      botiquin: { name: ['botiquín', 'botiquines'], stack: 1, color: '#c23b30', kg: 1.2 },
      antibiotico: { name: ['pastilla de antibiótico', 'pastillas de antibiótico'], stack: 16, color: '#e6e0a8', kg: 0.005 },
      paracetamol: { name: ['pastilla de paracetamol', 'pastillas de paracetamol'], stack: 16, color: '#ffffff', kg: 0.005 }
    },
    // What each piece of furniture may have: [item, chance, fewest, most]. Each line is rolled once. "w:..." is a
    // hand weapon (data/melee.js), "c:..." a bag to wear, "i:" one of the special objects that stack (data/items.js,
    // the user's answer 11: "los objetos se encuentran en el mundo, en los roperos, mesas"), rolled by `rarity`.
    // Pieces not listed (beds, pews, toilets...) have nothing to search.
    rarity: { comun: 80, raro: 17, legendario: 3 },
    sinks: ['pileta', 'lavatorio', 'mesada'], // where an empty bottle is filled with water (E, once searched)
    // Pharmacies: some of the shops (`pharmacy` of them, the same ones every game). Their furniture has its own
    // tables (the user: the pharmacy kit and the botiquín are found in pharmacies).
    pharmacy: 0.15,
    pharmacyPieces: {
      mostrador: [['botiquin', 0.2, 1, 1], ['kitFarmacia', 0.4, 1, 2], ['antibiotico', 0.35, 4, 8], ['paracetamol', 0.5, 4, 8]],
      gondola: [['curitas', 0.6, 4, 10], ['alcohol', 0.5, 1, 2], ['sanitizante', 0.5, 1, 2], ['vendas', 0.5, 1, 3], ['paracetamol', 0.4, 4, 8], ['kitFarmacia', 0.12, 1, 1], ['agua', 0.2, 1, 1]],
      estante: [['vendas', 0.4, 1, 3], ['antibiotico', 0.2, 4, 4], ['kitFarmacia', 0.15, 1, 1], ['botiquin', 0.05, 1, 1]],
      cajas: [['curitas', 0.4, 4, 10], ['alcohol', 0.3, 1, 2], ['botiquin', 0.08, 1, 1], ['r:guantesTrabajo', 0.08, 1, 1]]
    },
    // The names of the pieces, for the window that opens when you search one (the user: "como Project Zomboid").
    pieceNames: { ropero: 'Ropero', mesa: 'Mesa', mesita: 'Mesita de luz', mesada: 'Mesada', heladera: 'Heladera',
      estante: 'Estante', cajas: 'Cajas', escritorio: 'Escritorio', archivero: 'Archivero', gondola: 'Góndola',
      mostrador: 'Mostrador', maquina: 'Máquina', motor: 'Motor', auto: 'Auto', lavatorio: 'Lavatorio', camilla: 'Camilla',
      lavarropas: 'Lavarropas', pileta: 'Pileta', tanque: 'Tanque', taller: 'Banco de taller' },
    pieces: {
      ropero: [['i:', 0.04, 1, 1], ['c:mochila', 0.08, 1, 1], ['c:bolso', 0.1, 1, 1], ['c:rinonera', 0.06, 1, 1], ['trapos', 0.6, 1, 3], ['vendas', 0.2, 1, 1], ['balas', 0.12, 3, 8], ['w:cinturon', 0.25, 1, 1], ['w:hockey', 0.04, 1, 1], ['r:remera', 0.5, 1, 1], ['r:camisa', 0.3, 1, 1], ['r:termica', 0.08, 1, 1], ['r:buzo', 0.35, 1, 1], ['r:camperaJean', 0.12, 1, 1], ['r:camperaCuero', 0.05, 1, 1], ['r:piloto', 0.08, 1, 1], ['r:camperon', 0.1, 1, 1], ['r:gorro', 0.2, 1, 1], ['r:gorra', 0.2, 1, 1], ['r:guantesLana', 0.15, 1, 1], ['r:guantesCuero', 0.04, 1, 1], ['r:jean', 0.3, 1, 1], ['r:jogging', 0.3, 1, 1], ['r:short', 0.2, 1, 1], ['r:medias', 0.4, 1, 1], ['r:mediasLana', 0.15, 1, 1], ['r:zapatillas', 0.15, 1, 1], ['r:zapatos', 0.1, 1, 1], ['r:botas', 0.05, 1, 1], ['r:ojotas', 0.1, 1, 1]],
      mesa: [['i:', 0.03, 1, 1], ['comida', 0.1, 1, 1]],
      mesita: [['i:', 0.05, 1, 1], ['balas', 0.15, 2, 6], ['vendas', 0.2, 1, 1], ['paracetamol', 0.12, 2, 6], ['w:americano', 0.04, 1, 1], ['w:destornillador', 0.06, 1, 1]],
      mesada: [['agua', 0.2, 1, 1], ['botella', 0.4, 1, 1], ['trapos', 0.3, 1, 2], ['comida', 0.35, 1, 1], ['w:tenedor', 0.3, 1, 1], ['w:cuchillo', 0.25, 1, 1],
        ['w:cuchilla', 0.08, 1, 1], ['w:rodillo', 0.1, 1, 1], ['w:sarten', 0.12, 1, 1], ['w:pava', 0.1, 1, 1]],
      heladera: [['agua', 0.45, 1, 2], ['comida', 0.5, 1, 2], ['botella', 0.3, 1, 1], ['w:sifon', 0.1, 1, 1]],
      estante: [['chatarra', 0.4, 1, 3], ['clavos', 0.4, 4, 10], ['botella', 0.2, 1, 1], ['tablas', 0.2, 1, 1], ['w:martillo', 0.12, 1, 1],
        ['w:destornillador', 0.12, 1, 1], ['w:llave', 0.08, 1, 1], ['w:barra', 0.05, 1, 1], ['w:cadena', 0.04, 1, 1], ['w:machete', 0.03, 1, 1]],
      cajas: [['tablas', 0.3, 1, 2], ['clavos', 0.3, 3, 8], ['chatarra', 0.3, 1, 2], ['trapos', 0.3, 1, 2], ['w:ladrillo', 0.15, 1, 1], ['w:fierro', 0.05, 1, 1]],
      escritorio: [['i:', 0.04, 1, 1], ['c:mochila', 0.06, 1, 1], ['balas', 0.1, 2, 6], ['chatarra', 0.2, 1, 1], ['w:hockey', 0.04, 1, 1]],
      archivero: [['i:', 0.03, 1, 1], ['chatarra', 0.3, 1, 1], ['balas', 0.1, 2, 5]],
      gondola: [['sanitizante', 0.15, 1, 1], ['alcohol', 0.08, 1, 1], ['agua', 0.4, 1, 2], ['c:bolso', 0.04, 1, 1], ['comida', 0.5, 1, 2], ['botella', 0.3, 1, 1], ['vendas', 0.15, 1, 1], ['w:sifon', 0.06, 1, 1]],
      mostrador: [['c:rinonera', 0.06, 1, 1], ['c:bolso', 0.05, 1, 1], ['balas', 0.15, 3, 8], ['comida', 0.2, 1, 1], ['w:americano', 0.04, 1, 1], ['w:matafuegos', 0.06, 1, 1]],
      maquina: [['chatarra', 0.6, 2, 4], ['nafta', 0.2, 1, 1], ['w:barra', 0.2, 1, 1], ['w:llave', 0.15, 1, 1], ['w:hacha', 0.04, 1, 1]],
      motor: [['nafta', 0.5, 1, 1], ['chatarra', 0.3, 1, 2], ['w:matafuegos', 0.3, 1, 1], ['w:llave', 0.15, 1, 1]],
      auto: [['nafta', 0.5, 1, 1], ['chatarra', 0.4, 1, 2], ['w:llave', 0.2, 1, 1], ['w:cadena', 0.1, 1, 1], ['r:casco', 0.03, 1, 1], ['r:piloto', 0.05, 1, 1]],
      lavatorio: [['vendas', 0.35, 1, 2], ['curitas', 0.3, 2, 6], ['alcohol', 0.25, 1, 1], ['paracetamol', 0.15, 2, 4], ['antibiotico', 0.04, 2, 4]],
      camilla: [['curitas', 0.4, 2, 8], ['alcohol', 0.3, 1, 1], ['vendas', 0.3, 1, 2], ['kitFarmacia', 0.08, 1, 1], ['antibiotico', 0.1, 4, 4]],
      lavarropas: [['trapos', 0.4, 1, 2], ['w:escoba', 0.3, 1, 1], ['w:palita', 0.3, 1, 1], ['r:remera', 0.3, 1, 1], ['r:medias', 0.3, 1, 1], ['r:jean', 0.15, 1, 1], ['r:buzo', 0.1, 1, 1]],
      pileta: [['trapos', 0.3, 1, 1], ['w:escoba', 0.2, 1, 1]],
      tanque: [['chatarra', 0.3, 1, 1]],
      taller: [['w:martillo', 0.3, 1, 1], ['w:destornillador', 0.2, 1, 1], ['w:llave', 0.2, 1, 1], ['w:pala', 0.1, 1, 1], ['w:rastrillo', 0.1, 1, 1],
        ['w:machete', 0.06, 1, 1], ['w:hacha', 0.05, 1, 1], ['clavos', 0.4, 4, 12], ['r:guantesTrabajo', 0.3, 1, 1], ['r:pantalonTrabajo', 0.15, 1, 1], ['r:botas', 0.1, 1, 1]]
    }
  };
})(this.Lluvia = this.Lluvia || {});
