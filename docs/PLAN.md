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
- **2026-11-20 (decisión del usuario):** un duelo cada **2 minutos** en vez de 3, para acortar la partida (con las
  ultis y las fusiones duraba 40-50 minutos). Con eso, en 4 partidas simuladas dura 30-41 minutos: todavía más que
  los 20-25 del diseño; el resto se ajusta en la etapa 7.

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

### Segunda temporada (hoja de ruta como diseñador)
La 1.0 ya se juega entera. Lo que sigue, en orden de lo que más suma a la diversión por esfuerzo:

9. **Mundo y bienvenida:** lore de Aguaverde (`docs/LORE.md`), pantalla de inicio con la historia, cómo se juega,
   y un tutorial de consejos que aparecen solos la primera vez que pasa cada cosa. *(hecho, ver abajo)*
10. **Horda con personalidad:** Escupelodo (dispara), Charco madre (se divide), Tronador (kamikaze), élites
    doradas y eventos de tormenta cada minuto. *(hecho, ver abajo)*
11. **Progresión entre partidas — el Cuaderno del Paraguas:** logros que desbloquean personajes, ítems y Leyes del
    Cielo nuevas (por ejemplo: "ganá un Juicio con Vampiros" desbloquea un ítem). Es lo que hace que quieras jugar
    "una más". Guarda en el navegador. *(hecho como mejoras permanentes + logros; los desbloqueos de contenido
    quedan para más adelante)*
12. **Jefes distintos:** uno por tramo de la partida (el Coloso; una Reina del Granizo que dispara en abanico; un
    Leviatán del desagüe que sale del piso). Cada uno con un patrón que se aprende.
13. **Más Leyes del Cielo:** solo cuerpo a cuerpo, Anegados en el Juicio, niebla (se ve poco), viento (te empuja).
14. **Personajes 6 a 8**, con ulti propia cada uno, y 4-6 ítems más que abran builds nuevas (por ejemplo, ítems
    que premien quedarse quieto o moverse sin parar).
15. **Partida diaria:** misma semilla para todos ese día y un récord para batir.
16. **Pulido:** menú de opciones (volumen, tamaño de letra), joystick, pantallas chicas.
17. **Online contra personas** (grande: necesita un servidor).

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
- **2026-11-20: etapa 5.** Apuestas: 15 segundos antes de cada duelo, con Q y E, hasta el 50% del oro, pozo común
  repartido entre los que acertaron y una apuesta gratis que pone la casa. Si uno de los dos queda afuera antes
  del duelo, se devuelve todo. La IA apuesta al que se ve más fuerte. Panel en pantalla con el pozo y cuánto paga
  cada lado, y aviso de lo que cobraste o perdiste. 64 pruebas.
  - Partidas simuladas (3): siguen terminando con ganador, ahora entre los 8 y los 31 minutos. El oro de las
    apuestas cambia quién crece, así que el largo de la partida varía más. Se mide bien con el banco (etapa 7).
- **2026-11-20: etapa 6.** Contenido:
  - **Ultis:** una por personaje, con Espacio hacia el mouse (también en los duelos). Lluvia de fuego (meteoros),
    Terremoto (aturde), Corte (salto que corta), Haz (línea larguísima) y Raíces (atrapa y cura). Arrancan a media
    carga. La IA las usa cuando la rodean o cuando tiene al rival a tiro en un duelo.
  - **Fusiones:** habilidad al nivel 5 + su ítem = una opción de fusión que siempre aparece al subir de nivel y
    reemplaza a la habilidad por una versión mucho más fuerte. Hay 8, una por habilidad.
  - **Nuevo:** 2 personajes (Ceniza y Musgo), 2 habilidades (Escarcha, que deja lentos, y Meteoro) y 4 ítems
    (Lupa, Escudo, Trébol y Fénix). Los enemigos ahora pueden quedar aturdidos o lentos.
  - 80 pruebas.
  - **Lo que cambió en las partidas simuladas:** casi nadie cae en la horda, así que las partidas pasaron a durar
    40-50 minutos. Quedó como decisión abierta (arriba).
- **2026-11-20: etapa 7.** El banco: `node tools/bench.js [partidas] [--set ruta=valor ...]` juega partidas
  enteras con 8 bots en paralelo (usa todos los núcleos) y resume el largo de la partida, cuántas vidas se pierden
  por minuto en la horda y en duelos, cómo le va a cada personaje, los duelos y los ganadores. Con `--set` se
  prueba un número sin tocar los archivos (por ejemplo `--set duels.every=100`).
  - **Cómo estaba (22 partidas):** la partida duraba 41 minutos de mediana. La horda sacaba unas 5 vidas por
    partida en los primeros 10 minutos y después casi ninguna: los que pasaban el minuto 10 ya no caían, y
    decidían solo los duelos.
  - **Arreglo de un error:** si alguien estaba caído esperando volver justo cuando quedaban dos, la partida se
    trababa para siempre (en la recta final no hay horda, y el tiempo de espera corre en la horda). Ahora en la
    final se puede pelear aunque estés caído. Tiene su prueba.
  - **Lo que se cambió, midiendo cada paso:**
    - La vida de los enemigos crece ×1,28 por minuto (era ×1,22), y desde el minuto 10 además ×1,4 por minuto: a
      los que se vuelven imparables la horda los termina alcanzando.
    - El daño de los enemigos crece +30% por minuto (era +15%).
    - El Cazador llega en el minuto 7 (era el 5): era buena parte del muro del minuto 5.
    - Personajes: Brasa (105) y Filo (100) con más vida y Lluvia de fuego pega más; Haz pega menos (era el
      más fuerte); Musgo se cura un poco más rápido.
  - **Cómo quedó (33 partidas):** la partida dura **23 minutos de mediana**, y el 80% entre 21 y 26: lo del
    diseño. La horda saca vidas a lo largo de toda la partida (antes, solo entre los minutos 5 y 10). Los duelos
    duran 21 segundos de promedio y solo el 5% llega a los 60.
  - **Personajes (otras 33 partidas, con los números finales):** cada uno gana entre el 9% y el 16% de las veces
    que lo juegan (lo justo es 12,5%) y el puesto promedio va de 4,0 a 5,0. Con 33 partidas, diferencias de unos
    pocos puntos son ruido; para afinar más hacen falta corridas más largas (100 partidas tardan media hora).
  - Sigue habiendo más vidas perdidas entre los minutos 5 y 10 que en el resto (unas 5 por partida), pero ya no es
    un muro: es cuando la horda se pone seria por primera vez.
- **2026-11-20 (pedido del usuario):** seguir solo, como diseñador, hasta gastar el límite de la semana: lore,
  tutorial, más variedad de enemigos, mejor escalado y un loop divertido, gastando pocas pruebas.
- **2026-11-20: etapa 8, arte y sonido.** Todo dibujado con código, sin archivos de imagen ni de audio:
  - Cada Paraguas tiene su silueta (Brasa con llamas, Roca de piedra, Filo con capa, Ceniza con capucha y aura,
    Musgo con hojas), mira hacia donde camina y tiene sombra.
  - Cada criatura tiene su forma (gotas con ojos que te miran, triángulos, flechas, bloques, el Coloso con púas) y
    cambia de color si está quemada, lenta o golpeada. Las élites brillan doradas.
  - Piso inundado con baldosas y charcos que hacen ondas, lluvia cayendo sobre la pantalla (más fuerte durante la
    Marea), cofres con tapa y brillo, cristales que flotan, proyectiles con estela.
  - Partículas al matar, al subir de nivel y al abrir cofres, textos flotantes, y la pantalla tiembla con las
    ultis, al perder una vida y al bajar un Coloso.
  - Sonido sintetizado con el navegador: disparos, bajas, cristales, nivel, cofres (uno especial para legendarios),
    ulti, explosiones, jefe, Juicio, apuestas, victoria y derrota, y una lluvia suave de fondo. **M** silencia.
  - El motor avisa lo que pasa (L.emit) solo en la arena que mirás; las de los rivales no gastan en eso.
- **2026-11-20: etapa 9, mundo y bienvenida.** `docs/LORE.md` cuenta Aguaverde, los Paraguas, la Torre del Trueno
  y los Anegados. Pantalla de inicio con la frase del juego, una bio por personaje, "La historia" y "Cómo se juega".
  Pantalla final con una frase según ganes o pierdas.
  - **Tutorial:** 11 consejos que aparecen solos la primera vez que pasa cada cosa (moverte, cristales, primer
    cofre pagable, ulti lista, apuestas, tu primer Juicio, el Coloso, perder una vida, eventos, élites, la final).
    Cada uno sale una vez; se pueden volver a ver desde el inicio.
- **2026-11-20: etapa 10, horda con personalidad.**
  - Criaturas nuevas: **Escupelodo** (se queda lejos y escupe barro), **Charco madre** (se parte en tres Gotitas),
    **Tronador** (corre, prende la mecha y explota; si lo matás antes, explota sobre los suyos). Nombres nuevos
    según el lore para las de siempre.
  - **Élites** doradas desde el minuto 6: 6 veces más vida, más grandes, más daño, 5 veces más experiencia y oro, y
    1 de cada 4 deja un cofre gratis.
  - **Eventos de tormenta** cada minuto desde el 1:45, anunciados en pantalla: Cerco (te rodean), Estampida (una
    fila cruza), Tormenta eléctrica (Tronadores), Marea (el triple de Anegados 10 s) y Lluvia de lodo.
  - La IA también esquiva el barro.
  - **Arreglo de rendimiento:** al final de partidas largas, las cadenas de efectos de ítems se multiplicaban y el
    juego se trababa (en una partida simulada, 20 s por minuto de juego). Ahora hay un tope de 300 efectos por
    cuadro y por arena; los golpes siguen pegando igual.
- **2026-11-20: etapa 11, el Cuaderno del Paraguas** (progresión entre partidas). Cada partida da Monedas del Sol
  (por puesto, Juicios ganados y bajas). En el Cuaderno se gastan en 7 mejoras permanentes chicas (vida, daño,
  velocidad, imán, oro inicial, recarga, suerte en los cofres) que solo tenés vos. 12 logros con premio en monedas
  (ganar, podio, fusiones, Coloso, 1.000 bajas, legendario, apuestas, todos los personajes, ganar sin perder
  vidas...). Récords: partidas, victorias, mejor puesto, bajas. Se guarda en el navegador.
