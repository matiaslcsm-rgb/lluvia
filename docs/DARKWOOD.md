# Darkwood como referencia: qué tomamos y qué no

Pedido del usuario (2026-11-24): "la estética que vamos a buscar replicar es la del Darkwood, en mecánicas
también". Regla de la casa: **mecánicas sí, contenido no.** De Darkwood se toman ideas de cómo se juega y del clima
que arma. Su bosque, sus personajes, sus monstruos, su historia, sus dibujos, sus sonidos y su música no se toman.
Lo nuestro sigue siendo San Miguel con el Sol Amarillo.

Este documento es la lista para decidir antes de programar. Lo que tiene que decidir el usuario está marcado
"(decisión)", con la opción recomendada.

**2026-11-24 (decisión del usuario):** "sí a todas las recomendadas" (las cuatro de la sección 4), y sumar el ciclo
de día y noche, el clima y las estaciones, con un día de 12 horas que dura 40 minutos (sección 5).

## Qué es Darkwood, en dos líneas
Un juego de terror y supervivencia visto desde arriba. Ves solo lo que tu personaje tiene adelante y el resto
queda a oscuras. De día salís a juntar cosas, y de noche te encerrás en tu refugio a aguantar hasta que salga el
sol. Hay pocas balas y se oyen cosas antes de verlas.

## 1. Lo que se ve (la estética)

| Idea | En Darkwood | En San Miguel | Cuesta |
|---|---|---|---|
| **Campo de visión** | Ves lo que hay en un cono delante del personaje. Detrás de las paredes y a tus espaldas, el mapa queda en penumbra y no se ven los bichos. | Igual: el cono va hacia donde apuntás con el mouse. Las paredes de las casas, los edificios y los muebles cortan la vista. Detrás tuyo ves un círculo chico, para sentir lo que tenés pegado. | Grande. Es lo que más cambia el juego, y le da sentido a los interiores y los muebles que ya hicimos. |
| **Paleta sucia y apagada** | Colores gastados: marrones, verdes oscuros, grises, poca saturación. | Bajar la saturación de toda la ciudad y ensuciar los colores: la luz del Sol Amarillo tiñe todo de un amarillo enfermo. | Chico: son colores en los datos. |
| **Grano y viñeta** | Una textura de ruido encima de todo y los bordes de la pantalla más oscuros. | Igual, con el grano suave para que no canse en partidas largas. | Chico. |
| **Luces** | La linterna, las lámparas y el fuego iluminan. Lo demás está oscuro de noche. | Linterna con batería para el cono de noche; faroles de la calle, fogatas y luces adentro de las casas (si hay electricidad). | Mediano. |
| **Interfaz mínima** | Casi nada en pantalla. La vida se ve en el personaje y hay pocos números. | Sacar números de la pantalla: la vida y las balas, chicas y en un rincón. El minimapa pasa a ser un mapa que se abre con una tecla (ver más abajo). | Chico. |
| **Sonido que se ve** | Ruidos fuera de la vista: se oyen pasos, golpes, gruñidos. | Ruidos con dirección (izquierda o derecha) para los zombis que no ves. Si no tenés sonido, una marca chica en el borde del cono. | Mediano. |

## 2. Lo que se juega (las mecánicas)

| Idea | En Darkwood | En San Miguel | Cuesta |
|---|---|---|---|
| **Día y noche** | De día se explora con relativa calma; de noche salen las cosas peores y conviene estar en el refugio. | Cada día dura unos minutos. De día exploras San Miguel: casas, negocios, cofres. De noche la horda sale en serio. Ver la decisión 1. | Grande. |
| **Refugio y barricadas** | Elegís un refugio, tapás puertas y ventanas con tablas, corrés muebles para trabar puertas y ponés trampas. | Cualquier casa puede ser tu refugio. Tapás ventanas y puertas con tablas y arrastrás muebles contra las puertas (los muebles ya son sólidos). Los zombis rompen tablas y empujan muebles. | Grande, pero aprovecha casi todo lo que ya existe: casas, puertas, ventanas y muebles sólidos. |
| **Juntar y fabricar** | Se revisan muebles y cajones. Con lo que juntás fabricás en un banco de trabajo, que se mejora. | Revisar los muebles de las casas (roperos, mesadas, estantes, góndolas) da materiales: tablas, clavos, trapos, nafta, piezas. En el banco del refugio se fabrican tablas, trampas, molotov, vendas y balas. | Grande. |
| **Pocas balas** | La munición es escasa: cada tiro cuenta y muchas peleas se evitan. | Ver la decisión 2: choca con la idea de shooter a lo SAS. | Chico de programar, grande para el balance. |
| **Armas que se gastan** | Las armas de mano se rompen con el uso y se reparan. | Armas de mano nuevas (palo, caño, machete) que se gastan. Las de fuego no se rompen, pero se traban si están muy gastadas. | Mediano. |
| **Mochila con lugar** | Llevás pocas cosas: una grilla con casilleros, y hay que elegir. | Ver la decisión 3: choca con los ítems que se apilan a lo Risk of Rain. | Mediano. |
| **Mapa sin flecha** | El mapa no dice exactamente dónde estás: te ubicás por lo que ves. | El minimapa con el puntito se va. Abrís el mapa de San Miguel con una tecla y ves las calles y lo que marcaste, con una zona aproximada de dónde estás. Los nombres de las calles ayudan a ubicarse. | Chico. |
| **Mejoras con contra** | Te inyectás algo para ganar habilidades, y en ciertos puntos ganás algo bueno a cambio de algo malo. | Las mejoras al subir de nivel siguen. Cada tanto aparece una mutación del Sol Amarillo: algo muy bueno con una contra (ves de noche, pero la luz te encandila). | Mediano. Encaja con lo que ya hay. |
| **Comerciante de día** | Un vendedor pasa de día y cambia cosas. | Un superviviente que de día instala un puesto en una plaza. Cambiás materiales por balas, armas y comida. Puede ser uno de los rivales de la etapa 37. | Mediano. |
| **Sangrado y quemaduras** | Las heridas siguen haciendo daño hasta que te curás. | Algunos zombis te hacen sangrar y se cura con vendas. El fuego quema y se apaga solo, o rodando. | Chico. |
| **Correr cansa** | Una barra de aire para correr y pegar. | Correr con Shift gasta aire, y pegar con armas de mano también. Disparar no. | Chico. |

## 3. Lo que no se toma
- El bosque, los pueblos y todo su mapa. Lo nuestro es San Miguel real.
- Sus personajes, sus monstruos y su historia. Lo nuestro son los mutantes del Sol Amarillo, con nombres y dibujos
  propios.
- Sus dibujos, sus sonidos, su música y sus textos.
- La manera exacta en que se ve (su dibujo a mano). Tomamos el clima: oscuro, sucio, poca luz.
- Que el personaje no pueda morir sin perder casi todo. Seguimos con las 3 vidas de Lluvia, salvo que el usuario
  quiera otra cosa.

## 4. Decisiones del usuario
Elegidas las cuatro recomendadas (2026-11-24). Quedan acá con sus opciones, para saber qué se descartó.

**1. ¿Cómo se lleva el día y la noche con la horda que crece a lo Risk of Rain?**
- A) **Las dos cosas juntas** *(recomendada)*: el reloj de dificultad sigue subiendo. Cada noche es una oleada fuerte
  que hay que aguantar en un refugio; de día hay pocos zombis sueltos. Cada noche es más dura que la anterior, y
  ganás si aguantás un número de noches (cuántas: decisión 6, en la sección 5).
- B) Solo día y noche, como en Darkwood: sin reloj de dificultad. Lo que se pone peor es lo que encontrás lejos de
  la plaza.
- C) Solo el reloj, como ahora, sin día ni noche: la oscuridad queda solo para los interiores.

**2. ¿Cuántas balas?** El juego hoy es un shooter a lo *SAS: Zombie Assault*, donde se dispara mucho.
- A) **Balas que alcanzan, sin sobrar** *(recomendada)*: las balas salen de revisar casas y del comerciante, sin
  recargas infinitas. Siempre hay un arma de mano para cuando se terminan. Es lo del medio entre los dos juegos.
- B) Escasas como en Darkwood: cada tiro cuenta y casi todo se pelea con armas de mano o se evita.
- C) Infinitas como ahora: solo hay que recargar.

**3. ¿Mochila con lugar o ítems que se apilan?**
- A) **Las dos** *(recomendada)*: los ítems de los cofres siguen apilándose sin ocupar lugar, porque son mejoras.
  La mochila con casilleros es para lo que se gasta: materiales, vendas, balas, molotov.
- B) Solo mochila: también los ítems ocupan lugar y hay que elegir cuáles llevar.
- C) Sin mochila: todo se guarda sin límite.

**4. ¿Qué tan oscuro?**
- A) **Penumbra** *(recomendada)*: fuera del cono el mapa se ve oscuro pero se reconoce (calles, casas), y los zombis
  no se ven. De noche, más oscuro, y sin linterna se ve muy poco.
- B) Negro total fuera del cono, como Darkwood de noche, siempre.
- C) Solo de noche: de día se ve todo como ahora.

## 5. Reloj, clima y estaciones
Pedido del usuario (2026-11-24): "agregale ciclo día y noche y clima, encajalo cuando creas; también estaciones.
Cada día de 12 horas dura 40 minutos."

**El reloj.** El juego tiene su hora, que se ve en un reloj chico en la pantalla. 12 horas del juego duran 40
minutos de verdad: una hora del juego son 3 minutos 20 segundos, y el día entero (24 horas) dura 1 hora 20 minutos.
Ver la decisión 5.
- **Amanecer y atardecer:** la luz cambia de a poco, del azul de la noche al naranja y al amarillo enfermo del
  mediodía. Las sombras de edificios y árboles giran con el sol.
- **De día** hay pocos zombis sueltos y se explora. **Al atardecer** los zombis se juntan y empiezan a moverse
  hacia donde hay ruido y luz. **De noche** sale la oleada: hay que estar en el refugio, con las barricadas puestas.
  Cada noche es más dura que la anterior.
- **Tu personaje** se cansa si no duerme. Dormir en el refugio adelanta el reloj, pero no se puede dormir con zombis
  cerca.

**El clima.** Cambia solo, de a ratos, con más chances de una cosa u otra según la estación. Cada clima cambia algo
del juego, no solo cómo se ve:
- **Despejado:** se ve lejos. Con el Sol Amarillo al mediodía, la luz encandila un poco y los zombis están más
  quietos.
- **Nublado:** luz más pareja y apagada.
- **Lluvia:** el ruido de la lluvia tapa tus pasos y los de los zombis (se oye menos de los dos lados). Si dura,
  las zonas bajas del mapa se inundan (esto es el paso 43 del plan, "el agua en lo bajo", que encaja acá).
- **Tormenta:** lluvia fuerte, viento y rayos. Un rayo ilumina todo un instante, también de noche, y asusta.
- **Niebla:** el cono de visión se achica. La de la madrugada es la peor.
- **Calor:** en verano. Te cansás más rápido al correr y necesitás más agua.
- **Frío y helada:** en invierno. Sin fuego en el refugio, de noche perdés vida de a poco.

**Las estaciones.** Las cuatro, como en Buenos Aires:
- **Verano:** días largos (el sol sale temprano y se pone tarde, así que las noches son cortas), calor, tormentas.
- **Otoño:** días que se acortan, lluvia, hojas en el piso que hacen ruido al pisarlas.
- **Invierno:** días cortos y noches largas, frío, niebla, heladas.
- **Primavera:** días que se alargan, clima cambiante.

La duración del día cambia con la estación, pero el reloj no: en verano hay más horas de luz de las 24, en invierno
menos. Los árboles cambian con la estación (verdes, amarillos, pelados, en flor).

**(decisión) 5. ¿La noche también dura 40 minutos?**
- A) **Sí: 12 horas de día y 12 de noche, 40 minutos cada una, y la estación corre el amanecer y el atardecer**
  *(recomendada)*. En verano el día dura unos 46 minutos y la noche unos 34; en invierno, al revés.
- B) Siempre 40 minutos de día y 40 de noche, sin importar la estación.
- C) 40 minutos de día y una noche más corta (20 minutos), para que se juegue más de día.

**(decisión) 6. ¿Cuánto dura una partida?** Con un día de 1 hora 20 minutos, aguantar 7 noches lleva más de 9
horas. Ya no entra en una sentada, y las estaciones solo tienen sentido si la partida dura varios días.
- A) **Partida larga que se guarda sola** *(recomendada)*: el juego se guarda al dormir y al salir, y seguís otro
  día. Cada estación dura 3 días del juego (un año, 12 días: unas 16 horas). Ganás si sobrevivís un año entero;
  podés seguir después.
- B) Partida corta en una sentada: una sola estación por partida (elegida al azar o por vos) y se gana aguantando 3
  noches (unas 4 horas).
- C) Sin final: sobrevivir todo lo que puedas, guardando. El récord es cuántos días aguantaste.

## 6. Orden propuesto
Cada paso se puede jugar al terminarlo, y cada uno lleva sus pruebas.
1. **Estética:** paleta apagada, grano, viñeta e interfaz mínima. Es rápido y cambia el clima enseguida.
2. **Campo de visión:** el cono, la penumbra, las paredes y los muebles que tapan, y los zombis que no se ven.
3. **El reloj y el día y la noche:** la hora, la luz que cambia, la linterna, los faroles y las luces de las casas.
   Va antes de los zombis porque decide cuándo salen.
4. **Volver los zombis al mapa**, con el campo de visión y la noche: pocos de día, la oleada de noche. Ahí se prueba
   si da miedo y si se puede jugar.
5. **Juntar, mochila y fabricar:** revisar muebles, materiales y el banco de trabajo.
6. **Refugio y barricadas:** tablas en puertas y ventanas, muebles que se arrastran y zombis que rompen. Dormir.
7. **El clima:** lluvia, tormenta, niebla, calor y frío, cada uno con su efecto, y el agua que inunda lo bajo.
8. **Guardar la partida y las estaciones:** el guardado automático, las cuatro estaciones con sus días largos o
   cortos, su clima y sus árboles.
9. **Sonido con dirección**, comerciante, armas de mano que se gastan, sangrado y correr que cansa.
10. **Mutaciones con contra** y el mapa sin flecha.

Las etapas que ya estaban en el plan (jefes, otros supervivientes, desbloqueos, la historia del Sol Amarillo)
siguen, y se acomodan a esto cuando lleguen.
