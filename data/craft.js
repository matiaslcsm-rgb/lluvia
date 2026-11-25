// Crafting (js/craft.js), after Darkwood and Project Zomboid (docs/DARKWOOD.md, docs/ZOMBOID.md): what you gather
// becomes things you need. Tab opens the list. Simple things are made anywhere, with your hands; the rest needs a
// workbench ("taller", the bench in the sheds) within reach.
//   need: what it uses, from the backpack   make: what you get ("w:..." a hand weapon, data/melee.js)
//   at: 'taller' if it needs the workbench
(function (L) {
  'use strict';
  L.data = L.data || {};
  L.data.craft = {
    reach: 1.5,          // meters from a workbench to use it
    recipes: [
      { id: 'venda', name: 'Venda', need: { trapos: 2 }, make: ['vendas', 1] },
      { id: 'vendados', name: 'Puños vendados', need: { vendas: 1 }, make: ['w:vendados', 1] },
      { id: 'botellarota', name: 'Botella rota', need: { botella: 1 }, make: ['w:botellarota', 1] },
      { id: 'molotov', name: 'Molotov', need: { botella: 1, trapos: 1, nafta: 1 }, make: ['molotov', 1] },
      { id: 'balas', name: 'Balas', need: { chatarra: 2 }, make: ['balas', 5], at: 'taller' },
      { id: 'tablas', name: 'Tablas (de un mueble roto)', need: { clavos: 4, chatarra: 1 }, make: ['tablas', 2], at: 'taller' }
    ],
    // The molotov (G throws it toward the sight): it flies up to `range` m, bursts into a fire of `radius` m that
    // lasts `time` s and burns whatever is in it (`dps` a second, zombies and you); it is heard `noise` m away.
    molotov: { range: 12, radius: 2.2, time: 8, dps: 4, noise: 14, flight: 0.55 }
  };
})(this.Lluvia = this.Lluvia || {});
