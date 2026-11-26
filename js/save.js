// Saving the game (stage 61), as the user decided (2026-11-25, answer 4 b): the game saves only when you lie down in
// a bed. "Continuar" on the start screen brings you back there, awake, at that hour.
//   L.saveGame(g): a plain object (JSON) with everything that has to come back.
//   L.applySave(g, data): puts it into a game just made with L.createGame (same map: the city is baked in).
// What is not saved: the zombies (new ones come), shots, fires and thrown things, toasts. Where furniture was searched
// and what was left in it is saved; what each piece holds is seeded by its place (js/loot.js), so it comes back the same.
(function (L) {
  'use strict';

  L.SAVE_VERSION = 1;

  // Player fields that are rebuilt, not copied: definitions, functions, derived numbers, the moment's state.
  var SKIP = { char: 1, abilities: 1, passives: 1, stats: 1, items: 1, itemOrder: 1, onHit: 1, onKill: 1, ulti: 1,
    gun: 1, asleep: 1, hurt: 1, invuln: 1, aiming: 1, running: 1, blocking: 1, wasHurt: 1, stairOn: 1 };
  // Game fields copied as they are.
  var GAME = ['seed', 'time', 'slept', 'kills', 'deaths', 'gold', 'pendingLevels', 'nextBoss', 'nextMini', 'nextWave',
    'spawnAcc', 'seasonId', 'weather', 'ground', 'bodies', 'barrierSeen', 'barricades',
    'refuge', 'rep', 'repDay', 'repKnockedDay', 'people', 'peopleHouses', 'peopleN', 'peopleT', 'peopleDay', 'madHour', 'morale', 'lights', 'story'];

  function copy(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v, noPlans)); }
  // A building's plan (the house you, your bed or your body are in) is saved as its number and found again on load:
  // the plan is big, and it points to itself.
  function noPlans(k, v) { return v && typeof v === 'object' && v.frame && v.lab && v.index !== undefined ? { plan: v.index } : v; }
  function plans(g, v) {
    if (!v || typeof v !== 'object') return v;
    if (v.plan !== undefined && Object.keys(v).length === 1) return g.city && L.cityHouse ? L.cityHouse(g.city, v.plan) : null;
    Object.keys(v).forEach(function (k) { v[k] = plans(g, v[k]); });
    return v;
  }

  L.saveGame = function (g) {
    var p = g.player, pl = {};
    Object.keys(p).forEach(function (k) {
      if (SKIP[k] || typeof p[k] === 'function') return;
      pl[k] = copy(p[k]);
    });
    var data = {
      v: L.SAVE_VERSION, at: Date.now(), player: pl,
      bothHands: !!(p.hands && p.hands.l && p.hands.l === p.hands.r), // a long weapon: one thing in both hands
      gun: p.gun ? { id: p.gun.def.id, level: p.gun.level, ammo: p.gun.ammo } : null,
      passives: p.passives.map(function (ps) { return { id: ps.id, level: ps.level }; }),
      items: copy(p.items || {}),
      pack: copy(g.pack),
      searched: g.searched ? Array.from(g.searched) : [],
      leftover: g.leftover ? Array.from(g.leftover.entries()) : [],
      explored: L.packExplored ? L.packExplored(g) : null // what the map remembers (js/explored.js)
    };
    GAME.forEach(function (k) { if (g[k] !== undefined) data[k] = copy(g[k]); });
    return data;
  };

  L.applySave = function (g, data) {
    if (!data || data.v !== L.SAVE_VERSION) return false;
    var p = g.player;
    // What you earned leveling up: passives, items, the gun's upgrades. Then the numbers they give.
    (data.passives || []).forEach(function (ps) {
      L.addPassive(g, ps.id);
      for (var i = 1; i < ps.level; i++) L.levelUpPassive(g, ps.id);
    });
    Object.keys(data.items || {}).forEach(function (id) { for (var i = 0; i < data.items[id]; i++) L.addItem(g, id); });
    if (data.gun) { L.giveGun(g, data.gun.id); p.gun.level = data.gun.level; p.gun.ammo = data.gun.ammo; }
    else p.gun = null;
    // You, as you were.
    Object.keys(data.player).forEach(function (k) { p[k] = plans(g, copy(data.player[k])); });
    if (data.bothHands && p.hands) p.hands.l = p.hands.r;
    p.asleep = null; p.invuln = 0; p.hurt = 0;
    L.recalcStats(g);
    p.hp = Math.min(data.player.hp, p.stats.maxHp);
    // The world.
    GAME.forEach(function (k) { if (data[k] !== undefined) g[k] = plans(g, copy(data[k])); });
    g.pack = copy(data.pack);
    g.searched = new Set(data.searched || []);
    g.leftover = new Map(data.leftover || []);
    if (data.explored && L.unpackExplored) L.unpackExplored(g, data.explored);
    if (g.barricades && L.useBarricades) L.useBarricades(g); // the walk grid with this game's barricades
    g.enemies = []; g.projectiles = []; g.enemyShots = []; g.throws = []; g.fires = []; g.toasts = [];
    g.choice = g.pendingLevels > 0 && L.makeChoices ? L.makeChoices(g) : null;
    return true;
  };

  // Where the browser keeps it (js/view/main.js sets L.store; the tests don't have one).
  L.SAVE_KEY = 'solLoco.save';
  L.writeSave = function (g) {
    if (!L.store) return false;
    try { L.store.setItem(L.SAVE_KEY, JSON.stringify(L.saveGame(g))); return true; } catch (e) { return false; }
  };
  L.readSave = function () {
    if (!L.store) return null;
    try { var d = JSON.parse(L.store.getItem(L.SAVE_KEY) || 'null'); return d && d.v === L.SAVE_VERSION ? d : null; } catch (e) { return null; }
  };
})(this.Lluvia = this.Lluvia || {});
