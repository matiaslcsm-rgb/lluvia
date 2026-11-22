// Level-up choices: 3 options among new abilities, upgrades and passives.
(function (L) {
  'use strict';

  function deltaText(delta) {
    var labels = L.data.statLabels;
    return Object.keys(delta).map(function (k) {
      var v = delta[k];
      return (v > 0 ? '+' : '') + L.formatNumber(v) + ' ' + (labels[k] || k);
    }).join(', ');
  }

  // Fusions ready right now: ability at level 5 plus at least one copy of its item.
  L.fusionsReady = function (g) {
    var p = g.player;
    return L.data.fusions.filter(function (f) {
      var a = L.findById(p.abilities, f.ability);
      return a && a.level >= L.MAX_LEVEL && p.items[f.item] > 0;
    }).map(function (f) {
      var into = L.findAbility(f.into);
      return { type: 'fusion', id: f.ability, into: f.into, name: into.name, color: into.color,
        tag: '¡Fusión! ' + L.findAbility(f.ability).name + ' + ' + L.findItem(f.item).name, desc: into.desc };
    });
  };

  // Every option the player could take right now.
  function candidates(g) {
    var p = g.player, out = [];
    p.abilities.forEach(function (a) {
      if (a.level < L.MAX_LEVEL) {
        out.push({ type: 'upAbility', id: a.id, name: a.def.name, color: a.def.color,
          tag: 'Nivel ' + (a.level + 1), desc: deltaText(a.def.perLevel[a.level - 1]) });
      }
    });
    if (p.abilities.length < L.ABILITY_SLOTS) {
      L.data.abilities.forEach(function (def) {
        if (!def.fused && !L.findById(p.abilities, def.id)) {
          out.push({ type: 'newAbility', id: def.id, name: def.name, color: def.color, tag: 'Habilidad nueva', desc: def.desc });
        }
      });
    }
    p.passives.forEach(function (ps) {
      if (ps.level < L.MAX_LEVEL) {
        out.push({ type: 'upPassive', id: ps.id, name: ps.def.name, color: '#ffd27a', tag: 'Pasiva, nivel ' + (ps.level + 1), desc: ps.def.desc });
      }
    });
    if (p.passives.length < L.PASSIVE_SLOTS) {
      L.data.passives.forEach(function (def) {
        if (!L.findById(p.passives, def.id)) {
          out.push({ type: 'newPassive', id: def.id, name: def.name, color: '#ffd27a', tag: 'Pasiva nueva', desc: def.desc });
        }
      });
    }
    return out;
  }

  // Fusions always make it onto the list; the rest are drawn at random. Trébol adds one more option.
  L.makeChoices = function (g) {
    var count = 3 + (g.player.stats.extraChoices || 0);
    var picked = L.fusionsReady(g).slice(0, count), pool = candidates(g);
    while (picked.length < count && pool.length) picked.push(pool.splice(g.rng.int(pool.length), 1)[0]);
    if (!picked.length) picked.push({ type: 'heal', id: 'heal', name: 'Curación', color: '#ff6b81', tag: 'Todo al máximo', desc: 'Recuperás 30 de vida.' });
    return picked;
  };

  // Applies option `index` of the open choice. Returns false if there is no such option.
  L.choose = function (g, index) {
    var o = g.choice && g.choice[index];
    if (!o) return false;
    var p = g.player;
    if (o.shop) { // the Mercader errante: buying doesn't use up a level-up
      if (o.type === 'buy') {
        if (g.gold < o.price) { L.toast(g, 'No te alcanza: cuesta ' + o.price + ' de oro.', '#ff9a7a'); return false; }
        g.gold -= o.price;
        L.addItem(g, o.id);
        L.toast(g, 'Compraste ' + o.name + '.', '#ffd27a');
      }
      g.choice = g.pendingLevels > 0 ? L.makeChoices(g) : null;
      return true;
    }
    if (o.type === 'newAbility') L.addAbility(g, o.id);
    else if (o.type === 'upAbility') L.levelUpAbility(g, o.id);
    else if (o.type === 'newPassive') L.addPassive(g, o.id);
    else if (o.type === 'upPassive') L.levelUpPassive(g, o.id);
    else if (o.type === 'heal') p.hp = Math.min(p.stats.maxHp, p.hp + 30);
    else if (o.type === 'fusion') {
      var a = L.findById(p.abilities, o.id), def = L.findAbility(o.into);
      a.id = def.id; a.def = def; a.level = L.MAX_LEVEL; a.stats = L.abilityStats(def, L.MAX_LEVEL);
      a.timer = 0; a.hits.clear();
    }
    g.pendingLevels--;
    g.choice = g.pendingLevels > 0 ? L.makeChoices(g) : null;
    return true;
  };
})(this.Lluvia = this.Lluvia || {});
