// Health (js/health.js), as the user asked after playing (2026-11-25, docs/CUERPO.md section 5): wounds by the
// kind of damage, the life cap they take away, bleeding, first aid kits, bandages, disinfectant, infection with its
// antibiotic course, paracetamol, and recovering by resting. Hours are hours of the game's clock.
(function (L) {
  'use strict';
  L.data = L.data || {};
  L.data.health = {
    // A wound every `every` points of damage a zombie does to you; what kind, by the zombie's mix (a scratch is
    // cortante, a bite punzante, a blow contundente; my call for the zombie of now).
    every: 6,
    zombieMix: { k: 0.45, p: 0.25, c: 0.3 },
    // Each kind of wound: how much of the life cap it takes at once (`cap`, a share of the full life), whether it
    // bleeds and may get infected, and how much it slows you (`slow`, contundente only, until paracetamol).
    kinds: {
      k: { name: 'Corte', cap: 0.05, bleed: true, infect: 0.22 },
      p: { name: 'Herida punzante', cap: 0.06, bleed: true, infect: 0.3 },
      c: { name: 'Golpe', cap: 0.04, bleed: false, infect: 0, slow: 0.08 }
    },
    maxSlow: 0.4,          // the most the blows together slow you down
    minCap: 0.25,          // the life cap never goes under this share (a floor so you can always come back)
    bleed: 0.03,           // life cap lost per hour by each wound bleeding without a bandage
    // Infection: it shows up `incub` hours after the wound. What changes the chance (it multiplies):
    //   disinfected (alcohol or sanitizer on it before bandaging), the bandage it got, nothing at all, and your
    //   defenses (rested, fed and healthy: the user's "100%").
    incub: 4,
    infectMul: { disinfected: 0.2, kit: 0.5, venda: 1.6, trapo: 2.6, none: 1.4, defenses: 0.5 },
    // Untreated infection: after `fever` hours, fever: the energy goes down `feverEnergy` times faster, the life
    // cap `feverCap` per hour, and a faint now and then (`feverFaint` a second). With full defenses, each hour it may
    // go away by itself (`selfCure`).
    fever: 24, feverEnergy: 2.5, feverCap: 0.015, feverFaint: 0.002, selfCure: 0.04,
    // The antibiotic: `doses` doses, one every `every` hours, each with water. At each dose it may be gone early
    // (`early`); at the end it may resist (`resist`) and need `more` doses more. The first dose you take yourself;
    // the rest by themselves if you have water and pills, asleep too.
    antibiotic: { doses: 4, every: 8, early: 0.15, resist: 0.15, more: 2, retry: 1 },
    // First aid kits: they stop the bleeding and freeze the life cap for `hours`; they heal a little life.
    kits: { kitCasero: { hours: 24, heal: 15 }, kitFarmacia: { hours: 36, heal: 25 } },
    // A bandage or a rag alone: stops one wound's bleeding at once (and heals `heal` life), the infection risk up.
    bandage: { vendas: 'venda', curitas: 'venda', trapos: 'trapo' }, heal: 12,
    disinfect: ['alcohol', 'sanitizante'],
    // Paracetamol: takes away the slowness of the blows; it counts for recovering for `hours`.
    paracetamol: { hours: 24 },
    // Recovering (no infection, nothing bleeding, paracetamol, fed and watered): each hour asleep gives back
    // 1/`sleep` of the life cap lost (the user: "dormir 1 día completo").
    sleep: 24,
    // The botiquín (in pharmacies): opening it gives this.
    botiquin: { kitFarmacia: 4, antibiotico: 16, paracetamol: 16 },
    // Defenses at 100%: energy, food and water on time, and the life cap whole.
    defenses: { energy: 0.9 }
  };
})(this.Lluvia = this.Lluvia || {});
