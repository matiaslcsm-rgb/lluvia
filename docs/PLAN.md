# Plan del proyecto

La meta: un juego 2D para navegador que mezcla *Custom Hero Chaos*, *Vampire Survivors*, *Risk of Rain* y duelos con
apuestas. Cómo se juega está en `DISENO.md`. Las etapas van en orden; cada una cierra con algo que se puede
comprobar.

## Decisiones tomadas
- **2026-11-20 (decisión del usuario):** proyecto nuevo y aparte de `chaos`. Lo que sirva de ahí se reescribe acá.
- **2026-11-20 (decisión del usuario):** te movés y los ataques salen solos; la ulti la tirás vos.
- **2026-11-20 (decisión del usuario):** 2D visto desde arriba.
- **2026-11-20 (decisión del usuario):** el juego se llama **Lluvia**.
- **2026-11-20 (decisión del usuario):** van las recomendadas en las decisiones que quedaban:
  - 3 vidas por jugador.
  - Morir en la horda: perdés una vida y la mitad del oro.
  - Los ítems se apilan sin tope: cada copia suma, algunos con rendimiento decreciente.

## Decisiones abiertas
- Ninguna por ahora.

## Etapas
0. **Base:** página con el lienzo, el bucle del juego y el personaje que se mueve. *Se comprueba:* abrís
   `index.html` y te movés con WASD.
1. **Horda:** enemigos que vienen, ataque automático, experiencia, subir de nivel y elegir 1 de 3.
   *Se comprueba:* aguantás unos minutos y el personaje crece; 300 enemigos sin trabarse.
2. **Ítems y reloj:** oro, cofres, ítems apilables con efectos al pegar, reloj de dificultad y jefes.
3. **Ocho arenas:** los 7 rivales de la IA jugando su horda en paralelo (simulada), vidas y tabla de posiciones.
4. **Duelos:** emparejamiento, arena de duelo y las reglas locas.
5. **Apuestas:** ventana de apuestas, pozo común y apuesta gratis.
6. **Contenido:** ulti, fusiones, más personajes, habilidades e ítems.
7. **Banco de partidas simuladas:** muchas partidas solo con IA para ajustar números.
8. **Arte y sonido.**

## Hecho
- **2026-11-20:** carpeta creada con `CLAUDE.md`, `docs/DISENO.md` y este plan.
- **2026-11-20: etapas 0 y 1.** Se juega abriendo `index.html` (o con un servidor local). Hay 3 personajes (Brasa,
  Roca, Filo), 6 habilidades armadas con 5 piezas (proyectil, onda, órbita, aura, rayo), 6 pasivas, 3 enemigos,
  experiencia, niveles con elección de 1 de 3 y fin de partida. 14 pruebas (`node tests/run.js`), incluida la de
  300 enemigos: menos de 4 ms por cuadro.
  - Primera medición con un bot tonto que camina en círculos y siempre toma la primera opción: muere entre los
    2 y los 4 minutos. Roca aguanta más (unos 3:40) y **Filo queda floja** (a veces menos de 20 bajas en 2 minutos):
    sus cuchillas casi no tocan a los enemigos si te alejás. Se ajusta en la etapa 7 con el banco.
  - Morir por ahora termina la partida; las vidas llegan con la etapa 3.
- **2026-11-20: etapa 2.** Oro por baja, 6 cofres en la arena (se abren al tocarlos), 12 ítems que se apilan
  (stats, efectos al pegar y al matar, encadenables hasta 3 eslabones), reloj de dificultad por minuto, el jefe
  Coloso (2:30 y cada 3 minutos, deja un cofre gratis) y el Cazador, un enemigo rápido desde el minuto 5.
  30 pruebas, incluida la de 300 enemigos con 11 ítems encima: menos de 6 ms por cuadro.
  - Ajustes hechos midiendo con un bot que esquiva y compra cofres (18 partidas):
    - La Mecha explotaba por la vida del enemigo muerto, y con 3 copias una baja barría a toda la horda en cadena.
      Ahora explota por el golpe que lo mató.
    - Salían 200-380 ítems en 20 minutos. Con menos oro por baja y cofres que se encarecen más rápido, quedan
      unos 45.
    - La vida de los enemigos ahora se multiplica por escalón (antes sumaba), y el Cazador corre más que vos.
    - Filo arranca con 3 cuchillas en vez de 2.
  - **Lo que sigue mal (para la etapa 7):** las partidas salen de dos tipos. O el bot muere entre los 3 y los 6
    minutos (sobre todo cuando llegan el primer jefe y los cazadores), o arranca a crecer y no lo para nadie
    hasta el minuto 20. Filo sigue siendo la más floja (aguanta unos 4 minutos de promedio). Con las vidas y los
    duelos de las etapas 3 y 4 la partida ya no es "aguantar sola", así que se ajusta con el banco.
- **2026-11-20: etapa 3.** Partida de 8: vos y 7 rivales de la IA (Nube, Trueno, Granizo, Bruma, Rocío, Relámpago
  y Llovizna), cada uno jugando su propia arena completa con las mismas reglas y el mismo reloj. 3 vidas: morir
  cuesta una vida y la mitad del oro, volvés a los 5 segundos con 2 de invulnerabilidad y los enemigos de
  alrededor despejados. Tabla de posiciones en pantalla, avisos cuando un rival pierde una vida o queda afuera, y
  pantalla final con tu puesto. Mientras elegís una mejora, toda la partida espera.
  - La IA es un bot que esquiva, va a los cofres que puede pagar y elige mejoras. Cada rival tiene su nivel de
    habilidad (de 0,35 a 0,95). El mismo bot juega las partidas simuladas: `node tools/simulate.js`.
  - Para que 8 arenas no traben, las de los rivales avanzan de a 1/30 s en cuadros alternados, y las búsquedas de
    vecinos usan el radio del enemigo más grande que esté vivo. Con 250 enemigos en cada arena: menos de 8 ms por
    cuadro. 42 pruebas.
  - El Cazador quedaba más rápido que todos los personajes y barría a casi todos entre el 5:00 y el 5:40. Ahora
    es más lento (165) y sale la mitad de seguido.
  - **Lo que sigue mal (para la etapa 7):** igual hay un muro cerca del minuto 5: en 4 partidas simuladas, la
    mitad de los jugadores queda afuera entre el 5:00 y el 6:00. Los que pasan ese momento se vuelven imparables
    y en 3 de 4 partidas quedan 3 en pie a los 25 minutos. Los duelos de la etapa 4 van a ser los que definan la
    partida; recién con eso tiene sentido ajustar.
- **2026-11-20: etapa 4.** Duelos cada 3 minutos entre los dos que pelearon menos, en una arena aparte, con todo el
  kit y una de 6 reglas locas (gigantes, lava, velocidad, cristal, vampiros, rebote). Hasta 60 s; si nadie cae,
  gana el de más vida en porcentaje. El perdedor pierde una vida y el ganador cobra oro. El duelo tiene su propia
  vida, que crece con el reloj como la de los enemigos. Cuando quedan dos, se terminan las hordas y pelean duelos
  seguidos. Pantalla de duelo si peleás vos, y aviso con las barras de vida si pelean otros. 54 pruebas.
  - Cómo está hecho: cada luchador es una copia liviana de su jugador (mismas habilidades e ítems) con su propia
    posición y vida de duelo; el motor de habilidades corre una vez por lado, viendo al otro como único enemigo.
  - Partidas simuladas (4): **ahora todas terminan con ganador**, entre los 8 y los 20 minutos. Los duelos duran
    entre 15 y 40 segundos de promedio, y casi ninguno llega a los 60.
  - Sigue el muro del minuto 5 (la mitad cae ahí, en la horda) y la partida sale algo más corta que los 20-25
    minutos del diseño. Se ajusta en la etapa 7.
