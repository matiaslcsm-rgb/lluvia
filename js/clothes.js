// Clothes (data/clothes.js; docs/CUERPO.md section 7), like Project Zomboid: one garment per place of your body.
// Each one warms you and protects you a little from the zombies' blows; the rain soaks them and wet they warm less;
// the blows they stop wear them out until they tear.
//   p.clothes: { cabeza, torso, abrigo, manos, piernas, medias, calzado }: a slot { id: 'r:jean', n: 1, dur, wet }
//   or null. In your pockets and bags a garment is the same kind of slot.
(function (L) {
  'use strict';

  function D() { return L.data.clothes; }
  L.isCloth = function (id) { return id.indexOf('r:') === 0; };
  L.clothDef = function (id) { return D().kinds[id.indexOf('r:') === 0 ? id.slice(2) : id]; };
  L.clothColor = function (id) { return D().colors[L.clothDef(id).slot]; };
  L.newCloth = function (cid, dur, wet) { return { id: 'r:' + cid, n: 1, dur: dur === undefined ? D().kinds[cid].dur : dur, wet: wet || 0 }; };

  L.makeClothes = function (g) {
    var p = g.player;
    p.clothes = {};
    D().slots.forEach(function (s) { p.clothes[s] = null; });
    D().start.forEach(function (cid) { p.clothes[D().kinds[cid].slot] = L.newCloth(cid); });
    p.warmState = 'bien';
  };

  // Puts a garment on; what you had there comes back (a slot) or null.
  L.putOn = function (g, sl) {
    var p = g.player, place = L.clothDef(sl.id).slot, old = p.clothes[place];
    p.clothes[place] = sl;
    return old;
  };
  // Takes off what you wear at `place`: to your pockets or bags, or to the floor if it doesn't fit.
  L.takeOff = function (g, place) {
    var p = g.player, sl = p.clothes[place];
    if (!sl) return false;
    p.clothes[place] = null;
    if (!L.packAddSlot(g, sl)) { L.dropToGround(g, sl); L.toast(g, 'No te entra: ' + L.slotName(sl) + ' queda en el piso.', '#8d8672'); }
    return true;
  };
  // A garment found (a wardrobe, the floor): on you if that place is free, else where it fits. True if you took it.
  L.giveCloth = function (g, sl) {
    var p = g.player;
    if (!p.clothes) return L.packAddSlot(g, sl);
    if (!p.clothes[L.clothDef(sl.id).slot]) { L.putOn(g, sl); return true; }
    return L.packAddSlot(g, sl);
  };
  // A garment in a piece of furniture: on you if that place is free; else it is left out on the floor, where you see
  // it and can choose (E takes it; my call, so a wardrobe doesn't fill your bags with shirts).
  L.foundCloth = function (g, sl) {
    var p = g.player;
    if (p.clothes && !p.clothes[L.clothDef(sl.id).slot]) { L.putOn(g, sl); return true; }
    L.dropToGround(g, sl);
    return false;
  };
  // "Jean (mojado, roto)"
  L.clothName = function (sl) {
    var c = L.clothDef(sl.id), bits = [];
    if (sl.dur <= 0) bits.push('roto'); else if (sl.dur < c.dur) bits.push(Math.round(sl.dur / c.dur * 100) + '%');
    if (sl.wet > 0.6) bits.push('empapado'); else if (sl.wet > 0.15) bits.push('mojado');
    return c.name + (bits.length ? ' (' + bits.join(', ') + ')' : '');
  };

  // What you can do with what you wear at `place` (the inventory's menu): [{ label, run }].
  L.clothActions = function (g, place) {
    var p = g.player, sl = p.clothes && p.clothes[place];
    if (!sl) return [];
    return [
      { label: 'Sacártelo', run: function () { return L.takeOff(g, place); } },
      { label: 'Tirar', run: function () { p.clothes[place] = null; L.dropToGround(g, sl); L.emit(g, 'drop', p.x, p.y); return true; } }
    ];
  };

  // ---- Warmth ----
  function worn(p) { return D().slots.map(function (s) { return p.clothes && p.clothes[s]; }).filter(Boolean); }
  function warmOf(sl) { var c = L.clothDef(sl.id); return c.warm * (1 - (1 - D().wetWarm) * (sl.wet || 0)) * (sl.dur > 0 ? 1 : 0.5); }
  L.warmth = function (g) { return worn(g.player).reduce(function (a, sl) { return a + warmOf(sl); }, 0); };
  function inside(g) { var p = g.player; return !!(p.floor || g.city && L.cityHouseAt && L.cityHouseAt(g.city, p.x, p.y)); }
  L.warmNeed = function (g) {
    var N = D().need, k = L.clockOf ? L.clockOf(g) : null, need = 0;
    need += k && k.season ? N.season[k.season.id] || 0 : N.season.otono;
    if (k && k.light < 0.3) need += N.night;
    var W = g.weather;
    if (W) { var a = N.weather[W.prev] || 0, b = N.weather[W.id] || 0; need += a + (b - a) * W.blend; }
    if (inside(g)) need += N.inside;
    return Math.max(0, need);
  };
  // How you feel: { diff, state: 'helado' | 'frio' | 'bien' | 'calor' | 'muchoCalor' }.
  L.bodyTemp = function (g) {
    var C = D(), diff = L.warmth(g) - L.warmNeed(g);
    var state = diff < C.freezing ? 'helado' : diff < C.cold ? 'frio' : diff > C.veryHot ? 'muchoCalor' : diff > C.hot ? 'calor' : 'bien';
    return { diff: diff, state: state };
  };
  L.warmText = { helado: 'Helado: perdés vida. Abrigate o metete bajo techo.', frio: 'Tenés frío: te da más hambre.', bien: '',
    calor: 'Tenés calor: te da más sed y el aire vuelve más lento.', muchoCalor: 'Mucho calor: sacate algo de ropa.' };
  // What the warmth changes (1 none): 'hunger', 'thirst', 'air'.
  L.tempMul = function (g, key) {
    var p = g.player, C = D(), s = p.clothes ? p.warmState : 'bien';
    if (key === 'hunger') return s === 'frio' || s === 'helado' ? C.coldHunger : 1;
    if (key === 'thirst') return s === 'calor' ? C.hotThirst : s === 'muchoCalor' ? C.veryThirst : 1;
    if (key === 'air') return s === 'calor' ? C.hotAir : s === 'muchoCalor' ? C.veryAir : 1;
    return 1;
  };

  // Every frame: the rain soaks you outdoors and the clothes dry; how warm you are; the freezing cold hurts.
  L.updateClothes = function (g, dt, gdt) {
    var p = g.player, C = D();
    if (!p.clothes) return;
    var hours = gdt / L.data.clock.hour, rain = L.wx ? L.wx(g, 'rain') : 0, under = inside(g), cl = p.clothes;
    var soak = function (sl, through) {
      if (!sl) return;
      if (rain > 0.05 && !under) sl.wet = Math.min(1, (sl.wet || 0) + C.wetPerHour * rain * through * hours);
      else sl.wet = Math.max(0, (sl.wet || 0) - (under ? C.dryIn : C.dryOut) * hours);
    };
    var keep = function (sl) { return sl ? L.clothDef(sl.id).water : 0; };
    // The outer things get the rain; what is under them only what they let through.
    ['cabeza', 'abrigo', 'calzado', 'manos', 'piernas'].forEach(function (s) { if (cl[s]) soak(cl[s], 1 - keep(cl[s])); });
    soak(cl.torso, cl.abrigo ? 1 - keep(cl.abrigo) : 1);
    soak(cl.medias, cl.calzado ? 1 - keep(cl.calzado) : 1);
    var was = p.warmState, now = L.bodyTemp(g).state;
    p.warmState = now;
    if (now !== was && now !== 'bien') L.toast(g, L.warmText[now], now === 'helado' || now === 'frio' ? '#8fb3d9' : '#e0a060');
    if (now === 'helado' && !(g.respawn > 0)) p.hp -= C.freezeHp * hours;
  };

  // ---- Protection ----
  // A zombie's blow that would leave a wound of `kind` (k cut, p puncture, c blow): where it lands, and whether what
  // you wear there stops it. A stopped blow wears the garments it hit. Returns true if it was stopped.
  L.clothesStop = function (g, kind) {
    var p = g.player, C = D();
    if (!p.clothes) return false;
    var r = g.rng(), part = null;
    for (var k in C.parts) { r -= C.parts[k].hit; if (r < 0) { part = C.parts[k]; break; } }
    if (!part) part = C.parts.torso;
    var on = part.by.map(function (s) { return p.clothes[s]; }).filter(function (sl) {
      return sl && sl.dur > 0 && (!part.sleeves || L.clothDef(sl.id).sleeves);
    });
    if (!on.length) return false;
    var through = 1;
    on.forEach(function (sl) { var c = L.clothDef(sl.id); through *= 1 - (kind === 'p' ? c.bite : kind === 'k' ? c.scratch : c.scratch * 0.5); });
    if (g.rng() >= 1 - through) return false;
    on.forEach(function (sl) {
      sl.dur = Math.max(0, sl.dur - 1);
      if (sl.dur === 0) L.toast(g, 'Se rompió: ' + L.clothDef(sl.id).name.toLowerCase() + '.', '#8d8672');
    });
    L.emit(g, 'clothStop', p.x, p.y);
    return true;
  };
})(this.Lluvia = this.Lluvia || {});
