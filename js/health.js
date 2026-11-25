// Health (data/health.js, docs/CUERPO.md section 5). A zombie's blows leave wounds: a cut or a stab bleeds and may
// get infected, a blow slows you down. Each wound takes away part of your life cap (p.capLost: a share of the full
// life) and a bleeding one keeps taking it until it is bandaged; a first aid kit freezes the cap for a while. An
// infection shows up some hours later, brings fever if it is not treated, and needs an antibiotic course. To win
// back the cap: no infection, nothing bleeding, paracetamol, fed and watered, and sleep.
// Hours are hours of the game's clock; js/game.js calls updateHealth with the clock's seconds (more while asleep).
(function (L) {
  'use strict';

  function D() { return L.data.health; }

  L.makeHealth = function (g) {
    var p = g.player;
    p.wounds = []; p.capLost = 0; p.capPeak = 0; p.woundAcc = 0; p.kitT = 0; p.paraT = 0; p.infection = null; p.bluntSlow = 0;
  };

  // The life you can have now: the full life less what the wounds took (never under minCap).
  L.lifeCap = function (g) {
    var p = g.player;
    return p.stats.maxHp * Math.max(D().minCap, 1 - (p.capLost || 0));
  };
  function loseCap(g, share) {
    var p = g.player;
    if (p.kitT > 0) return; // a kit freezes the cap (the user: "congela el medidor")
    p.capLost = Math.min(1 - D().minCap, p.capLost + share);
    p.capPeak = Math.max(p.capPeak, p.capLost);
  }

  // A new wound of kind 'k' (cortante), 'p' (punzante) or 'c' (contundente).
  L.addWound = function (g, kind) {
    var p = g.player, K = D().kinds[kind];
    if (!p.wounds) L.makeHealth(g);
    var w = { kind: kind, age: 0, bleed: K.bleed, band: null, dis: false, rolled: !K.infect }; // age: hours since
    p.wounds.push(w);
    var was = p.kitT; p.kitT = 0; loseCap(g, K.cap); p.kitT = was; // a fresh wound always takes its share
    if (K.bleed) L.toast(g, K.name + ': estás sangrando. Vendate (H) o usá un kit (K).', '#c26a4a');
    else if (K.slow) L.toast(g, 'Un golpe fuerte: te movés más lento. El paracetamol lo alivia.', '#c26a4a');
    blunt(g);
    L.emit(g, 'wound', p.x, p.y, { kind: kind });
    return w;
  };
  // A zombie hurt you by `dmg`: every `every` points, a wound of a kind rolled from its mix.
  L.takeWound = function (g, dmg, e) {
    var p = g.player, H = D();
    if (!p.wounds) L.makeHealth(g);
    p.woundAcc += dmg;
    while (p.woundAcc >= H.every) {
      p.woundAcc -= H.every;
      var mix = (e && e.type && e.type.attack) || H.zombieMix, r = g.rng(), kind = 'c';
      for (var k in mix) { r -= mix[k]; if (r < 0) { kind = k; break; } }
      if (L.clothesStop && L.clothesStop(g, kind)) continue; // what you wear stopped it (js/clothes.js)
      L.addWound(g, kind);
    }
  };

  function bleeding(p) { return (p.wounds || []).filter(function (w) { return w.bleed && !w.band; }); }
  L.bleeding = bleeding;
  // Defenses at 100% (the user): rested, fed and watered, the life cap whole and the life almost full.
  function defenses(g) {
    var p = g.player, N = L.data.needs, R = L.data.rest;
    return (p.energy === undefined || p.energy >= R.max * D().defenses.energy) && p.fed < N.eat.every && p.watered < N.drink.every &&
      p.capLost <= 0.001 && p.hp >= L.lifeCap(g) * 0.9;
  }
  L.defenses = defenses;

  // ---- Treatments ----
  // A bandage, a plaster or a rag on a bleeding wound: it stops at once (and heals a little). Without a bleeding
  // wound, a bandage still heals a little life. Returns true if it was used.
  L.bandage = function (g, id) {
    var p = g.player, H = D(), w = bleeding(p)[0];
    if (!w && (id !== 'vendas' || p.hp >= L.lifeCap(g))) return false;
    if (!L.packTake(g, id, 1)) return false;
    if (w) w.band = H.bandage[id];
    p.hp = Math.min(L.lifeCap(g), p.hp + H.heal);
    L.toast(g, w ? (id === 'trapos' ? 'Te ataste un trapo: paró el sangrado, pero se puede infectar.' : 'Te vendaste: paró el sangrado.') : 'Te vendaste.', '#e8e2d6');
    return true;
  };
  // H: the best thing at hand for a bleeding wound (a bandage, a plaster, a rag), or a bandage for the life.
  L.quickBandage = function (g) {
    var ids = ['vendas', 'curitas', 'trapos'];
    for (var i = 0; i < ids.length; i++) if (L.packCount(g, ids[i]) && L.bandage(g, ids[i])) return true;
    return false;
  };
  // Alcohol or sanitizer on the fresh wounds, before bandaging: much less chance of infection.
  function fresh(p) { return (p.wounds || []).filter(function (w) { return !w.rolled && !w.dis && (!w.band || w.band === 'kit'); }); }
  L.disinfect = function (g, id) {
    var p = g.player, ws = fresh(p);
    if (!ws.length || !L.packTake(g, id, 1)) return false;
    ws.forEach(function (w) { w.dis = true; });
    L.toast(g, 'Desinfectaste ' + (ws.length === 1 ? 'la herida' : 'las heridas') + '.', '#cfe3ea');
    return true;
  };
  // A first aid kit: every wound stops bleeding, and the life cap stays frozen for its hours.
  L.applyKit = function (g, id) {
    var p = g.player, K = D().kits[id];
    if (!L.packTake(g, id, 1)) return false;
    (p.wounds || []).forEach(function (w) { if (w.bleed && (!w.band || w.band === 'kit')) w.band = 'kit'; });
    p.kitT = Math.max(p.kitT, K.hours);
    p.hp = Math.min(L.lifeCap(g), p.hp + K.heal);
    L.toast(g, 'Te aplicaste el kit: estás estabilizado por ' + K.hours + ' h.', '#e8e8e8');
    return true;
  };
  // Paracetamol: the blows stop slowing you, and it counts for recovering.
  L.takeParacetamol = function (g) {
    var p = g.player;
    if (!L.packTake(g, 'paracetamol', 1)) return false;
    p.paraT = D().paracetamol.hours;
    (p.wounds || []).forEach(function (w) { if (w.kind === 'c') w.eased = true; });
    blunt(g);
    L.toast(g, 'Tomaste paracetamol.', '#ffffff');
    return true;
  };
  // Opens a botiquín: what it holds goes where it fits; the rest, to the floor.
  L.openBotiquin = function (g) {
    var B = D().botiquin;
    if (!L.packTake(g, 'botiquin', 1)) return false;
    Object.keys(B).forEach(function (id) { var rest = L.packAdd(g, id, B[id]); if (rest) L.dropToGround(g, { id: id, n: rest }); });
    L.toast(g, 'Abriste el botiquín: 4 kits, 16 antibióticos y 16 paracetamoles.', '#c23b30');
    return true;
  };

  // How much the blows slow you down, until paracetamol.
  function blunt(g) {
    var p = g.player, H = D();
    p.bluntSlow = Math.min(H.maxSlow, (p.wounds || []).reduce(function (a, w) { return a + (w.kind === 'c' && !w.eased ? H.kinds.c.slow : 0); }, 0));
  }

  // ---- The infection ----
  function infect(g) {
    var p = g.player;
    if (p.infection) return;
    p.infection = { h: 0, doses: 0, need: D().antibiotic.doses, next: 0, started: false, fever: false };
    L.toast(g, 'Una herida se infectó. Tomá antibiótico (desde el inventario o el estado, K).', '#9bc26a');
    L.emit(g, 'infected', p.x, p.y);
  }
  function cure(g, why) {
    var p = g.player;
    p.infection = null;
    L.toast(g, why + ' Ahora descansá (paracetamol, comida y agua) para recuperarte.', '#9bc26a');
  }
  // One dose: a pill and some water. `auto`: taken by itself (it says so; and shouts if something is missing).
  L.takeAntibiotic = function (g, auto) {
    var p = g.player, A = D().antibiotic, inf = p.infection, N = L.data.needs;
    if (!inf) { if (!auto) L.toast(g, 'No tenés ninguna infección.', '#8d8672'); return false; }
    var pills = L.packCount(g, 'antibiotico'), water = L.packCount(g, N.drink.item);
    if (!pills || !water) {
      if (auto) { L.toast(g, 'Tocaba el antibiótico y ' + (!pills ? 'no te quedan pastillas.' : 'no tenés agua.'), '#e04a3a'); L.emit(g, 'alarm', p.x, p.y); }
      else L.toast(g, !pills ? 'No tenés antibiótico.' : 'Necesitás agua para tomar la pastilla.', '#8d8672');
      inf.next = A.retry;
      return false;
    }
    L.packTake(g, 'antibiotico', 1);
    L.consume(g, 'drink', true);
    inf.doses++; inf.started = true; inf.next = A.every; inf.fever = false;
    L.toast(g, 'Dosis ' + inf.doses + '/' + inf.need + ' tomada.', '#e6e0a8');
    if (inf.doses < inf.need && g.rng() < A.early) cure(g, 'El antibiótico hizo efecto antes: se te fue la infección.');
    else if (inf.doses >= inf.need) {
      if (g.rng() < A.resist) { inf.need += A.more; L.toast(g, 'La infección resiste: hacen falta ' + A.more + ' dosis más.', '#c26a4a'); }
      else cure(g, 'Terminaste el antibiótico: se te fue la infección.');
    }
    return true;
  };

  // ---- What each medical thing can do (the right click menu, js/loot.js L.slotActions) ----
  L.itemActions = function (g, sl, add) {
    var p = g.player, id = sl.id;
    if (D().bandage[id]) {
      if (bleeding(p).length) add(id === 'trapos' ? 'Atarte en la herida' : 'Vendar la herida', function () { return L.bandage(g, id); });
      else if (id === 'vendas') add('Vendarte', function () { return L.bandage(g, id); });
    }
    if (D().disinfect.indexOf(id) >= 0 && fresh(p).length) add('Desinfectar la herida', function () { return L.disinfect(g, id); });
    if (D().kits[id]) add('Aplicar', function () { return L.applyKit(g, id); });
    if (id === 'paracetamol') add('Tomar', function () { return L.takeParacetamol(g); });
    if (id === 'antibiotico' && p.infection) add('Tomar (con agua)', function () { return L.takeAntibiotic(g, false); });
    if (id === 'botiquin') add('Abrir', function () { return L.openBotiquin(g); });
  };

  // ---- Each frame ----
  L.updateHealth = function (g, dt, gdt) {
    var p = g.player, H = D(), hours = gdt / L.data.clock.hour, N = L.data.needs;
    if (!p.wounds) L.makeHealth(g);
    // Bleeding wounds keep taking the cap.
    var bl = bleeding(p);
    if (bl.length) loseCap(g, H.bleed * bl.length * hours);
    // The kit wears off: the wounds still open bleed again.
    if (p.kitT > 0) {
      p.kitT -= hours;
      if (p.kitT <= 0) {
        p.kitT = 0;
        var open = 0;
        p.wounds.forEach(function (w) { if (w.band === 'kit') { w.band = null; open++; } });
        L.toast(g, 'El kit dejó de hacer efecto' + (open ? ': las heridas vuelven a sangrar.' : '.'), '#c26a4a');
      }
    }
    // The infection shows up some hours after a cut or a stab.
    p.wounds.forEach(function (w) {
      w.age += hours;
      if (w.rolled || w.age < H.incub) return;
      w.rolled = true;
      var M = H.infectMul, chance = H.kinds[w.kind].infect;
      chance *= w.dis ? M.disinfected : 1;
      chance *= w.band === 'kit' ? M.kit : w.band ? M[w.band] : M.none;
      if (defenses(g)) chance *= M.defenses;
      if (g.rng() < chance) infect(g);
    });
    var inf = p.infection;
    if (inf) {
      inf.h += hours;
      if (inf.started) {
        inf.next -= hours;
        if (inf.next <= 0) L.takeAntibiotic(g, true); // the next doses by themselves, asleep too (no waking up)
      } else if (inf.h >= H.fever) {
        if (!inf.fever) { inf.fever = true; L.toast(g, 'Tenés fiebre: la infección avanza. Tomá antibiótico.', '#9bc26a'); }
      }
      if (p.infection && inf.fever) {
        loseCap(g, H.feverCap * hours);
        if (p.energy !== undefined && !p.asleep) p.energy = Math.max(0, p.energy - L.data.rest.perHour * (H.feverEnergy - 1) * hours);
        if (!p.asleep && !(p.faint > 0) && g.rng() < H.feverFaint * dt) { p.faint = N.faint.time; L.toast(g, 'La fiebre te tumbó.', '#c26a4a'); }
      }
      // With full defenses it may go away by itself.
      if (p.infection && defenses(g) && g.rng() < 1 - Math.pow(1 - H.selfCure, hours)) cure(g, 'Tus defensas pudieron con la infección.');
    }
    // Recovering: asleep, no infection, nothing bleeding, paracetamol, fed and watered.
    p.recovering = !!(p.asleep && p.capLost > 0 && !p.infection && !bleeding(p).length && p.paraT > 0 && p.fed < N.eat.every && p.watered < N.drink.every);
    if (p.recovering) {
      p.capLost = Math.max(0, p.capLost - Math.max(p.capPeak, 0.05) / H.sleep * hours);
      if (p.capLost <= 0) {
        p.capLost = 0; p.capPeak = 0; p.wounds = [];
        L.toast(g, 'Te recuperaste del todo.', '#9bc26a');
      }
    }
    // Wounds that no longer matter (bandaged or healed, rolled, not slowing) are forgotten when the cap is whole.
    if (p.capLost <= 0 && p.wounds.length && !p.infection) p.wounds = p.wounds.filter(function (w) { return !w.rolled || w.bleed && !w.band || w.kind === 'c' && !w.eased; });
    blunt(g);
    if (p.paraT > 0) p.paraT = Math.max(0, p.paraT - hours);
    var cap = L.lifeCap(g);
    if (p.hp > cap) p.hp = cap;
  };
})(this.Lluvia = this.Lluvia || {});
