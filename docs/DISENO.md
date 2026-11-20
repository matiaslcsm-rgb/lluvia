# Diseño

Todos los números son **provisorios**: se ajustan con partidas simuladas cuando exista el banco.

## En una frase
8 jugadores (vos + 7 de la IA), cada uno aguantando hordas en su arena y armando un personaje cada vez más roto.
Cada tanto, dos se enfrentan en un duelo con reglas locas mientras los demás apuestan. Gana el último en pie.

## La partida
- Dura **20-25 minutos**.
- Se repite un ciclo: **3 minutos de horda → apuestas (15 s) → duelo (hasta 60 s)**. Mientras dos pelean, los demás
  siguen en su horda.
- Cada jugador arranca con **3 vidas**. Sin vidas, quedás afuera (y podés seguir apostando como espectador).
- Cuando quedan dos, se terminan las hordas: duelos seguidos hasta que uno se queda sin vidas.

## Controles
- **Moverse:** WASD o flechas. Es lo único que hacés todo el tiempo; los ataques salen solos.
- **Ulti:** Espacio, apunta hacia el mouse. Tiene recarga larga (alrededor de 60 s).

## La horda (tu arena)
- Los enemigos aparecen desde los bordes y vienen hacia vos. Cuanto más avanza el reloj, más y más fuertes.
- Matar deja **experiencia** (hay que juntarla caminando encima) y a veces **oro**.
- Aparece un **jefe** a los 2:30 y después cada 3 minutos. Al matarlo deja un cofre gratis que nunca da comunes.
- Desde el minuto 5 llegan los **cazadores**, más rápidos que vos: no se puede escapar corriendo para siempre.
- **Morir en la horda:** perdés una vida y la mitad del oro que llevás, y volvés a los 5 segundos. Al volver tenés
  2 segundos de invulnerabilidad y se van los enemigos que tenías encima (el jefe no).
- Mientras elegís una mejora, toda la partida espera (las arenas de los rivales también).

## Habilidades (al subir de nivel)
- Al subir de nivel elegís **1 de 3**: una habilidad nueva o subir una que ya tenés (hasta nivel 5).
- Las habilidades salen de un montón mezclado de muchos personajes, como en *Custom Hero Chaos*.
- **5 ranuras** de habilidades automáticas + **1 ulti**, y **4 ranuras de pasivas** (más velocidad, más vida, más
  daño...). Se arranca eligiendo 1 de 3 personajes, que da la primera
  habilidad y las estadísticas base.
- **Fusiones:** ciertas parejas (habilidad al máximo + ítem justo) se convierten en una versión mucho más fuerte.

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
- Los 12 primeros: Pluma, Afilador, Reloj de arena, Vendas, Cristal y Mecha (comunes); Arpa de chispas, Ascua,
  Colmillo y Eco (raros); Corona de tormenta y Espejo (legendarios). El detalle está en `data/items.js`.

## El reloj de dificultad
- Sube un escalón **cada minuto**, igual para todos.
- Cada escalón: los enemigos tienen más vida (×1,22, se va multiplicando), más daño (+15%) y un poco más de
  velocidad (+3%, hasta +60%), aparecen más seguido y los cofres cuestan más.
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
  - Ideas para más adelante: solo cuerpo a cuerpo, y enemigos de la horda que atacan a los dos.
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

## Afuera de la 1.0
- Jugar online contra otras personas.
- Mandar enemigos a la arena de un rival.
- Arte final y música (primero figuras simples).
