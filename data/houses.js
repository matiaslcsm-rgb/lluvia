// Houses you can walk into (js/interiors.js): which buildings get an inside, the sizes the floor plans use, and
// each room's name and floor on screen. Lengths in meters.
(function (L) {
  'use strict';

  L.data.houses = {
    kinds: ['casa'],        // building kinds that get an inside (the rest stay solid for now)
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
    rooms: {
      living: { name: 'Living', floor: '#a7825a' },
      livingCocina: { name: 'Living cocina', floor: '#a98a63' },
      ambiente: { name: 'Ambiente', floor: '#a7825a' },
      cocina: { name: 'Cocina', floor: '#c9c1ae' },
      lavadero: { name: 'Lavadero', floor: '#b9bec2' },
      dormitorio: { name: 'Dormitorio', floor: '#8e6a46' },
      bano: { name: 'Baño', floor: '#d6dde2' },
      pasillo: { name: '', floor: '#9a8466' }
    },
    wall: '#e8e1d3',        // inside walls, seen from above
    wallEdge: '#5a5146'
  };
})(this.Lluvia = this.Lluvia || {});
