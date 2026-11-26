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
- **2026-11-24 (decisión del usuario):** "quiero que todos los muebles y objetos sean objetos físicos": todos los
  muebles frenan el paso y las balas, también los chicos (se había recomendado que solo los grandes).
- **2026-11-24 (decisión del usuario):** Darkwood (`docs/DARKWOOD.md`): "sí a todas las recomendadas":
  - día y noche junto con la horda que crece: cada noche una oleada más dura, que se aguanta en un refugio;
  - balas que alcanzan sin sobrar, más un arma de mano;
  - los ítems de cofre se siguen apilando; la mochila con lugar es para lo que se gasta;
  - penumbra fuera del campo de visión, más oscuro de noche.
  Y sumar el ciclo de día y noche, el clima y las estaciones, con un día de 12 horas que dura 40 minutos.

- **2026-11-24 (decisión del usuario):** las dos del reloj (`docs/DARKWOOD.md`, sección 5), las recomendadas:
  - 12 horas de día y 12 de noche, 40 minutos cada una; la estación corre el amanecer y el atardecer;
  - partida larga que se guarda sola (al dormir y al salir); cada estación dura 3 días del juego y se gana
    sobreviviendo un año entero, con la opción de seguir.

- **2026-11-25 (decisión del usuario):** el juego es una mezcla de Darkwood y *Project Zomboid*
  (`docs/ZOMBOID.md`): armas de mano con lo que se encuentra en una ciudad argentina (piñas, puños vendados, puño
  americano, puño con cinturón, palo de escoba, tenedor, cuchillo, palita de barrer, barra de metal...); zombis que
  no van derecho hacia vos sino que deambulan y te encuentran por el ruido o porque te ven; por ahora zombis
  normales, que a los tiros solo mueren con un tiro en la cabeza; y una puntería que mejora con cada tiro en la
  cabeza.

- **2026-11-25 (decisión del usuario):** respuestas 1 a 10 sobre la mezcla con Zomboid (`docs/ZOMBOID.md`, arriba de
  todo): las armas se rompen según su fragilidad; habilidades de pelea en árbol (cuerpo a cuerpo → a mano, arma
  corta, media distancia), que también mejoran el aire; daño contundente, cortante y punzante con una mezcla por
  arma; las armas de mano matan según el enemigo y la experiencia, a mano limpia muy difícil y lastima las manos;
  **por ahora los mismos zombis de día y de noche**, que de día ven más lejos y de noche oyen más lejos (cambia la
  etapa 47); un tiro en el cuerpo frena un segundo y, según arma, bala y tiro, voltea o hace tambalear.
- **2026-11-25 (decisión del usuario):** respuestas 11 a 15: apuntar con clic derecho; la bala tiene que pasar por la
  cabeza dibujada y la Puntería la agranda; todas las habilidades en 10 niveles; más habilidades si son coherentes
  con el juego; el orden propuesto. **Pruebas:** nada de medir todo en cada paso; se prueba todo junto en momentos
  acordados de la producción (el primero, al terminar la etapa 48).

- **2026-11-25 (decisión del usuario):** respuestas sobre inventario y supervivencia: se arranca solo con los
  bolsillos; bolso y mochila como están; **lugares y peso** (lo que más restringe es ir pesado); correr como está;
  el clic derecho con armas de fuego y de media distancia apunta o prepara el golpe (cubrirse, más adelante);
  sonidos: lo que se pueda conseguir; el toque violeta, sí; **el nombre del juego se está pensando**; por ahora hay
  niveles, pero la experiencia no se junta del piso: llega al matar y al repetir tareas (pelear, fabricar); **una
  sola vida**; los objetos especiales se encuentran en los muebles; el refugio, todavía no; **hambre y sed**: agua
  cada 6 horas y comida cada 12, que se consumen solas si las tenés; un día sin comer no hace nada, después crece el
  malestar, y nervioso te puede bajar la presión y desmayarte, más cuanto más tiempo pase. Al terminar la tanda,
  elegir las pruebas, hacerlas y subir todo.

- **2026-11-25 (decisión del usuario):** sonidos, "lo que consideres mejor" (siguen hechos por el programa: bajar
  archivos pide aprobar cada uno); la botella vacía se rellena en una canilla; agua y comida y el desmayo como están;
  sigue el clima, y también cubrirse; guardar la partida y las estaciones, todavía sin definir.

- **2026-11-25 (decisión del usuario, después de probarlo):** sigue el sistema viejo de subir de nivel (la mejora de
  la Glock sirve para probar); energía, dormir y comida juntos; tirar cosas al piso y menú de clic derecho; manos,
  bolsillos y mochila como Project Zomboid; salud con heridas, sangrado, kits, infección y antibióticos; refugio y
  barricadas para cuando estén el lore, el jugador y el mapa; sin zombis nuevos por ahora; al morir te despertás
  donde dormiste por última vez y tu cuerpo queda para ir a buscarlo (la partida no se pierde); estaciones de 7 días,
  y después un sistema de ropa; más adelante la cordura. Todo en `docs/CUERPO.md`.

- **2026-11-25 (decisión del usuario):** respuestas a los 10 puntos después de la novena temporada:
  - se sigue y se prueba más adelante;
  - el aire dura un 30% más y vuelve un 30% más rápido;
  - **ropa como Project Zomboid**: medias, zapatos, guantes, remeras, camisas, etc.; cada prenda protege y abriga;
  - **la partida se guarda solo al dormir en una cama**;
  - el sistema de subir de nivel queda así hasta afinarlo;
  - solo el sonido con dirección, sin marcas en pantalla;
  - la cordura, más adelante;
  - **el mapa recuerda lo que viste**: el minimapa se va destapando con lo que entra en tu vista, y hay un lugar
    donde consultar todo lo explorado; más adelante, niebla de guerra (que también sirve para no cargar todo el mapa
    al empezar);
  - **el juego se llama Sol Loco** por ahora;
  - el lore nuevo (la tormenta, la barrera negra, la noche sin estrellas, el sol enfermo) en `docs/LORE.md`.
  - Trajo además una propuesta de facciones y finales hecha con otra IA: `docs/FACCIONES.md`, sin decidir.
- **2026-11-25 (segunda tanda):** respondió la lista de "qué sigue":
  - **la barrera negra**: un muro negro alrededor de San Miguel, que no se cruza; de ahí salen los zombis, así que
    cerca hay muchos más;
  - **refugio y barricadas** ahora ("probemos cómo sale"): tablas y clavos en puertas y ventanas, correr muebles, y
    zombis que golpean y rompen;
  - **vecinos (NPC)**, arrancando chico ("a ver cómo sale"): encerrados en sus casas, te piden algo y te dan algo a
    cambio, y se convierten si los muerden;
  - **la cordura no se usa por ahora**: primero quiere pulir cómo se juega y se desarrolla una partida. Por eso la
    lluvia negra que hace mal también espera;
  - las facciones, después de los NPC, empezando por una o dos;
  - el Ente se queda, pero misterioso: solo señales, nunca se dice qué es;
  - la niebla de guerra de la calle, más adelante, cuando el mapa pese.
- **2026-11-25 (tercera tanda): cómo se juega una partida y los sobrevivientes.**
  - **El arranque (por ahora uno solo):** sos un policía de la provincia que se quedó cuidando la Catedral de San
    Miguel durante la tormenta. Arrancás ahí adentro; la catedral es un refugio seguro y trabado, y tenés buena
    relación con su gente.
  - **El objetivo:** conseguir suministros y proteger el refugio, averiguar qué pasa, tratar con los otros refugios,
    ayudar gente y matar criaturas. La partida tiene disparadores (cosas que pasan cuando hacés algo o pasa tiempo).
  - **Noqueado:** si te noquean o te atacan, te despertás en el último lugar donde dormiste, pero baja tu reputación;
    si alguien te ve caer, baja más. La reputación se recupera no haciendo cosas profanas.
  - **Sobrevivientes:** encerrados en casas y también en la calle. Si encontrás uno, lo podés mandar a la catedral,
    o se suma y te acompaña. Te piden comida, remedios, tablas, armas.
  - **Se convierten solo si mueren.** Pero pueden enloquecer y alucinar: sabotear el campamento, pedirte compañía y
    tratar de matarte en el camino, atraer zombis, controlar criaturas.
  - **Les podés pegar.** Cada NPC y el jugador tienen reputación y relaciones con otros NPC.
  - **Conciencia colectiva:** zonas con la moral baja y más locura, más inestables y peligrosas. Esto crece después.
  - Las pruebas en el navegador las hace Claude.

## Decisiones abiertas
- Las facciones y los finales (`docs/FACCIONES.md`): cuáles primero (van después de los NPC, de a una o dos).
- Qué es "profano" (lo que baja la reputación además de caer): por ahora solo caer la baja, y cada día sin caer
  sube un poco.
- La cordura: ahora la locura es de los NPC; falta ver si el jugador también tiene.

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

### Profundidad y altura del mapa
Pedido del usuario (2026-11-24): que edificios, casas, árboles y estructuras tengan profundidad (hoy el personaje
pasa por encima de los árboles, como si estuvieran en el piso), poder subir escaleras a los pisos de arriba y usar
el terreno alto y bajo. "Avanzá como vos creas". En este orden:

40. **Capa de arriba:** el mapa se dibuja en dos capas, el piso (calles, veredas, pasto, autos) debajo de los
    personajes y lo que está en alto (copas de árboles, techos) encima. Alrededor de tu personaje lo de arriba se
    vuelve transparente, para no perderte de vista.
41. **Edificios con altura:** cada edificio muestra sus paredes, y el techo se corre según su altura y dónde está
    respecto del centro de la pantalla, así los altos "se inclinan" al caminar. Sale de los pisos que ya tiene cada
    edificio.
42. **Interiores y escaleras** (pasos 3 y 4 de `MAPA.md`): al entrar, el techo desaparece y se ve adentro; las
    escaleras llevan a los pisos de arriba, al sótano y a la terraza. El piso de abajo se ve más oscuro.
    **(decisión del usuario, 2026-11-24): escaleras fluidas, sin botón.** La escalera es una rampa que se camina: la
    altura va con lo que avanzaste (a mitad de camino quedás a mitad), la planta de abajo se apaga mientras aparece
    la de arriba, sobre la escalera solo chocás con la baranda y los bichos suben igual que vos.
43. **El agua en lo bajo:** el mapa ya tiene la altura real del terreno (0 a 43 m). Con la lluvia, las zonas bajas
    se inundan: el agua frena, corta el paso y obliga a buscar lo alto.

### Octava temporada — Darkwood: oscuridad, noche, clima y estaciones
Pedido y decisiones del usuario (2026-11-24, ver "Decisiones tomadas" y `docs/DARKWOOD.md`). Cada etapa se juega
al terminarla. El paso 43 ("el agua en lo bajo") pasa a ser parte del clima, en la etapa 50.
44. **Estética:** paleta apagada y sucia, grano, viñeta e interfaz mínima.
45. **Campo de visión:** el cono hacia donde apuntás, la penumbra, paredes y muebles que tapan la vista.
46. **El reloj y el día y la noche:** la hora (12 horas en 40 minutos), la luz que cambia, linterna, faroles y luces.
47. **Los zombis vuelven:** pocos de día, la oleada de noche, cada noche más dura.
48. **Juntar, mochila y fabricar:** revisar muebles, materiales, banco de trabajo. *(primera parte hecha: revisar
    muebles y la mochila)* Lo que sigue va en este orden (`docs/ZOMBOID.md`):
    - 48b. **Zombis que buscan:** deambulan, oyen y ven; investigan ruidos y persiguen.
    - 48c. **Tiro a la cabeza y Puntería:** la cabeza del zombi, apuntar con clic derecho, la habilidad que sube.
    - 48d. **Armas de mano:** piñas y lo que se encuentra en los muebles, con lo que aguantan y el aire.
    - 48e. **Fabricar:** puños vendados, botellas rotas, molotov, vendas, balas, tablas.
49. **Refugio y barricadas:** tablas, muebles contra las puertas, zombis que rompen; dormir.
50. **El clima:** lluvia, tormenta, niebla, calor y frío, con su efecto en el juego; el agua inunda lo bajo.
51. **Guardar y estaciones:** guardado automático; verano, otoño, invierno y primavera, con sus días, clima y árboles.
52. **Sonido con dirección**, comerciante, armas de mano que se gastan, sangrado y correr que cansa.
53. **Mutaciones con contra** y el mapa sin flecha.

### Novena temporada — el cuerpo (`docs/CUERPO.md`)
Pedido del usuario (2026-11-25), en este orden:
54. **Energía y dormir:** la barra de energía, la cama, dormir bien comido, ver menos sin dormir.
55. **Tirar y el menú de clic derecho:** las cosas quedan en el piso y se juntan.
56. **Manos, bolsillos y mochila:** dos manos, dos bolsillos, la comida y el agua como tiempo que te dura.
57. **Salud:** heridas por tipo de daño, vida máxima, sangrado, kits, infección, antibióticos, paracetamol, la
    ventana de estado.
58. **Morir:** despertar donde dormiste y el cuerpo que queda.
59. **Estaciones** (y después la ropa).
Más adelante: la cordura; refugio y barricadas; otros sobrevivientes.

### Décima temporada — Sol Loco
Pedido del usuario (2026-11-25):
60. **Aire, nombre y lore:** el aire dura un 30% más; el juego se llama Sol Loco; el lore nuevo en `docs/LORE.md`.
61. **Guardar al dormir en una cama**, y seguir la partida desde el menú.
62. **Ropa como Project Zomboid:** prendas por parte del cuerpo; cada una protege de mordidas y rasguños y abriga;
    se mojan con la lluvia negra y se rompen.
63. **Sonido con dirección:** se oye más fuerte del lado de donde viene.
64. **El mapa que recuerda:** el minimapa muestra solo lo que ya viste, y un mapa grande para consultar lo explorado.
Segunda tanda (2026-11-25):
65. **La barrera negra:** el borde del partido es un muro negro que no se cruza; cerca hay más zombis y algunos
    salen de ella.
66. **Refugio y barricadas:** tablas y clavos en puertas y ventanas, correr muebles para trabar, zombis que golpean
    y rompen.
67. **Vecinos:** reemplazada por las etapas 68 a 74 (tercera tanda).
Tercera tanda (2026-11-25), cómo se juega una partida:
68. **El refugio de la Catedral:** arrancás adentro, como el policía que la cuidaba; ventanas trabadas, la puerta
    libre, y la reputación con el refugio (caer la baja, más si te ven; un día sin caer la sube).
69. **Sobrevivientes:** en casas trabadas y en la calle; hablarles, qué te piden y qué te dan.
70. **Mandarlos a la Catedral o que te acompañen;** la gente del refugio vive ahí y pide cosas.
71. **Reputación y relaciones:** cada NPC con la suya y con los otros; pegarles tiene consecuencias.
72. **La locura de los NPC:** alucinan, sabotean el refugio, te traicionan en el camino, atraen zombis; al morir se
    convierten.
73. **Conciencia colectiva:** la moral de cada zona; donde hay más locura es más peligroso.
74. **Disparadores:** averiguar qué pasa, los otros refugios.
Más adelante: facciones (de a una o dos, propuesta en `docs/FACCIONES.md`); la cordura y la lluvia negra que hace
mal (cuando el usuario defina cómo se juega una partida); niebla de guerra en la calle.

### Más adelante: autos y vehículos
Idea del usuario (2026-11-24): que algún día el juego tenga autos y vehículos. Hoy los autos estacionados son
obstáculos. Lo que ya ayuda: las calles tienen su ancho real y están conectadas, así que se puede manejar por
ellas. Cuando llegue: subir y bajar de un auto, manejarlo (velocidad, frenada, choques), atropellar, que se rompa y
se quede sin nafta, y otros vehículos (moto, colectivo, camioneta). Las cosas que se hagan antes (paredes, capas,
alturas) se piensan para que un auto pueda moverse más rápido que una persona sin atravesar nada.

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
- **2026-11-24: un jugador, zombis y una Glock** (decisión del usuario: "por ahora un solo jugador, zombies y una
  sola arma, una Glock"). Todo se maneja desde `L.data.mode` en `data/guns.js`.
  - Jugás solo: no hay rivales, duelos, apuestas ni envíos. La partida termina cuando perdés la última vida.
  - La Glock 17 tiene 17 balas: apuntás con el mouse, mantenés el clic para disparar, y recarga con R o sola
    cuando se vacía. En pantalla hay una mira y el contador de balas.
  - Al subir de nivel no hay habilidades ni ulti: salen pasivas y "Mejorar Glock" (+30% daño, +15% balas).
  - Las balas chocan contra las paredes de la ciudad. No llueve más.
  - Los bichos son zombis: hombros, brazos estirados hacia vos y cabeza.
    - Nombres: Zombi, Corredor, Vomitador, Hinchado, Arrastrado, Explosivo, Sprinter, Mole y Atrapador.
    - Jefes: Gigante podrido, Reina de la Colmena, Carnicero, Hidra de carne y Primer Mutado.
    - Campeones: Verdugo, Llamador y Aplastador.
  - La horda de este modo crece más despacio, a lo Risk of Rain:
    - el reloj de dificultad va a la mitad;
    - vida ×0,65, daño ×0,5 y la mitad de bichos;
    - primer jefe a las 5:00.
  - Zombis siempre fuera de pantalla: antes, si un zombi nacía dentro de una manzana, lo corría a la calle más
    cercana, a veces al lado tuyo.
  - `node tools/solo.js 8 25`: un bot juega el modo solo en San Miguel. Se le enseñó a esquivar paredes.
    - Antes del ajuste duraba 3 minutos; ahora la mediana es 9:32.
    - Alguien que apunta con el mouse tendría que durar más; falta medirlo jugando.
  - El juego de 8 jugadores con habilidades sigue intacto (el banco de 30 partidas lo usa).
- **2026-11-24: el mapa lleno, prolijo y con edificios** (pedido: "el mapa completo de mi ciudad, prolijo, con
  edificios como el SAS, todo a escala"; ver `docs/SHOOTER.md`).
  - Cada cuadra se llena de casas a lo largo de la vereda. Donde OpenStreetMap ya tiene el edificio, va ese.
    - Frente de 8-12 m y fondo de 10-18 m; en las avenidas son más grandes y algunas son negocios.
    - Cada tanto queda un pasillo de 3,5 m para entrar a los patios.
    - San Miguel: 42.600 casas generadas, además de los 1702 edificios de OpenStreetMap.
  - Los patios y el fondo de las manzanas se caminan. Las casas, los edificios y los autos son sólidos (también
    frenan las balas).
    - Antes la manzana entera era pared; ahora los zombis también pueden venir por los patios, como en Project
      Zomboid.
  - Autos estacionados junto al cordón (12.900) y árboles en las veredas (27.000), sin ponerlos en las esquinas.
  - Dibujo: patios verdes, plazas, vereda clara con cordón, asfalto, líneas punteadas en las avenidas, techos de
    8 colores con su cumbrera, sombra hacia el sudeste, autos con parabrisas y árboles con copa. Solo se dibuja
    lo que está en pantalla (la ciudad está partida en cuadros de 64 m): 4 ms por cuadro.
  - Minimapa arriba a la derecha (unos 520 m alrededor tuyo) con calles, plazas, zombis, cofres y el nombre de
    la calle donde estás.
  - La ciudad se arma en alrededor de 1 segundo (pantalla "Armando San Miguel...") y se guarda para las
    partidas siguientes.
  - Banco solo (`tools/solo.js`): mediana 9:41, igual que antes.
- **2026-11-24: el mapa real de San Miguel** (pedido: "una copia lo más similar a mi ciudad, edificios a los que
  se pueda subir, escaleras, terrazas, sótanos y altura del terreno; primero el mapa"). Todo en `docs/MAPA.md`.
  - Edificios reales: 54.745 contornos de Overture (Google, Microsoft y OpenStreetMap), contra los 1702 de
    antes. Para bajarlos se instaló DuckDB, con el OK del usuario.
  - Además: 2642 lugares con nombre, uso del suelo, agua, tren, y la altura del terreno cada 60 m (SRTM, de 18
    a 41 m).
  - `node tools/bake-map.js` junta todo en `data/map-sanmiguel.js` (3,8 MB). A cada edificio le da tipo, pisos,
    techo (terraza, tejas o chapa) y sótano: del dato si existe, estimado si no.
  - Visor aparte del juego, en `mapa/`: terreno con curvas de nivel, capas, colores por tipo, pisos, techo o
    fuente, un selector de nivel (sótano, planta baja, pisos, terraza) y la ficha de cada edificio al hacer clic.
  - Todavía no está en el juego. Primero lo revisa el usuario; después vienen los interiores y escaleras y el
    paso al juego.
- **2026-11-24: el mapa con aspecto de ciudad.** El usuario lo revisó: "el mapa está bien, se excede en el
  terreno; hay que mejorar la estética para que parezca una ciudad: se ve como gráficos ASCII, no hay veredas, no
  hay pasto ni detalles, las calles parecen muy chicas".
  - Nuevo dibujante compartido, `js/view/mapdraw.js`, que después usa el juego.
  - Calles con ancho real (calzada + vereda de cada lado, según el tipo de calle): una calle de barrio mide 11 m
    de calzada más 3,5 m de vereda por lado; las avenidas, 15-18 m más 4-4,5 m.
  - Texturas: asfalto, veredas de baldosas, pasto en los patios y parques, adoquines en las plazas.
  - Marcas: línea amarilla en las avenidas, línea punteada en las calles y sendas peatonales en las esquinas de
    las calles con tránsito.
  - Techos con textura (tejas, chapa acanalada, losa de distintos colores con su borde) y tanque de agua en las
    terrazas. Sombras más largas en los edificios más altos.
  - Árboles en las veredas y en los parques (unos 30.000), y vías del tren con balasto y durmientes.
  - El terreno ahora es un relieve suave encima de todo, no un color propio, y nada se dibuja fuera del cuadrado
    del mapa.
- **2026-11-24: el mapa real, adentro del juego** (pedido: "llevar el mapa al juego").
  - El juego ya no usa la ciudad vieja (1702 edificios y casas inventadas en cada manzana): arma San Miguel con
    `data/map-sanmiguel.js`. Los 54.745 edificios reales son paredes, y no se inventa ninguna casa.
  - Las calles tienen el mismo ancho para caminar que el que se ve (la tabla vive en `js/city.js`; el visor la
    usa también). Los patios entre las casas se caminan, como antes.
  - Se dibuja con el mismo dibujante del visor (`js/view/mapdraw.js`): veredas, sendas peatonales, techos con
    textura, sombras, árboles, tren y el relieve suave. Los autos estacionados siguen siendo del juego y van
    debajo de los árboles.
  - Se arma en 0,7 s; dibujar la pantalla tarda menos de 1 ms. Se comprobó que las paredes coinciden con los
    techos: ninguna celda bajo un techo se camina.
  - Todavía no se entra a los edificios: son paredes. Eso viene con los interiores y escaleras (pasos 3 y 4 de
    `docs/MAPA.md`). Los arroyos todavía no frenan el paso.
  - `data/city-sanmiguel.js` queda en el repo, pero el juego ya no lo carga.
  - Banco solo (`node tools/solo.js 8 25`, mismas partidas): mediana **7:22**, antes 9:41. La ciudad real es
    más cerrada (más paredes y esquinas que la vieja) y el bot aguanta un 24% menos. No se tocaron números.
    Decidido por el usuario: dejarlo así por ahora; el balance se vuelve a medir después de los bordes y de
    Darkwood, porque el mapa cambia otra vez.
- **2026-11-24: el partido de San Miguel entero, con su borde** (pedido: "agrandarlo y delimitar los bordes para
  que sea solo San Miguel"). El usuario eligió el partido (83 km²) y no solo la ciudad (8,3 km²).
  - Se bajó todo de nuevo para el partido: el borde y las calles de OpenStreetMap (`tools/fetch/overpass.js`),
    los edificios, lugares, uso del suelo, agua y tren de Overture, y el terreno (523 pedidos a OpenTopoData).
    El área vive en `tools/fetch/area.json` y todos la leen de ahí. Detalle en `docs/MAPA.md`.
  - El mapa ahora es un rectángulo de 15,9 × 11,8 km recortado al borde del partido: 118.532 edificios, 4510
    calles, 314 plazas, terreno de 0 a 43 m. `data/map-sanmiguel.js` pasó de 3,8 a 9,3 MB.
  - Adentro del borde se camina; afuera no, y se ve oscuro.
  - El armado de la ciudad real se rehízo para que entre en memoria: rellenos por filas, sin guardar copias de
    los edificios, sin grillas de ayuda. Se arma en 0,6 s y usa unos 74 MB (con el método viejo habrían sido
    unos 500 MB). Dibujar la pantalla sigue tardando menos de 1 ms.
  - Dos arreglos que el mapa grande destapó: buscar el lugar libre más cercano miraba el cuadrado entero de cada
    anillo y no solo su borde (un cofre lejos de la calle colgaba el juego); y la partida empezaba en una
    esquina del mapa y recién después te llevaba a la plaza, así que los primeros cofres caían lejos.
  - Banco solo (`node tools/solo.js 8 25`): mediana 8:38 (con el mapa de la ciudad era 7:22), pero dos bots
    aguantaron los 25 minutos con más de 6000 bajas, cosa que antes no pasaba. Lo más probable es que hayan
    llegado a los campos abiertos de Campo de Mayo, donde es fácil escaparse. Se mira cuando se ajuste el balance
    (el usuario decidió no tocarlo por ahora).
- **2026-11-24: modo mapa, sin enemigos** (pedido: "sacá todo lo que son los enemigos por ahora, también el tiempo de
  oleadas; vamos a solo armar el mapa").
  - `L.data.mode.explore` (en `data/guns.js`): sin horda, jefes, oleadas, cofres, santuarios, encargos ni clima, y
  la pantalla no muestra el reloj, la dificultad, las bajas ni el oro. Solo se recorre la ciudad.
  - Nada se borró: con `explore: false` vuelve todo como estaba. Las pruebas y los bancos no usan este modo.
  - Decidido también: por ahora no se prueba la jugabilidad; el mapa se revisa en el visor y con las pruebas de
  la ciudad.
- **2026-11-24: la escala** (el usuario: "los edificios muy pequeños, el jugador muy grande; tiene que ser 1:1").
  Hoy el mundo va a 10 px por metro y el jugador mide 2,8 m de ancho y corre a 21 m/s, unas 5 veces de más.
  Propuesta, en orden: (1) el mundo en metros con la cámara aparte, a 1:1 (jugador de 0,5 m, se ven unos 25-30 m
  alrededor, como Darkwood); (2) el mapa en zonas de 50 m que se arman cerca del jugador, por la memoria y los
  cuelgues; (3) dibujar cada zona una vez y reusarla; (4) recién ahí interiores y escaleras.
- **2026-11-24: escala 1:1 en el mapa real** (pasos 1 y 2 de la propuesta de escala).
  - El mapa real va a 50 px por metro (`mapScale`): el jugador (28 px) mide ~0,55 m y corre a ~4 m/s; la
  pantalla muestra ~25 m. Las ciudades viejas o inventadas siguen a 10 px/m.
  - Paredes en celdas de 0,5 m, en zonas de 32 m que se arman cuando alguien se acerca (máximo 3000 zonas,
  ~12 MB). Se arma en 0,19 s. Los autos se ubican por geometría.
  - Falta: mirarlo en pantalla (texturas a esta escala), y dibujar por zonas guardadas (paso 3).
- **2026-11-24: escala 1:1 terminada** (pedido: "terminar la escala 1:1"; paso 3 de la propuesta de escala).
  - **Dibujar el mapa era lento.** El "menos de 1 ms" de antes medía solo el tiempo de mandar las órdenes de
    dibujo, no el de pintarlas. Pintando de verdad, una pantalla de 1920 × 1080 del mapa real tardaba 60-90 ms
    (unos 11-16 cuadros por segundo). Lo más caro eran las texturas y las formas grandes.
  - **Ahora el mapa va en pedazos de 16 m** (`L.drawMapTiles` en `js/view/city.js`). Cada pedazo se dibuja una
    vez, con el piso, las calles, los autos, los techos, los árboles y el relieve, y después solo se copia. Copiar
    una pantalla tarda unos 12 ms en la misma medición, que es la peor (en la placa de video es casi nada).
    Armar un pedazo tarda unos 16 ms; los de alrededor de la pantalla se preparan cuando el navegador está libre,
    uno cada 0,2 s como mucho. Se guardan los de la pantalla, su borde y algunos más (unos 2,5 MB cada uno).
  - **Texturas finas a escala real** (`js/view/mapdraw.js`): baldosas de vereda de 40 cm, adoquines de 20 cm en
    las plazas, tejas en filas de 30 cm, chapa acanalada cada 10 cm, losas de terraza con junta cada metro, y pasto
    y asfalto con grano fino. Se usan de cerca (20 px por metro o más); el visor alejado sigue con las de antes.
  - La sombra de los autos pasó a medirse en metros (antes eran 3-4 px fijos, que a 1:1 no se veían).
  - Revisado en el navegador: veredas, plaza, casas con tejas y chapa, terrazas, autos y árboles; sin cortes entre
    pedazos y sin errores. El visor del mapa se ve igual que antes.
  - Sigue: entrar a los edificios (interiores y escaleras, pasos 3 y 4 de `docs/MAPA.md`).
- **2026-11-24: capa de arriba** (paso 40 de "Profundidad y altura").
  - El mapa real se dibuja en dos capas de pedazos: el piso (con las sombras de los árboles) debajo de todo, y las
    copas de los árboles encima de los personajes, los bichos y las balas (`L.drawCityOver` en
    `js/view/city.js`, `layer` en `js/view/mapdraw.js`). Los pedazos de arriba sin ningún árbol no guardan imagen.
  - Alrededor de tu personaje las copas se vuelven transparentes en un círculo suave de 1,8 m, así no te perdés
    debajo de un árbol. Un bicho debajo de una copa queda tapado: sirve de escondite para los dos.
  - Los techos siguen en la capa del piso: hoy los edificios son paredes y nadie queda debajo de un techo. Pasan a
    la capa de arriba en el paso 41, cuando tengan altura.
  - Revisado en el navegador: el personaje pasa por debajo de un árbol de la plaza y se lo ve; sin errores.
- **2026-11-24: edificios con altura** (paso 41 de "Profundidad y altura").
  - Los edificios se paran (`L.drawCityBuildings` en `js/view/city.js`): como vistos desde una cámara a 30 m sobre
    el centro de la pantalla, el techo es el contorno agrandado desde el centro según la altura del edificio, y se
    ven las paredes que miran hacia vos. Al caminar, los altos "se inclinan". La altura sale de los pisos (3 m cada
    uno, más el techo); los muy altos se topean en 18 m para que no tapen media pantalla.
  - Paredes de revoque o ladrillo en las casas, hormigón en edificios, oficinas, escuelas y salud, y chapa en
    galpones, industrias, garages y estaciones. Más claras las que miran al sol (del noroeste, como las sombras), y
    con una raya en cada piso para que se lea la altura.
  - El piso de los pedazos guarda solo la base de cada edificio y su sombra; techos y paredes se dibujan en cada
    cuadro encima de personas y bichos, y debajo de las copas. Un bicho detrás de un edificio queda tapado.
  - Los edificios del otro lado del borde del partido quedan planos, en lo oscuro. El visor del mapa no cambia.
  - Revisado en el navegador: se ven las paredes que miran hacia vos, más anchas en los edificios altos y lejanos.
    La altura de cámara (30 m) y el tope (18 m) se pueden ajustar.
- **2026-11-24: casas por dentro, planta baja** (paso 42, primera parte). Pedido del usuario: "que no sean todas
  iguales, distribuí las habitaciones de maneras diferentes, con coherencia, no copiar y pegar".
  - **No hay datos públicos de cómo es cada casa por dentro**, así que cada planta se genera del contorno real, del
    lado que da a la calle y del tamaño (`js/interiors.js`, números en `data/houses.js`). La misma casa siempre sale
    igual; entre vecinas casi no se repiten (en las pruebas, 45 o más distintas de 60).
  - **Cinco maneras de repartir los cuartos**, típicas de acá, según la forma del lote:
    - *Casa chorizo*: galería al costado, living al frente, los cuartos en fila y la cocina al fondo con la puerta
      al patio. Solo en lotes angostos.
    - *Pasillo al medio*: living al frente, pasillo con cuartos de los dos lados, cocina (y a veces lavadero) al
      fondo. Lotes anchos.
    - *Frente y fondo*: living y cocina adelante, dormitorios y baño atrás, con pasillo si hay dos o más.
    - *Living integrado*: un living-cocina grande adelante y los cuartos atrás.
    - *Monoambiente*: un ambiente con el baño en un rincón (casas chicas).
  - Los dormitorios salen de los metros (hasta 45 m² ninguno, después 1, 2, 3 o 4), a veces uno más o uno menos.
    Las proporciones cambian un poco en cada casa, y la mitad sale espejada.
  - **Se camina adentro:** paredes con puertas entre cuartos, puerta de calle (y de atrás desde la cocina). Si frente
    a la puerta hay otra construcción, la puerta pasa a un costado o al fondo. Los bichos también entran.
  - Las casas que entran son las de tipo casa de 25 a 320 m²; galpones, negocios y edificios siguen macizos.
  - **Al entrar**, el techo desaparece: se ven los cuartos con su piso (madera, parquet, cerámica en baño y cocina),
    las paredes, las puertas y el nombre de cada cuarto, y la ciudad de afuera se oscurece. Desde la calle, un
    felpudo marca cada puerta.
  - Cosas que el mapa real obligó a ajustar: muchas casas de San Miguel están giradas respecto de la grilla de
    paso (las calles van en diagonal), y ahí las paredes ocupan más. Por eso los pasillos tienen 1,8 m (una galería)
    y las puertas 1,2 m, los cuartos tienen al menos 2,2 m de lado, cada puerta se abre de pared a pared después de
    levantarlas, y nunca abre hacia la casa de al lado (en los datos, las casas pegadas a veces se pisan un poco).
  - Pruebas nuevas (`tests/houses.test.js`): misma casa igual y variedad entre vecinas; todos los cuartos con
    puerta y la de calle mirando a la calle; más metros, más dormitorios; y en 30 casas reales de San Miguel, desde
    la vereda se llega caminando a cada cuarto y las paredes no se cruzan.
  - Revisado en el navegador: se entra caminando por la puerta a una casa chorizo y a una de pasillo al medio.
  - Sigue: muebles, puertas y ventanas dibujadas, y después escaleras y pisos de arriba.
- **2026-11-24: escaleras fluidas y piso de arriba en las casas de dos pisos** (paso 42, segunda parte, con la
  decisión del usuario de escaleras sin botón).
  - **La escalera** es un tramo recto de 2 × 3,5 m contra una pared del living (o de la cocina), con lugar para
    pararse al pie y un descanso arriba, sin tapar ninguna puerta. Si no entra en ningún lado (pasa en las casas
    de pasillo al medio, con el living ancho y poco profundo), el dormitorio más grande se vuelve el hall de la
    escalera, como en muchas casas reales de dos pisos, y los dormitorios quedan arriba. En las casas de prueba, 4
    de cada 5 de dos pisos tienen escalera.
  - **Se sube caminando**: cada uno (vos y los bichos) lleva su piso y su altura. Sobre la escalera la altura va
    de 0 al pie a 1 arriba, según lo que avanzaste, y pasada la mitad chocás con las paredes de arriba. Abajo la
    baranda cierra los costados y la punta de arriba; arriba cierra los costados y el pie: por el costado no se
    entra.
  - **El piso de arriba** tiene su propia planta (`plan.upper`): un pasillo con el hueco de la escalera y pasillo a
    los dos lados, y los dormitorios y un baño al costado. Arriba los choques no usan la grilla: se calculan contra
    las paredes de ese piso.
  - **Al subir**, la planta de abajo se apaga y la de arriba aparece según tu altura; desde arriba los escalones
    se ven oscurecerse hacia abajo. Un bicho de otro piso se ve medio transparente.
  - **Los bichos suben**: si estás arriba van al pie de tu escalera, suben y te siguen; si están arriba y vos
    abajo, bajan. Las balas y los golpes solo valen entre los que están en el mismo piso.
  - El techo de las casas de dos pisos se dibuja como siempre desde afuera (paso 41).
  - Pruebas nuevas: escalera y planta de arriba con sus cuartos en las casas de dos pisos; en 12 casas reales se
    llega caminando al pie, se sube hasta arriba pasando por la mitad, arriba se llega a cada cuarto y por el
    costado no se entra; y las paredes de abajo no frenan arriba.
  - Revisado en el navegador: se sube y se baja una escalera de a poco, con el cambio de planta gradual.
  - Ajustes por las casas giradas: escalera de 2 m de ancho, y las barandas que caen sobre una pared de la casa no
    se agregan (engrosaban la pared).
  - Sigue: edificios de departamentos (palier, escalera en "U", departamentos por piso), terrazas y sótanos.
- **2026-11-24: edificios de departamentos, terrazas y sótanos** (paso 42, tercera parte).
  - **Cualquier cantidad de pisos.** Antes había planta baja y "arriba"; ahora cada edificio tiene una lista de
    escaleras (cada una une un piso con el de arriba) y una planta por piso: -1 el sótano, 0 la planta baja, 1, 2...
    y la terraza arriba de todo. Cada uno (vos y los bichos) lleva su piso, su altura y la escalera en la que está.
  - **Edificios de departamentos** (104 de los 153 de San Miguel; los demás tienen formas donde no entra el
    núcleo y siguen macizos):
    - en el medio, el **palier** con una **escalera en "U"**: dos tramos uno al lado del otro, uno sube desde los
      pisos pares y el otro desde los impares, así que cada piso llega a una punta del palier. El palier da la
      vuelta alrededor de la escalera;
    - **de 2 a 6 departamentos por piso**, adelante y atrás del palier y al costado si hay lugar. Cada uno se arma
      como una casa (living, cocina, dormitorios y baño) con la puerta al palier. Todos los pisos son iguales, como
      en un edificio de verdad;
    - en la planta baja, el **hall de entrada** desde la puerta de calle hasta el palier, sin pared en el medio;
    - arriba, la **terraza** con la sala de máquinas por donde sale la escalera; abajo, el **sótano** si tiene (la
      mitad de los edificios, según el mapa).
  - **Casas con terraza** (la mitad de las de San Miguel): una escalera sube a la losa, desde el living en las de un
    piso y desde el pasillo o un dormitorio en las de dos. La terraza se camina, cerrada por su murito.
  - **Casas con sótano** (unas 5.000): una escalera baja desde el living o la cocina.
  - Las escaleras nunca se pisan entre sí ni tapan puertas; si no entran, la casa queda sin terraza o sin sótano.
  - Los bichos buscan la escalera que lleva a tu piso, sea arriba o abajo, y la toman piso por piso.
  - Al subir o bajar, el piso que dejás se apaga y el próximo aparece según tu altura (también el sótano).
  - Ajuste por los datos: en el centro, las casas y edificios pegados se pisan un poco, y a veces el que está al
    lado tapaba la puerta de calle. Ahora la puerta se pone donde está libre en todo su ancho.
  - Pruebas nuevas: edificios con escalera en "U" que se alterna, cada cuarto con puerta en cada piso, al menos dos
    departamentos por piso, terraza y sótano; casas que llegan a la terraza y al sótano sin escaleras encimadas;
    y en 5 edificios reales de San Miguel, desde la vereda se sube caminando hasta la terraza, se baja hasta el
    sótano y en el primer piso se llega a cada cuarto.
  - Revisado en el navegador: el hall con la escalera, un piso con los dos tramos y la terraza con la sala de
    máquinas.
  - Sigue: muebles, puertas y ventanas dibujadas; galpones, negocios, escuelas y los demás tipos de edificio.
  - Arreglos después de las pruebas completas: la escalera solo va donde queda lugar para pasar alrededor y se
    sigue llegando a cada puerta del cuarto (una escalera a la terraza dejaba un dormitorio a medio metro de la
    baranda), y un cuarto que el contorno deja más angosto que 1,5 m se suma al de al lado.
- **2026-11-24: se entra a los demás edificios** (paso 42, cuarta parte).
  - **Galpones** (los 29.000 del fondo de los terrenos) y **garages**: un ambiente con su puerta.
  - **Negocios**: el local adelante, el depósito y un baño atrás. Si tienen dos pisos, arriba está la vivienda,
    con su escalera desde el depósito o el local; también pueden tener terraza y sótano.
  - **Fábricas**: una nave grande con una oficina y un baño en una esquina del frente. **Iglesias**: el templo y
    la sacristía al fondo.
  - **Escuelas, salas de salud, oficinas y edificios públicos**: el mismo núcleo que los edificios de
    departamentos (hall, palier, escalera en "U", terraza), pero en cada piso, en vez de departamentos, una fila
    de aulas, consultorios u oficinas con su puerta al palier, y un baño. Si son muy chicos para el núcleo, son
    una nave con su nombre.
  - Las estaciones siguen macizas.
  - Un cuarto que el contorno parte en pedazos separados (una escuela en "U", una casa en L) queda con el pedazo
    más grande, y cada otro pedazo pasa a ser un cuarto propio con su puerta: antes había pedazos a los que no se
    llegaba.
  - Pruebas nuevas: cada tipo con sus cuartos (galpón, negocio con vivienda arriba, fábrica, iglesia, escuela con
    al menos 6 aulas por piso); y en San Miguel, en 3 de cada tipo (galpón, negocio, fábrica, iglesia, escuela,
    salud, oficina) se entra por la puerta y se llega caminando a cada cuarto.
  - Revisado en el navegador: un negocio, una escuela y una fábrica.
  - Sigue: muebles, puertas y ventanas dibujadas; mirar los pisos en el visor del mapa.
- **2026-11-24: pruebas rápidas con un mapa de prueba** (pedido del usuario: "un mapa base de prueba que contenga
  todo lo necesario... así no tardan tanto las pruebas; lo viejo de Lluvia no lo usamos, no hagas pruebas de eso").
  - **Mapa de prueba** (`tests/fixtures/map-prueba.js`, 111 KB contra 9,7 MB del real): un recorte del San Miguel
    real, el centro de 600 m alrededor de la plaza (818 edificios, 230 calles), más 27 lotes copiados de otras
    partes para los tipos que en el centro hay pocos (fábricas, oficinas, escuelas, iglesias, edificios públicos,
    garages, estaciones). Tiene borde, terreno y lugares, como el real. Lo arma `node tools/make-test-map.js`
    desde el mapa real; hay que volver a correrlo si se rehace el mapa.
  - Las pruebas usan ese mapa. Con `REAL=1` usan el partido entero (lento), para una revisión de vez en cuando.
  - **Las pruebas del juego viejo** (duelos, apuestas, 8 jugadores, habilidades, cofres, temporada 2) pasaron a
    `tests/clasico/` y no se corren; con `CLASICO=1` se corren igual. Quedan 20 pruebas: ciudad, casas y edificios,
    y el modo solo con la Glock.
  - **Antes tardaban de 10 minutos a una hora; ahora, unos 30 segundos.**
  - El mapa de prueba encontró dos problemas en edificios del centro que las pruebas de antes no miraban:
    - una casa en L tenía las puertas del baño y de un dormitorio sobre una franja del living de un metro, que las
      paredes se comen. Ahora una puerta va donde de los dos lados hay lugar para pararse (1,5 × 1,5 m); si no hay,
      el cuarto se conecta por otro lado;
    - un edificio con otro pegado al frente no podía tener la puerta de calle en el hall y la ponía en un
      departamento. Ahora, si pasa eso, el edificio prueba con el frente hacia otro lado.
- **2026-11-24: muebles, puertas y ventanas** (pedido del usuario: "Sí, seguí").
  - **Muebles** (`js/furnish.js`, la lista de cada cuarto en `data/houses.js`, `furniture`): cada cuarto tiene lo
    suyo. Dormitorio: cama (de una plaza si no entra la doble), ropero, mesita. Living: sillón, tele, mesa con
    sillas. Cocina: mesada con pileta y hornallas, heladera, mesa. Baño: inodoro, lavatorio, ducha. Terraza: tanque
    de agua y soga. Negocio: mostrador, estantes y góndolas. Fábrica: máquinas y estantes. Iglesia: altar y bancos
    en filas. Escuela: pizarrón, escritorio y pupitres en filas mirando al pizarrón. Y así los demás.
  - Cada mueble va contra una pared o suelto en el medio con lugar alrededor, adentro de su cuarto, sin pisar a
    otro, sin tapar puertas ni escaleras y sin salirse de la pared de afuera en las casas giradas. Siempre los
    mismos en la misma casa; los pisos iguales de un edificio tienen los mismos muebles.
  - **Puertas**: cada puerta se ve con su hoja abierta y el arco que barre; abre hacia el cuarto, no hacia el
    pasillo. La de calle abre para adentro.
  - **Ventanas**: en la pared de afuera de cada cuarto, una cada 4 m (chicas en baños y lavaderos), salvo donde
    hay otro edificio pegado, en la terraza, el sótano, pasillos y palieres.
  - Al principio los muebles solo se dibujaban; ver la entrada siguiente.
  - Pruebas nuevas (`tests/muebles.test.js`): en todo el mapa de prueba, cada mueble adentro de su cuarto, sin
    pisarse, sin tapar puertas ni escaleras; 9 de cada 10 dormitorios con cama, baños con inodoro, cocinas con
    mesada y aulas con pupitres; ventanas sobre la pared de afuera y ninguna en la terraza.
  - Sigue: mirar los pisos en el visor del mapa; después, que los muebles frenen el paso (si se decide).
- **2026-11-24: muebles sólidos** (decisión del usuario: "quiero que todos los muebles y objetos sean objetos
  físicos").
  - Todos los muebles frenan a las personas y a los bichos, y paran las balas, en planta baja y en los pisos de
    arriba. En planta baja entran a la grilla por la que se camina, como las paredes; arriba, cada mueble es una caja
    que se mide justo.
  - Para que un mueble no deje a nadie encerrado, al ubicarlo se revisa que entre las puertas y escaleras del cuarto
    siga habiendo un paso de 1 m, separado de las paredes, y que no corte ningún pedazo del cuarto al que antes se
    llegaba (un escritorio que cierra un rincón). Si cierra algo, se prueba en otro lugar. Un cuarto demasiado
    angosto para ese paso queda sin muebles.
  - Las filas (bancos de iglesia, pupitres, góndolas) dejan 1 m entre una y otra. En los edificios girados la
    grilla de planta baja se come un poco de ese metro, así que entre algunas filas se pasa justo.
  - Prueba nueva: el medio de cada mueble no deja pararse ni pasar una bala, en todos los pisos. Las pruebas de
    caminar hasta cada cuarto siguen pasando con los muebles puestos.
- **2026-11-24: estética a lo Darkwood** (etapa 44; decisión del usuario: "sí, y arrancá").
  - La ciudad se ve con colores gastados: pierde la mitad del color, queda teñida suave por el amarillo enfermo
    del Sol y un poco más oscura y sucia. Encima, un grano de película que se mueve y bordes de pantalla oscuros.
    Solo el mundo: la interfaz queda limpia encima. Los valores están en `data/look.js` (se ajustan sin tocar
    código); lo dibuja `js/view/look.js`.
  - Interfaz chica y callada, arriba a la izquierda: la vida es una barra fina, las vidas son cuadraditos y el
    nivel, una línea finita con el número chico. Las balas, abajo a la derecha, en letra chica y color apagado.
  - El minimapa sigue igual por ahora: se va en la etapa 53 (el mapa sin flecha).
  - Prueba nueva: los valores de `data/look.js` están en rango. Falta medir cuánto cuesta por cuadro en una PC
    común (en la vista de prueba el navegador estaba en segundo plano).
- **2026-11-24: campo de visión** (etapa 45; pedido del usuario: "sí, seguí").
  - Ves un cono de 100° hacia donde apuntás con el mouse, de hasta 38 m, y un círculo chico de 2,5 m alrededor
    tuyo, también a la espalda. El personaje mira siempre hacia la mira.
  - Lo que no ves queda en penumbra: la ciudad se reconoce, pero los zombis y sus tiros no se dibujan.
  - Tapan la vista las paredes de los edificios y de las casas, y los muebles altos (roperos, estantes, heladeras,
    góndolas, máquinas, archiveros, motores, tanques). Por encima de los muebles bajos, los autos estacionados y las
    barandas de las escaleras se ve; por las ventanas, también, de adentro hacia afuera y al revés. Todo eso sigue
    frenando el paso y las balas.
  - En un piso de arriba tapan las paredes de ese piso; por una ventana se ve la calle.
  - Un zombi en otro piso no se ve.
  - Los números están en `data/sight.js`; el cálculo en `js/sight.js`. Calcular lo que se ve lleva 1,3 ms por
    cuadro en el partido entero.
  - Pruebas nuevas (`tests/vista.test.js`): el cono llega lejos y atrás solo lo pegado; las paredes tapan; las
    ventanas, las barandas y las camas dejan ver; los roperos tapan; arriba también tapan las paredes.
- **2026-11-25: el reloj, el día y la noche** (etapa 46; pedido del usuario: "sí, seguí").
  - El juego tiene su hora: 12 horas duran 40 minutos (una hora, 3 min 20 s). Arrancás el día 1 a las 9:00. El sol
    sale a las 6 y se pone a las 18 (las estaciones lo van a correr en la etapa 51); amanecer y atardecer duran un
    poco más de una hora cada uno, con la luz cambiando de a poco y un tinte naranja.
  - De noche la ciudad se oscurece casi del todo. Se ve donde hay luz:
    - **la linterna** (tecla F): alumbra el cono hasta 17 m. Gasta batería prendida y se recarga sola apagada (a
      dínamo: todavía no hay pilas para juntar);
    - **los faroles** de la calle, uno cada 36 m en las veredas, de lados alternados; anda menos de la mitad y
      algunos parpadean;
    - **las casas con luz**: 3 de cada 10 tienen la luz prendida; desde afuera brillan sus ventanas y adentro se ve
      todo el piso.
  - Sin luz, de noche ves hasta 5 m (la luna). Los zombis que estén más lejos y a oscuras no se ven, aunque estén
    en tu cono.
  - En pantalla, debajo de la vida: "☾ Día 1 · 22:00" y, de noche o si la usaste, la batería de la linterna.
  - Los números están en `data/clock.js`; el cálculo en `js/clock.js` y el dibujo en `js/view/night.js`.
  - Queda para más adelante: que las sombras de los edificios giren con el sol (hoy están siempre del mismo lado).
  - Pruebas nuevas (`tests/reloj.test.js`): 12 horas en 40 minutos, día 2 a medianoche, el atardecer sin saltos;
    la linterna se prende y apaga con F, gasta y se recarga; de noche se ve menos que de día; los faroles están en
    la calle y alumbran solo la planta baja.
- **2026-11-25: vuelven los zombis, con el reloj** (etapa 47; pedido del usuario: "sí, seguí").
  - De día salen pocos (uno cada 14 s, hasta 10 a la vez). Al atardecer van saliendo más, y a medianoche llegan a
    uno cada 2 s, hasta 40 a la vez. Cada noche después de la primera suma un 30% a las dos cosas, y los zombis
    son más fuertes: dos escalones de dificultad por noche, más uno mientras está oscuro.
  - A la mañana, los que sobran y están lejos (a más de 30 m) se van de a uno, sin dejar experiencia.
  - Se ven solo dentro de tu cono y con luz (etapas 45 y 46). El minimapa ya no los muestra.
  - Por ahora no hay cofres, santuarios ni encargos: vuelven con "juntar" (etapa 48) o más adelante.
  - Los números están en `data/guns.js` (`nights`). El bot con día y noche: `node tools/solo.js 3 170 noche`
    (tarda: unos 10 minutos por partida de dos días). Falta ajustarlos con lo que mida.
  - Prueba nueva: al mediodía hay pocos, a medianoche muchos, la segunda noche más y más fuertes, y a la mañana
    los de lejos se van.
- **2026-11-25: juntar, primera parte: revisar muebles y la mochila** (etapa 48; pedido del usuario: "con qué
  podés seguir mientras").
  - Manteniendo **E** al lado de un mueble (a menos de 90 cm) lo revisás en 1,4 s, con un círculo que se llena
    alrededor del personaje. Lo que hay va a la mochila, y el mueble queda más apagado, revisado.
  - Qué tiene cada mueble (`data/loot.js`): roperos, trapos, vendas y a veces balas; mesitas y mostradores, balas;
    mesadas y heladeras, comida y botellas; estantes y cajas, chatarra, clavos y tablas; máquinas, motores y
    autos, nafta y chatarra; lavatorios, vendas. Camas, bancos e inodoros no tienen nada. Siempre lo mismo en el
    mismo mueble, y cada mueble se revisa una sola vez.
  - **La mochila** tiene 10 casilleros, abajo a la izquierda, y cada cosa se apila hasta un tope (34 balas, 5
    vendas, 10 trapos...). Lo que no entra se queda en el mueble para volver a buscarlo.
  - **Las balas salen de la mochila** (decisión 2 de Darkwood): arrancás con el cargador lleno y 17 más. Sin balas
    no se recarga y aparece un aviso. Junto al cargador se ve cuántas quedan en la mochila.
  - **H** usa una venda: +30 de vida.
  - Queda para la segunda parte: el arma de mano para cuando no hay balas, y fabricar en el banco de trabajo (vendas,
    molotov, balas, tablas). Hoy la comida, los clavos, la nafta y la chatarra se juntan pero todavía no sirven.
  - Pruebas nuevas (`tests/juntar.test.js`): la mochila apila y se llena; un ropero se revisa con E, una sola vez y
    siempre da lo mismo; soltar E corta; lo que no entra queda en el mueble; la venda cura; recargar usa las
    balas de la mochila y sin balas no recarga.
- **2026-11-25: pantalla de inicio nueva y el personaje como persona** (pedido del usuario: "saca el menú de inicio
  del juego anterior; cambia el círculo del personaje principal por una persona").
  - Al abrir el juego aparece "LLUVIA", una línea sobre San Miguel y el Sol Amarillo, el botón Empezar (o Enter) y
    las teclas. Ya no se elige Paraguas: se juega con el primero. Lo del juego viejo (elegir personaje, Cuaderno,
    Pactos, Partida del día) queda en el código, fuera del menú.
  - En la ciudad tu personaje es una persona vista desde arriba: hombros con campera, cabeza con pelo, los brazos
    hacia la pistola que sostiene con las dos manos, y los pies que dan pasos al caminar. Mira hacia la mira.
- **2026-11-25: zombis que buscan** (etapa 48b; `docs/ZOMBOID.md`, sección 2).
  - Cada zombi deambula despacio (a veces se queda quieto y gira si choca una pared), va a ver de dónde vino un
    ruido y se queda mirando un rato, y te persigue solo si te ve. Si te pierde 4 s, va adonde te vio por última
    vez y busca 7 s.
  - Te ven en un cono de 120°: de día hasta 16 m, de noche 6, pero con la linterna prendida, 24. Paredes y muebles
    altos tapan.
  - Oyen: un tiro a 35 m, revisar un mueble a 2, tus pasos a 3. De noche oyen 1,6 veces más lejos; con una pared en
    el medio, la mitad.
  - El que persigue gruñe cada 3 s y los que están a 12 m van a ver.
  - **Los mismos zombis de día y de noche** (respuesta 9): hasta 30 a la vez, que nacen en la calle a entre 25 y
    60 m, donde no los ves; uno que no te persigue y queda a más de 90 m se va. Por ahora solo zombis normales.
  - Los números están en `data/senses.js` y en `data/guns.js` (`nights`).
  - Pruebas nuevas (`tests/sentidos.test.js`, se corren en el momento de prueba): no te ven de espaldas; de día sí
    a 9 m; de noche no sin luz, con linterna sí; oyen un tiro a 20 m y no tus pasos; el gruñido llama a otros.
- **2026-11-25: tiro a la cabeza y Puntería** (etapa 48c; `docs/ZOMBOID.md`, sección 3).
  - A los zombis normales solo los mata una bala que pasa por su cabeza (el círculo de piel del lado hacia donde
    miran). Un tiro en el cuerpo los frena 1 s, a veces los tira al piso (más de cerca) o los hace tambalear, y
    después van hacia donde vino el tiro.
  - **Apuntar:** con el clic derecho apretado te quedás quieto y la mira se cierra de a poco; caminar la abre, y cada
    tiro la abre un poco. El círculo de la mira muestra hasta dónde pueden ir las balas.
  - **Puntería** (primera habilidad, `data/skills.js`): 10 niveles. Un tiro en la cabeza da 10 de experiencia, uno en
    el cuerpo, 2. Cada nivel cierra la mira más rápido y más chica, y agranda la cabeza para tus balas hasta 1,6
    veces. Se ve arriba a la izquierda, al lado de la hora.
  - Pruebas nuevas (`tests/punteria.test.js`, para el momento de prueba): la Puntería sube y se frena en 10; apuntar
    cierra, caminar abre, más nivel cierra más; la bala tiene que pasar por la cabeza y la Puntería la agranda.
- **2026-11-25: armas de mano** (etapa 48d; `docs/ZOMBOID.md`, sección 1 y respuestas 2 a 4).
  - 26 armas en `data/melee.js`: piñas (siempre), puños vendados, puño con cinturón, puño americano, tenedor,
    cuchillo, cuchilla de asado, rodillo, sartén, pava, sifón, ladrillo, martillo, destornillador, llave inglesa,
    barra de metal, fierro de construcción, palita de barrer, palo de escoba, palo de hockey, matafuegos, pala,
    rastrillo, cadena de bicicleta, machete y hacha.
  - Cada una tiene daño, alcance, velocidad, cuántos golpes aguanta (según qué tan frágil es: la palita 10, la barra
    300), chance de voltear, ruido y aire por golpe. Su daño se reparte en contundente, cortante y punzante; el
    zombi normal recibe un poco más de lo cortante y un poco menos de lo punzante.
  - **Habilidades de pelea** (`data/skills.js`, 10 niveles): cuerpo a cuerpo (todos los golpes: más daño, menos
    aire) y sus ramas, combate a mano, arma corta y media distancia. Cada golpe y cada muerte dan experiencia.
  - A piñas un zombi normal necesita unos 15 golpes (8 con la habilidad al máximo), y a veces te lastimás las manos.
    Con un hacha, uno o dos golpes. Un zombi volteado recibe el doble.
  - **1** saca la pistola, **2** el arma de mano; con el arma de mano en la mano, **2** de nuevo la cambia por la
    siguiente de la mochila. El clic izquierdo pega hacia la mira. Cuando un arma se rompe quedás a piñas.
  - Se encuentran revisando muebles: los cuchillos, la sartén y la pava en las mesadas; la escoba y la palita en el
    lavadero; el cinturón en los roperos; martillos, llaves y barras en estantes y en el taller de los galpones
    (el banco de trabajo ahora se llama "taller", para que no se confunda con los bancos de la iglesia); el
    matafuegos en las salas de máquinas.
  - En pantalla: el aire, una barra al lado de la vida; abajo a la derecha, el arma, su habilidad y su desgaste.
  - Pruebas nuevas (`tests/armas.test.js`, para el momento de prueba).
- **2026-11-25: fabricar y el molotov** (etapa 48e).
  - **Tab** abre la lista de lo que se puede hacer (el juego espera mientras está abierta); se fabrica con un clic o
    con el número. Cada línea dice qué usa y, si no se puede, por qué.
  - En cualquier lado: venda (2 trapos), puños vendados (1 venda), botella rota (1 botella, un arma de mano nueva),
    molotov (botella, trapo y nafta). Al lado de un taller: 5 balas con 2 de chatarra y 2 tablas con clavos y
    chatarra (las tablas sirven para las barricadas de la etapa 49).
  - **G** tira un molotov hacia la mira, hasta 12 m (se frena en la primera pared): estalla en un fuego de 2,2 m
    que dura 8 s y quema a los zombis que pisan (el fuego sí los mata, no solo la cabeza) y a vos si te metés. Se
    oye a 14 m.
  - Los números están en `data/craft.js`.
- **2026-11-25: momento de prueba de la etapa 48** (lo acordado con el usuario: probar todo junto en momentos
  fijos). Pasan las 41 pruebas; las dos que fallaron eran pruebas viejas que no sabían que los muebles ahora también
  dan armas, y se corrigieron.
- **2026-11-25: inventario, correr, piñas con las dos manos, menús, sonidos y el cielo** (pedido del usuario:
  "agregale un inventario, lo que pueda llevar una persona normal en el cuerpo, y metamos mochilas, bolsos y
  riñoneras; mejorá los menús e interfaces; agregá sonidos; la lluvia es negra, las nubes blancas y el sol atrás
  brillando con un amarillo tétrico y violáceo"; y después: "el personaje necesita correr; peleando a mano, un clic
  da con una mano y el otro con la otra; los dos al mismo tiempo empuja").
  - **Lo que llevás encima** (`data/loot.js`, `containers`): arrancás con los bolsillos (4 lugares) y una riñonera
    (4), donde solo entran cosas chicas. En los muebles aparecen un **bolso** (8 lugares, te frena un 6%) y una
    **mochila** (12, te frena un 3%), donde entran también las grandes: tablas, bidones de nafta y las armas largas.
    Una de cada tipo; si encontrás otra igual, queda en el mueble.
  - **Inventario (I):** tus manos (la pistola y el arma de mano, con su desgaste) y cada lugar con lo que tiene.
    Un clic usa (la venda cura, el arma va a la mano) y la ✕ lo tira. En la pantalla del juego, abajo a la izquierda,
    se ven los lugares con sus casilleros.
  - **Correr (Shift):** 1,6 veces más rápido, gasta aire y hace ruido (8 m en vez de 3).
  - **A mano:** el clic izquierdo pega con una mano y el derecho con la otra, cada una a su ritmo; los dos juntos
    empujan (cualquier arma de mano): los zombis de adelante van para atrás 80 cm, se frenan y a veces caen. No
    lastima.
  - **Menús:** colores de Darkwood (marrones, dorado gastado, letra con serifa en los títulos), la pausa con todas las
    teclas, la pantalla de inicio con los controles nuevos.
  - **Sonidos** (hechos con el navegador, sin archivos): el disparo de la Glock, la recarga, el clic sin balas, la
    bala que pega en el cuerpo y en la cabeza, tus pasos (más fuertes corriendo), el arrastre del zombi más cercano
    a menos de 9 m, los gruñidos, el golpe al aire y el que pega, el empujón, un arma que se rompe, revisar un
    mueble, fabricar y el molotov que estalla. La lluvia del juego viejo ya no suena en la ciudad.
  - **El cielo** (`docs/LORE.md`): nubes blancas, el sol amarillo tétrico y violáceo detrás, la lluvia negra (para el
    clima, etapa 50). En la pantalla, un toque violeta en las sombras (`data/look.js`).
  - Pasan las 42 pruebas.
- **2026-11-25: peso, hambre y sed, una vida, experiencia sin juntar, objetos en los muebles, golpe preparado**
  (respuestas del usuario de ese día).
  - **Solo bolsillos al empezar.** La riñonera, el bolso y la mochila se encuentran.
  - **Peso** (`data/loot.js`, `carry`): cada cosa pesa (una bala 12 g, una tabla 1,5 kg, un bidón 3 kg, una barra de
    metal 2,5 kg, la Glock 0,8 kg...). Hasta 8 kg vas normal; cada kilo de más te frena un 6% (hasta 60%) y correr
    te cansa más. El peso se ve abajo de la hora y en el inventario.
  - **Agua cada 6 horas y comida cada 12** (`data/needs.js`): si tenés botellas de agua (heladeras, mesadas,
    góndolas) o latas, se consumen solas; también desde el inventario. Tomar deja la botella vacía (sirve para el
    molotov). Un día sin comer (o 12 horas sin tomar) no hace nada; después el malestar crece. Con malestar y
    nervioso (un zombi persiguiéndote a menos de 12 m, o recién lastimado) te puede bajar la presión: te desmayás
    4 s sin poder moverte ni pegar. Más malestar, más chance.
  - **Una sola vida.**
  - **La experiencia llega sola:** al matar (los zombis ya no sueltan gemas) y al hacer cosas (cada golpe, cada
    tiro que suma Puntería, cada cosa fabricada).
  - **Objetos especiales en los muebles:** a veces un ropero, una mesita, una mesa, un escritorio o un archivero
    tiene uno (casi siempre común, a veces raro, rara vez legendario). Es tuyo al instante y se apila.
  - **Golpe preparado:** con un arma de media distancia, mantener el clic derecho carga el golpe en 0,8 s (caminás a
    mitad de velocidad); el próximo golpe pega hasta 60% más y voltea el doble.
  - **Sonidos:** siguen hechos por el programa. Bajar sonidos grabados de internet necesita que apruebes cada
    archivo (nombre, de dónde y cuánto pesa); queda en la lista de puntos.
  - **Pruebas de la tanda:** las 45 pruebas (nuevas: peso, una vida, experiencia directa, comer y tomar, desmayo,
    objetos en muebles, golpe preparado) y una partida corta con el bot (4 minutos, sin errores).
- **2026-11-25: el clima, la inundación, cubrirse y rellenar botellas** (etapa 50 y respuestas del usuario).
  - **El clima** (`data/weather.js`) cambia solo cada 1 a 7 horas del juego, nunca dos veces igual seguido, y el
    cambio tarda media hora en llegar. Se ve al lado de la hora:
    - **despejado**;
    - **nublado:** el día un poco más oscuro;
    - **lluvia negra:** gotas negras cayendo, se oye, ves un poco menos y tus pasos se oyen menos;
    - **tormenta:** más oscura y más lluvia, rayos cada 7 a 18 s que iluminan todo un instante (y se ven los
      zombis), truenos;
    - **niebla:** ves menos de la mitad y los zombis también;
    - **calor:** el aire vuelve más lento, correr cansa más y te da sed más rápido;
    - **frío:** te da hambre más rápido, y de noche afuera perdés 4 de vida por hora (adentro de una casa, no).
    Por ahora sin estaciones: cada tipo tiene su chance fija.
  - **La inundación:** mientras llueve, el agua sube en lo más bajo del terreno real (hasta 3 m sobre el punto más
    bajo del mapa) y baja cuando para. Se ve agua oscura en el piso, con anillos donde cae la lluvia. Caminar en el
    agua te frena (más cuanto más hondo), y a los zombis también.
  - **Cubrirse (Espacio):** frena parte del golpe de un zombi que viene de adelante (la mitad a mano, más con un arma
    corta, 80% con una larga), pagado con aire; caminás a mitad de velocidad. Se ven los brazos arriba.
  - **Rellenar botellas:** una pileta, un lavatorio o una mesada ya revisados, con botellas vacías encima: E las
    llena de agua.
  - Pruebas: 48 (nuevas: el clima cambia, niebla y lluvia achican la vista, el rayo ilumina, el frío lastima de
    noche afuera, la inundación sube en lo bajo y no en lo alto y baja al parar, cubrirse frena, la pileta llena
    botellas) y una partida corta con el bot.
- **2026-11-25: el cuerpo — energía y sueño, manos y mochila, tirar al piso, salud, morir, estaciones** (etapas
  54 a 59, pedido del usuario después de probarlo; todo en `docs/CUERPO.md`).
  - **Energía y dormir (Z):** la barra baja con las horas despierto (más rápido corriendo). Con poca energía el aire
    vuelve más lento y alcanza para menos; con sueño ves menos lejos. Z te acuesta: en una cama descansás el doble
    que en el piso. Dormido, el reloj corre 60 veces más rápido; un zombi cerca o un golpe te despiertan. Si te
    acostaste comido y tomado y dormiste al menos 3 horas, la barra llega al doble y baja más despacio. Sin sueño
    ni heridas no te deja acostarte.
  - **Manos, bolsillos y mochila:** 2 manos (izquierda y derecha). Una cosa de una mano en cada una, o una larga en
    las dos. El clic izquierdo pega con la mano derecha y el derecho con la izquierda; una mano vacía es un puño, y
    una con agua no pega. 1 saca la pistola y lo que tenías espera a un lado; 2 lo devuelve. Hay 2 bolsillos para
    cosas chicas (se empieza con la pistola y las balas). La comida y el agua van en la mochila o un bolso, se ven
    como "agua para 18 h, comida para 24 h", y sin bolso van a una mano vacía.
  - **Tirar y el menú de clic derecho:** en el inventario, el clic hace lo primero que se puede y el clic derecho
    abre todas las opciones según la cosa (el agua: Tomar, Llevar en la mano, Tirar). Lo tirado queda en el piso,
    se ve, y E lo junta.
  - **Salud (K: estado):**
    - los zombis dejan heridas: un corte o un puntazo sangra y se puede infectar, un golpe te frena;
    - cada herida baja la vida máxima, y sangrar la sigue bajando hasta vendarte;
    - el kit casero (se fabrica) congela la vida máxima 1 día y el de farmacia 36 horas; la venda o el trapo solos
      paran el sangrado, pero suben el riesgo de infección;
    - el alcohol o el sanitizante antes de vendar bajan mucho la infección;
    - la infección aparece a las 4 horas; sin tratar, a las 24 viene la fiebre. El antibiótico son 4 dosis cada 8
      horas: la primera la tomás vos y las demás se toman solas, dormido también. Puede curarse antes o resistir;
    - con defensas altas cuesta más infectarse y te podés curar solo;
    - el paracetamol saca la lentitud de los golpes;
    - para recuperar la vida máxima: sin infección, sin sangrar, con paracetamol, comido y tomado, dormís un día;
    - el botiquín trae 4 kits, 16 antibióticos y 16 paracetamoles;
    - farmacias: el 15% de los locales, siempre los mismos. Los consultorios y los baños también tienen algo;
    - el borde de la pantalla late rojo si sangrás y se pone verdoso con la infección.
  - **Morir:** te despertás donde dormiste por última vez (o en la plaza), entero. Tu cuerpo queda donde caíste con
    todo menos la pistola, y E sobre el cuerpo te devuelve tus cosas. La partida sigue.
  - **Estaciones:** de 7 días cada una, empezando por el otoño. Cambian la hora a la que sale y se pone el sol
    (verano de 5:30 a 19:30, invierno de 7:30 a 17:30) y el clima más probable (en verano no hay frío, en invierno
    no hay calor). Se ven al lado de la hora.
  - Arreglado: el aviso viejo "perdiste una vida y la mitad del oro" salía al empezar.
  - Pruebas: 59 (nuevas: dormir, manos, salud, morir, estaciones), una partida de 4 minutos con el bot y una
    mirada en el navegador (inventario, menú, estado, cosas en el piso).
- **2026-11-25: Sol Loco — aire, nombre, lore y guardar** (etapas 60 y 61).
  - **Aire:** dura un 30% más y vuelve un 30% más rápido.
  - **Nombre:** la pantalla de inicio dice SOL LOCO, con una línea del lore nuevo (`docs/LORE.md`).
  - **Guardar:** al acostarte en una cama se guarda la partida (en el piso no). En la pantalla de inicio aparece
    **Continuar** (y Enter también continúa): volvés despierto al lado de la cama, a esa hora, con todo lo que
    tenías (mochila, manos, heridas, energía, nivel, habilidades, la mejora de la pistola, los muebles revisados,
    tu cuerpo si habías muerto). Los zombis no se guardan: vienen otros. "Empezar de nuevo" arranca otra partida, y
    la guardada se reemplaza la próxima vez que dormís en una cama.
  - Pruebas: una nueva (guardar) y una mirada en el navegador (guardar, recargar la página, Continuar).
- **2026-11-25: la ropa** (etapa 62; todo en `docs/CUERPO.md`, sección 8).
  - 24 prendas en 7 lugares del cuerpo. Cada una abriga y frena algunas heridas; se gastan y se rompen.
  - El frío y el calor dependen de lo que tenés puesto: con frío, más hambre; helado, perdés vida; con calor, más sed
    y menos aire.
  - La lluvia moja, y mojada la ropa abriga menos.
  - Está en los roperos (lo que no te ponés queda en el piso), lavarropas, talleres, cajas y autos.
  - Pruebas: 64 (nuevas: cuatro de ropa; cambiaron clima, inventario y revisar muebles), el bot 2 minutos y una
    mirada en el navegador (el recuadro Ropa del inventario, ponerse el camperón, la ropa en el piso).
- **2026-11-25: sonido con dirección** (etapa 63).
  - Cada ruido del mundo (zombis que gimen o caminan, golpes, tiros, muebles revisados, vidrios) suena del lado de
    donde viene: a la izquierda de la pantalla, por el parlante izquierdo.
  - Suena más bajo cuanto más lejos (se deja de oír a los 30 m) y la mitad si hay una pared en el medio.
  - Lo tuyo suena al medio. Sin marcas en la pantalla, como pidió el usuario.
  - Pruebas: 65 (nueva: oído) y una mirada en el navegador (el ruido de la izquierda sale por la izquierda).
- **2026-11-25: el mapa que recuerda** (etapa 64, respuesta 8 del usuario).
  - La ciudad está partida en cuadrados de 8 m. Lo que entra en lo que ves en ese momento (más lejos de día, menos de
    noche o con niebla) queda marcado como visto.
  - El minimapa muestra solo lo que ya viste; lo demás es oscuro.
  - **M abre el mapa grande** (el juego espera): todo lo que recorriste, el porcentaje de San Miguel que conocés, dónde
    estás, dónde dormiste por última vez y tu cuerpo si moriste. Con la rueda se acerca y aleja, y se arrastra.
  - Se guarda con la partida (al dormir en una cama).
  - **Cambio de tecla (lo decidí yo):** el sonido se apaga ahora con la O, porque la M es el mapa.
  - Queda para más adelante la niebla de guerra y cargar el mapa de a partes.
  - Pruebas: 66 (nueva: mapa) y una mirada en el navegador (minimapa, mapa grande, M sin apagar el sonido).
- **2026-11-25: niebla de guerra adentro y casas en el mapa** (pedido del usuario después de probar la etapa 64).
  - Al entrar a un edificio, el interior está tapado. Lo que alcanza tu vista (el cono hacia donde mirás, lo que
    tenés pegado y lo que alumbra la luz o la linterna) se destapa y queda recordado, también al salir. Cada piso se
    recuerda aparte. Los nombres de las habitaciones que no viste no aparecen.
  - El minimapa y el mapa grande dibujan las casas, y adentro las habitaciones que recorriste (con sus paredes) del
    piso donde estás, o la planta baja. Antes quedaba oscuro porque solo había calles.
  - Se guarda con la partida.
  - Pruebas: 67 (nueva: adentro se ve solo lo que alumbra tu vista) y una mirada en el navegador.
- **2026-11-25: etapa 65, la barrera negra** (`data/barrier.js`, `js/barrier.js`).
  - El borde del partido, que ya no se podía cruzar, ahora es un muro negro con brillo violeta y humo, que se ve a
    través de la oscuridad (así de noche sabés dónde termina la ciudad).
  - A menos de 150 m hay más zombis: en la pared misma, 2,5 veces más. Parte de los nuevos salen de la barrera, a
    tu vista, con un gemido y una nube oscura.
  - La primera vez que te acercás te avisa qué es; eso se guarda con la partida.
  - Pruebas: 69 (nuevas: dónde está y que se guarda; más zombis cerca y que salen de ella).
- **2026-11-25: etapa 66, refugio y barricadas** (`data/barricade.js`, `js/barricade.js`).
  - En una puerta o ventana de planta baja: **E clava una tabla** (hace falta 1 tabla, 2 clavos y un martillo; hace
    ruido y atrae zombis). Entran 3 tablas en una puerta y 2 en una ventana. **X saca una tabla** con el martillo
    (recuperás la tabla, los clavos no).
  - Sin tablas, **E traba la puerta corriendo un mueble pesado** que esté cerca (ropero, heladera, estante, sillón,
    mesa...). X lo vuelve a su lugar. El mueble trabando no se puede revisar.
  - **Los zombis golpean**: los que te persiguen o vienen por un ruido que oyeron adentro van a la puerta o ventana
    cerrada más cercana y le pegan hasta romperla: primero las tablas (de a una), el mueble (queda roto) o el vidrio.
    Por una ventana rota se pasa (ellos y vos). Al golpear hacen ruido y llaman a otros.
  - Todo se guarda con la partida; una partida nueva arranca sin barricadas.
  - Decisión mía: las ventanas sanas ya no dejaban pasar a nadie; ahora los zombis pueden romperlas.
  - Pruebas: 73 (nuevas: clavar y sacar tablas, trabar con un mueble, zombis que rompen tablas y vidrios, guardar).
- **2026-11-25: trabarse en una pared, menú de pruebas y revisión** (el usuario se quedó trabado probando; dijo
  que sí al menú de pruebas y a revisar el código cada tanto).
  - Un bot (`node tools/stuck.js`) caminó por calles, casas y escaleras del mapa entero y no se trabó nunca. Lo que
    te mete en una pared viene de otra cosa (un empujón, una escalera, algo que aparece debajo tuyo). Ahora, si
    intentás caminar y no hay para dónde, el juego te saca al lugar libre más cercano. También en un piso de arriba.
  - Arreglado: guardar acostado en una casa rompía el guardado (la casa se guardaba entera). Ahora se guarda su número.
  - **Menú de pruebas (F2):** moverte (destrabarte, a la plaza, a una casa, a una de dos pisos, a la barrera), darte
    cosas (para trabar puertas, comida, curarte, abrigo, armas), la hora, el clima, invencible, curarte todo, sacar
    los zombis de cerca y destapar el mapa. Abajo dice dónde estás, para pasarle a Claude si algo anda mal.
  - Revisión del código de hoy: los zombis que oían un ruido adentro no llegaban a golpear la puerta; un zombi parado
    en la puerta quedaba metido en la tabla; se podía trabar con un mueble desde afuera. Los tres arreglados.
  - Pruebas: 77.
- **2026-11-25 (tercera tanda):**
  - Prueba en el navegador de lo de ayer (la hace Claude): clavar tablas, el zombi que oye, golpea y rompe la puerta
    (dos tablas en unos 30 s), la barrera y destrabarse. Todo anduvo.
  - **Etapa 68, el refugio de la Catedral:** arrancás adentro, con las 13 ventanas trabadas y la puerta libre;
    traés mochila, martillo, 3 tablas y 8 clavos. Los zombis nunca aparecen adentro. Si te noquean sin haber dormido
    en otro lado, te despertás ahí. La reputación con el refugio se ve abajo a la izquierda ("En la Catedral confían
    en vos"); caer la baja 8, y 7 más si fue cerca (te vieron); cada día sin caer sube 3. La Catedral está marcada
    en el mapa (cruz dorada en el minimapa, y en el mapa grande). En el menú F2: "Al refugio".
  - Pruebas: 81.
  - **Pedido del usuario: la ventana del mueble, como Project Zomboid.** Al revisar un mueble se abre una ventana:
    a la izquierda lo que tiene, a la derecha lo que llevás. Clic en lo del mueble: te lo llevás; "Tomar todo";
    clic en lo tuyo: lo dejás guardado en el mueble (la pistola no). Un mueble ya revisado se abre al toque con E.
    E o Esc cierra; el juego espera mientras está abierta. Los muebles no tienen límite de lugar por ahora.
  - Pruebas: 84.
  - **Etapa 69, sobrevivientes:** en algunas casas (1 de cada 20, siempre las mismas) hay alguien encerrado, con la
    puerta trabada desde adentro: te acercás a la puerta y con E golpeás y hablás. De día aparece gente en la calle
    (hasta 2, fuera de tu vista), que camina un poco y se va si te alejás. Cada uno te pide algo (comida, agua,
    vendas, tablas, clavos, remedios, un arma...) y te da otra cosa (balas, comida, ropa, un arma...). Se lo das
    desde la ventana de la charla; ayudar a alguien sube la confianza de la Catedral. En F2: "A un sobreviviente".
    Todavía no: pegarles (71), que enloquezcan (72).
  - Pruebas: 88.
  - **Etapa 70, mandarlos a la Catedral o que te acompañen:** después de ayudar a alguien, en la charla aparecen
    "Que te acompañe" y "Mandarlo a la Catedral". El que mandás camina hasta allá (no lo ves; tarda según la
    distancia), llega y vive adentro; cada mañana la gente de la Catedral pide algo (comida, agua, vendas, tablas...)
    y dárselo sube la confianza. El que te acompaña sale de su casa, te sigue de cerca, te alcanza si te alejás o te
    perdés de vista, y le pega a los zombis que tiene al lado; le podés decir "Que espere acá". Para hablarle tenés
    que mirarlo (si no, la E sería siempre para él). Abajo a la izquierda: cuántos viven en la Catedral y cuántos te
    acompañan. Arreglado: el menú F2 tiraba al piso una mochila repetida y eso rompía el dibujo.
  - Pruebas: 91.
- **2026-11-24: pedidos del usuario para después** (anotados, no empezados):
  - *(lista armada y decidida: `docs/DARKWOOD.md`; las etapas, abajo)* **Darkwood como referencia, en la estética y en
    las mecánicas**: "la estética que vamos a buscar replicar es
    la del Darkwood, en mecánicas también". Antes de tocar nada, armar una lista de qué se toma (vista desde
    arriba con campo de visión, oscuridad, sonido, armado de defensas, día y noche...) y qué no, con la regla de
    la casa: mecánicas sí, contenido no.
  - *(hecho, ver arriba)* Afinar el mapa: agrandarlo y que sea solo San Miguel.
