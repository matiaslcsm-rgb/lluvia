// The Cuaderno del Paraguas (progress between matches). Pure logic on a plain profile object, so it can be
// tested; the browser view (js/view/main.js) loads and saves the profile.
(function (L) {
  'use strict';

  L.newProfile = function () {
    return { coins: 0, upgrades: {}, achievements: {}, unlocked: {}, played: {}, daily: {}, stats: { matches: 0, wins: 0, bestPlace: 9, kills: 0 } };
  };

  // The daily match: everyone gets the same seed on the same day (same rivals, same horde).
  L.dailySeed = function (date) {
    var key = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
    return ((key * 2654435761) >>> 0) || 1;
  };
  L.dailyKey = function (date) { return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate(); };

  // Keeps your best place on that day's daily match (lower is better). Returns true if it is a new record.
  L.recordDaily = function (profile, key, place, kills) {
    profile.daily = profile.daily || {};
    var best = profile.daily[key];
    if (best && (best.place < place || (best.place === place && best.kills >= kills))) return false;
    profile.daily[key] = { place: place, kills: kills };
    return true;
  };

  // Unlocks: open if nothing locks it, if you bought it, or if you have its achievement.
  L.unlockFor = function (id) { return L.findById(L.data.meta.unlocks, id); };
  L.isUnlocked = function (profile, id) {
    var u = L.unlockFor(id);
    if (!u) return true;
    if (!profile) return false;
    return !!((profile.unlocked || {})[id] || profile.achievements[u.achievement]);
  };
  L.buyUnlock = function (profile, id) {
    var u = L.unlockFor(id);
    if (!u || !u.cost || L.isUnlocked(profile, id) || profile.coins < u.cost) return false;
    profile.coins -= u.cost;
    profile.unlocked = profile.unlocked || {};
    profile.unlocked[id] = true;
    return true;
  };

  L.upgradeLevel = function (profile, id) { return profile.upgrades[id] || 0; };
  L.upgradeCost = function (profile, def) { return def.cost * (L.upgradeLevel(profile, def.id) + 1); };

  L.buyUpgrade = function (profile, id) {
    var def = L.findById(L.data.meta.upgrades, id), lvl = L.upgradeLevel(profile, id);
    if (!def || lvl >= def.max) return false;
    var cost = L.upgradeCost(profile, def);
    if (profile.coins < cost) return false;
    profile.coins -= cost;
    profile.upgrades[id] = lvl + 1;
    return true;
  };

  // What your upgrades add, as the same kind of numbers recalcStats uses.
  L.metaBonus = function (profile) {
    var b = { maxHpMul: 0, damageMul: 0, speedMul: 0, pickupMul: 0, startGold: 0, cooldownMul: 0, luck: 0 };
    if (!profile) return b;
    L.data.meta.upgrades.forEach(function (def) { b[def.stat] += def.per * L.upgradeLevel(profile, def.id); });
    return b;
  };

  // Gives a game your Cuaderno upgrades (call right after creating it).
  L.applyMeta = function (g, profile) {
    g.meta = L.metaBonus(profile);
    g.gold += g.meta.startGold;
    L.recalcStats(g);
    g.player.hp = g.player.stats.maxHp;
  };

  // At the end of a match: coins earned and achievements unlocked. Updates the profile. Returns a summary.
  L.settleMatch = function (profile, m) {
    var me = m.human, g = me.game, M = L.data.meta, place = me.place || 1;
    var track = { duelsWon: me.duelsWon || 0, betsWon: me.betsWon || 0, bossKills: g.bossKills || 0,
      legendary: g.gotLegendary, livesLost: L.data.horde.lives - Math.max(0, g.lives) };
    var duelsWon = track.duelsWon;
    var coins = M.placeCoins[place - 1] + duelsWon * M.perDuelWon + Math.floor(g.kills / 100) * M.per100Kills;
    var charId = g.player.char.id;
    profile.played[charId] = true;
    profile.stats.matches++;
    profile.stats.kills += g.kills;
    if (place === 1) profile.stats.wins++;
    profile.stats.bestPlace = Math.min(profile.stats.bestPlace, place);

    var fusionsNow = g.player.abilities.filter(function (a) { return a.def.fused; }).length;
    var fusionsMax = fusionsNow; // fusions are never lost, so the count at the end is the most you had
    var done = {
      primera: true,
      podio: place <= 3,
      sol: place === 1,
      juicio: duelsWon >= 3,
      fusion: fusionsMax >= 1,
      dosfusiones: fusionsMax >= 2,
      coloso: (track.bossKills || 0) >= 1,
      mil: g.kills >= 1000,
      legendario: !!track.legendary,
      apostador: (track.betsWon || 0) >= 3,
      todos: L.data.characters.every(function (c) { return profile.played[c.id]; }),
      invicto: place === 1 && !(track.livesLost || 0),
      eterna: place === 1 && !!m.storm
    };
    if (m.storm) coins *= M.storm.coinMul;
    var wasOpen = {};
    M.unlocks.forEach(function (u) { wasOpen[u.id] = L.isUnlocked(profile, u.id); });
    var unlocked = [];
    M.achievements.forEach(function (a) {
      if (done[a.id] && !profile.achievements[a.id]) {
        profile.achievements[a.id] = true;
        coins += a.coins;
        unlocked.push(a);
      }
    });
    profile.coins += coins;
    var opened = M.unlocks.filter(function (u) { return !wasOpen[u.id] && L.isUnlocked(profile, u.id); });
    return { coins: coins, unlocked: unlocked, opened: opened, duelsWon: duelsWon };
  };
})(this.Lluvia = this.Lluvia || {});
