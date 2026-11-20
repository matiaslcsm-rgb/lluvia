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
        if (!L.findById(p.abilities, def.id)) {
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

  L.makeChoices = function (g) {
    var pool = candidates(g), picked = [];
    while (picked.length < 3 && pool.length) picked.push(pool.splice(g.rng.int(pool.length), 1)[0]);
    if (!picked.length) picked.push({ type: 'heal', id: 'heal', name: 'Curación', color: '#ff6b81', tag: 'Todo al máximo', desc: 'Recuperás 30 de vida.' });
    return picked;
  };

  // Applies option `index` of the open choice. Returns false if there is no such option.
  L.choose = function (g, index) {
    var o = g.choice && g.choice[index];
    if (!o) return false;
    var p = g.player;
    if (o.type === 'newAbility') L.addAbility(g, o.id);
    else if (o.type === 'upAbility') L.levelUpAbility(g, o.id);
    else if (o.type === 'newPassive') L.addPassive(g, o.id);
    else if (o.type === 'upPassive') L.levelUpPassive(g, o.id);
    else if (o.type === 'heal') p.hp = Math.min(p.stats.maxHp, p.hp + 30);
    g.pendingLevels--;
    g.choice = g.pendingLevels > 0 ? L.makeChoices(g) : null;
    return true;
  };
})(this.Lluvia = this.Lluvia || {});
