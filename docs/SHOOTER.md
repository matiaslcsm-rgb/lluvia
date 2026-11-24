# San Miguel: un shooter en mi ciudad

Documento de la idea, escrito a partir de lo que pidió el usuario (2026-11-24). Las decisiones de cada día y lo que
ya está hecho siguen anotándose en `docs/PLAN.md`; este documento es el norte.

## La idea en una frase
Un shooter visto desde arriba, tipo **SAS: Zombie Assault**, que se juega en **las calles de verdad de San Miguel
(Buenos Aires)**, con todo **a escala**, y que va creciendo de a capas.

## Qué es lo primero (y no se negocia)
1. **El mapa es la ciudad completa.** Todo San Miguel, no un pedazo. Hoy entra un cuadrado de 4,75 km que cubre la
   ciudad de San Miguel según OpenStreetMap. (Si después se quiere el partido entero, con Bella Vista y Muñiz,
   también se puede: pesa más, pero el motor ya lo aguanta.)
2. **Prolijo.** Calles con su vereda y su cordón, esquinas limpias, avenidas que se distinguen. Nada de manchas
   raras ni de calles que se cortan sin motivo.
3. **Con edificios, como el SAS.** Las manzanas tienen que estar llenas: casas, negocios y edificios con su techo,
   sus paredes y su frente sobre la vereda; patios y jardines atrás. Donde OpenStreetMap tiene el edificio
   dibujado, va ese; donde no, el juego lo completa con casas creíbles.
4. **Todo a escala.** El personaje mide lo que mide una persona: una calle común entra 3 o 4 personajes de ancho,
   y en pantalla se ve una cuadra y media.

## Cómo se juega (hoy)
- **Un solo jugador.**
- **Zombis.** La gente mutó cuando el sol empezó a brillar amarillo.
- **Una sola arma: la Glock 17.**
  - Te movés con WASD, apuntás con el mouse, mantenés el clic para disparar y recargás con R.
  - Al subir de nivel mejorás la Glock o a tu personaje.
- **La horda crece de a poco**, a lo Risk of Rain: al principio hay pocos zombis, pero cada tanto aparece uno
  fuerte. Cada 5 minutos, más o menos, viene un jefe.
- **Arrancás en la plaza principal**, sobre la Avenida Ricardo Balbín.

## Las capas que vienen (en orden)
Cada capa se puede jugar al terminarla. Primero el mapa; las demás, en el orden que el usuario decida.

1. **Mapa prolijo y lleno de edificios** *(lo próximo)*
   - Veredas y cordones de ancho parejo, esquinas redondeadas, sendas peatonales en las avenidas.
   - Manzanas llenas: casas a lo largo de cada cuadra (frente de 8 a 12 m), con patios atrás que se pueden
     caminar. Los edificios de OpenStreetMap se respetan. Las casas son sólidas: los zombis rodean.
   - Techos de colores distintos, sombra y paredes con grosor, para que se lea como el SAS.
   - Árboles en las veredas, autos estacionados (cubren de las balas), rejas y paredones.
   - Plazas con caminos, bancos y canteros; la plaza principal bien reconocible.
   - Un minimapa en una esquina, con tu posición y el nombre de la calle donde estás.
2. **Entrar a los edificios**, como en el SAS: al cruzar la puerta se ve el interior desde arriba (habitaciones,
   muebles), y adentro hay cofres, armas y zombis.
3. **Más armas, a medida que se consiguen**: escopeta, subfusil, rifle, lanzallamas y granadas. Se encuentran o se
   compran en una armería.
4. **Lugares reales con historia**: la estación de San Miguel, la catedral, la municipalidad, los colegios. Cada
   uno con algo que contar, algo que encontrar o un jefe que lo cuida.
5. **Jefes por la ciudad**: cada barrio tiene el suyo, esperándote en su plaza o en su parque.
6. **Personajes**: los de antes (Brasa, Roca, Filo...) vuelven como supervivientes, cada uno con su estilo de
   juego.
7. **Desbloqueos a lo Risk of Rain**: desafíos que abren armas, personajes y mejoras para la próxima partida.
8. **Otros supervivientes** (más adelante): otras personas en la misma ciudad, para cooperar o competir.

## Lo que ya existe y se aprovecha
- **El motor:** la horda, los jefes con fases, los cofres con ítems, las pasivas, los santuarios, los encargos y el
  Cuaderno de progreso.
- **La ciudad:** las calles de San Miguel vienen adentro del juego (no hace falta internet) y los zombis te buscan
  por las calles, sin atravesar paredes.
- **El juego anterior** (la lluvia, 8 jugadores con duelos y apuestas) quedó guardado con la marca `lluvia-clasico`.

## Cómo se prueba
- En la PC: doble clic en `index.html`, o el link de claude.ai.
- El equipo de pruebas automáticas corre en cada cambio.
- `tools/solo.js` hace jugar a un bot para medir cuánto se aguanta. Los números se ajustan con eso y con lo que
  diga el usuario después de jugar.
