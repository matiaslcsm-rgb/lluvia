# El cuerpo: energía, sueño, comida, inventario y salud

Lo que pidió el usuario el 2026-11-25 después de probar el juego. Está escrito con mis palabras y en orden. Donde
el pedido no dice algo, puse "(lo decidí yo)", y el usuario lo puede cambiar.

## 1. Subir de nivel (por ahora queda como está)
Sigue el sistema viejo: al subir elegís más daño o una mejora de la Glock. Queda así a propósito, porque la mejora
de la Glock recarga y deja salir a explorar sin quedarse sin balas mientras se prueba lo demás.

## 2. Energía, sueño y comida
- **Energía:** una barra que baja con las horas despierto, y más rápido si corrés y peleás. Con poca energía, el
  aire (correr y pegar) vuelve más lento y te alcanza para menos.
- **Dormir:** se duerme en una cama, o en el piso, donde se descansa peor (lo decidí yo). Mientras dormís, las horas
  pasan rápido. Un ruido o un zombi cerca te despiertan.
- **Dormir bien comido:** si te acostás con comida y agua al día, al despertar la barra de energía es el doble y baja
  más despacio.
- **Sin comer:** te podés desmayar (ya estaba).
- **Sin dormir:** ves menos lejos (el cono y el círculo cercano se achican).
- **Para más adelante:** la **cordura**, atada a todo esto. No se programa todavía, pero la energía, el sueño y la
  comida se guardan de forma que después se pueda sumar.

## 3. Inventario, menú de clic derecho y cosas en el piso
- **Tirar cosas:** lo que tirás queda en el piso, a la vista, y se puede volver a juntar con E.
- **Menú de clic derecho:** sobre algo del inventario se abren sus opciones según lo que sea. Por ejemplo, el agua:
  Tomar, Llevar en la mano o Tirar.

## 4. Lugares: manos, bolsillos y mochila
- **2 manos (como en Project Zomboid):** izquierda y derecha. En cada una va una cosa de una mano, o va una sola cosa
  que ocupa las dos: la Glock y las armas largas.
- **Si tenés las dos manos ocupadas y sacás un arma de dos manos,** lo que tenías se guarda aparte; cuando la soltás,
  vuelve a tus manos.
- **2 bolsillos:** cosas chicas de uso rápido, como la Glock, una piedra o un cuchillo. Se empieza con la Glock en un
  bolsillo (lo decidí yo).
- **Mochila:** la comida y el agua van siempre a la mochila, o a otro bolso que lleves (lo decidí yo), nunca a los
  bolsillos. En la mochila no se ven como latas sueltas, sino como **cuánto tiempo te dura**: "agua para 18 h, comida
  para 36 h". Si está llena, no entra nada más hasta que hagas lugar.
- **Sin bolso,** la comida y el agua se pueden llevar en las manos, una cosa por mano (lo decidí yo).

## 5. Salud, primeros auxilios e infección
- **Ventana de estado (tecla K):** tus heridas, lo que te pasa y qué te está frenando.
- **Avisos:** uno chico cuando tomás solo una dosis ("Dosis 2/4 tomada"), y uno urgente si tocaba tomarla y faltaba
  agua o pastillas.
- **El borde de la pantalla:** late rojo si sangrás sin vendar, y se pone verdoso y un poco borroso si avanza una
  infección.
- **Tipos de daño:**
  - **cortante y punzante:** sangran y se pueden infectar;
  - **contundente:** te pone más lento (para moverte y para pegar), pero no sangra ni se infecta.
- **Vida máxima:** cada herida baja un poco la vida máxima, y ese tope queda bloqueado hasta que te cures. El
  sangrado sin tratar la sigue bajando.
- **Kit de primeros auxilios:** se aplica desde la ventana de estado o el inventario, y se puede usar todas las veces
  que quieras. Frena el sangrado y congela la vida máxima para que no siga bajando.
  - **Casero:** dura 1 día. Se fabrica con 1 venda, curita o trapo y 1 alcohol o sanitizante.
  - **De farmacia:** se encuentra en las farmacias y dura 36 horas.
- **Sin kit:**
  - **alcohol o sanitizante** sobre una herida nueva, antes de vendar: baja mucho la chance de infección;
  - **solo una venda o un trapo:** frena el sangrado en el acto, pero sube mucho el riesgo de infección, más con un
    trapo.
- **Botiquín** (en farmacias): ocupa un lugar en la mochila. Al abrirlo trae 4 kits de farmacia, 4 blísteres de
  antibiótico (16 dosis) y 4 blísteres de paracetamol.
- **Paracetamol:** saca la lentitud de los golpes.
- **Curarse del todo (sin infección):** el kit solo estabiliza. Para recuperar la vida máxima hay que tomar
  paracetamol, estar comido y tomado, y dormir 1 día completo. Lo tomé como **24 horas de sueño en total**, aunque
  sean en varias veces (lo decidí yo).
- **Defensas:** con descanso, comida y salud al 100% cuesta más infectarse, y una infección se puede curar sola.
- **Infección sin tratar:** no deja recuperar la vida máxima. Si pasa mucho tiempo, viene la fiebre: la energía baja
  mucho más rápido, la vida máxima baja de a poco y te podés desmayar.
- **Antibiótico:**
  - son 4 dosis, una cada 8 horas, y la primera la tomás vos;
  - en cada toma puede curarse antes de tiempo, y con menos chance puede resistir y pedir más dosis;
  - después, mientras sigas infectado y tengas agua y pastillas encima, las dosis se toman solas, incluso dormido,
    sin despertarte.
- **Alta:** recién con la infección curada se puede descansar (paracetamol, comida y agua) para recuperar el 100% de
  la vida máxima.

## 6. Morir
Al morir te despertás en el último lugar donde dormiste, con la vida al 100%. Tu cuerpo queda donde moriste, con lo
que llevabas, y lo podés ir a buscar. La partida no se pierde. Se va a pulir más adelante.

## 7. Estaciones
Las 4 estaciones, de 7 días cada una. Cambian cuánto duran el día y la noche y qué clima es más probable. Hace falta
un **sistema de ropa** para el frío y el calor: es la sección 8.

## 8. La ropa (etapa 62)
Pedido del usuario (2026-11-25): "como el Project Zomboid podés equiparte prendas de ropa, medias, zapatos, guantes,
remeras, camisas, etc.; cada prenda te da protección y te da calor".
- **Siete lugares del cuerpo**, una prenda en cada uno: cabeza, torso, abrigo, manos, piernas, medias y calzado.
  Hay 24 prendas (gorro, gorra, casco de moto, remera, camisa, camiseta térmica, buzo, campera de jean, campera de
  cuero, piloto, camperón, tres tipos de guantes, jean, jogging, short, pantalón de trabajo, dos tipos de medias,
  ojotas, zapatillas, zapatos y botas). Los números de cada una están en `data/clothes.js`.
- **Abrigo:** cada prenda suma calor. Lo que hace falta depende de la estación (verano poco, invierno mucho), de la
  noche, del clima (frío, lluvia, tormenta suben; calor baja) y de si estás bajo techo.
  - Si te falta un poco, tenés **frío** y te da más hambre. Si te falta mucho, estás **helado** y perdés vida.
  - Si te sobra un poco, tenés **calor**: más sed y el aire vuelve más lento. Si te sobra mucho, más todavía.
  - Esto reemplaza la regla vieja "el frío de noche afuera lastima": ahora depende de lo que tenés puesto.
- **Protección:** cada golpe de zombi que te iba a dejar una herida cae en una parte del cuerpo (cabeza, torso,
  brazos, manos, piernas, pies). Lo que tenés puesto ahí puede frenarla: unas prendas frenan mejor los cortes y otras
  las mordidas. Para los brazos solo sirven las prendas con mangas. La remera casi no frena nada; la campera de cuero,
  el casco y las botas, mucho.
- **Se gastan:** cada golpe que frena gasta la prenda, hasta que **se rompe**. Rota no protege y abriga la mitad.
- **La lluvia moja** lo de afuera, y lo de abajo solo si lo de afuera la deja pasar. El piloto y las botas casi no
  dejan pasar nada. Mojada, una prenda abriga mucho menos. Se seca sola, más rápido bajo techo.
- **Dónde está:** sobre todo en los roperos; algo en los lavarropas, los talleres, las cajas y los autos.
- **Lo decidí yo:**
  - arrancás con remera, jean, medias y zapatillas;
  - en un mueble, la prenda de un lugar que tenés libre te la ponés sola; las demás quedan en el piso, al lado,
    para que elijas (así un ropero no te llena la mochila de remeras);
  - lo que tenés puesto no pesa; en la mochila, sí;
  - al morir te despertás con la ropa puesta (lo demás queda en el cuerpo);
  - el camperón, la campera de cuero, el casco y las botas son grandes: solo entran en una mochila o un bolso.
- **En el inventario (I)** está el recuadro "Ropa": cuánto abriga lo que tenés y cuánto hace falta. El clic sobre una
  prenda puesta te la saca, y sobre una de la mochila te la pone (lo que tenías ahí va a la mochila). La ventana de
  estado (K) dice si tenés frío o calor y cuántas prendas mojadas tenés.
