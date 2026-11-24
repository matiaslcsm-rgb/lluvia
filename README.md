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

## Datos del mapa
Calles, plazas y edificios: © colaboradores de [OpenStreetMap](https://www.openstreetmap.org/copyright),
disponibles bajo la licencia ODbL.
