# El mapa de San Miguel

Pedido del usuario (2026-11-24): "el mapa tiene que ser una copia lo más similar que se pueda a mi ciudad;
edificios y casas a los que se pueda subir, con escaleras, terrazas, techos y sótanos; si se puede, altura en el
terreno. Centrémonos en armar el mapa; después lo pasamos al juego."

Este documento dice de dónde salen los datos, qué tiene hoy el mapa y cómo se van a armar los pisos, las escaleras
y los sótanos. El mapa se mira en el **visor**: `mapa/index.html`, aparte del juego.

## De dónde salen los datos
| Qué | Fuente | Qué aporta en San Miguel |
|---|---|---|
| Borde del partido | OpenStreetMap (relación 2430369, "Partido de San Miguel") | 83 km², unos 15,6 × 11,5 km. Recorta todo lo demás y es el límite del juego |
| Calles, plazas, parques | OpenStreetMap | 4510 calles con su nombre y tipo, 314 plazas y parques |
| Contornos de edificios | Overture Maps (junta OpenStreetMap con los contornos que Google y Microsoft sacaron de fotos satelitales) | **118.532 edificios reales**: 61.981 de Google, 53.702 de Microsoft y 2.849 de OpenStreetMap |
| Lugares con nombre | Overture Maps (places) | 3.751 negocios, escuelas, iglesias, consultorios...; 1.268 caen dentro de su edificio y le dan el tipo |
| Uso del suelo, agua, tren | Overture Maps | 227 zonas, 67 cursos de agua, las vías |
| Altura del terreno | SRTM de la NASA (30 m), bajado con OpenTopoData | una grilla cada 60 m (265 × 197 puntos): el partido va de **0 a 43 m** sobre el mar; lo más bajo, hacia el río Reconquista |
| Pisos y techos | OpenStreetMap, donde están cargados | solo 51 edificios tienen la cantidad de pisos |

Los datos crudos se bajan con los programas de `tools/fetch/` y quedan en `tools/raw/` (no se suben a GitHub:
pesan 30 MB y se pueden volver a bajar). `node tools/bake-map.js` los junta en `data/map-sanmiguel.js` (3,8 MB).

Licencias: OpenStreetMap y Overture (ODbL), Google Open Buildings (CC BY 4.0), Microsoft (ODbL), SRTM (dominio
público). Hay que nombrarlos donde se muestre el mapa, y así se hace en el visor y en el README.

## Qué tiene cada edificio
- **Contorno real** (simplificado a 35 cm).
- **Tipo:** casa, galpón, negocio, edificio de departamentos, escuela, iglesia, salud, estación, industria,
  garage, oficina o público. Sale del dato de OpenStreetMap, del lugar que tiene adentro o, si no hay nada, del
  tamaño. Por ejemplo, menos de 30 m² es un galpón del fondo.
- **Pisos:** el dato real si lo hay; si no, estimado y marcado así.
  - Casas: 1 piso el 62% de las veces, si no 2.
  - Escuelas, oficinas y salud: 2 o 3 pisos.
  - En el centro (a menos de 550 m de la plaza), algunos lotes medianos son edificios de 3 a 9 pisos.
- **Techo:**
  - *terraza*: losa plana, se puede subir;
  - *tejas*: inclinado, no se camina;
  - *chapa*: galpones e industrias.
  - Las casas tienen terraza el 62% de las veces.
- **Sótano:** la mitad de los edificios de departamentos, uno de cada cuatro negocios del centro, y pocas casas.

## Cómo se van a armar los pisos (en el juego)
La idea es como Project Zomboid y el SAS: el mapa tiene **niveles** y se ve uno por vez desde arriba.
- **Nivel -1, sótano:** solo en los edificios que tienen. Se baja por una escalera.
- **Nivel 0, planta baja:** la calle, los patios y el interior de cada edificio.
- **Niveles 1, 2...:** los pisos de arriba.
- **Techo:** las terrazas se caminan; desde ahí se ve lejos y se dispara desde arriba. Los techos de tejas y de
  chapa no se caminan.
- **Interiores:** se generan del contorno de cada edificio, siempre iguales para el mismo edificio.
  - Puerta del lado de la calle, habitaciones, pasillo.
  - Escalera en un rincón, una por edificio con más de un nivel, que llega al sótano y a la terraza.
  - Los departamentos tienen un palier con escalera, y ascensor que no anda.
- **Al entrar a un edificio**, el techo se vuelve transparente y se ve el piso donde estás, como en el SAS. Al
  subir o bajar la escalera se cambia de nivel.
- **Terreno:** la altura cambia el color del piso (más claro arriba, sombreado en las pendientes) y las curvas de
  nivel. San Miguel es bastante plano (43 m de diferencia en 15 km), así que el terreno es más ambiente que
  obstáculo; las barrancas hacia el arroyo se notan.

## Qué se puede mejorar con más datos
- **Alturas reales de cada edificio:** Google Open Buildings 2.5D (2016-2023) estima la altura de cada techo con
  un error de unos 1,5 m, y cubre Argentina. Se baja desde Google Earth Engine (pide cuenta de Google) o en
  archivos por zona. Con eso, los pisos dejan de ser estimados.
- **Terreno más fino:** el IGN tiene un modelo de 5 m en algunas zonas y el MDE-Ar de 30 m en todo el país.
- **Lotes reales:** el catastro de ARBA tiene las parcelas, pero no encontramos una descarga abierta.
- **Árboles reales y veredas:** OpenStreetMap tiene pocos en San Miguel; hoy se generan.

## Pasos
1. *(hecho)* Bajar y juntar los datos; el visor para mirarlos (`mapa/`).
2. **Revisar con el usuario:** recorrer el visor y marcar qué no coincide con la ciudad real (un edificio que
   falta, un tipo equivocado, una calle mal).
3. Generar los interiores, escaleras, terrazas y sótanos de cada edificio, y verlos en el visor piso por piso.
   *(casi hecho, en el juego)*: las casas tienen su planta, generada de su contorno con cinco maneras de repartir
   los cuartos, escalera y piso de arriba si son de dos pisos, terraza y sótano donde el mapa dice. Los edificios de
   departamentos tienen palier con escalera en "U", departamentos en cada piso, hall, terraza y sótano
   (`js/interiors.js`). También se entra a galpones, garages, negocios, fábricas, iglesias, escuelas, salas de salud,
   oficinas y edificios públicos; solo las estaciones siguen macizas. Falta verlos en el visor.
4. Pasar el mapa al juego. *(hecho)*: el juego usa el mapa real y se dibuja igual que en el visor; se entra a las
   casas y a los edificios, y se sube y se baja caminando por las escaleras, piso por piso.
5. Alturas reales con Google Open Buildings 2.5D.
6. *(hecho)* **Agrandar el mapa y recortarlo a San Miguel** (pedido del usuario, 2026-11-24). El usuario eligió
   el partido entero, no solo la ciudad (8,3 km², que ya entraba en el cuadrado viejo).

## El área y el borde
- El área es el rectángulo de `tools/fetch/area.json`: el partido más 150 m de margen, unos 15,9 × 11,8 km.
  Todos los programas de descarga y `tools/bake-map.js` la leen de ahí (`tools/fetch/frame.js` la pasa a
  metros, con el (0, 0) en la esquina noroeste).
- Se guarda lo que está adentro del partido o a menos de 60 m de su borde (para que se dibuje un poco del otro
  lado). El borde va en el mapa (`border`).
- En el juego, adentro del borde se camina (menos los edificios y los autos) y afuera no; lo de afuera se dibuja
  oscuro. Lo que no se puede alcanzar desde la plaza también queda como pared.
- Para rehacer todo desde cero (pide internet; DuckDB va en un entorno de Python aparte):
  `python tools/fetch/overture-buildings.py`, `python tools/fetch/overture-extra.py`,
  `node tools/fetch/osm.js` (borde, calles y edificios de OpenStreetMap), `node tools/fetch/terrain.js` (unos
  25 minutos: 523 pedidos) y al final `node tools/bake-map.js`.
