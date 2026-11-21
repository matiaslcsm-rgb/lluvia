// The world of Lluvia: texts the screens show. The long version is docs/LORE.md.
(function (L) {
  'use strict';
  L.data.lore = {
    tagline: 'Hace cien años que llueve en Aguaverde. El último Paraguas en pie gana un día de sol.',
    intro: [
      'En Aguaverde llueve desde hace cien años. De los charcos salen los Anegados: criaturas de agua y barro que se llevan todo lo que tocan.',
      'Cada temporada, la Torre del Trueno convoca a ocho Paraguas, los únicos que saben pelear bajo el Diluvio. Cada uno defiende su barrio de la horda.',
      'Cada tanto, el Trueno elige a dos y los llama al Juicio: un duelo bajo una Ley del Cielo distinta cada vez. Los demás apuestan desde sus barrios.',
      'El último Paraguas en pie gana el Sol: un día entero sin lluvia para su barrio. Nadie recuerda la última vez que alguien lo consiguió.'
    ],
    bios: {
      brasa: 'Una herrera que nunca dejó apagar su fragua. Donde pisa, el agua hierve.',
      roca: 'Fue el muro del puerto durante treinta inundaciones. No se mueve rápido, pero no se mueve.',
      filo: 'Corre por los techos de Aguaverde desde chica. Corta la lluvia antes de que toque el suelo.',
      ceniza: 'Estudiosa de la Torre. Aprendió a guardar el rayo en un frasco y a soltarlo de a poco.',
      musgo: 'Creció en el pantano viejo, donde la lluvia no destruye: hace crecer. La horda la esquiva.',
      marea: 'Pescadora del muelle. Dice que el mar le habla, y que el mar está harto de la lluvia.',
      oxido: 'Junta chatarra de las inundaciones y la vuelve a armar. Sus torretas tienen nombre.',
      faro: 'El último guardián del faro del puerto. Hace cien años que no ve un barco, pero la luz sigue prendida.'
    },
    // What each Paraguas does with the day of sun it won (shown when you win).
    sunDays: {
      brasa: 'Brasa prende una fogata en la plaza seca y por primera vez el fuego no chisporrotea bajo la lluvia.',
      roca: 'Roca se sienta en el muelle con los pies colgando y deja que el sol le caliente la piedra de la espalda.',
      filo: 'Filo corre por los techos secos de punta a punta del barrio, solo para ver si puede.',
      ceniza: 'Ceniza abre los ventanales de la Torre y lee al sol el libro que la lluvia nunca le dejó terminar.',
      musgo: 'Musgo se tira en el pasto, que por un día no es barro, y escucha crecer las plantas.',
      marea: 'Marea baja a la playa y mira cómo el mar, por fin, se queda quieto en su lugar.',
      oxido: 'Óxido desarma sus torretas y deja que el sol seque cada tornillo, uno por uno.',
      faro: 'Faro apaga su luz. Por un día entero, Aguaverde no necesita que nadie la ilumine.'
    },
    rivals: 'Nube, Trueno, Granizo, Bruma, Rocío, Relámpago y Llovizna: los otros siete Paraguas de esta temporada.',
    winLines: [
      'Las nubes se abren sobre tu barrio. Por primera vez en cien años, sale el sol.',
      'La Torre del Trueno se calla. Tu barrio va a tener su día de sol.'
    ],
    loseLines: [
      'La lluvia sigue. Habrá otra temporada.',
      'Tu barrio queda bajo el agua esta vez. El Trueno vuelve a convocar el año que viene.'
    ]
  };
})(this.Lluvia = this.Lluvia || {});
