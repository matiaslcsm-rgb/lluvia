// Clothes (js/clothes.js), as the user asked (2026-11-25, answer 3): "como el Project Zomboid podés equiparte
// prendas de ropa, medias, zapatos, guantes, remeras, camisas, etc.; cada prenda te da protección y te da calor".
// Spec in docs/CUERPO.md, section 7.
//   slots: where each garment goes on your body (one per place)
//   parts: where a zombie's blow lands (`hit`: how likely) and which places cover it
//   warm: how much it warms you   scratch: how likely it stops a cut (k) or a blow (c, half of it)
//   bite: how likely it stops a puncture/bite (p)   water: how much rain it keeps out (0-1)
//   dur: how many stopped blows it takes before it is torn (torn: no protection, half the warmth)
//   big: only fits in a bag that takes big things   sleeves: it covers your arms
(function (L) {
  'use strict';
  L.data = L.data || {};
  L.data.clothes = {
    slots: ['cabeza', 'torso', 'abrigo', 'manos', 'piernas', 'medias', 'calzado'],
    colors: { cabeza: '#7a6a9a', torso: '#c9c2b0', abrigo: '#6a5a4a', manos: '#8a6a4a', piernas: '#4a5a7a', medias: '#b8b0a0', calzado: '#3a3430' }, // how they look on the floor
    slotNames: { cabeza: 'Cabeza', torso: 'Torso', abrigo: 'Abrigo', manos: 'Manos', piernas: 'Piernas', medias: 'Medias', calzado: 'Calzado' },
    parts: {
      cabeza: { hit: 0.1, by: ['cabeza'] },
      torso: { hit: 0.3, by: ['torso', 'abrigo'] },
      brazos: { hit: 0.2, by: ['torso', 'abrigo'], sleeves: true },
      manos: { hit: 0.15, by: ['manos'] },
      piernas: { hit: 0.2, by: ['piernas'] },
      pies: { hit: 0.05, by: ['medias', 'calzado'] }
    },
    start: ['remera', 'jean', 'medias', 'zapatillas'], // what you wake up wearing on the first day (my call)
    kinds: {
      gorro: { name: 'Gorro de lana', slot: 'cabeza', warm: 1.2, scratch: 0.1, bite: 0, water: 0.1, dur: 6, kg: 0.1 },
      gorra: { name: 'Gorra', slot: 'cabeza', warm: 0.3, scratch: 0.05, bite: 0, water: 0.3, dur: 6, kg: 0.1 },
      casco: { name: 'Casco de moto', slot: 'cabeza', warm: 0.6, scratch: 0.8, bite: 0.7, water: 0.9, dur: 30, kg: 1.3, big: true },
      remera: { name: 'Remera', slot: 'torso', warm: 0.5, scratch: 0.05, bite: 0, water: 0, dur: 4, kg: 0.15 },
      camisa: { name: 'Camisa', slot: 'torso', warm: 0.8, scratch: 0.1, bite: 0.02, water: 0, dur: 5, kg: 0.2, sleeves: true },
      termica: { name: 'Camiseta térmica', slot: 'torso', warm: 1.6, scratch: 0.05, bite: 0, water: 0, dur: 5, kg: 0.2, sleeves: true },
      buzo: { name: 'Buzo', slot: 'abrigo', warm: 2, scratch: 0.2, bite: 0.05, water: 0.1, dur: 8, kg: 0.5, sleeves: true },
      camperaJean: { name: 'Campera de jean', slot: 'abrigo', warm: 1.4, scratch: 0.35, bite: 0.1, water: 0.2, dur: 14, kg: 0.8, sleeves: true },
      camperaCuero: { name: 'Campera de cuero', slot: 'abrigo', warm: 2, scratch: 0.6, bite: 0.3, water: 0.6, dur: 24, kg: 1.4, sleeves: true, big: true },
      piloto: { name: 'Piloto de lluvia', slot: 'abrigo', warm: 0.8, scratch: 0.15, bite: 0.03, water: 0.95, dur: 8, kg: 0.5, sleeves: true },
      camperon: { name: 'Camperón', slot: 'abrigo', warm: 4, scratch: 0.3, bite: 0.1, water: 0.5, dur: 12, kg: 1.2, sleeves: true, big: true },
      guantesLana: { name: 'Guantes de lana', slot: 'manos', warm: 0.8, scratch: 0.15, bite: 0.02, water: 0, dur: 5, kg: 0.1 },
      guantesTrabajo: { name: 'Guantes de trabajo', slot: 'manos', warm: 0.4, scratch: 0.45, bite: 0.15, water: 0.2, dur: 12, kg: 0.2 },
      guantesCuero: { name: 'Guantes de cuero', slot: 'manos', warm: 0.6, scratch: 0.55, bite: 0.25, water: 0.5, dur: 16, kg: 0.2 },
      jean: { name: 'Jean', slot: 'piernas', warm: 0.8, scratch: 0.3, bite: 0.1, water: 0.1, dur: 12, kg: 0.7 },
      jogging: { name: 'Jogging', slot: 'piernas', warm: 1, scratch: 0.1, bite: 0.02, water: 0, dur: 6, kg: 0.4 },
      short: { name: 'Short', slot: 'piernas', warm: 0.1, scratch: 0, bite: 0, water: 0, dur: 3, kg: 0.15 },
      pantalonTrabajo: { name: 'Pantalón de trabajo', slot: 'piernas', warm: 1, scratch: 0.45, bite: 0.15, water: 0.3, dur: 16, kg: 0.9 },
      medias: { name: 'Medias', slot: 'medias', warm: 0.4, scratch: 0.02, bite: 0, water: 0, dur: 4, kg: 0.05 },
      mediasLana: { name: 'Medias de lana', slot: 'medias', warm: 1, scratch: 0.05, bite: 0, water: 0, dur: 5, kg: 0.1 },
      ojotas: { name: 'Ojotas', slot: 'calzado', warm: 0, scratch: 0, bite: 0, water: 0, dur: 4, kg: 0.2 },
      zapatillas: { name: 'Zapatillas', slot: 'calzado', warm: 0.3, scratch: 0.15, bite: 0.05, water: 0.2, dur: 10, kg: 0.6 },
      zapatos: { name: 'Zapatos', slot: 'calzado', warm: 0.3, scratch: 0.2, bite: 0.1, water: 0.4, dur: 12, kg: 0.7 },
      botas: { name: 'Botas', slot: 'calzado', warm: 0.8, scratch: 0.5, bite: 0.3, water: 0.8, dur: 20, kg: 1.2, big: true }
    },
    // How warm you need to be (the sum of what you wear, wet counts less): by season, plus the night, the weather;
    // inside a house, less.
    need: {
      season: { verano: 0.5, primavera: 2, otono: 3, invierno: 5 },
      night: 1.5,                                  // when the light is low
      weather: { frio: 3, calor: -2, lluvia: 0.5, tormenta: 1 },
      inside: -1.5
    },
    // What you wear minus what you need: under `cold` you are cold (hunger `coldHunger` times faster), under
    // `freezing` you lose `freezeHp` life per hour; over `hot` you are hot (thirst `hotThirst` times faster, air
    // `hotAir`), over `veryHot` more (`veryThirst`, `veryAir`).
    cold: -1.5, freezing: -4, coldHunger: 1.3, freezeHp: 4,
    hot: 2.5, veryHot: 5, hotThirst: 1.4, hotAir: 0.85, veryThirst: 2, veryAir: 0.65,
    // Rain: a garment soaks `wetPerHour` per hour of full rain (times what it doesn't keep out); it dries `dryOut` per
    // hour without rain and `dryIn` under a roof. Soaked, it warms `wetWarm` of what it did.
    wetPerHour: 1.5, dryOut: 0.25, dryIn: 0.5, wetWarm: 0.3
  };
})(this.Lluvia = this.Lluvia || {});
