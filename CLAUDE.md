# Lluvia

Juego 2D para navegador que mezcla cuatro cosas: la estructura de *Custom Hero Chaos* (8 jugadores, cada uno en su
arena, armando un kit con habilidades de cualquier personaje), las hordas de *Vampire Survivors* (ataques que salen
solos, vos te movés), los ítems que se apilan y el reloj de dificultad de *Risk of Rain*, y duelos con reglas locas
donde los demás apuestan. Gana el último que queda.

## Antes de tocar nada
- Leé `docs/DISENO.md`: cómo se juega.
- Leé `docs/PLAN.md`: las etapas, qué está hecho y las decisiones abiertas.
- Para jugar: abrí `index.html` en el navegador. Para las pruebas: `node tests/run.js`.

## Reglas de la casa
- **Mecánicas sí, contenido no.** Se toman ideas de esos juegos, pero nombres, personajes, dibujos y textos son
  propios. No se recrea ningún juego existente.
- **Proyecto limpio y aparte.** No se copia código de `chaos`, `match` ni `custom-hero-chaos`. Si algo de ahí sirve,
  se reescribe acá, chico.
- **2D**, JavaScript puro con `<script>` clásicos (el orden está en `index.html`), sin build.
- **Los datos mandan.** Personajes, habilidades, ítems, enemigos y reglas de duelo viven en `data/` como datos; el
  motor los lee. Las habilidades se arman con piezas reutilizables y solo las raras llevan código propio.
- **Rendimiento primero.** Tiene que aguantar cientos de enemigos en pantalla sin trabarse.
- Código, comentarios y commits en inglés. Interfaz y documentos en español rioplatense. El usuario no es programador.
- Toda mecánica nueva lleva su prueba. El balance se mide con partidas simuladas, no a ojo.
- Lo que decide el usuario se marca "(decisión)" con 2-3 opciones y una recomendada.
