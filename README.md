# Lluvia — un shooter en San Miguel

Shooter visto desde arriba que se juega en las calles de verdad de **San Miguel (Buenos Aires)**, con todo a
escala. El sol empezó a brillar amarillo y la gente mutó. Estás solo, tenés una Glock y aguantás todo lo que
puedas.

## Cómo jugar
Abrí `index.html` en el navegador de la PC. No hace falta instalar nada ni tener internet.

- **WASD** o flechas: moverte
- **Mouse**: apuntar; **mantené el clic** para disparar
- **R**: recargar
- **Esc**: pausa

## Qué hay
- La ciudad de San Miguel completa: calles, plazas, parques y edificios reales, y casas, patios, autos y árboles
  que completan cada manzana.
- Zombis de distintos tipos y jefes que se enfurecen a mitad de vida.
- Cofres con ítems, mejoras al subir de nivel y un minimapa con el nombre de la calle donde estás.

La idea y las capas que vienen están en [`docs/SHOOTER.md`](docs/SHOOTER.md); el diario de trabajo, en
[`docs/PLAN.md`](docs/PLAN.md). El juego anterior (la lluvia, 8 jugadores con duelos y apuestas) quedó guardado en
la marca `lluvia-clasico`.

## Para desarrollar
- Pruebas: `node tests/run.js` (o `ONLY=texto node tests/run.js` para correr solo algunas).
- Cuánto aguanta un bot en el modo solo: `node tools/solo.js [partidas] [minutos]`.
- Hornear otra ciudad desde OpenStreetMap: `node tools/bake-city.js` (las instrucciones están en el archivo).

## El mapa
El visor del mapa está en `mapa/index.html` (en la web: `/lluvia/mapa/`). Sirve para recorrer San Miguel con sus
54.745 edificios, el terreno y los lugares, y para ver cada edificio piso por piso. Cómo se arma está en
[`docs/MAPA.md`](docs/MAPA.md).

## Datos del mapa
- Calles, plazas y edificios: © colaboradores de [OpenStreetMap](https://www.openstreetmap.org/copyright) (ODbL).
- Edificios, lugares, uso del suelo y agua: [Overture Maps Foundation](https://overturemaps.org) (ODbL). Los
  contornos vienen de Google Open Buildings (CC BY 4.0) y de Microsoft ML Building Footprints (ODbL).
- Altura del terreno: SRTM (NASA), a través de [OpenTopoData](https://www.opentopodata.org).
