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
- Cada tanto aparece un **jefe** que deja un cofre gratis.
- **Morir en la horda:** perdés una vida y la mitad del oro que llevás, y volvés a los 5 segundos.

## Habilidades (al subir de nivel)
- Al subir de nivel elegís **1 de 3**: una habilidad nueva o subir una que ya tenés (hasta nivel 5).
- Las habilidades salen de un montón mezclado de muchos personajes, como en *Custom Hero Chaos*.
- **5 ranuras** de habilidades automáticas + **1 ulti**, y **4 ranuras de pasivas** (más velocidad, más vida, más
  daño...). Se arranca eligiendo 1 de 3 personajes, que da la primera
  habilidad y las estadísticas base.
- **Fusiones:** ciertas parejas (habilidad al máximo + ítem justo) se convierten en una versión mucho más fuerte.

## Ítems (con oro)
- En la arena hay **cofres** que se abren con oro; su precio sube con el reloj.
- Los ítems **se apilan sin límite**: tener tres iguales triplica el efecto (o lo suma con rendimientos decrecientes).
- Rarezas: **común** (blanco), **raro** (verde), **legendario** (rojo).
- Muchos ítems disparan efectos al pegar ("10% de tirar un rayo"), y esos efectos pueden disparar otros. De ahí sale
  la sensación de quedar roto.

## El reloj de dificultad
- Sube un escalón **cada minuto**, igual para todos.
- Cada escalón: los enemigos tienen más vida y daño, aparecen más seguido y los cofres cuestan más.
- Idea: quedarse quieto juntando no sirve; hay que crecer más rápido que el reloj.

## Duelos
- Se elige a dos jugadores (se prioriza a los que pelearon menos).
- Pelean en una arena aparte con todo lo que tienen. Hasta 60 s; si nadie murió, gana el que tiene más % de vida.
- **El perdedor pierde 1 vida. El ganador se lleva un premio de oro.**
- **Peleas locas:** cada duelo sale con una regla al azar. Ejemplos:
  - Todos gigantes (más vida, más lentos).
  - Piso de lava que se achica.
  - Solo cuerpo a cuerpo.
  - Los proyectiles rebotan en las paredes.
  - Aparecen enemigos de la horda que atacan a los dos.
  - Velocidad doble.

## Apuestas
- Antes de cada duelo, los que no pelean tienen **15 segundos** para apostar.
- Se puede apostar hasta el **50% del oro** que tenés.
- Pozo común: lo apostado al perdedor se reparte entre los que apostaron al ganador, en proporción a lo que puso
  cada uno.
- Todos tienen además una **apuesta gratis** chica en cada duelo, para que siempre valga la pena mirar.

## La IA
- Los 7 rivales eligen habilidades e ítems con reglas simples, se mueven esquivando y apuestan según quién parece
  más fuerte. Tienen que perder a veces y ganar a veces.

## Afuera de la 1.0
- Jugar online contra otras personas.
- Mandar enemigos a la arena de un rival.
- Arte final y música (primero figuras simples).
