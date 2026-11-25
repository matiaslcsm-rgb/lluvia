// Houses you can walk into (js/interiors.js): which buildings get an inside, the sizes the floor plans use, and
// each room's name and floor on screen. Lengths in meters.
(function (L) {
  'use strict';

  L.data.houses = {
    kinds: ['casa'],        // building kinds that get an inside as a house (the rest stay solid for now)
    area: [25, 320],        // m² of footprint: smaller ones are sheds; bigger ones are odd shapes, solid for now
    cell: 0.5,              // plan cell (the walk grid's)
    // Corridors and doors a bit wider than real ones: on a house turned against the walk grid (most streets of San
    // Miguel run diagonally) the walls take more room, and a 1 m corridor closes up. 1.8 m is a "galería".
    hall: 1.8,              // corridor width
    door: 1.2,              // door between rooms
    exit: 1.2,              // front and back doors
    minRoom: 3,             // m²: a smaller leftover (the footprint cuts a room) joins its neighbour
    bedroomMin: 2.4,        // narrowest side of a bedroom
    // Bedrooms by footprint, up to that many m². A house can have one more or one less now and then.
    bedrooms: [[45, 0], [75, 1], [110, 2], [160, 3], [Infinity, 4]],
    // How the rooms are laid out, with how often each one is picked when the shape allows it:
    //   lateral: "casa chorizo", a corridor along one side with the rooms in a row (long, narrow lots)
    //   central: a corridor down the middle with rooms on both sides (wide lots)
    //   frontBack: living and kitchen at the front, bedrooms at the back
    //   open: one big living-kitchen at the front, bedrooms at the back without a corridor
    layouts: { lateral: 3, central: 2, frontBack: 3, open: 2 },
    // Other buildings you can walk into, each with its layout (js/interiors.js, SPECIAL) and the m² it takes:
    //   shed: one open room; shop: the sales floor, a storeroom and a bath; nave: a big hall with an office and a
    //   bath (a factory) or a room at the back (`back`: a church's sacristy).
    special: {
      galpon: { layout: 'shed', room: 'galpon', area: [8, 300] },
      garage: { layout: 'shed', room: 'garage', area: [8, 600] },
      negocio: { layout: 'shop', area: [20, 1200] },
      industria: { layout: 'nave', room: 'nave', area: [60, 8000] },
      iglesia: { layout: 'nave', room: 'templo', back: 'sacristia', area: [30, 3000] }
    },
    // Apartment buildings: a core with the palier and a "U" stair (two flights side by side), apartments around it.
    building: {
      // Which kinds, and what fills each floor: apartments (null) or a row of rooms of one kind about `size` m wide.
      kinds: {
        edificio: null,
        escuela: { room: 'aula', size: 7 },
        salud: { room: 'consultorio', size: 3.5 },
        oficina: { room: 'oficina', size: 4 },
        publico: { room: 'oficina', size: 4.5 }
      },
      area: [80, 3000],     // m² of footprint
      lane: 2,              // width of each flight (wider than a real one, for the same reason as the corridors)
      flight: 3.5,          // length of a flight
      landing: 2,           // palier at each end of the stair
      side: 1.4,            // palier along each side of the stair
      hall: 3,              // width of the entrance hall, from the street door to the palier
      strip: 3.5,           // beside the core, a strip at least this wide is one more apartment
      units: [140, 260]     // apartments per floor: 2 below the first m², 3 below the second, else 4
    },
    rooms: {
      living: { name: 'Living', floor: '#a7825a' },
      livingCocina: { name: 'Living cocina', floor: '#a98a63' },
      ambiente: { name: 'Ambiente', floor: '#a7825a' },
      cocina: { name: 'Cocina', floor: '#c9c1ae' },
      lavadero: { name: 'Lavadero', floor: '#b9bec2' },
      dormitorio: { name: 'Dormitorio', floor: '#8e6a46' },
      bano: { name: 'Baño', floor: '#d6dde2' },
      pasillo: { name: '', floor: '#9a8466' },
      palier: { name: 'Palier', floor: '#b4ada0' },
      hall: { name: 'Hall', floor: '#c4bcaa' },
      terraza: { name: 'Terraza', floor: '#b7a68f' },
      casilla: { name: 'Sala de máquinas', floor: '#8d877c' },
      sotano: { name: 'Sótano', floor: '#77716a' },
      galpon: { name: 'Galpón', floor: '#aaa293' },
      garage: { name: 'Garage', floor: '#a59e92' },
      local: { name: 'Local', floor: '#d2c9b6' },
      deposito: { name: 'Depósito', floor: '#9e978a' },
      nave: { name: 'Nave', floor: '#b3ab9b' },
      oficina: { name: 'Oficina', floor: '#a88f6d' },
      templo: { name: 'Templo', floor: '#b49a78' },
      sacristia: { name: 'Sacristía', floor: '#9c8162' },
      aula: { name: 'Aula', floor: '#b9a17b' },
      consultorio: { name: 'Consultorio', floor: '#d3d8d5' }
    },
    // Furniture of each room (js/furnish.js), in the order it is placed: [piece, width, depth, where, how many,
    // [width, depth] if it doesn't fit].
    // Width along the wall it stands against, depth out from it, in meters. where: 'wall' (its back against a wall)
    // or 'center' (free all round; with a count, in rows: pews, desks, shelves). It is solid: you
    // can't walk or shoot through any of it (decision: docs/PLAN.md).
    furniture: {
      dormitorio: [['cama', 1.4, 1.9, 'wall', 1, [0.9, 1.9]], ['ropero', 1.2, 0.6, 'wall'], ['mesita', 0.45, 0.4, 'wall']],
      living: [['sillon', 2.0, 0.85, 'wall'], ['tele', 1.2, 0.4, 'wall'], ['mesa', 2.2, 1.7, 'center']],
      livingCocina: [['mesada', 2.4, 0.6, 'wall'], ['heladera', 0.7, 0.7, 'wall'], ['sillon', 2.0, 0.85, 'wall'], ['mesa', 2.2, 1.7, 'center']],
      ambiente: [['cama', 1.4, 1.9, 'wall', 1, [0.9, 1.9]], ['mesada', 1.8, 0.6, 'wall'], ['sillon', 1.6, 0.85, 'wall'], ['mesa', 1.6, 1.4, 'center']],
      cocina: [['mesada', 2.4, 0.6, 'wall', 1, [1.2, 0.6]], ['heladera', 0.7, 0.7, 'wall'], ['mesa', 1.6, 1.4, 'center']],
      lavadero: [['lavarropas', 0.6, 0.6, 'wall'], ['pileta', 0.6, 0.5, 'wall']],
      bano: [['inodoro', 0.45, 0.7, 'wall'], ['lavatorio', 0.6, 0.45, 'wall'], ['ducha', 0.9, 0.9, 'wall', 1, [0.8, 0.8]]],
      terraza: [['tanque', 1.2, 1.2, 'wall'], ['soga', 3, 0.3, 'wall']],
      casilla: [['motor', 1.2, 0.8, 'wall']],
      sotano: [['estante', 1.6, 0.5, 'wall', 2], ['cajas', 0.8, 0.8, 'wall', 3]],
      galpon: [['taller', 1.8, 0.7, 'wall'], ['estante', 1.6, 0.5, 'wall', 2], ['cajas', 0.8, 0.8, 'wall', 2]],
      garage: [['auto', 1.8, 4.2, 'wall'], ['estante', 1.6, 0.5, 'wall']],
      local: [['mostrador', 2.0, 0.6, 'wall'], ['estante', 1.6, 0.5, 'wall', 3], ['gondola', 2.4, 0.8, 'center', 6]],
      deposito: [['estante', 1.6, 0.5, 'wall', 4], ['cajas', 0.8, 0.8, 'wall', 4]],
      nave: [['estante', 1.6, 0.5, 'wall', 6], ['maquina', 2.4, 1.6, 'center', 8], ['cajas', 0.8, 0.8, 'wall', 4]],
      oficina: [['escritorio', 1.4, 1.2, 'wall', 2], ['archivero', 0.5, 0.6, 'wall']],
      templo: [['altar', 2.0, 1.0, 'wall'], ['banco', 3.0, 0.6, 'center', 24]],
      sacristia: [['ropero', 1.2, 0.6, 'wall'], ['mesa', 1.6, 1.4, 'center']],
      aula: [['pizarron', 3.0, 0.2, 'wall'], ['escritorio', 1.4, 1.2, 'wall'], ['pupitre', 0.7, 0.9, 'center', 20]],
      consultorio: [['camilla', 0.7, 1.9, 'wall'], ['escritorio', 1.4, 1.2, 'wall'], ['lavatorio', 0.6, 0.45, 'wall']]
    },
    // Windows on the outer walls, where nothing stands against them: one every `every` meters of a room's outer
    // wall, `length` long (`small` in the rooms listed), none in the rooms of `none`.
    windows: { length: 1.2, small: 0.6, smallIn: ['bano', 'lavadero', 'casilla'], none: ['terraza', 'sotano', 'pasillo', 'palier', 'hall'], every: 4 },
    wall: '#e8e1d3',        // inside walls, seen from above
    wallEdge: '#5a5146'
  };
})(this.Lluvia = this.Lluvia || {});
