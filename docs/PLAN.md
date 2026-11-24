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
    "una más". Guarda en el navegador. *(hecho: mejoras permanentes, logros y desbloqueos de contenido)*
12. **Jefes distintos:** uno por tramo de la partida (el Coloso; una Reina del Granizo que dispara en abanico; un
    Leviatán del desagüe que sale del piso). Cada uno con un patrón que se aprende.
13. **Más Leyes del Cielo:** solo cuerpo a cuerpo, Anegados en el Juicio, niebla (se ve poco), viento (te empuja).
    *(hecho)*
14. **Personajes 6 a 8**, con ulti propia cada uno, y 4-6 ítems más que abran builds nuevas (por ejemplo, ítems
    que premien quedarse quieto o moverse sin parar). *(hecho)*
15. **Partida diaria:** misma semilla para todos ese día y un récord para batir.
16. **Pulido:** menú de opciones (volumen, tamaño de letra), joystick, pantallas chicas. *(hecho)*
17. **Online contra personas** (grande: necesita un servidor).

### Tercera temporada
18. **Pronóstico del día:** cada partida trae un clima que cambia la horda para las 8 arenas por igual. *(hecho)*
19. **Rival:** el Paraguas que más duelos te ganó pasa a ser tu rival; ganarle en duelo paga el doble y tiene frase.
    *(hecho)*
20. **Maestría de personaje:** cada Paraguas sube de rango con las partidas y gana un título y un color. *(hecho)*

### Cuarta temporada
21. **Mercader errante:** aparece en tu barrio como los santuarios y te vende 1 de 3 ítems a elección. *(hecho)*
22. **Lluvia de oro:** una nube dorada cruza el barrio; quedarte debajo da oro, pero la horda la sigue. *(hecho)*
23. **Jefe del Juicio final:** en el duelo final, a mitad de la pelea entra un jefe que ataca a los dos. *(hecho)*

### Quinta temporada
24. **Encargos del barrio:** misiones cortas que aparecen solas (cazar, que no te toquen, abrir cofres), con premio
    si las cumplís y sin castigo si no. *(hecho)*
25. **Ajuste de Faro:** ganaba poco en tres bancos seguidos; se le dio una mano. *(hecho)*
26. **Aguante:** al ganar la final, seguir peleando contra tu horda con una sola vida, por récord personal. *(hecho)*

### Sexta temporada — el Torneo del Dios Loco
El usuario probó el juego (2026-11-23): faltan jefes y momentos divertidos, se vuelve repetitivo y el mundo de
lluvias y paraguas no le gusta. **(decisión)** Elegido: el mundo pasa a ser el *Torneo del Dios Loco* (un dios del
caos invoca héroes de otros reinos a su coliseo: monstruos de fantasía, jefes titanes, tono épico), y primero va la
jugabilidad. Lo nuevo ya se arma con nombres del mundo nuevo; lo viejo se cambia en el punto 31.
27. **Sumidero:** un bicho nuevo desde el minuto 9 que te chupa hacia él (y hacia la horda). *(hecho)*
28. **Minijefes:** entre jefe y jefe, cada 90 segundos, un campeón del Dios con un truco propio (embiste, invoca,
    golpea el piso). Deja un cofre. *(hecho)*
29. **Jefes con fases y jefes nuevos:** a mitad de vida cada jefe cambia (se enfurece, invoca, ataque nuevo), y se
    suman jefes titanes hasta llegar al Avatar del Dios Loco. *(hecho)*
30. **Momentos sorpresa:** el Duende del tesoro (escapa con tu oro; si lo bajás, llueven cofres), el Frenesí (30
    segundos de horda doble y botín doble) y los Caprichos del Dios (el Dios cambia las reglas un rato).
31. **El mundo nuevo:** historia, nombres de personajes, enemigos, jefes, textos, pantalla de inicio y arte.
32. **Racha de bajas** y **récords en el Cuaderno** (quedan para después).

### Séptima temporada — Sol Amarillo (rediseño)
El usuario replanteó el juego (2026-11-23): "mucho survivor, poco Risk of Rain", y le faltan cosas para
desbloquear. **(decisión)** Elegido, en vez del Dios Loco:
- **Lluvia se transforma** en este juego (no es un proyecto aparte). Se aprovechan los ítems, habilidades, ultis,
  jefes y el Cuaderno.
- **Mundo:** un día el sol empezó a brillar amarillo y todo se volvió loco: la gente mutó o enloqueció, y los
  objetos se volvieron raros.
- **Mapa:** elegís un punto en un mapa del mundo y jugás en las calles reales de esa zona (OpenStreetMap: calles,
  edificios, parques, plazas). Sin internet, una ciudad inventada.
- **Rivales:** los 7 de la IA pasan a ser **otros supervivientes** en la misma ciudad: te los cruzás, los podés
  desafiar a duelo o apostar, y compiten por los cofres.

Cómo se juega (estilo Risk of Rain):
- Mundo abierto: cofres, puntos con historia, mapas y cosas raras por la ciudad.
- Se puede entrar a los edificios (interiores simulados, no idénticos).
- Al principio hay pocos monstruos, pero uno solo puede ser muy fuerte o tener habilidades; las oleadas grandes
  tardan en llegar y las criaturas se hacen más fuertes con el tiempo.
- Jefes repartidos por la ciudad de forma procedural.
- Ítems, poderes y todo lo que ya existe, más muchos desbloqueos nuevos.

Más decisiones del usuario (2026-11-23):
- **Es para PC** (teclado y mouse).
- **En San Miguel, la ciudad entera** (unos 4,75 × 4,75 km), que viene adentro del juego y anda sin internet. El
  mapa del mundo para elegir otro lugar queda armado, pero fuera del menú.
- **Tipo SAS: Zombie Assault:** te movés con WASD y apuntás y disparás con el mouse. Hay armas (pistola,
  escopeta, ametralladora, lanzallamas...), recarga, granadas y armadura, que se compran o se mejoran.
  - **(decisión)** Elegido: armas + poderes. Las habilidades que pegan solas quedan como poderes que se suben de
    nivel, y los ítems de cofre siguen sumando.
- **Los personajes se conservan:** Brasa, Roca, Filo y los demás se convierten al juego nuevo.
- **El juego de la lluvia se guarda** tal como estaba: marca `lluvia-clasico` en git.

Etapas (cada una se puede jugar al terminarla):
33. **La ciudad:** elegir el punto en el mapa, bajar las calles y edificios de OpenStreetMap (o inventar una ciudad
    sin internet), dibujarla desde arriba y caminar por las calles chocando con los edificios. Los bichos te
    persiguen por las calles, no a través de las paredes. *(hecho)*
34. **Mundo abierto con reloj:** la horda arranca de a poco y crece con el reloj; cofres, ítems y puntos con
    historia repartidos por calles, parques y plazas.
34b. **Armas tipo SAS:** apuntar y disparar con el mouse; cada personaje arranca con su arma; recarga; armería para
    comprar y mejorar armas; granadas. Las habilidades pasan a ser poderes.
35. **Edificios por dentro:** puertas que llevan a interiores simulados (casa, negocio, galpón) con cofres y algún
    bicho.
36. **Jefes por la ciudad:** jefes procedurales que esperan en lugares marcados (plazas, parques) y monstruos
    sueltos fuertes desde el principio.
37. **Otros supervivientes:** los rivales recorren la misma ciudad; cruzarte uno abre duelo o apuesta.
38. **Desbloqueos a lo Risk of Rain:** desafíos que abren ítems, personajes y habilidades nuevas.
39. **El Sol Amarillo:** historia, mutantes, personajes, textos, pantalla de inicio y arte nuevos (reemplaza
    lluvias y paraguas). Los campeones, la Hidra y el Avatar se renombran acá.

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
- **2026-11-20: etapas 12 a 16.**
  - **Jefes que rotan:** Coloso del Diluvio, Reina del Granizo (abanicos de granizo desde lejos) y Leviatán del
    desagüe (se agazapa, marca con una línea roja y embiste).
  - **3 Leyes del Cielo nuevas** para el Juicio: Niebla (la mitad de alcance, se ve poco), Viento (una ráfaga que
    gira y empuja) y Cuerpo a cuerpo (lo de lejos pega 35%, lo de cerca 160%). Ya son 9.
  - **3 personajes nuevos:** Marea (Ola que va y vuelve; ulti Resaca, que arrastra), Óxido (Torretas que disparan
    solas; ulti Chatarra, esquirlas) y Faro (Haz giratorio; ulti Destello, que aturde todo). Con sus fusiones
    (Tsunami, Fortaleza, Faro mayor). Ya son 8 personajes y 11 habilidades.
  - **Partida del día:** misma semilla para todos ese día y tu mejor resultado guardado.
  - **Volumen** en la pausa.
  - **Balance con todo junto (banco de 22 partidas):** la partida dura **21 minutos de mediana** (el 80% entre 12 y
    28). Se suavizaron los jefes nuevos (la Reina tira 5 granizos de 7 de daño; el Leviatán pega 24), el Tronador
    llega en el minuto 8, el Escupelodo pega 7, las élites dan el doble de oro (no 5 veces) y 1 de cada 12 deja
    cofre: antes los ganadores terminaban con más de 200 ítems, ahora con unos 75. Musgo con más vida y curación,
    el Haz de Faro pega más, las Torretas de Óxido un poco menos.
  - **Pendiente:** entre los minutos 5 y 10 la horda saca unas 8 vidas por partida (casi una por jugador), y entre
    el 10 y el 15 casi ninguna. Probé sacando las élites, los eventos y las criaturas nuevas, de a una: ninguna lo
    explica sola. Es el salto general de dificultad de esos minutos, cuando todos tienen poco armado. Para
    suavizarlo habría que repartir la dificultad de otra forma (por ejemplo, crecer menos entre el 5 y el 10 y más
    después); queda para una próxima pasada con el banco.
  - **Personajes:** con 22 partidas, cuánto gana cada uno salta de una corrida a otra (Marea pasó de 10% a 24%).
    Para medirlos bien hacen falta unas 100 partidas (media hora de banco).
- **2026-11-21: controles y santuarios.**
  - **Joystick:** palanca para moverte, A para la ulti (hacia donde caminás; en el Juicio, al rival), LB/RB para
    apostar, Start para pausar, y la cruceta con A para todos los menús.
  - **Pantalla táctil:** un dedo arrastrado es la palanca (se dibuja en pantalla), otro toque tira la ulti hacia
    ese punto, y tocar un lado del panel de apuestas apuesta a ese Paraguas. Los menús se achican y se desplazan en
    pantallas chicas.
  - **Santuarios** en tu barrio (riesgos que elegís): el Santuario del Trueno te da un cofre de jefe si aguantás
    20 segundos de élites sin perder una vida; el Pozo de los deseos te dobla o te saca un cuarto del oro. Aparecen
    cada 2:30 desde el minuto 3 y desaparecen al minuto si no los tocás. Solo los tenés vos (la IA no los usa), así
    que no cambian el balance de los rivales.
- **2026-11-21: curva de dificultad nueva (banco de 33 partidas).** La vida de los enemigos crece ×1,22 por minuto
  (era ×1,28) y el apretón tardío arranca en el minuto 8 con ×1,5 por minuto (era el 10 con ×1,4). Resultado: el
  pico de vidas perdidas entre los minutos 5 y 10 bajó de 7,8 a 5,4 por partida, y la horda vuelve a sacar vidas
  entre el 10 y el 25 (antes casi ninguna). La partida dura **25 minutos de mediana**, el 80% entre 19 y 34.
  Ajuste chico de personajes según esa corrida: Haz de Ceniza 85 de daño (salía primera), Ola de Marea 14, Torreta
  de Óxido 10 (salía última). Con 33 partidas cada personaje sigue con mucho ruido; falta una corrida de 100.
- **2026-11-21: desbloqueos y modo difícil.**
  - **Paraguas por desbloquear:** Marea se abre con el logro Alquimista (hacé una fusión), Óxido con Rompeolas
    (bajá un jefe) y Faro con Podio (terminá entre los 3 primeros). Si no querés esperar, se compran en el
    Cuaderno (60, 80 y 100 ☀). Los rivales usan siempre los 8. En la Partida del día están todos abiertos.
  - **Tormenta eterna (modo difícil):** se abre ganando una partida. La horda tiene ×1,5 de vida y ×1,25 de daño en
    todas las arenas, los rivales juegan mejor y las monedas se pagan dobles. Logro nuevo: «Sol en la tormenta»
    (ganá en Tormenta eterna, 200 ☀). Se elige con el botón de modo en la pantalla de inicio.
  - **Ley del Cielo nueva, Anegados en el Juicio:** cada 2,5 s entran 2 criaturas por los bordes y van contra el
    Paraguas más cercano (hasta 14 a la vez). Cada una que bajás te cura el 4% de tu vida de duelo, así que los kits
    que limpian multitudes pueden dar vuelta la pelea. Ya son 10 Leyes.
- **2026-11-21: balance de personajes (banco de 100 partidas + control de 40).** En 100 partidas, Marea ganaba el
  22% y Brasa y Óxido el 5-6% (lo justo es 13%). Cambios: Ola 12 de daño (+5 por nivel, era 14 y +6); Chispa 14
  (era 12) y Brasa con 115 de vida (era 105); Torreta 12 (era 10) y Óxido con 120 de vida (era 110). En el control
  de 40, Brasa gana 14% y Óxido 15%, y Marea bajó de puesto promedio 3,8 a 4,3. El resto queda dentro del ruido
  de 40 partidas (±5 puntos); la partida sigue durando 26 minutos de mediana.
- **2026-11-21: ítems de postura y mandar Anegados.**
  - **4 ítems nuevos** (ya son 20), para builds que no existían:
    - Ancla (raro): +10% de daño siempre, y quieto sube hasta +35% más en 1,5 s.
    - Racha (raro): moviéndote sin parar, tu daño sube hasta +30% en 3 s.
    - Raíz (común): +1 de vida por segundo siempre, y quieto 3 más.
    - Charco de oro (común): +15% de oro de las criaturas.
    - Se ven en pantalla: un aro dorado cuando estás plantado y una estela celeste cuando venís en racha.
  - **Mandar Anegados** (como en Custom Hero Chaos, donde se le mandan creeps a otro):
    - Con R, Y en el joystick o tocando el cartel, pagás oro (60 al principio, crece como los cofres) y al que va
      primero le cae una tanda de 6 criaturas, con una élite y más con el reloj. Recarga de 30 s.
    - La IA también lo hace desde el minuto 9, cuando le sobra el doble del precio.
    - Funciona como freno para el que se escapa. Tiene consejo propio en el tutorial y está en "Cómo se juega".
  - **Lo que midió el banco:** con los ítems de postura "puros", la IA (que no para de moverse) recibía ítems
    que no le servían. El pico de vidas perdidas entre los minutos 5 y 10 subió de 5,3 a 6,8, y la partida bajó a
    22 minutos. Mandar Anegados desde el minuto 4 lo empeoraba (7,3). Con el piso fijo de Ancla y Raíz, y la IA
    mandando desde el minuto 9, volvió a 5,5 y a **26:40 de mediana** (banco de 40).
  - Pendiente: los ganadores juntan más ítems (unos 140, eran 107) por el Charco de oro, y Roca sale último en
    puesto promedio en cuatro bancos seguidos. Hace falta una corrida larga antes de tocarlos.
- **2026-11-21: ajuste fino con banco de 100 + control de 60.** La corrida de 100 mostró que el tramo de los
  minutos 5-10 seguía más duro que antes de los ítems nuevos (6,1 vidas perdidas) y que Filo y Roca salían últimos
  en puesto. Cambios: la vida de la horda crece ×1,21 por minuto (era ×1,22), Charco de oro +10% (era +15%; los
  ganadores bajaron de 140 a unos 120 ítems), Roca con 190 de velocidad (era 180) y Filo con 108 de vida (era 100).
  Control de 60: pico de 5,0, **25:22 de mediana**, todos los personajes entre 4,2 y 4,8 de puesto promedio.
- **2026-11-21: ítems malditos y Pactos del Cielo** (ideas de Risk of Rain: los ítems lunares y los artefactos).
  - **3 ítems malditos** (rareza nueva, violeta; salen en el 1% de los cofres comunes). Dan mucho y cobran algo
    para toda la partida, y se apilan con su precio:
    - Paraguas de vidrio: +50% de daño, -20% de vida máxima.
    - Gota negra: +40% de oro, -8% de velocidad.
    - Reloj torcido: mucha menos recarga, pero perdés 1,5 de vida por segundo (el drenaje nunca te mata).
  - **4 Pactos del Cielo:** se activan antes de la partida y cambian todas las arenas. Cada uno da +25% de monedas.
    Se abren con logros (o con monedas en el Cuaderno) y no valen en la Partida del día.
    - Enjambre: el doble de Anegados con la mitad de vida (logro Mil gotas).
    - Fiebre del oro: cofres a mitad de precio, horda con +30% de vida (logro Tesoro del barro).
    - Juicio caótico: cada Juicio junta dos Leyes del Cielo (logro Juez del Trueno).
    - Todos de cristal: todos los Paraguas con la mitad de vida (logro Ojo de halcón).
  - **Banco:** con los malditos al 2% y la Gota negra al +60%, los Juicios bajaron de 12 a 9 s (el vidrio apilado)
    y los ganadores volvieron a 137 ítems. Al 1% y +40%: Juicios de 10,6 s, 124 ítems, la curva igual (pico 5,2,
    **25:14 de mediana**, banco de 40).
- **2026-11-21: habilidades nuevas, final con sol y opciones.**
  - **4 habilidades nuevas** (ya son 15, más 15 fusiones), pensadas para las builds nuevas:
    - Granizo (muchos golpes chicos al azar); su fusión, Diluvio, sale con Racha.
    - Remolino (dos bolas de agua pesadas que giran lejos); su fusión, Maelstrom, sale con Reloj de arena.
    - Latido (pulso corto y muy seguido, para plantarse); su fusión, Tambor del barro, sale con Ancla.
    - Paraguazo (tu paraguas como bumerán); su fusión, Paraguas real, sale con Charco de oro.
    - Prueba nueva: toda habilidad que se ofrece tiene su fusión, con un ítem que existe.
  - **Final con sol:** cuando ganás se abren las nubes (un sol que sube y brilla) y un epílogo propio de cada
    Paraguas cuenta qué hace con su día de sol.
  - **Opciones en la pausa:** temblor de pantalla sí/no y letra grande en los menús. Se guardan en el navegador.
  - **Banco de 60 partidas:** la curva aguanta (mediana 25:28; 4,5 vidas perdidas contra la horda en los minutos
    5-10). Duelos de 10,9 s, ganadores con 144 ítems y 5 fusiones. Puestos promedio entre 4,0 y 4,9: ningún
    personaje se despega.
- **2026-11-21: pronóstico del día** (tercera temporada). Cada partida sale con un clima, el mismo en las 8 arenas,
  que se anuncia al empezar y queda escrito debajo del reloj:
  - Llovizna (sin cambios, la más común), Chaparrón (más bichos y más oro), Granizada (la horda pega más, vos
    también), Neblina (salen más pero son frágiles), Ventarrón (todos corren más, la horda aguanta un poco más) y
    Arcoíris (cofres más baratos, el más raro).
  - Cada clima tiene su contra: con solo ventajas, el banco de 30 dio partidas de 30 minutos, la mitad de vidas
    perdidas en los minutos 5-10 y ganadores con 192 ítems (más bichos ya es más oro y experiencia). Con las
    contras: mediana 27:17, 4,4 vidas perdidas en los minutos 5-10 y 169 ítems.
  - Se suma a la Tormenta eterna y a los Pactos. La partida diaria también tiene pronóstico (igual para todos).
  - Las pruebas ahora son más livianas para gastar menos (decisión del usuario): las automáticas en cada tanda, y
    30 partidas simuladas solo cuando cambian números del balance.
- **2026-11-22: el rival.** El Paraguas que más duelos te ganó pasa a ser tu rival (si hay empate, el último que te
  ganó). Lo marca ⚔ en la tabla de posiciones.
  - Cuando te gana te provoca con una frase; cuando te toca contra él se anuncia la revancha, y si le ganás cobrás
    el doble del premio del duelo.
  - Logro nuevo: Revancha (ganale un duelo a tu rival, 30 monedas). Consejo nuevo la primera vez que tenés rival.
  - Solo vos tenés rival, así que no cambia el balance entre los Paraguas de la IA; no hizo falta banco.
- **2026-11-22: maestría de personaje.** Cada partida le suma puntos al Paraguas que usaste: 10 por ganar, 7 por
  salir segundo, y así hasta 1; más 1 por cada duelo ganado.
  - Seis rangos: Aprendiz, Paraguas de barrio (15), Veterano del charco (40), Guardián del arroyo (80), Señor de la
    tormenta (140) y Leyenda de Aguaverde (220).
  - Se ve en la tarjeta del personaje (estrellas, título, puntos y borde del color del rango), en un aura suave del
    mismo color alrededor tuyo en la partida, y en la pantalla final cuando subís.
  - Es solo de adorno: no da poder, así que no cambia el balance.
- **2026-11-22: el Mercader errante** (cuarta temporada). Ahora los santuarios rotan de a tres: Mercader, Trueno y
  Pozo. El Mercader ofrece 3 ítems distintos y elegís uno (o seguís de largo); el juego espera mientras mirás.
  - Precio: el costo del cofre del momento ×1,6 los comunes, ×3,2 los raros, ×9 los legendarios y ×2,5 los
    malditos. Sale más caro que un cofre, pero elegís vos y salen más raros.
  - Como los santuarios, solo está en tu arena: no cambia el balance de la IA.
- **2026-11-22: lluvia de oro.** A los 5:00 y después cada 4 minutos, una nube dorada cruza tu barrio durante 18
  segundos (a paso lento, así que hay que seguirla).
  - Debajo de la nube ganás oro todo el tiempo (6 por segundo al principio, y crece con el reloj como el oro de
    cada bicho), pero mientras estás ahí la horda sale casi el doble de rápido.
  - Al irse te dice cuánto juntaste. Como los santuarios, solo está en tu arena.
- **2026-11-22: el Juez del Trueno.** En la final (cuando quedan dos), a los 4 segundos de cada duelo entra el Juez
  del Trueno: va contra el que tenga más cerca, y el que lo baja se cura la mitad de la vida. Aparece con un cartel
  y muestra su barra de vida arriba.
  - Banco de 30: la curva no cambió (mediana 27:18, duelos de 9,9 s, ganadores con 173 ítems).
  - Pendiente: Faro ganó solo el 4% en los últimos tres bancos de 30 (puesto promedio 4,4-4,9, en el medio).
    Con 30 partidas es ruido posible; mirar en el próximo banco largo antes de tocarlo.
- **2026-11-23: Encargos del barrio** (quinta temporada). A los 1:30 y después cada 2:30 (entre santuario y
  santuario) aparece un encargo que se muestra bajo el reloj con su cuenta y su tiempo. Rotan: cazar enemigos en 30
  segundos (deja un cofre de jefe al lado), que no te toquen por 12 segundos (paga dos cofres de oro) y abrir 2 cofres
  en 45 segundos (devuelve un cofre y medio de oro). Si no llegás, no perdés nada. Solo en tu arena, como los
  santuarios, así que no cambia el balance de los rivales y no hizo falta banco.
- **2026-11-23: ajuste de Faro.** Sumando los últimos tres bancos ganaba el 4% (lo justo es 13%), así que pasó de
  105 a 115 de vida y su Haz giratorio arranca pegando 17 en vez de 14.
  - Banco de 30: Faro gana el 11%. La curva casi igual (mediana 28:30, duelos de 11,1 s, ganadores con 167 ítems).
    Brasa bajó a 6%, pero venía en 9%: se mira en el próximo banco antes de tocarlo.
- **2026-11-23: Aguante.** Al ganar el Sol aparece el botón "Seguir aguantando". Volvés a tu barrio con la horda
  donde estaba, la vida llena y una sola vida; el reloj y la dificultad siguen subiendo. Al caer se muestra cuánto
  aguantaste, se guarda tu récord y pagás 5 Monedas del Sol por minuto entero. (Se llamó "Aguante" y no "Tormenta
  eterna sin fin" para no confundirlo con el modo difícil.) No cambia el balance: solo pasa después de ganar.
  - Pruebas: `ONLY=texto node tests/run.js` corre solo las que tengan ese texto en el nombre, para no esperar las
    diez minutos de todas mientras se arma algo.
- **2026-11-23: Sumidero y campeones del Dios Loco** (sexta temporada). El usuario pidió más jefes y momentos, y
  cambiar el mundo (ver la sexta temporada arriba).
  - Sumidero, desde el minuto 9: una boca que camina y te chupa hacia ella. Se nota por un anillo tenue que marca
    hasta dónde llega. El tirón tiene tope aunque haya varios, y no te mueve mientras sos invulnerable.
  - Campeones del Dios (minijefes), con cuernos dorados y barra de vida; aparecen a los 4:00 y después cada 3
    minutos, justo a mitad entre jefe y jefe, y dejan un cofre de élite:
    - el Verdugo embiste;
    - el Nigromante se queda lejos e invoca tandas de 5 bichos;
    - el Gólem frena, muestra un anillo rojo que se llena y golpea el piso: hay que salir antes de que se cierre.
  - Banco de 30: la curva igual (mediana 27:06, horda 3,3 vidas en el minuto 5-10, duelos de 9,8 s, ganadores
    con 175 ítems). Marea y Roca dieron 0% de victorias y en el banco anterior 16% y 14%: con 30 partidas puede
    ser ruido; mirarlos en el próximo banco antes de tocarlos.
- **2026-11-23: jefes con fases y dos titanes.** A media vida cada jefe cambia hasta el final de la pelea: lo marca
  un halo rojo que late, un cartel y el sonido de jefe.
  - Coloso: se apura y llama a 8 bichos.
  - Reina del Granizo: abanicos de 9 en vez de 5, y más seguidos.
  - Leviatán: embiste casi sin pausa.
  - Titanes nuevos en la ronda de jefes (ahora son cinco):
    - la Hidra del Coliseo (11:30): a media vida le crecen 2 cabezas y al morir se parte en 3 cabezas que escupen;
    - el Avatar del Dios Loco (14:30): tira abanicos de fuego de 7, y a media vida abanicos de 11 y llama al
      Verdugo.
  - Banco de 30: la curva igual (mediana 27:42, duelos de 9,4 s, ganadores con 195 ítems; una partida pasó de
    45 minutos). Marea y Roca volvieron a 10% y 14%: lo del banco anterior era ruido. Oxido dio 3% (venía en 13-19%).
- **2026-11-23: la ciudad** (séptima temporada, etapa 33). Después de elegir personaje elegís dónde arrancás:
  - en un mapa del mundo (Leaflet + OpenStreetMap);
  - en una lista de lugares (San Miguel primero, a pedido del usuario; Obelisco, Córdoba, Rosario, Mendoza,
    Montevideo, Ciudad de México, Madrid);
  - con "Donde estoy";
  - o eligiendo "Ciudad inventada".

  Cómo se arma el mapa:
  - El juego baja de OpenStreetMap un cuadrado de 1 km alrededor del punto. Primero las calles, plazas y parques;
    después los edificios, que son solo para dibujar.
  - Prueba tres servidores, porque a veces están saturados. Si no llegan las calles, arma una ciudad inventada y
    lo avisa.
  - Se camina por las calles (ancho según el tipo de calle), las plazas y los parques; las manzanas son paredes.
    Así anda aunque no estén cargados todos los edificios.
  - Los bichos te buscan por las calles con un "campo de flujo" (un mapa de distancias que se recalcula cada
    0,4 s); los cofres, santuarios y saltos caen en la calle.
  - Los rivales siguen jugando en sus arenas de siempre hasta la etapa 37. La partida del día usa una ciudad
    inventada con la semilla del día, igual para todos.

  Probado:
  - San Miguel bajó 148 calles y 15 plazas (Belgrano, Sarmiento, España, Italia...); el Obelisco, 355 calles.
  - Se ve bien en pantalla.
  - El navegador interno de la app no puede salir a internet, así que la descarga desde el juego no se probó
    ahí. Hay que mirar si la versión de claude.ai lo permite; en la página de GitHub tendría que andar.
- **2026-11-23: San Miguel entera, adentro del juego.**
  - `tools/bake-city.js` toma lo que se bajó de OpenStreetMap y lo guarda en `data/city-sanmiguel.js` (286 KB):
    1842 calles, 169 plazas y parques, y 1702 edificios, en un cuadrado de 4,75 km.
  - Se arranca directo en la plaza principal, sobre la Avenida Ricardo Balbín. Arma la ciudad en 0,08 s.
  - El campo de flujo solo se extiende 300 celdas alrededor tuyo (2,4 km): con la ciudad entera no hace falta
    más, y así tarda 6 ms.
  - Escala: 2,5 píxeles por metro.
  - El juego de la lluvia quedó guardado con la marca `lluvia-clasico`.
- **2026-11-23: todo a escala.** El usuario pidió que el personaje esté a escala con la ciudad. Antes medía como
  11 m.
  - Ahora la ciudad va a 10 píxeles por metro: una calle común (10 m) mide 100 px, unos 3-4 personajes, y en
    pantalla se ve una cuadra y media, como en el SAS. San Miguel mide 47.500 px de lado.
  - Para que siga liviana:
    - la grilla de paso es de 1,6 m (8,8 millones de celdas, 1 byte cada una) y se arma en 0,25 s;
    - el campo de flujo cubre solo un cuadrado de 120 celdas alrededor tuyo (unos 190 m) y tarda 0,5 ms;
    - los cofres aparecen alrededor tuyo, entre 50 y 180 m.
  - Las velocidades no se tocaron: la ciudad es más grande para el personaje, pero el juego se siente igual.
