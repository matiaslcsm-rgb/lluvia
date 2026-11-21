# Diseño

Todos los números son **provisorios**: se ajustan con partidas simuladas cuando exista el banco.

## En una frase
8 jugadores (vos + 7 de la IA), cada uno aguantando hordas en su arena y armando un personaje cada vez más roto.
Cada tanto, dos se enfrentan en un duelo con reglas locas mientras los demás apuestan. Gana el último en pie.

## La partida
- Dura **20-25 minutos**.
- Se repite un ciclo: **2 minutos de horda → apuestas (15 s) → duelo (hasta 60 s)**. Mientras dos pelean, los demás
  siguen en su horda.
- Cada jugador arranca con **3 vidas**. Sin vidas, quedás afuera (y podés seguir apostando como espectador).
- Cuando quedan dos, se terminan las hordas: duelos seguidos hasta que uno se queda sin vidas.

## Controles
- **Moverse:** WASD o flechas. Es lo único que hacés todo el tiempo; los ataques salen solos.
- **Ulti:** Espacio, apunta hacia el mouse. Tiene recarga larga (30 a 55 s) y arranca a media carga. Sirve también
  en los duelos. Cada personaje tiene la suya:
  - Brasa: **Lluvia de fuego**, 6 meteoros alrededor de donde apuntás.
  - Roca: **Terremoto**, golpea todo lo cercano y lo aturde 2,5 s.
  - Filo: **Corte**, un salto que corta lo que cruza (sin recibir daño mientras salta).
  - Ceniza: **Haz**, una línea de energía larguísima.
  - Musgo: **Raíces**, atrapa a los cercanos 3 s y te cura un 30%.
  - Marea: **Resaca**, arrastra a todos los cercanos a donde apuntás, los golpea y los aturde.
  - Óxido: **Chatarra**, 20 esquirlas en todas direcciones que atraviesan.
  - Faro: **Destello**, aturde 2 s a todo lo que se ve.
- **Sonido:** M lo prende y lo apaga; el volumen se cambia en la pausa.
- **Apostar:** Q y E (ver Apuestas).

## La horda (tu arena)
- Los enemigos aparecen desde los bordes y vienen hacia vos. Cuanto más avanza el reloj, más y más fuertes.
- Matar deja **experiencia** (hay que juntarla caminando encima) y a veces **oro**.
- Aparece un **jefe** a los 2:30 y después cada 3 minutos, rotando entre tres: **Coloso del Diluvio** (grande y
  lento), **Reina del Granizo** (se queda lejos y dispara abanicos de granizo) y **Leviatán del desagüe** (se
  agazapa, marca con una línea roja hacia dónde va y embiste). Al matarlo deja un cofre gratis que nunca da comunes.
- Criaturas con comportamiento propio: **Escupelodo** (dispara barro desde lejos), **Charco madre** (se parte en
  tres Gotitas), **Tronador** (kamikaze; si lo matás antes, explota sobre los suyos). **Élites** doradas desde el
  minuto 6: más duras, más oro, a veces un cofre gratis.
- **Eventos de tormenta** cada minuto desde el 2:45: Cerco, Estampida, Tormenta eléctrica, Marea y Lluvia de lodo.
  Nunca el mismo dos veces seguidas. Los nombres y el porqué de todo están en `docs/LORE.md`.
- Desde el minuto 7 llegan los **cazadores**, rápidos: no se puede escapar corriendo para siempre.
- **Morir en la horda:** perdés una vida y la mitad del oro que llevás, y volvés a los 5 segundos. Al volver tenés
  2 segundos de invulnerabilidad y se van los enemigos que tenías encima (el jefe no).
- Mientras elegís una mejora, toda la partida espera (las arenas de los rivales también).

## Habilidades (al subir de nivel)
- Al subir de nivel elegís **1 de 3**: una habilidad nueva o subir una que ya tenés (hasta nivel 5).
- Las habilidades salen de un montón mezclado de muchos personajes, como en *Custom Hero Chaos*.
- **5 ranuras** de habilidades automáticas + **1 ulti**, y **4 ranuras de pasivas** (más velocidad, más vida, más
  daño...). Se arranca eligiendo 1 de 3 personajes, que da la primera
  habilidad y las estadísticas base.
- Hay 8 personajes (Brasa, Roca, Filo, Ceniza, Musgo, Marea, Óxido y Faro) y 11 habilidades: Chispa, Lanza, Temblor,
  Cuchillas, Niebla ácida, Rayo, Escarcha (deja lentos), Meteoro, Ola (va y vuelve), Torreta (dispara sola) y Haz
  giratorio. Cada una tiene su fusión (Ola + Ascua = Tsunami, Torreta + Cristal = Fortaleza, Haz giratorio + Lupa =
  Faro mayor, además de las 8 de antes).
- **Fusiones:** habilidad al nivel 5 + su ítem = aparece la fusión al subir de nivel (siempre entre las opciones), y
  reemplaza a la habilidad por una versión mucho más fuerte:
  Chispa + Eco = Enjambre de chispas · Lanza + Afilador = Lanza real · Temblor + Vendas = Cataclismo ·
  Cuchillas + Pluma = Torbellino · Niebla ácida + Colmillo = Pantano · Rayo + Arpa de chispas = Tormenta ·
  Escarcha + Escudo = Glaciar · Meteoro + Mecha = Apocalipsis.

## Ítems (con oro)
- En la arena siempre hay **6 cofres**. Se abren solos al tocarlos si te alcanza el oro, y aparece otro en su lugar.
  Unas flechas en el borde de la pantalla marcan los más cercanos.
- El precio sube con el reloj (×1,25 por escalón) un poco más rápido que el oro por baja (×1,1), así que los ítems
  llegan a un ritmo parejo: más o menos uno por minuto.
- Qué sale: 79% común, 20% raro, 1% legendario.
- Los ítems **se apilan sin límite**: tener tres iguales triplica el efecto (o lo suma con rendimientos decrecientes).
- Rarezas: **común** (blanco), **raro** (verde), **legendario** (rojo).
- Muchos ítems disparan efectos al pegar ("10% de tirar un rayo"), y esos efectos pueden disparar otros. De ahí sale
  la sensación de quedar roto. Para que no se repita para siempre, la cadena corta a los 3 eslabones.
- Los golpes débiles y seguidos (aura, cuchillas) disparan efectos menos seguido que los fuertes.
- Hay 16: Pluma, Afilador, Reloj de arena, Vendas, Cristal, Lupa, Escudo y Mecha (comunes); Arpa de chispas, Ascua,
  Colmillo, Eco y Trébol (raros); Corona de tormenta, Espejo y Fénix (legendarios). El detalle está en
  `data/items.js`. El Fénix es especial: la próxima vez que caigas en la horda te salva la vida, y se gasta.

## El reloj de dificultad
- Sube un escalón **cada minuto**, igual para todos.
- Cada escalón: los enemigos tienen más vida (×1,22, se va multiplicando), más daño (+30%) y un poco más de
  velocidad (+3%, hasta +60%), aparecen más seguido y los cofres cuestan más.
- Desde el minuto 8 la vida de los enemigos crece todavía más rápido (otro ×1,5 por minuto): al que se volvió
  imparable la horda lo termina alcanzando, y la partida dura unos 25 minutos (medido con el banco).
- Idea: quedarse quieto juntando no sirve; hay que crecer más rápido que el reloj.

## Duelos
- Se elige a dos jugadores (se prioriza a los que pelearon menos).
- Pelean en una arena aparte con todo lo que tienen. Hasta 60 s; si nadie murió, gana el que tiene más % de vida.
- **El perdedor pierde 1 vida. El ganador se lleva un premio de oro** (30, que crece con el reloj como el oro por
  baja).
- El duelo tiene su propia vida (vida máxima × 3, y crece con el reloj igual que la de los enemigos), así que dura
  parecido al principio y al final, y no toca tu vida de la horda. Mientras peleás, tu arena espera; al volver
  tenés 2 segundos de invulnerabilidad.
- Ves el duelo en pantalla completa si peleás vos; si no, arriba a la izquierda se ve quién pelea y cómo va.
- **Peleas locas:** cada duelo sale con una regla al azar. Hoy hay 6:
  - **Gigantes:** los dos enormes, con más vida y más lentos.
  - **Piso de lava:** la lava se va cerrando y afuera del círculo te quemás.
  - **A toda velocidad:** todo pasa al doble de rápido.
  - **De cristal:** los dos con la mitad de vida.
  - **Vampiros:** cada golpe te cura un cuarto del daño que hacés.
  - **Rebote:** los proyectiles rebotan en las paredes.
  - **Niebla:** se ve poco y las habilidades llegan la mitad de lejos.
  - **Viento:** una ráfaga que gira empuja a los dos.
  - **Cuerpo a cuerpo:** lo de lejos pega 35%, lo de cerca 160%.
  - Idea para más adelante: Anegados que entran al Juicio y atacan a los dos.
- **Recta final:** cuando quedan dos, se terminan las hordas y pelean un duelo cada 5 segundos hasta que uno se
  queda sin vidas.

## Apuestas
- Antes de cada duelo se anuncian los dos que van a pelear y la regla loca, y los que no pelean tienen
  **15 segundos** para apostar. Mientras tanto, todos siguen en su horda.
- **Q** apuesta al primero y **E** al segundo. Cada toque pone el 10% de tu oro. Hay un panel abajo que muestra el
  pozo de cada lado y cuánto paga.
- Se puede apostar hasta el **50% del oro** que tenías cuando se abrieron las apuestas. No se puede cambiar de lado.
- Pozo común: todo lo apostado se reparte entre los que acertaron, en proporción a lo que puso cada uno. Los que le
  erraron pierden lo que pusieron.
- Con tu primera apuesta se suma una **apuesta gratis** (15 de oro, crece con el reloj). La pone la casa: cuenta
  para repartir, pero no te cuesta nada.
- Si uno de los dos queda afuera antes del duelo, se devuelve todo.
- En la recta final no hay apuestas: no queda nadie que no pelee.
- La IA apuesta una vez, en un momento distinto cada uno, al que se ve más fuerte (nivel, habilidades e ítems).
  Cuanto más claro lo ve, más pone; los rivales menos hábiles se equivocan más seguido.

## La IA
- Los 7 rivales eligen habilidades e ítems con reglas simples, se mueven esquivando y apuestan según quién parece
  más fuerte. Tienen que perder a veces y ganar a veces.
- Se llaman Nube, Trueno, Granizo, Bruma, Rocío, Relámpago y Llovizna. Cada uno tiene su nivel de habilidad.
- Juegan su arena de verdad, con las mismas reglas que vos: no hay números inventados para ellos.

## Entre partidas: el Cuaderno del Paraguas
- Cada partida da **Monedas del Sol**: 60 al 1.º, 35 al 2.º... 4 al 8.º, más 4 por Juicio ganado y 1 cada 100 bajas.
- Se gastan en 7 **mejoras permanentes** chicas que solo tenés vos: vida, daño, velocidad, imán, oro inicial,
  recarga y suerte en los cofres. Cada nivel cuesta más que el anterior.
- 12 **logros** con premio en monedas (de "terminá una partida" a "ganá sin perder ninguna vida").
- **Partida del día:** misma semilla para todos ese día; se guarda tu mejor resultado.
- Todo se guarda en el navegador.

## Afuera de la 1.0
- Jugar online contra otras personas.
- Mandar enemigos a la arena de un rival.
- Arte final y música (primero figuras simples).
