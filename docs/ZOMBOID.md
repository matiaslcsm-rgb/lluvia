# Darkwood + Project Zomboid: armas de mano, zombis que buscan y tiro a la cabeza

Pedido del usuario (2026-11-25): "va a ser una mezcla entre Darkwood y PZ Zomboid". De Darkwood tomamos el clima,
la vista y la noche (`docs/DARKWOOD.md`). De *Project Zomboid* tomamos cómo se sobrevive día a día: armas de mano
con lo que encontrás en las casas, zombis lentos que deambulan y te encuentran por el ruido o porque te ven, y
habilidades que suben con el uso. La regla de la casa sigue: **mecánicas sí, contenido no.** Ni nombres, ni
dibujos, ni textos de esos juegos.

Lo que pidió el usuario, con sus palabras:
- Armas de mano: piñas, puños vendados, puño americano, el puño con un cinturón, palo de escoba, utensilios
  (tenedor, cuchillo, palita de barrer), barra de metal, y más cosas que se encuentran en una ciudad argentina.
- Los zombis no van derecho hacia vos: tienen un rango de búsqueda, deambulan al azar y te encuentran por el ruido
  o porque te ven.
- Por ahora, zombis normales: **a los tiros solo mueren con un tiro en la cabeza.**
- Un sistema de puntería: cuantos más tiros en la cabeza acertás, más fácil te resulta apuntar a la cabeza.

## Respuestas del usuario (2026-11-25)
El usuario contestó punto por punto. Lo que dijo manda sobre lo que está más abajo, y lo de abajo ya está
corregido con esto:
1. La lista de armas: sí.
2. Se gastan y se rompen **según la fragilidad de cada objeto**.
3. Pegar gasta aire, pero **eso se puede mejorar con habilidad**. Las habilidades de pelea son un árbol:
   **combate cuerpo a cuerpo**, y de ahí salen **combate a mano** (puños, nudillos), **combate con arma corta**
   (cuchillos, tenedores, objetos chicos) y **combate a media distancia** (machetes, cuchillos grandes, espadas,
   palas, palos, barras de metal). Además, cada arma reparte su daño en tres tipos: **contundente** (puños,
   martillos, ladrillos, piedras), **cortante** (todo lo que tiene filo) y **punzante** (un tenedor, una lanza).
   Cada arma tiene su mezcla: un martillo, 80% contundente, 15% cortante y 5% punzante. Así todas.
4. **Las armas de mano matan**, según el enemigo y según la experiencia del personaje con cada arma. A mano limpia
   es muy difícil matar, y te podés lastimar las manos.
5. Los zombis deambulan, investigan y persiguen: sí.
6. Las distancias de ruido: sí.
7. La linterna te delata: sí.
8. El que persigue gruñe y trae a los de cerca: sí.
9. **Por ahora no hay diferencia entre el día y la noche en cuántos zombis hay.** Lo que cambia son sus sentidos:
   **de día ven más lejos, de noche oyen más lejos.** (Esto cambia lo de la etapa 47: los zombis ya no se multiplican
   de noche.)
10. Un tiro en el cuerpo **depende del arma, de la bala y del tiro**, pero siempre **frena al zombi un segundo**, y
    puede tirarlo al piso o hacerlo tambalear.

11. Apuntar con el clic derecho, quieto, con la mira que se cierra: sí.
12. **La A:** la bala tiene que pasar por la cabeza dibujada del zombi, y la Puntería la agranda para tus balas.
13. La Puntería de 0 a 10: sí. **Por ahora todo escala en 10 niveles.**
14. Más habilidades con el mismo sistema: sí, **si son coherentes con el juego**.
15. El orden: sí.

Y sobre las pruebas: "no te pongas a hacer mil pruebas de todo para medirlo; hagamos momentos específicos para
probar todo en cierto punto de producción".

## 1. Armas de mano
Cada arma tiene daño, alcance, velocidad, cuánto aguanta antes de romperse (según qué tan frágil es), chance de
voltear al zombi y cuánto ruido hace. Su daño se reparte en **contundente, cortante y punzante**, cada arma con su
mezcla (un martillo: 80% contundente, 15% cortante, 5% punzante). Cada arma pertenece a una habilidad: **a mano**
(los puños), **arma corta** (cuchillos, tenedores, cosas chicas) o **media distancia** (machetes, palos, palas,
barras); cuanta más experiencia, más daño, más rápido y menos aire. Golpear gasta aire (correr también cansa, como
en `DARKWOOD.md`), y eso también mejora con la habilidad. Se encuentran revisando muebles, cada una donde tiene
sentido. Pegar a mano limpia mata muy difícil y puede lastimarte las manos.

| Arma | Tipo | Dónde se encuentra | Cómo es |
|---|---|---|---|
| **Piñas** | puños | siempre | Con lo puesto: poco daño, rápidas, no se rompen. Voltean poco. |
| **Puños vendados** | puños | con 1 venda (se arma) | Un poco más de daño y no te lastimás las manos. Se gastan. |
| **Puño con cinturón** | puños | roperos | El cinturón enrollado, con la hebilla afuera: pega más. |
| **Puño americano** | puños | mesitas, mostradores | El mejor puño: daño alto, rápido, dura mucho. |
| **Tenedor** | punzante | mesadas | Casi nada, pero algo es algo. Se dobla enseguida. |
| **Cuchillo de cocina** | cortante | mesadas | Rápido, de cerca. Se mella. |
| **Cuchilla de asado** | cortante | mesadas, parrillas | Más pesado que el cuchillo, mejor corte. |
| **Palita de barrer** | contundente | lavaderos | Ridícula, pero aleja. Se rompe enseguida. |
| **Palo de escoba** | contundente | lavaderos | Largo: pega de lejos y voltea. Se parte. |
| **Rodillo de amasar** | contundente | mesadas | Corto y firme. |
| **Sartén** | contundente | mesadas | Lenta, pega fuerte, voltea seguido, hace ruido. |
| **Pava** | contundente | mesadas | Para el apuro. |
| **Sifón de soda** | contundente | heladeras, negocios | Pesado; se rompe y queda una botella rota. |
| **Botella rota** | cortante | se arma (una botella) | Corta bien, dura poco. |
| **Ladrillo** | contundente | obras, patios | Pega muy fuerte, lento, corto. |
| **Martillo** | contundente | galpones, estantes | Corto, fuerte y dura. |
| **Destornillador** | punzante | galpones, estantes | Rápido, va a la cabeza. |
| **Llave inglesa** | contundente | galpones, garages | Buena, aguanta. |
| **Barra de metal** | contundente | galpones, depósitos, obras | De lo mejor: largo, voltea, dura mucho. |
| **Fierro de construcción** | contundente | obras | Como la barra, más largo y más lento. |
| **Palo de hockey** | contundente | escuelas, roperos | Largo y rápido, se astilla. |
| **Matafuegos** | contundente | palieres, negocios, escuelas | Pesadísimo, voltea; vaciarlo es una nube que frena a los zombis. |
| **Pala** | contundente | galpones, patios | Larga, lenta, fuerte. |
| **Rastrillo** | punzante | galpones | Largo, raro, se rompe. |
| **Machete** | cortante | galpones | Muy bueno; corta de un golpe si acierta en la cabeza. |
| **Hacha** | cortante | galpones | El mejor golpe, el más lento. Pesa. |
| **Cadena de bicicleta** | contundente | garages, galpones | Larga y rápida, flexible. |

## 2. Zombis que buscan
Los zombis ya no van derecho hacia vos. Cada uno está en uno de estos estados:
- **Deambula:** camina despacio sin rumbo, a veces se queda quieto.
- **Investiga:** oyó algo y va hasta donde vino el ruido; si no encuentra nada, se queda un rato y vuelve a
  deambular.
- **Persigue:** te vio, y va hacia vos. Si te pierde de vista, va hasta el último lugar donde te vio y busca
  alrededor un rato.

**Cómo te encuentran:**
- **La vista:** ven en un cono hacia adelante. De día ven más lejos; de noche, menos, salvo que tengas la linterna
  prendida: la linterna te delata desde lejos. Las paredes y los muebles altos los tapan, igual que a vos.
- **El oído:** cada cosa hace ruido, hasta cierta distancia:
  - disparar la Glock, unos 35 m;
  - un golpe o algo que se rompe, unos 10 m;
  - correr, unos 8 m;
  - caminar, unos 3 m;
  - revisar un mueble, unos 2 m.
  Las paredes bajan el ruido. De noche oyen más lejos.
- Un zombi que persigue gruñe, y los que están cerca lo oyen y van también: así se arma una horda.

**Día y noche:** por ahora hay los mismos zombis de día y de noche (respuesta 9). De día ven más lejos y de noche
oyen más lejos, así que de noche un tiro trae más zombis.

## 3. Tiro a la cabeza y Puntería
- A los zombis normales **un tiro en el cuerpo no los mata**. Siempre los frena un segundo, y según el arma, la bala
  y el tiro, puede tirarlos al piso o hacerlos tambalear. Solo los mata un tiro en la cabeza.
- Se ve la cabeza de cada zombi (un círculo chico, arriba del cuerpo, del lado hacia donde mira).
- **Apuntar:** con el clic derecho apretado, el personaje se queda quieto apuntando y la mira se cierra de a poco:
  las balas salen más derechas. Caminar la abre, correr la abre mucho.
- **Puntería:** una habilidad que sube con el uso, del nivel 0 al 10. Cada tiro en la cabeza da experiencia; un tiro
  en el cuerpo, un poco. Cada nivel cierra la mira más rápido, la deja más chica y agranda un poco la cabeza para
  tus balas. En pantalla se ve el nivel y cuánto falta para el siguiente.
- Más adelante, más habilidades con el mismo sistema: fuerza (armas de mano), sigilo, carpintería (barricadas),
  primeros auxilios.

## 4. Decisiones del usuario

Decididas: la 1 (respuesta 4), matan, según el enemigo y la experiencia con cada arma, a mano limpia muy difícil;
la 2 (respuesta 12), la A.

**1. ¿Las armas de mano matan?** Dijiste que a los tiros solo mueren con un tiro en la cabeza.
- A) **Sí, a golpes** *(recomendada)*: los golpes van a la cabeza, así que cada arma de mano mata después de unos
  cuantos golpes (un hacha o un machete en uno o dos; las piñas en muchos). Un zombi volteado en el piso se remata
  más fácil.
- B) Los golpes solo empujan y voltean: para matar hay que rematarlo en el piso (un pisotón o un golpe en la cabeza
  con el zombi tirado).
- C) Los golpes solo empujan y voltean; matar, únicamente con un tiro en la cabeza.

**2. ¿Cómo se apunta a la cabeza?**
- A) **La cabeza de verdad, y la Puntería ayuda** *(recomendada)*: la bala mata si pasa por la cabeza dibujada del
  zombi. Apuntar con clic derecho cierra la mira, y cada nivel de Puntería la cierra más y agranda la cabeza para
  tus balas. Mejora vos y mejora el personaje.
- B) Por suerte: cada tiro que pega tiene una chance de ser en la cabeza, que sube con la Puntería, con apuntar
  quieto y de cerca. No hace falta acertarle a la cabeza con el mouse.
- C) Solo con el mouse: la cabeza siempre del mismo tamaño y la Puntería no la cambia; mejora solo cuánto tarda en
  cerrarse la mira.

## 5. Orden propuesto
Cambia la etapa 48 (juntar), que tenía una segunda parte con el arma de mano y fabricar:
1. **Zombis que buscan:** deambular, oír, ver, investigar y perseguir. La linterna y los tiros te delatan.
2. **Tiro a la cabeza y Puntería:** la cabeza del zombi, el clic derecho para apuntar, la habilidad que sube.
3. **Armas de mano:** las piñas siempre, las demás encontradas en los muebles, con lo que aguantan y el aire.
4. **Fabricar:** puños vendados, botellas rotas, molotov, vendas con trapos, balas con chatarra, tablas.
5. Sigue el plan: refugio y barricadas, el clima, guardar y estaciones.
