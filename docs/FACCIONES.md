# Facciones y finales (propuesta, sin decidir)

El usuario trajo esta propuesta el 2026-11-25. La armó con otra IA (Gemini). Acá queda resumida para no perderla,
con mis notas. **Nada de esto está decidido todavía.** Va después de la gente de la ciudad (NPC), porque las
facciones son grupos de esa gente.

## La idea central
Cada regla del juego cuenta la historia:
- **La barrera negra** es el borde del mapa y la pared de una "incubadora" del **Ente**, lo que está detrás de todo.
- **La lluvia negra** es el aire del Ente: obliga a buscar ropa que no se moje, techo y calor.
- **Sin internet, teléfono ni radio**, los refugios están aislados. El jugador es quien los vuelve a conectar, o
  quien los deja caer de a uno.

## Las facciones
Cada una tiene sus fuerzas, su rutina y un punto donde se quiebra. Cualquiera puede crecer o caer.

| Facción | Cómo actúa | Su debilidad | Si cae |
|---|---|---|---|
| **Ejército (Campo de Mayo)** | La más fuerte: patrullas, barricadas pesadas, raciones; recibe sobrevivientes a cambio de trabajo | Perdió la mitad de la tropa en la tormenta y está pegado a la barrera: recibe los peores ataques | Se pierde la evacuación y la zona se vuelve la más letal del mapa |
| **Iglesias** | Reciben heridos, reparten lo poco que tienen, sostienen la cordura de todos; no salen a pelear | Casi sin armas; gastan comida y remedios rápido porque reciben a cualquiera | Un infectado o alguien quebrado adentro desata el caos: se vuelven fanáticos del Ente o un nido |
| **Hospital Larcade y salitas** | Protocolo de emergencia, generadores, remedios, gente que sabe curar infecciones y heridas graves | Atraen desesperados y saqueadores; ven las mutaciones de cerca | Asedio o falta de luz e insumos: el barrio se queda sin cura avanzada |
| **Comisarías** | Atrincheradas con 9 mm y escopetas; salen a buscar patrulleros y limpiar su cuadra; no dejan entrar a cualquiera | No producen comida ni remedios: cambian seguridad y balas por víveres | Sin balas o sin comida, algunos se vuelven saqueadores y el resto queda sitiado |
| **Supermercados** | Persiana baja, chapas soldadas: tienen la comida en lata y el agua limpia de la zona | Aislados, desconfían de todos y no saben qué pasa afuera | Si rompen la persiana, saqueo y la zona se queda sin comida |

## Los finales
El objetivo es que San Miguel no sea absorbido del todo por el Ente. Hay tres maneras de terminar:
1. **La red unida:** conectaste los refugios con radios, los abasteciste y te pusiste de acuerdo con Campo de Mayo.
   El Ejército escolta a todos adentro de su perímetro y prepara el ataque a la barrera.
2. **El umbral:** te metiste en la noche y la lluvia, la cordura se te fue y empezaste a percibir cosas. Encontrás
   los puntos donde el Ente sostiene la barrera y los saboteás desde adentro, a costa de tu humanidad.
3. **El último sobreviviente:** cayeron todos, hasta Campo de Mayo. Solo queda aguantar en tu refugio, día tras día.

## Cómo se haría (la parte técnica de la propuesta)
- Cada facción guarda unos pocos números: gente, comida, remedios, defensa, cordura y estado.
- Una vez por día del juego se recalculan.
- Sin comida o con poca cordura, entra **en crisis** y aparece un aviso en el mapa.
- Dos días en crisis sin que hagas nada, **cae**, y de ahí salen grupos hostiles hacia los vecinos.

## Mis notas
- **Encaja bien** con lo que ya hay. La barrera como borde del mapa, la lluvia negra con la ropa, la cordura de
  más adelante (el final del umbral) y el refugio propio (el último final) son cosas que ya están en el plan.
- **La parte técnica es liviana** y está bien pensada: unos números por facción que cambian una vez por día. Se
  puede programar sin la gente todavía, pero no se ve nada en el juego hasta que haya NPC caminando, hablando y
  comerciando. Por eso conviene después de los NPC.
- **El Ente es una idea nueva:** el lore del usuario no dice qué hay detrás de la barrera. Hay que decidir si se
  queda, y si se queda, si es alienígena o se deja misterioso.
- **Lugares reales:** el mapa ya es San Miguel de verdad, así que Campo de Mayo, el Larcade, las iglesias y las
  comisarías se pueden ubicar donde están. Salvo Campo de Mayo, que es una sola, el resto conviene manejarlo como
  tipos de lugar ("una iglesia", "una comisaría", "un hospital") y no como gente real con nombre.
- **"Supermercados chinos":** como tipo de lugar, sí (son una parte real del barrio), pero yo lo llamaría
  "supermercados" o "autoservicios" sin marcar el origen de la gente que los atiende. En la propuesta son los
  únicos definidos por eso y por desconfiar de todos, y queda como un estereotipo.
- **Es mucho:** cinco facciones, radios, tres finales y poderes de percepción son varias temporadas de trabajo.
  Lo razonable es arrancar con una o dos facciones que se puedan visitar, y sumar el resto de a poco.
