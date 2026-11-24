# El mapa de San Miguel

Pedido del usuario (2026-11-24): "el mapa tiene que ser una copia lo más similar que se pueda a mi ciudad;
edificios y casas a los que se pueda subir, con escaleras, terrazas, techos y sótanos; si se puede, altura en el
terreno. Centrémonos en armar el mapa; después lo pasamos al juego."

Este documento dice de dónde salen los datos, qué tiene hoy el mapa y cómo se van a armar los pisos, las escaleras
y los sótanos. El mapa se mira en el **visor**: `mapa/index.html`, aparte del juego.

## De dónde salen los datos
| Qué | Fuente | Qué aporta en San Miguel |
|---|---|---|
| Calles, plazas, parques | OpenStreetMap | 1842 calles con su nombre y tipo, 169 plazas y parques |
| Contornos de edificios | Overture Maps (junta OpenStreetMap con los contornos que Google y Microsoft sacaron de fotos satelitales) | **54.745 edificios reales**: 30.769 de Google, 22.434 de Microsoft y 1.547 de OpenStreetMap. Antes teníamos 1.702 |
| Lugares con nombre | Overture Maps (places) | 2.642 negocios, escuelas, iglesias, consultorios...; 887 caen dentro de su edificio y le dan el tipo |
| Uso del suelo, agua, tren | Overture Maps | 227 zonas, 67 cursos de agua, las vías |
| Altura del terreno | SRTM de la NASA (30 m), bajado con OpenTopoData | una grilla cada 60 m: San Miguel va de **18 a 41 m** sobre el mar |
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
  nivel. San Miguel es bastante plano (23 m de diferencia en 4,75 km), así que el terreno es más ambiente que
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
4. Pasar el mapa al juego. *(hecho, la planta baja)*: el juego usa el mapa real, los edificios son paredes y se
   dibuja igual que en el visor. Falta: niveles, escaleras y entrar a los edificios (después del paso 3).
5. Alturas reales con Google Open Buildings 2.5D.
6. **Agrandar el mapa y recortarlo a San Miguel** (pedido del usuario, 2026-11-24): hoy es un cuadrado de 4,75 km
   que toma parte de San Miguel y parte de los partidos vecinos, de manera dispar. Bajar el límite del partido
   de OpenStreetMap, agrandar el área hasta cubrirlo entero, dejar afuera lo que no es San Miguel y hacer de ese
   borde el límite del juego.
