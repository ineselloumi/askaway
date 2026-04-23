// ─── Localized story chat messages ───────────────────────────────────────────
// Each entry maps locale → storyId → { user, assistant } strings.
// English is the default (kept in storyData.ts). Only non-English locales live here.
// Stories each have exactly one user message followed by one assistant message.

interface LocalizedPair {
  user: string;
  assistant: string;
}

type LocalizedMessages = Record<string, Record<string, LocalizedPair>>;

export const storyLocalizedMessages: LocalizedMessages = {

  // ── French ─────────────────────────────────────────────────────────────────
  fr: {
    maria: {
      user: `Je prépare un voyage de 4 jours à Paris en juin et j'ai besoin d'aide pour planifier mon itinéraire. J'adore l'art et l'histoire, je voyage avec ma cousine Frankie, et notre budget est flexible. Nous séjournerons près de la cathédrale Notre Dame.

Peux-tu détailler chaque journée avec des activités pour le matin, l'après-midi et le soir ? Ajoute aussi des suggestions de restaurants près des endroits où nous serons, ce qu'il faut réserver à l'avance, et des conseils pour éviter la foule.`,
      assistant: `## Jour 1 — Le cœur historique (vous êtes déjà au meilleur endroit)
### Matin
Commencez par la cathédrale Notre Dame — en juin 2026, elle est entièrement rouverte et absolument splendide. Arrivez à 8h30 avant l'affluence. Traversez ensuite directement vers la Sainte-Chapelle (les vitraux sont sublimes à la lumière du matin).
### Après-midi
Rejoignez la Rive Gauche et explorez Saint-Germain-des-Prés — flânez dans les galeries, faites un saut au Musée de Cluny (art médiéval, tapisseries remarquables) et promenez-vous dans les ruelles.
### Soir
Dîner à Saint-Germain. Essayez Allard — un bistrot parisien classique à l'ancienne, ouvert depuis 1931. Puis promenade en soirée le long de la Seine au coucher du soleil (le soleil ne se couche pas avant 22h environ).
🎟️ À réserver à l'avance : entrée horodatée à la Sainte-Chapelle

## Jour 2 — Le Louvre + le Palais Royal
### Matin
Le Louvre — réservez le premier créneau d'entrée (9h). Concentrez-vous sur 2 à 3 ailes maximum, sinon vous serez épuisées. L'aile Richelieu pour l'histoire de France, l'aile Denon pour les chefs-d'œuvre incontournables.
### Après-midi
Promenez-vous jusqu'aux jardins du Palais Royal pour décompresser, puis explorez le Marais — faites un tour à la Place des Vosges (la plus ancienne place de Paris) et glissez-vous dans les petites galeries autour de la Rue de Bretagne.
### Soir
Dîner dans le Marais. Le Breizh Café propose des crêpes et galettes bretonnes exceptionnelles — ça semble simple, c'est exceptionnel. Le quartier est animé pour une balade digestive.
🎟️ À réserver à l'avance : entrée horodatée au Louvre (complet des semaines à l'avance en juin)

## Jour 3 — Excursion à Versailles
### Matin
Prenez le RER C depuis Saint-Michel (10 min à pied depuis Notre Dame) jusqu'à Versailles — visez l'ouverture des grilles à 9h. Dirigez-vous directement vers les jardins avant que le château ne soit envahi.
### Après-midi
Visitez l'intérieur du château après le déjeuner. La Galerie des Glaces, les appartements royaux, tout le reste. Comptez environ 5 à 6 heures au total pour la journée.
### Soir
De retour à Paris en début de soirée. Dîner tranquille près de Notre Dame — Les Deux Magots pour l'expérience café emblématique, ou Au Vieux Paris d'Arcole juste à l'ombre de la cathédrale pour de solides classiques français.
🎟️ À réserver à l'avance : entrée horodatée à Versailles — absolument indispensable en juin

## Jour 4 — Montmartre + Musée d'Orsay
### Matin
Direction Montmartre de bonne heure — le Sacré-Cœur à 8h30 avant l'arrivée des touristes. Flânez dans les rues du village autour de la Place du Tertre, trouvez un café pour un petit-déjeuner tranquille.
### Après-midi
Redescendez vers le Musée d'Orsay (Impressionnisme, post-Impressionnisme — ce sera le coup de cœur pour les amatrices d'art). Le bâtiment lui seul vaut le détour.
### Soir
Un dîner de gala pour clôturer le séjour. Septime dans le 11e est l'un des meilleurs restaurants de Paris — créatif, de saison, sans prétention. Réservez bien à l'avance. Ou si vous préférez quelque chose de plus classique, Le Comptoir du Relais près de Saint-Germain.
🎟️ À réserver à l'avance : entrée horodatée au Musée d'Orsay + réservation de restaurant

## Conseils généraux pour éviter la foule

* Arrivez à chaque site majeur dès l'ouverture — la différence entre 9h et 11h est énorme en juin
* Procurez-vous une carte Navigo Easy pour le métro/RER — bien plus pratique que d'acheter des tickets à l'unité
* La plupart des musées sont gratuits le premier dimanche du mois — ça vaut la peine de le prévoir si ça tombe pendant votre séjour
* Évitez la Tour Eiffel à moins que ce soit une priorité — les files d'attente en juin sont éprouvantes et ça prend une demi-journée`,
    },
    tom: {
      user: `J'ai reçu cet e-mail hier, est-il légitime ?

De : security-alert@bankofamerica-support-center.com
Objet : ⚠️ Urgent : Activité suspecte détectée sur votre compte

Bonjour Tom,

Nous avons détecté une activité de connexion inhabituelle sur votre compte Bank of America se terminant par 3486. Afin de protéger votre compte, nous avons temporairement limité l'accès à celui-ci.

Veuillez vérifier votre identité dans les 24 heures pour rétablir l'accès complet :

👉 **Vérifier mon compte maintenant**

Si vous ne procédez pas à cette vérification, votre compte sera définitivement suspendu.

L'équipe de sécurité Bank of America`,
      assistant: `Il s'agit d'un e-mail de phishing. Ne cliquez sur aucun lien. Voici pourquoi il est clairement frauduleux :

Le domaine de l'expéditeur est faux. Le vrai domaine de Bank of America est bankofamerica.com. Cet e-mail provient de bankofamerica-support-center.com — un domaine entièrement différent, conçu pour paraître légitime au premier coup d'œil.

## Les techniques utilisées sont des classiques du phishing
* Urgence artificielle (« 24 heures » ou « définitivement suspendu »)
* Menaces de perte de compte pour vous pousser à agir vite sans réfléchir
* Emoji dans l'objet pour capter l'attention
* Une vague allusion à une « activité inhabituelle » avec juste assez de détails (4 derniers chiffres) pour paraître crédible

## Les 4 derniers chiffres ne prouvent rien
Les escrocs peuvent obtenir des numéros de compte partiels via des fuites de données ou simplement les deviner — ce détail vise à rendre l'e-mail plus personnalisé et à inspirer confiance.

## Que faire
* Ne cliquez sur aucun lien dans cet e-mail
* Signalez-le comme phishing/spam dans votre messagerie
* Si vous avez un doute sur votre compte Bank of America, rendez-vous directement sur bankofamerica.com en le tapant dans votre navigateur, ou appelez le numéro au dos de votre carte
* Vous pouvez aussi transférer les e-mails de phishing à abuse@bankofamerica.com`,
    },
    hannah: {
      user: `J'ai du mal à m'endormir et à rester endormie. Je me réveille souvent à 3h ou 4h du matin et je n'arrive pas à me rendormir. Que puis-je faire pour améliorer mon sommeil ?`,
      assistant: `Les troubles du sommeil comme les vôtres — en particulier ces réveils en fin de nuit — sont très courants et répondent généralement très bien aux changements de comportement. Voici ce qui fonctionne le mieux :

## Les bases de l'hygiène du sommeil
* Évitez les écrans ou les lumières vives au plafond dans les 1 à 2 heures avant le coucher.
* Maintenez votre chambre fraîche (environ 18–20°C est idéal pour la plupart des gens), sombre et silencieuse.
* Gardez une heure de réveil fixe chaque jour, même le week-end.
* Exposez-vous à une lumière vive (idéalement le soleil) dans l'heure qui suit votre réveil.

## Quand vous vous réveillez à 3h–4h du matin
La pire chose à faire est de rester au lit à essayer de forcer le sommeil — cela entraîne votre cerveau à associer le lit à l'éveil. À la place :

* Évitez de regarder votre téléphone ou votre réveil — connaître l'heure exacte tend à faire monter l'anxiété.
* Si vous êtes éveillée depuis plus de 20 minutes, levez-vous et faites quelque chose de calme dans une lumière tamisée (lire un livre papier, s'étirer doucement) jusqu'à ce que vous vous sentiez à nouveau somnolente.
* Essayez la respiration lente et diaphragmatique (inspirez sur 4 temps, expirez sur 6 à 8 temps) pour apaiser votre système nerveux.

## Les habitudes de la journée qui influencent le sommeil
* Évitez la caféine après midi ou 13h — sa demi-vie est de 5 à 7 heures, donc un café en début d'après-midi est encore dans votre organisme à minuit.
* Limitez l'alcool. Il aide à s'endormir mais fragmente le sommeil en seconde partie de nuit, ce qui contribue probablement à vos réveils de 3h–4h.
* L'exercice physique régulier améliore significativement la qualité du sommeil, mais essayez de terminer les séances intenses au moins 2 à 3 heures avant le coucher.

## Routine de décompression
Une routine pré-sommeil régulière de 30 à 60 minutes signale à votre cerveau que l'heure du sommeil approche. Elle peut inclure une douche chaude (la baisse de température corporelle qui s'ensuit favorise l'endormissement), une lecture légère ou des étirements doux.`,
    },
    juan: {
      user: `Chaque printemps, j'ai tendance à avoir le nez qui coule, les yeux qui piquent et la gorge qui démange. J'éternue fréquemment. Heureusement, je n'ai pas de fièvre. Est-ce que ce sont des symptômes d'un rhume ?`,
      assistant: `Ces symptômes ressemblent bien plus à des allergies saisonnières (rhinite allergique, communément appelée « rhume des foins ») qu'à un rhume. Voici pourquoi :

Le schéma que vous décrivez — qui se manifeste chaque printemps, avec le nez qui coule, les yeux qui piquent, la gorge qui démange et des éternuements — est la présentation classique des allergies saisonnières.

## Ce qui oriente vers les allergies plutôt que vers un rhume
* Ça se produit chaque printemps, ce qui correspond aux saisons polliniques (le pollen des arbres atteint son pic au printemps)
* Les démangeaisons — des yeux et de la gorge en particulier — sont caractéristiques des réactions allergiques, pas des infections virales
* Absence de fièvre, qui est plus fréquente avec les rhumes
* Les rhumes se résolvent généralement en 7 à 10 jours ; si vos symptômes durent plusieurs semaines, cela pointe fortement vers des allergies

## En quoi ils diffèrent d'un rhume
* Les rhumes s'accompagnent souvent de courbatures, de fatigue et parfois d'un mal de gorge (plutôt que de démangeaisons)
* Les symptômes du rhume évoluent sur plusieurs jours (s'aggravent puis s'améliorent) ; les symptômes allergiques restent constants tant que vous êtes exposé au facteur déclenchant
* Les rhumes sont causés par un virus ; les allergies sont la réaction de votre système immunitaire au pollen ou à d'autres allergènes en suspension dans l'air

## Ce que vous pourriez envisager
* Les antihistaminiques disponibles sans ordonnance (comme la cétirizine ou la loratadine) et les sprays nasaux à base de corticoïdes sont souvent très efficaces contre les symptômes des allergies saisonnières
* Noter chaque année à quel moment vos symptômes commencent et s'arrêtent peut aider à confirmer le schéma
* Si les symptômes affectent significativement votre qualité de vie, un allergologue peut réaliser des tests cutanés ou sanguins pour identifier vos déclencheurs spécifiques et discuter d'options comme l'immunothérapie

Cela dit, je ne suis pas médecin, et il vaut la peine d'évoquer ce schéma avec votre médecin — surtout si vous ne l'avez pas encore fait — afin qu'il puisse confirmer le diagnostic et vous recommander le meilleur traitement.`,
    },
    nicolas: {
      user: `Peux-tu me partager une recette de lasagne adaptée aux personnes intolérantes au lactose ? Utilise des ingrédients faciles à trouver.`,
      assistant: `## Lasagne sans produits laitiers
Une lasagne généreuse et conviviale, préparée sans aucun produit laitier — vous n'en manquerez pas !

## Ingrédients pour 6 personnes
* 12 feuilles de lasagne
* 2 cuillères à soupe d'huile d'olive
* 1 oignon jaune, émincé
* 4 gousses d'ail, hachées
* 500g de viande de bœuf hachée ou de saucisse italienne
* 1 boîte de tomates concassées (800g)
* 2 cuillères à soupe de concentré de tomates
* 1 c. à café d'origan séché
* 1 c. à café de basilic séché
* 1 c. à café de sel
* ½ c. à café de poivre noir
* 200g de noix de cajou crues, trempées 4h ou toute la nuit
* 240ml d'eau
* 2 cuillères à soupe de jus de citron
* 3 cuillères à soupe de levure nutritionnelle
* 200g de mozzarella végétale (par ex. Violife ou Daiya), râpée

## Étapes
1 — Cuire les pâtes : Faites cuire les feuilles de lasagne selon les instructions du paquet jusqu'à ce qu'elles soient al dente. Égouttez-les, arrosez-les d'un filet d'huile d'olive pour éviter qu'elles ne collent, et réservez.

2 — Préparer la sauce à la viande : Faites chauffer l'huile d'olive dans une grande poêle à feu moyen. Ajoutez l'oignon et faites revenir jusqu'à ce qu'il soit fondant, environ 7 minutes. Ajoutez l'ail et faites cuire encore 1 minute. Ajoutez la viande hachée ou la saucisse et faites cuire jusqu'à ce qu'elle soit bien dorée, en l'émiettant au fur et à mesure. Retirez l'excès de graisse.

3 — Laisser mijoter la sauce : Incorporez les tomates concassées, le concentré de tomates, l'origan, le basilic, le sel et le poivre. Laissez mijoter à feu doux pendant 15 minutes, en remuant de temps en temps.

4 — Préparer la crème de cajou : Égouttez les noix de cajou trempées et mixez-les avec l'eau, le jus de citron et la levure nutritionnelle jusqu'à obtenir une texture parfaitement lisse et crémeuse. C'est votre substitut de ricotta sans lactose. Assaisonnez avec une pincée de sel selon votre goût.

5 — Préchauffer le four : Préchauffez à 190°C.

6 — Assembler : Dans un plat à four de 20×30 cm environ, étalez une fine couche de sauce à la viande au fond. Disposez 3 à 4 feuilles de lasagne, puis ⅓ de la crème de cajou, puis ⅓ de la sauce à la viande. Répétez pour 3 couches au total. Terminez par le reste de sauce à la viande et recouvrez uniformément de mozzarella végétale râpée.

7 — Cuire à couvert : Couvrez hermétiquement avec du papier aluminium et enfournez pendant 30 minutes.

8 — Cuire à découvert : Retirez le papier aluminium et poursuivez la cuisson 15 minutes supplémentaires, jusqu'à ce que le dessus soit doré et légèrement gratiné.

9 — Laisser reposer et servir : Laissez la lasagne reposer environ 10 minutes avant de la découper — cela permet de la tenir à la coupe. Servez avec une simple salade verte et du pain croustillant.

Les substitutions clés sont simples : une crème de cajou mixée remplace la ricotta (elle est crémeuse, riche et au goût très neutre), et la mozzarella végétale râpée s'occupe de la couche fondante du dessus. Tout le reste est entièrement classique. Bon appétit !`,
    },
  },

  // ── Spanish ────────────────────────────────────────────────────────────────
  es: {
    maria: {
      user: `Estoy planeando un viaje de 4 días a París en junio y necesito ayuda para organizar el itinerario. Me apasiona el arte y la historia, viajo con mi prima Frankie, y tenemos un presupuesto flexible. Nos alojaremos cerca de la catedral de Notre Dame.

¿Puedes organizar cada día con actividades por la mañana, la tarde y la noche? Añade también sugerencias de restaurantes cerca de cada lugar, lo que conviene reservar con antelación, y consejos para evitar las multitudes.`,
      assistant: `## Día 1 — El corazón histórico (ya estáis en el mejor sitio)
### Mañana
Empezad en la Catedral de Notre Dame — en junio de 2026 estará completamente reabierta y es impresionante. Llegad a las 8:30 antes de que lleguen las multitudes. Cruzad después a la Sainte-Chapelle (las vidrieras son más bonitas con la luz de la mañana).
### Tarde
Cruzad a la orilla izquierda y explorad Saint-Germain-des-Prés — visitad galerías, entrad al Musée de Cluny (arte medieval, tapices increíbles) y callejeád por las calles estrechas.
### Noche
Cena en Saint-Germain. Probad Allard — un clásico bistró parisino de la vieja escuela, abierto desde 1931. Luego un paseo nocturno a orillas del Sena mientras se pone el sol (no se pondrá hasta casi las 22 h).
🎟️ Reservar con antelación: entrada con hora para Sainte-Chapelle

## Día 2 — El Louvre + Palais Royal
### Mañana
El Louvre — reservad el primer turno de entrada (9 h). Centraos en 2-3 alas como máximo o acabaréis agotados. El ala Richelieu para la historia francesa, Denon para las grandes obras.
### Tarde
Pasead hasta los jardines del Palais Royal para descansar, luego explorad el Marais — visitad la Place des Vosges (la plaza más antigua de París) y entrad en pequeñas galerías por la Rue de Bretagne.
### Noche
Cena en el Marais. Breizh Café hace unas crepes y galettes bretonas excepcionales — suena sencillo, sabe de maravilla. El barrio es muy animado para pasear después de cenar.
🎟️ Reservar con antelación: entrada con hora para el Louvre (se agota semanas antes en junio)

## Día 3 — Excursión a Versalles
### Mañana
Tomad el RER C desde Saint-Michel (10 min andando desde Notre Dame) hasta Versalles — intentad llegar cuando abran las puertas a las 9 h. Id directamente a los jardines antes de que se llene el palacio.
### Tarde
Visited el interior del palacio después de comer. La Galería de los Espejos, los apartamentos del rey, todo. Calculad unas 5-6 horas en total para el día.
### Noche
De vuelta a París a primera hora de la tarde. Una cena tranquila y relajada cerca de Notre Dame — Les Deux Magots para la experiencia icónica de café, o Au Vieux Paris d'Arcole justo a la sombra de la catedral para clásicos de la cocina francesa.
🎟️ Reservar con antelación: entrada con hora para Versalles — absolutamente imprescindible en junio

## Día 4 — Montmartre + Musée d'Orsay
### Mañana
Id a Montmartre temprano — el Sacré-Cœur a las 8:30 antes de que llegue la oleada turística. Callejeád por las calles del barrio alrededor de la Place du Tertre, encontrad un café para desayunar con calma.
### Tarde
Volved hacia el sur hasta el Musée d'Orsay (Impresionismo, posimpresionismo — este será el punto álgido para los amantes del arte). El edificio por sí solo ya vale la visita.
### Noche
Una cena especial para cerrar el viaje por todo lo alto. Septime, en el distrito 11, es uno de los mejores restaurantes de París — creativo, de temporada, sin pretensiones. Reservad con mucha antelación. O si preferís algo más clásico, Le Comptoir du Relais cerca de Saint-Germain.
🎟️ Reservar con antelación: entrada con hora para el Musée d'Orsay + reserva de restaurante

## Consejos generales para evitar las multitudes

* Llegad a cada lugar importante justo al abrir — la diferencia entre las 9 h y las 11 h es enorme en junio
* Conseguid una tarjeta Navigo Easy para el metro y el RER — mucho más cómodo que comprar billetes sueltos
* La mayoría de los museos son gratuitos el primer domingo del mes — vale la pena ajustar el calendario si cae durante vuestro viaje
* Evitad la Torre Eiffel a menos que sea una prioridad — las colas en junio son brutales y se come medio día`,
    },
    tom: {
      user: `Recibí este correo electrónico ayer, ¿es legítimo?

De: security-alert@bankofamerica-support-center.com
Asunto: ⚠️ Urgente: Se ha detectado actividad sospechosa en tu cuenta

Hola Tom,

Hemos detectado actividad de inicio de sesión inusual en tu cuenta de Bank of America que termina en 3486. Para proteger tu cuenta, hemos limitado el acceso temporalmente.

Por favor, verifica tu identidad en un plazo de 24 horas para restaurar el acceso completo:

👉 **Verificar mi cuenta ahora**

Si no verificas tu identidad, tu cuenta será suspendida de forma permanente.

Equipo de Seguridad de Bank of America`,
      assistant: `Este es un correo de phishing. No hagas clic en ningún enlace. Aquí tienes los motivos por los que es claramente fraudulento:

El dominio del remitente es falso. El dominio real de Bank of America es bankofamerica.com. Este correo proviene de bankofamerica-support-center.com — un dominio completamente diferente diseñado para parecer legítimo a primera vista.

## Las tácticas son patrones clásicos de phishing
* Urgencia artificial ("24 horas" o "suspendida de forma permanente")
* Amenazas de pérdida de cuenta para presionarte a actuar rápido sin pensar
* Emoji en el asunto para llamar la atención
* Una vaga afirmación de "actividad inusual" con suficientes detalles (últimos 4 dígitos) para parecer creíble

## Los últimos 4 dígitos no significan mucho
Los estafadores pueden obtener números de cuenta parciales a través de filtraciones de datos o simplemente adivinarlos — este detalle está pensado para que el correo parezca personalizado y de confianza.

## Qué hacer
* No hagas clic en ningún enlace del correo
* Márcalo como phishing/spam en tu cliente de correo
* Si realmente te preocupa tu cuenta de BofA, ve directamente a bankofamerica.com escribiéndolo en tu navegador, o llama al número que aparece en el reverso de tu tarjeta
* También puedes reenviar correos de phishing a abuse@bankofamerica.com`,
    },
    hannah: {
      user: `He tenido problemas para conciliar el sueño y para mantenerlo. A menudo me despierto a las 3 o las 4 de la madrugada y me cuesta volver a dormirme. ¿Qué puedo hacer para mejorar mi sueño?`,
      assistant: `Los problemas de sueño como los tuyos — especialmente ese despertar a primera hora de la madrugada — son muy comunes y suelen responder muy bien a los cambios de comportamiento. Esto es lo que mejor funciona:

## Hábitos básicos de higiene del sueño
* Evita las pantallas o las luces de techo brillantes en las 1-2 horas antes de acostarte.
* Mantén el dormitorio fresco (alrededor de 18-20 °C es ideal para la mayoría), oscuro y silencioso.
* Mantén una hora de despertar constante todos los días, incluidos los fines de semana.
* Exponte a luz intensa (idealmente luz solar) en la primera hora tras despertar.

## Cuando te despiertas a las 3-4 de la madrugada
Lo peor que puedes hacer es quedarte en la cama intentando forzar el sueño con ansiedad — esto entrena a tu cerebro a asociar la cama con el estado de vigilia. En su lugar:

* Evita mirar el móvil o el reloj — saber la hora exacta tiende a disparar la ansiedad.
* Si llevas más de 20 minutos despierto, levántate y haz algo tranquilo con luz tenue (leer un libro en papel, estiramientos suaves) hasta que vuelvas a tener sueño.
* Prueba la respiración lenta y diafragmática (inhala 4 tiempos, exhala 6-8 tiempos) para calmar el sistema nervioso.

## Hábitos diurnos que afectan al sueño nocturno
* Evita la cafeína después del mediodía o la 1 de la tarde — su vida media es de 5-7 horas, así que el café de la tarde sigue en tu organismo a medianoche.
* Limita el alcohol. Ayuda a conciliar el sueño, pero lo fragmenta en la segunda mitad de la noche, lo que probablemente contribuye a tu despertar de las 3-4.
* El ejercicio regular mejora significativamente la calidad del sueño, pero intenta terminar los entrenamientos intensos al menos 2-3 horas antes de acostarte.

## Rutina de relajación antes de dormir
Una rutina constante de 30-60 minutos antes de acostarte le indica a tu cerebro que se acerca el momento de dormir. Puede incluir una ducha caliente (la posterior bajada de temperatura corporal favorece el sueño), lectura ligera o estiramientos suaves.`,
    },
    juan: {
      user: `Cada primavera tiendo a tener mocos, ojos con picor y picor en la garganta. Estornudo con frecuencia. Por suerte no tengo fiebre. ¿Son estos los síntomas de un resfriado?`,
      assistant: `Estos síntomas se parecen mucho más a una alergia estacional (rinitis alérgica, comúnmente llamada "fiebre del heno") que a un resfriado. Aquí te explico por qué:

El patrón que describes — que ocurre cada primavera, con mocos, ojos con picor, picor en la garganta y estornudos — es la presentación clásica de las alergias estacionales.

## Lo que apunta a alergia y no a resfriado
* Ocurre cada primavera, lo que coincide con la temporada de polen (el polen de los árboles alcanza su pico en primavera)
* El picor — especialmente en los ojos y la garganta — es una señal característica de las reacciones alérgicas, no de las infecciones virales
* Sin fiebre, que es más habitual en los resfriados
* Los resfriados suelen resolverse en 7-10 días; si tus síntomas duran semanas, eso apunta claramente a alergia

## En qué se diferencian de un resfriado
* Los resfriados suelen ir acompañados de dolor muscular, cansancio y a veces dolor de garganta (en lugar de picor)
* Los síntomas del resfriado evolucionan a lo largo de los días (empeoran y luego mejoran); los síntomas alérgicos se mantienen constantes mientras estás expuesto al desencadenante
* Los resfriados los causa un virus; las alergias son la reacción de tu sistema inmunitario al polen u otros desencadenantes en el aire

## Qué podrías considerar
* Los antihistamínicos de venta libre (como la cetirizina o la loratadina) y los sprays nasales de corticosteroides suelen ser muy eficaces para los síntomas de alergia estacional
* Llevar un registro de cuándo empiezan y terminan tus síntomas cada año puede ayudar a confirmar el patrón
* Si los síntomas afectan significativamente tu calidad de vida, un alergólogo puede hacer pruebas cutáneas o de sangre para identificar tus desencadenantes específicos y comentar opciones como la inmunoterapia

Dicho esto, no soy médico, y vale la pena comentarle este patrón a tu médico — especialmente si aún no lo has hecho — para que pueda confirmar el diagnóstico y recomendarte el mejor tratamiento.`,
    },
    nicolas: {
      user: `¿Puedes compartir una receta de lasaña adaptada para personas intolerantes a la lactosa? Por favor, usa ingredientes que pueda encontrar fácilmente.`,
      assistant: `## Lasaña sin lácteos
¡Una lasaña contundente y para todos los gustos, elaborada sin ningún lácteo — no los echarás de menos!

## Ingredientes para 6 personas
* 12 láminas de lasaña
* 2 cucharadas de aceite de oliva
* 1 cebolla amarilla, picada
* 4 dientes de ajo, picados
* 500 g de carne picada de ternera o salchicha italiana
* 1 lata de tomate triturado (800 g)
* 2 cucharadas de concentrado de tomate
* 1 cucharadita de orégano seco
* 1 cucharadita de albahaca seca
* 1 cucharadita de sal
* ½ cucharadita de pimienta negra
* 200 g de anacardos crudos, en remojo 4 h o toda la noche
* 240 ml de agua
* 2 cucharadas de zumo de limón
* 3 cucharadas de levadura nutricional
* 200 g de mozzarella vegana (p. ej. Violife o Daiya), rallada

## Pasos
1 — Cocer las láminas: Cuece las láminas de lasaña siguiendo las instrucciones del paquete hasta que estén al dente. Escúrrelas, rocíalas con un poco de aceite de oliva para que no se peguen y resérvalas.

2 — Preparar la salsa de carne: Calienta el aceite de oliva en una sartén grande a fuego medio. Añade la cebolla y cocina hasta que esté blanda, unos 7 minutos. Agrega el ajo y cocina 1 minuto más. Incorpora la carne picada o la salchicha y cocina hasta que esté dorada, partiéndola mientras se cocina. Escurre el exceso de grasa.

3 — Reducir la salsa: Añade el tomate triturado, el concentrado de tomate, el orégano, la albahaca, la sal y la pimienta. Deja cocer a fuego lento durante 15 minutos, removiendo de vez en cuando.

4 — Preparar la crema de anacardos: Escurre los anacardos remojados y bátelos con el agua, el zumo de limón y la levadura nutricional hasta obtener una mezcla completamente suave y cremosa. Este es tu sustituto vegano de la ricotta. Sazona con una pizca de sal al gusto.

5 — Precalentar el horno: Precalienta a 190 °C.

6 — Montar: En una fuente de horno de 23×33 cm, extiende una fina capa de salsa de carne en el fondo. Coloca 3-4 láminas, luego ⅓ de la crema de anacardos y después ⅓ de la salsa de carne. Repite para hacer 3 capas en total. Termina con el resto de la salsa de carne y cubre uniformemente con la mozzarella vegana rallada.

7 — Hornear tapado: Cubre bien con papel de aluminio y hornea durante 30 minutos.

8 — Hornear destapado: Retira el papel de aluminio y hornea otros 15 minutos, hasta que la superficie esté burbujeante y ligeramente dorada.

9 — Reposar y servir: Deja reposar la lasaña unos 10 minutos antes de cortarla — esto ayuda a que se mantenga bien. Sírvela con una ensalada verde sencilla y pan crujiente.

Los cambios clave son simples: una crema de anacardos triturados sustituye a la ricotta (es cremosa y rica con un sabor muy neutro), y la mozzarella vegana rallada se encarga de la capa superior fundida. Todo lo demás es completamente estándar. ¡Que aproveche!`,
    },
  },

  // ── German ─────────────────────────────────────────────────────────────────
  de: {
    maria: {
      user: `Ich plane eine 4-tägige Reise nach Paris im Juni und brauche Hilfe bei der Reiseplanung. Ich interessiere mich für Kunst und Geschichte, reise mit meiner Cousine Frankie, und unser Budget ist flexibel. Wir werden in der Nähe der Kathedrale Notre Dame wohnen.

Kannst du jeden Tag mit Aktivitäten für den Morgen, Nachmittag und Abend aufteilen? Füge auch Restaurantempfehlungen in der Nähe unserer jeweiligen Standorte hinzu, was wir im Voraus buchen sollten, und Tipps, um den Menschenmassen zu entgehen.`,
      assistant: `## Tag 1 — Das historische Herz (du bist bereits am besten Ort)
### Morgen
Beginne bei der Kathedrale Notre Dame — im Juni 2026 ist sie vollständig wiedereröffnet und atemberaubend. Sei um 8:30 Uhr dort, bevor die Massen ankommen. Gehe direkt danach zur Sainte-Chapelle (das Buntglas ist im Morgenlicht am schönsten).
### Nachmittag
Überquere das linke Seineufer und erkunde Saint-Germain-des-Prés — schau dich in Galerien um, schau im Musée de Cluny vorbei (mittelalterliche Kunst, unglaubliche Wandteppiche), und schlendere durch die engen Straßen.
### Abend
Abendessen in Saint-Germain. Probiere Allard — klassisches altmodisches Pariser Bistro, seit 1931 dort. Dann ein Abendspaziergang entlang der Seine, wenn die Sonne untergeht (sie geht erst gegen 22 Uhr unter).
🎟️ Im Voraus buchen: Sainte-Chapelle Zeitfensterticket

## Tag 2 — Der Louvre + Palais Royal
### Morgen
Der Louvre — buche den ersten Einlass (9 Uhr). Konzentriere dich auf maximal 2–3 Flügel, sonst ist man erschöpft. Der Richelieu-Flügel für französische Geschichte, Denon für die großen Highlights.
### Nachmittag
Spaziere zu den Gärten des Palais Royal zum Entspannen, dann erkunde das Marais — besuche die Place des Vosges (Pariser ältester Platz) und schau in kleine Galerien entlang der Rue de Bretagne.
### Abend
Abendessen im Marais. Das Breizh Café serviert außergewöhnliche bretonische Crêpes und Galettes — klingt einfach, schmeckt unglaublich. Lebhaftes Viertel für einen Spaziergang nach dem Essen.
🎟️ Im Voraus buchen: Louvre Zeitfensterticket (im Juni Wochen im Voraus ausverkauft)

## Tag 3 — Tagesausflug nach Versailles
### Morgen
Nimm den RER C vom Saint-Michel (10 Minuten zu Fuß von Notre Dame) nach Versailles — plane die Ankunft bei Öffnung um 9 Uhr ein. Gehe zuerst direkt in die Gärten, bevor sich die Massen im Schloss ansammeln.
### Nachmittag
Besichtige das Schlossinnere nach dem Mittagessen. Der Spiegelsaal, die Königsgemächer, alles. Plane insgesamt etwa 5–6 Stunden für den Tag ein.
### Abend
Am frühen Abend zurück in Paris. Entspanntes, gemütliches Abendessen in der Nähe von Notre Dame — Les Deux Magots für das ikonische Café-Erlebnis, oder Au Vieux Paris d'Arcole direkt im Schatten der Kathedrale für solide französische Klassiker.
🎟️ Im Voraus buchen: Versailles Zeitfensterticket — im Juni absolut unverzichtbar

## Tag 4 — Montmartre + Musée d'Orsay
### Morgen
Gehe früh nach Montmartre — Sacré-Cœur um 8:30 Uhr, bevor die Touristenwelle ankommt. Schlendere durch die Dorfstraßen rund um die Place du Tertre, finde ein Café für ein gemütliches Frühstück.
### Nachmittag
Fahre zurück in den Süden zum Musée d'Orsay (Impressionismus, Post-Impressionismus — das wird das Highlight für Kunstliebhaber sein). Das Gebäude allein ist schon den Besuch wert.
### Abend
Schlemmeressen zum Abschluss der Reise. Septime im 11. Arrondissement ist eines der besten Restaurants in Paris — kreativ, saisonal, nicht steif. Weit im Voraus buchen. Oder wenn du etwas Klassischeres möchtest, Le Comptoir du Relais in der Nähe von Saint-Germain.
🎟️ Im Voraus buchen: Musée d'Orsay Zeitfensterticket + Tischreservierung

## Allgemeine Tipps, um den Menschenmassen zu entgehen

* Komme bei jeder wichtigen Sehenswürdigkeit direkt bei der Öffnung an — der Unterschied zwischen 9 Uhr und 11 Uhr ist im Juni enorm
* Besorge dir eine Navigo Easy-Karte für Metro/RER — viel einfacher als Einzeltickets kaufen
* Die meisten Museen sind am ersten Sonntag des Monats kostenlos — es lohnt sich, wenn es in deinen Reisezeitraum fällt
* Vermeide den Eiffelturm, wenn er keine Priorität ist — die Warteschlangen im Juni sind brutal und kosten einen halben Tag`,
    },
    tom: {
      user: `Ich habe diese E-Mail gestern erhalten. Ist sie legitim?

Von: security-alert@bankofamerica-support-center.com
Betreff: ⚠️ Dringend: Verdächtige Aktivität auf Ihrem Konto festgestellt

Hallo Tom,

wir haben ungewöhnliche Anmeldeaktivitäten auf Ihrem Bank of America-Konto mit der Endung 3486 festgestellt. Um Ihr Konto zu schützen, haben wir den Zugriff vorübergehend eingeschränkt.

Bitte bestätigen Sie Ihre Identität innerhalb von 24 Stunden, um den vollständigen Zugriff wiederherzustellen:

👉 **Mein Konto jetzt bestätigen**

Wenn Sie Ihre Identität nicht bestätigen, wird Ihr Konto dauerhaft gesperrt.

Bank of America Sicherheitsteam`,
      assistant: `Das ist eine Phishing-E-Mail. Klicke auf keinen Link darin. Hier ist der Grund, warum sie eindeutig betrügerisch ist:

Die Absender-Domain ist gefälscht. Die echte Domain von Bank of America ist bankofamerica.com. Diese E-Mail kommt von bankofamerica-support-center.com — eine völlig andere Domain, die darauf ausgelegt ist, auf den ersten Blick legitim zu wirken.

## Die Methoden sind klassische Phishing-Muster
* Künstliche Dringlichkeit ("24 Stunden" oder "dauerhaft gesperrt")
* Androhung des Kontoverlusts, um dich unter Druck zu setzen, schnell zu handeln, ohne nachzudenken
* Emoji in der Betreffzeile, um Aufmerksamkeit zu erregen
* Eine vage Behauptung "ungewöhnlicher Aktivität" mit gerade genug Details (letzte 4 Ziffern), um glaubwürdig zu wirken

## Die letzten 4 Ziffern bedeuten nicht viel
Betrüger können Teile von Kontonummern aus Datenlecks erhalten oder sie einfach erraten — dieses Detail soll die E-Mail personalisiert und vertrauenswürdig wirken lassen.

## Was du tun solltest
* Klicke auf keinen Link in der E-Mail
* Markiere sie als Phishing/Spam in deinem E-Mail-Programm
* Wenn du wirklich besorgt über dein BofA-Konto bist, gehe direkt auf bankofamerica.com, indem du die Adresse in deinen Browser eingibst, oder ruf die Nummer auf der Rückseite deiner Karte an
* Du kannst Phishing-E-Mails auch an abuse@bankofamerica.com weiterleiten`,
    },
    hannah: {
      user: `Ich habe Probleme beim Einschlafen und Durchschlafen. Ich wache oft um 3 oder 4 Uhr morgens auf und kann dann nur schwer wieder einschlafen. Was kann ich tun, um meinen Schlaf zu verbessern?`,
      assistant: `Schlafprobleme wie deine — besonders dieses frühmorgendliche Aufwachen — sind sehr verbreitet und sprechen in der Regel sehr gut auf Verhaltensänderungen an. Hier ist, was am besten wirkt:

## Grundlagen der Schlafhygiene
* Vermeide Bildschirme oder helles Deckenlicht in den 1–2 Stunden vor dem Schlafengehen.
* Halte dein Schlafzimmer kühl (um die 18–20 °C ist für die meisten Menschen ideal), dunkel und ruhig.
* Stehe jeden Tag zur gleichen Zeit auf, auch am Wochenende.
* Sorge innerhalb einer Stunde nach dem Aufwachen für helles Licht (idealerweise Sonnenlicht).

## Wenn du um 3–4 Uhr aufwachst
Das Schlimmste, was du tun kannst, ist, ängstlich im Bett zu liegen und zu versuchen, den Schlaf zu erzwingen — das trainiert dein Gehirn, das Bett mit Wachheit zu verbinden. Stattdessen:

* Vermeide es, auf dein Handy oder die Uhr zu schauen — die genaue Uhrzeit zu kennen, löst oft Angst aus.
* Wenn du länger als 20 Minuten wach bist, stehe auf und tue etwas Ruhiges bei gedämpftem Licht (ein echtes Buch lesen, leichtes Dehnen), bis du dich wieder schläfrig fühlst.
* Versuche langsames Zwerchfellatmen (4 Zählzeiten einatmen, 6–8 Zählzeiten ausatmen), um dein Nervensystem zu beruhigen.

## Tagesgewohnheiten, die den Nachtschlaf beeinflussen
* Vermeide Koffein nach 12 oder 13 Uhr — seine Halbwertszeit beträgt 5–7 Stunden, daher ist nachmittags getrunkener Kaffee um Mitternacht noch in deinem Körper.
* Begrenze Alkohol. Er hilft dir beim Einschlafen, stört aber den Schlaf in der zweiten Nachthälfte, was wahrscheinlich zu deinem Aufwachen um 3–4 Uhr beiträgt.
* Regelmäßige Bewegung verbessert die Schlafqualität erheblich, aber versuche, intensive Trainingseinheiten mindestens 2–3 Stunden vor dem Schlafengehen zu beenden.

## Einschlafroutine
Eine gleichbleibende 30- bis 60-minütige Routine vor dem Schlafengehen signalisiert deinem Gehirn, dass der Schlaf kommt. Dazu könnte eine warme Dusche gehören (der anschließende Abfall der Körpertemperatur fördert die Schläfrigkeit), leichtes Lesen oder sanftes Dehnen.`,
    },
    juan: {
      user: `Jeden Frühling bekomme ich eine laufende Nase, juckende Augen und einen juckenden Hals. Ich niese häufig. Zum Glück habe ich kein Fieber. Sind das die Symptome einer Erkältung?`,
      assistant: `Diese Symptome klingen viel mehr nach saisonalen Allergien (allergische Rhinitis, im Volksmund „Heuschnupfen" genannt) als nach einer Erkältung. Hier ist der Grund:

Das Muster, das du beschreibst — jedes Frühjahr, mit laufender Nase, juckenden Augen, juckendem Hals und Niesen — ist das klassische Erscheinungsbild von saisonalen Allergien.

## Was auf Allergien hindeutet, nicht auf eine Erkältung
* Es passiert jeden Frühling, was mit den Pollensaisons übereinstimmt (Baumpollen haben im Frühling ihren Höhepunkt)
* Juckreiz — besonders an Augen und Hals — ist ein Merkmal allergischer Reaktionen, nicht viraler Infektionen
* Kein Fieber, was bei Erkältungen häufiger vorkommt
* Erkältungen klingen in der Regel nach 7–10 Tagen ab; wenn deine Symptome wochenlang anhalten, spricht das stark für Allergien

## Wie sie sich von einer Erkältung unterscheiden
* Erkältungen gehen oft mit Gliederschmerzen, Müdigkeit und manchmal Halsschmerzen einher (eher als ein juckender Hals)
* Erkältungssymptome entwickeln sich über Tage (werden schlimmer, dann besser); Allergiesymptome bleiben gleichbleibend, solange du dem Auslöser ausgesetzt bist
* Erkältungen werden durch Viren verursacht; bei Allergien reagiert dein Immunsystem auf Pollen oder andere Auslöser in der Luft

## Was du in Betracht ziehen könntest
* Rezeptfreie Antihistaminika (wie Cetirizin oder Loratadin) und nasale Kortikosteroid-Sprays sind oft sehr wirksam bei saisonalen Allergiesymptomen
* Zu verfolgen, wann deine Symptome jedes Jahr beginnen und aufhören, kann helfen, das Muster zu bestätigen
* Wenn die Symptome deine Lebensqualität erheblich beeinträchtigen, kann ein Allergologe Haut- oder Bluttests durchführen, um deine spezifischen Auslöser zu identifizieren, und Optionen wie eine Immuntherapie besprechen

Das gesagt, ich bin kein Arzt, und es lohnt sich, dieses Muster deinem Hausarzt zu erwähnen — besonders wenn du es noch nicht getan hast — damit er die Diagnose bestätigen und die beste Behandlung für dich empfehlen kann.`,
    },
    nicolas: {
      user: `Kannst du mir ein Lasagne-Rezept teilen, das für laktoseintolerante Menschen angepasst ist? Bitte verwende Zutaten, die ich leicht finden kann.`,
      assistant: `## Laktosefreie Lasagne
Eine herzhafte, beliebte Lasagne ganz ohne Milchprodukte — du wirst sie nicht vermissen!

## Zutaten für 6 Portionen
* 12 Lasagneplatten
* 2 Esslöffel Olivenöl
* 1 gelbe Zwiebel, gewürfelt
* 4 Knoblauchzehen, gehackt
* 500 g Rinderhackfleisch oder italienische Bratwurst
* 1 Dose gehackte Tomaten (800 g)
* 2 Esslöffel Tomatenmark
* 1 TL getrockneter Oregano
* 1 TL getrocknetes Basilikum
* 1 TL Salz
* ½ TL schwarzer Pfeffer
* 200 g rohe Cashewkerne, 4 Stunden oder über Nacht eingeweicht
* 240 ml Wasser
* 2 Esslöffel Zitronensaft
* 3 Esslöffel Hefeflocken
* 200 g laktosefreier Mozzarella (z. B. Violife oder Daiya), gerieben

## Zubereitung
1 — Nudeln kochen: Lasagneplatten nach Packungsanweisung al dente kochen. Abgießen, mit etwas Olivenöl beträufeln, damit sie nicht kleben, und beiseite stellen.

2 — Fleischsauce zubereiten: Olivenöl in einer großen Pfanne bei mittlerer Hitze erhitzen. Zwiebel hinzufügen und etwa 7 Minuten weich dünsten. Knoblauch hinzufügen und 1 weitere Minute kochen. Das Hackfleisch oder die Wurst hinzufügen und unter Rühren braun braten, dabei in kleine Stücke zerteilen. Überschüssiges Fett abgießen.

3 — Sauce köcheln lassen: Gehackte Tomaten, Tomatenmark, Oregano, Basilikum, Salz und Pfeffer einrühren. Bei niedriger Hitze 15 Minuten köcheln lassen, dabei gelegentlich rühren.

4 — Cashewcreme zubereiten: Die eingeweichten Cashewkerne abgießen und zusammen mit dem Wasser, Zitronensaft und Hefeflocken vollständig glatt und cremig mixen. Das ist dein laktosefreier Ricotta-Ersatz. Mit einer Prise Salz nach Geschmack würzen.

5 — Ofen vorheizen: Auf 190 °C vorheizen.

6 — Schichten aufbauen: In einer Auflaufform (ca. 23 × 33 cm) eine dünne Schicht Fleischsauce auf dem Boden verteilen. 3–4 Nudelplatten auflegen, dann ⅓ der Cashewcreme, dann ⅓ der Fleischsauce. Für insgesamt 3 Schichten wiederholen. Mit der restlichen Fleischsauce abschließen und gleichmäßig mit dem geriebenen laktosefreien Mozzarella belegen.

7 — Abgedeckt backen: Mit Folie fest abdecken und 30 Minuten backen.

8 — Offen backen: Die Folie entfernen und weitere 15 Minuten backen, bis die Oberfläche sprudelt und leicht goldbraun ist.

9 — Ruhen lassen und servieren: Die Lasagne etwa 10 Minuten ruhen lassen, bevor sie aufgeschnitten wird — so hält sie besser zusammen. Mit einem einfachen grünen Salat und Baguette servieren.

Die wichtigsten Ersetzungen sind einfach: Eine gemixte Cashewcreme ersetzt den Ricotta (sie ist cremig und reichhaltig mit einem sehr neutralen Geschmack), und laktosefreier geriebener Mozzarella sorgt für die schmelzende Oberfläche. Alles andere ist völlig standard. Guten Appetit!`,
    },
  },

  // ── Italian ────────────────────────────────────────────────────────────────
  it: {
    maria: {
      user: `Sto pianificando un viaggio di 4 giorni a Parigi a giugno e ho bisogno di aiuto per organizzare un itinerario. Sono appassionata di arte e storia, viaggerò con mia cugina Frankie, e il nostro budget è flessibile. Alloggeremo vicino alla cattedrale di Notre Dame.

Puoi organizzare ogni giornata con attività mattutine, pomeridiane e serali? Aggiungi anche suggerimenti di ristoranti vicino ai posti che visiteremo, le cose da prenotare in anticipo e qualche consiglio per evitare la folla.`,
      assistant: `## Giorno 1 — Il cuore storico (sei già nel posto migliore)
### Mattina
Inizia dalla Cattedrale di Notre Dame — entro giugno 2026 sarà completamente riaperta e sarà uno spettacolo. Arriva entro le 8:30 prima che arrivi la folla. Attraversa subito dopo verso la Sainte-Chapelle (le vetrate sono al meglio con la luce del mattino).
### Pomeriggio
Attraversa verso la Rive Gauche ed esplora Saint-Germain-des-Prés — gira tra le gallerie, entra al Musée de Cluny (arte medievale, arazzi straordinari) e passeggia per le strade strette.
### Sera
Cena a Saint-Germain. Prova Allard — classico bistrot parigino d'altri tempi, aperto dal 1931. Poi una passeggiata serale lungo la Senna al tramonto (il sole non tramonta fino a quasi le 22:00).
🎟️ Prenota in anticipo: ingresso a orario fisso per la Sainte-Chapelle

## Giorno 2 — Il Louvre + il Palais Royal
### Mattina
Il Louvre — prenota il primo ingresso disponibile (ore 9). Concentrati su 2-3 ali al massimo, altrimenti ti esaurisci. L'ala Richelieu per la storia francese, la Denon per i capolavori più famosi.
### Pomeriggio
Cammina fino ai giardini del Palais Royal per rilassarti, poi esplora il Marais — visita Place des Vosges (la piazza più antica di Parigi) e scopri le piccole gallerie lungo Rue de Bretagne.
### Sera
Cena nel Marais. Il Breizh Café fa crêpes e galette bretoni eccezionali — sembra semplice, ma il sapore è incredibile. Quartiere vivace per una passeggiata dopo cena.
🎟️ Prenota in anticipo: ingresso a orario fisso per il Louvre (va esaurito settimane prima a giugno)

## Giorno 3 — Gita a Versailles
### Mattina
Prendi il RER C da Saint-Michel (10 minuti a piedi da Notre Dame) fino a Versailles — cerca di arrivare all'apertura dei cancelli alle 9. Vai subito nei giardini prima che si formi la folla alla reggia.
### Pomeriggio
Visita gli interni della reggia dopo pranzo. La Sala degli Specchi, gli appartamenti del Re, tutto. Calcola circa 5-6 ore in totale per la giornata.
### Sera
Di ritorno a Parigi nel tardo pomeriggio. Cena tranquilla e rilassata vicino a Notre Dame — Les Deux Magots per l'esperienza iconica del caffè parigino, oppure Au Vieux Paris d'Arcole proprio all'ombra della cattedrale per i classici francesi.
🎟️ Prenota in anticipo: ingresso a orario fisso per Versailles — assolutamente indispensabile a giugno

## Giorno 4 — Montmartre + Musée d'Orsay
### Mattina
Vai a Montmartre presto — il Sacré-Cœur alle 8:30 prima dell'ondata turistica. Gironzola per le strade del villaggio intorno a Place du Tertre, trova un caffè per una colazione tranquilla.
### Pomeriggio
Torna verso sud fino al Musée d'Orsay (Impressionismo, Post-Impressionismo — questo sarà il punto culminante per gli amanti dell'arte). L'edificio da solo vale già la visita.
### Sera
Una cena speciale per concludere il viaggio. Septime, nell'11° arrondissement, è uno dei migliori ristoranti di Parigi — creativo, stagionale, senza pretese. Prenota con largo anticipo. Oppure, se preferisci qualcosa di più classico, Le Comptoir du Relais vicino a Saint-Germain.
🎟️ Prenota in anticipo: ingresso a orario fisso per il Musée d'Orsay + prenotazione al ristorante

## Consigli generali per evitare la folla

* Arriva ad ogni sito principale proprio all'apertura — la differenza tra le 9 e le 11 è enorme a giugno
* Prendi un abbonamento Navigo Easy per metro/RER — molto più comodo che comprare i biglietti singoli
* La maggior parte dei musei è gratuita la prima domenica del mese — vale la pena organizzarsi se capita durante il tuo soggiorno
* Evita la Torre Eiffel a meno che non sia una priorità — le code a giugno sono estenuanti e ti portano via mezza giornata`,
    },
    tom: {
      user: `Ho ricevuto questa email ieri, è legittima?

Da: security-alert@bankofamerica-support-center.com
Oggetto: ⚠️ Urgente: Rilevata attività sospetta sul tuo conto

Ciao Tom,

Abbiamo rilevato un'attività di accesso insolita sul tuo conto Bank of America che termina con 3486. Per proteggere il tuo conto, ne abbiamo temporaneamente limitato l'accesso.

Verifica la tua identità entro 24 ore per ripristinare l'accesso completo:

👉 **Verifica il mio conto ora**

Se non effettui la verifica, il tuo conto verrà sospeso definitivamente.

Team di Sicurezza di Bank of America`,
      assistant: `Questa è un'email di phishing. Non cliccare su nessun link al suo interno. Ecco perché è chiaramente fraudolenta:

Il dominio del mittente è falso. Il vero dominio di Bank of America è bankofamerica.com. Questa email proviene da bankofamerica-support-center.com — un dominio completamente diverso, progettato per sembrare legittimo a prima vista.

## Le tattiche sono classici schemi di phishing
* Urgenza artificiale ("24 ore" o "sospeso definitivamente")
* Minacce di perdita dell'accesso al conto per spingerti ad agire in fretta senza riflettere
* Emoji nell'oggetto dell'email per attirare l'attenzione
* Un vago riferimento ad "attività insolita" con giusto abbastanza dettagli (le ultime 4 cifre) per sembrare credibile

## Le ultime 4 cifre non significano molto
I truffatori possono ottenere numeri di conto parziali da violazioni di dati o semplicemente indovinare — questo dettaglio serve a far sembrare l'email personalizzata e affidabile.

## Cosa fare
* Non cliccare su nessun link nell'email
* Segnalala come phishing/spam nel tuo client di posta
* Se sei davvero preoccupato per il tuo conto BofA, vai direttamente su bankofamerica.com digitandolo nel browser, oppure chiama il numero sul retro della tua carta
* Puoi anche inoltrare le email di phishing a abuse@bankofamerica.com`,
    },
    hannah: {
      user: `Ho difficoltà ad addormentarmi e a mantenere il sonno. Spesso mi sveglio alle 3 o alle 4 di mattina e faccio fatica a riaddormentarmi. Cosa posso fare per migliorare il mio sonno?`,
      assistant: `I problemi di sonno come il tuo — in particolare i risvegli nelle prime ore del mattino — sono molto comuni e di solito rispondono molto bene ai cambiamenti comportamentali. Ecco cosa tende a funzionare meglio:

## Le basi dell'igiene del sonno
* Evita gli schermi o le luci forti nel soffitto nelle 1–2 ore prima di andare a letto.
* Mantieni la camera da letto fresca (intorno ai 18–20°C è ideale per la maggior parte delle persone), buia e silenziosa.
* Mantieni un orario di sveglia costante ogni giorno, anche nel weekend.
* Esponiti a una luce intensa (idealmente la luce solare) entro un'ora dal risveglio.

## Quando ti svegli alle 3–4 di mattina
La cosa peggiore che puoi fare è restare a letto cercando ansiosamente di costringerti a dormire — questo insegna al cervello ad associare il letto alla veglia. Invece:

* Evita di guardare il telefono o l'orologio — sapere l'ora esatta tende ad aumentare l'ansia.
* Se sei sveglia da più di 20 minuti, alzati e fai qualcosa di tranquillo con una luce fioca (leggere un libro cartaceo, stretching leggero) finché non ti senti di nuovo assonnata.
* Prova una respirazione lenta e diaframmatica (inspira per 4 tempi, espira per 6–8 tempi) per calmare il sistema nervoso.

## Le abitudini diurne che influenzano il sonno notturno
* Evita la caffeina dopo mezzogiorno o l'una — la sua emivita è di 5–7 ore, quindi il caffè del pomeriggio è ancora nel tuo sistema a mezzanotte.
* Limita l'alcol. Ti aiuta ad addormentarti, ma frammenta il sonno nella seconda metà della notte, il che probabilmente contribuisce ai tuoi risvegli alle 3–4.
* L'esercizio fisico regolare migliora significativamente la qualità del sonno, ma cerca di terminare gli allenamenti intensi almeno 2–3 ore prima di andare a letto.

## Routine di rilassamento serale
Una routine pre-nanna costante di 30–60 minuti segnala al cervello che il sonno si avvicina. Potrebbe includere una doccia calda (il successivo abbassamento della temperatura corporea favorisce il sonno), lettura leggera o stretching dolce.`,
    },
    juan: {
      user: `Ogni primavera tendo ad avere il naso che cola, occhi e gola che prudono. Starnuto spesso. Per fortuna non ho la febbre. Sono questi i sintomi di un raffreddore?`,
      assistant: `Questi sintomi sembrano molto più simili alle allergie stagionali (rinite allergica, comunemente chiamata "febbre da fieno") che a un raffreddore. Ecco perché:

Il quadro che descrivi — che si ripete ogni primavera, con naso che cola, occhi che prudono, gola che prude e starnuti — è la classica manifestazione delle allergie stagionali.

## Cosa indica allergie e non un raffreddore
* Si manifesta ogni primavera, il che coincide con le stagioni dei pollini (i pollini degli alberi raggiungono il picco in primavera)
* Il prurito — soprattutto agli occhi e alla gola — è un segno distintivo delle reazioni allergiche, non delle infezioni virali
* Assenza di febbre, che è invece più comune con i raffreddori
* I raffreddori si risolvono generalmente in 7–10 giorni; se i tuoi sintomi durano settimane, questo indica fortemente un'allergia

## Come si differenziano da un raffreddore
* I raffreddori spesso si accompagnano a dolori muscolari, stanchezza e a volte mal di gola (piuttosto che prurito alla gola)
* I sintomi del raffreddore tendono a evolversi nel corso dei giorni (peggiorando, poi migliorando); i sintomi allergici restano costanti finché sei esposto al fattore scatenante
* I raffreddori sono causati da un virus; le allergie sono la reazione del sistema immunitario al polline o ad altri agenti presenti nell'aria

## Cosa potresti considerare
* Gli antistaminici da banco (come cetirizina o loratadina) e gli spray nasali a base di corticosteroidi sono spesso molto efficaci per i sintomi delle allergie stagionali
* Tenere traccia di quando i tuoi sintomi iniziano e finiscono ogni anno può aiutare a confermare il quadro
* Se i sintomi influenzano significativamente la tua qualità di vita, un allergologo può effettuare test cutanei o del sangue per identificare i tuoi specifici agenti scatenanti e discutere opzioni come l'immunoterapia

Detto questo, non sono un medico, e vale la pena menzionare questo schema al tuo medico di base — soprattutto se non l'hai già fatto — così potrà confermare la diagnosi e consigliarti il trattamento più adatto.`,
    },
    nicolas: {
      user: `Puoi condividere una ricetta di lasagne adattata per le persone intolleranti al lattosio? Per favore usa ingredienti che si trovano facilmente.`,
      assistant: `## Lasagne senza latticini
Una lasagna sostanziosa e amata da tutti, preparata senza latticini — non sentirete la differenza!

## Ingredienti per 6 porzioni
* 12 lasagne (sfoglie)
* 2 cucchiai di olio d'oliva
* 1 cipolla gialla, tritata
* 4 spicchi d'aglio, tritati finemente
* 500g di carne macinata o salsiccia italiana
* 1 lattina di pomodori pelati tritati (400g)
* 2 cucchiai di concentrato di pomodoro
* 1 cucchiaino di origano essiccato
* 1 cucchiaino di basilico essiccato
* 1 cucchiaino di sale
* ½ cucchiaino di pepe nero
* 200g di anacardi crudi, messi a bagno 4 ore o tutta la notte
* 240ml di acqua
* 2 cucchiai di succo di limone
* 3 cucchiai di lievito alimentare in scaglie
* 200g di mozzarella vegetale (es. Violife o Daiya), grattugiata

## Procedimento
1 — Cuoci le sfoglie: Lessate le lasagne seguendo le istruzioni sulla confezione fino a che siano al dente. Scolatele, conditele con un filo d'olio d'oliva per evitare che si attacchino e mettetele da parte.

2 — Prepara il ragù: Scaldate l'olio d'oliva in una grande padella a fuoco medio. Aggiungete la cipolla e cuocetela fino a che si ammorbidisce, circa 7 minuti. Aggiungete l'aglio e cuocete per 1 minuto in più. Aggiungete la carne macinata o la salsiccia e cuocete fino a che sia ben rosolata, sgranandola mentre cuoce. Eliminate il grasso in eccesso.

3 — Fate sobbollire il sugo: Aggiungete i pomodori tritati, il concentrato di pomodoro, l'origano, il basilico, il sale e il pepe. Fate sobbollire a fuoco basso per 15 minuti, mescolando di tanto in tanto.

4 — Prepara la crema di anacardi: Scolate gli anacardi ammollati e frullateli con l'acqua, il succo di limone e il lievito alimentare fino a ottenere un composto completamente liscio e cremoso. Questo è il vostro sostituto della ricotta senza latticini. Aggiustate di sale a piacere.

5 — Preriscalda il forno: Preriscaldatelo a 190°C.

6 — Assembla: In una teglia da 23×33 cm, stendete un sottile strato di ragù sul fondo. Fate uno strato con 3–4 sfoglie, poi ⅓ della crema di anacardi, poi ⅓ del ragù. Ripetete per 3 strati totali. Finite con il ragù rimasto e coprite uniformemente con la mozzarella vegetale grattugiata.

7 — Cuoci coperta: Coprite bene con la carta stagnola e cuocete per 30 minuti.

8 — Cuoci scoperta: Rimuovete la stagnola e cuocete per altri 15 minuti, fino a che la superficie sia gorgogliante e leggermente dorata.

9 — Riposate e servite: Lasciate riposare la lasagna per circa 10 minuti prima di tagliarla — questo aiuta a mantenerla compatta. Servite con una semplice insalata verde e pane croccante.

Le sostituzioni chiave qui sono semplici: una crema di anacardi frullati sostituisce la ricotta (è cremosa e ricca con un sapore molto neutro), e la mozzarella vegetale grattugiata gestisce lo strato filante in superficie. Tutto il resto è completamente standard. Buon appetito!`,
    },
  },

  // ── Portuguese ─────────────────────────────────────────────────────────────
  pt: {
    maria: {
      user: `Estou a planear uma viagem de 4 dias a Paris em junho e preciso de ajuda para organizar o itinerário. Gosto de arte e história, vou viajar com o meu primo Frankie, e o nosso orçamento é flexível. Ficamos hospedados perto da catedral de Notre Dame.

Podes organizar cada dia com atividades de manhã, tarde e noite? Inclui também sugestões de restaurantes perto dos sítios que vamos visitar, o que devo reservar com antecedência e dicas para fugir às multidões.`,
      assistant: `## Dia 1 — O Coração Histórico (já estás no melhor sítio)
### Manhã
Começa na Catedral de Notre Dame — em junho de 2026 está completamente reaberta e é deslumbrante. Chega lá por volta das 8h30 antes das multidões. Depois, traversa para a Sainte-Chapelle mesmo a seguir (os vitrais são mais bonitos com a luz da manhã).
### Tarde
Passa para a Margem Esquerda e explora Saint-Germain-des-Prés — visita galerias, entra no Musée de Cluny (arte medieval, tapeçarias incríveis) e passeia pelas ruas estreitas.
### Noite
Jantar em Saint-Germain. Experimenta o Allard — um bistrot parisiense clássico e tradicional, aberto desde 1931. Depois, um passeio noturno ao longo do Sena ao pôr do sol (o sol não se põe até quase às 22h).
🎟️ Reservar com antecedência: entrada com hora marcada na Sainte-Chapelle

## Dia 2 — O Louvre + Palais Royal
### Manhã
O Louvre — reserva o primeiro horário de entrada (9h). Concentra-te em 2 a 3 alas no máximo ou vais ficar esgotado. A ala Richelieu para a história francesa, a Denon para os grandes clássicos.
### Tarde
Caminha até aos jardins do Palais Royal para descansar, depois explora o Marais — passa pela Place des Vosges (a praça mais antiga de Paris) e entra nas pequenas galerias ao longo da Rue de Bretagne.
### Noite
Jantar no Marais. O Breizh Café serve crepes e galettes bretões excecionais — parece simples, mas o sabor é incrível. Bairro animado para uma caminhada depois do jantar.
🎟️ Reservar com antecedência: entrada com hora marcada no Louvre (esgota semanas antes em junho)

## Dia 3 — Excursão a Versalhes
### Manhã
Apanha o RER C em Saint-Michel (10 minutos a pé de Notre Dame) até Versalhes — tenta chegar quando os portões abrem às 9h. Vai direto para os jardins antes de as multidões se acumularem no palácio.
### Tarde
Faz o interior do palácio depois do almoço. A Galeria dos Espelhos, os aposentos do rei, tudo. Conta com cerca de 5 a 6 horas no total para o dia.
### Noite
De volta a Paris ao início da noite. Jantar tranquilo e descontraído perto de Notre Dame — Les Deux Magots para a experiência icónica de café, ou Au Vieux Paris d'Arcole mesmo à sombra da catedral para clássicos franceses sólidos.
🎟️ Reservar com antecedência: entrada com hora marcada em Versalhes — absolutamente essencial em junho

## Dia 4 — Montmartre + Musée d'Orsay
### Manhã
Vai a Montmartre cedo — Sacré-Cœur às 8h30 antes da vaga de turistas. Passeia pelas ruas da aldeia em redor da Place du Tertre, encontra um café para um pequeno-almoço tranquilo.
### Tarde
Regressa ao sul para o Musée d'Orsay (Impressionismo, pós-Impressionismo — este vai ser o ponto alto para os amantes de arte). O próprio edifício já vale a visita.
### Noite
Um jantar especial para fechar a viagem. O Septime, no 11.º arrondissement, é um dos melhores restaurantes de Paris — criativo, sazonal, sem ser pretensioso. Reserva com bastante antecedência. Ou se quiseres algo mais clássico, Le Comptoir du Relais perto de Saint-Germain.
🎟️ Reservar com antecedência: entrada com hora marcada no Musée d'Orsay + reserva de jantar

## Dicas Gerais para Fugir às Multidões

* Chega a todos os locais principais mesmo na hora de abertura — a diferença entre as 9h e as 11h é enorme em junho
* Arranja um cartão Navigo Easy para o metro/RER — muito mais prático do que comprar bilhetes individuais
* A maioria dos museus é gratuita no primeiro domingo do mês — vale a pena ver se calha durante a tua viagem
* Evita a Torre Eiffel a não ser que seja uma prioridade — as filas em junho são brutais e come meio dia inteiro`,
    },
    tom: {
      user: `Recebi este email ontem, é legítimo?

De: security-alert@bankofamerica-support-center.com
Assunto: ⚠️ Urgente: Atividade suspeita detetada na sua conta

Olá Tom,

Detetámos atividade de início de sessão invulgar na sua conta do Bank of America com final em 3486. Para proteger a sua conta, limitámos temporariamente o acesso.

Por favor, verifique a sua identidade nas próximas 24 horas para restaurar o acesso completo:

👉 **Verificar a minha conta agora**

Se não verificar, a sua conta será permanentemente suspensa.

Equipa de Segurança do Bank of America`,
      assistant: `Este é um email de phishing. Não cliques em nenhum link. Eis porque é claramente fraudulento:

O domínio do remetente é falso. O domínio real do Bank of America é bankofamerica.com. Este email vem de bankofamerica-support-center.com — um domínio completamente diferente, concebido para parecer legítimo à primeira vista.

## As táticas são padrões clássicos de phishing
* Urgência artificial ("24 horas" ou "permanentemente suspensa")
* Ameaças de perda de conta para te pressionar a agir rapidamente sem pensar
* Emoji no assunto para chamar a atenção
* Uma alegação vaga de "atividade invulgar" com apenas um detalhe (os últimos 4 dígitos) para parecer credível

## Os últimos 4 dígitos não significam muito
Os burlões podem obter números de conta parciais através de violações de dados ou simplesmente adivinhar — este detalhe serve para fazer o email parecer personalizado e de confiança.

## O que fazer
* Não cliques em nenhum link do email
* Marca-o como phishing/spam no teu cliente de email
* Se estiveres genuinamente preocupado com a tua conta do BofA, vai diretamente a bankofamerica.com escrevendo o endereço no browser, ou liga para o número no verso do teu cartão
* Também podes reencaminhar emails de phishing para abuse@bankofamerica.com`,
    },
    hannah: {
      user: `Tenho tido dificuldade em adormecer e em manter o sono. Acordo muitas vezes às 3 ou 4 da manhã e tenho dificuldade em voltar a adormecer. O que posso fazer para melhorar o sono?`,
      assistant: `Problemas de sono como o teu — especialmente esse acordar de madrugada — são muito comuns e normalmente respondem muito bem a mudanças de comportamento. Eis o que costuma funcionar melhor:

## Básicos de higiene do sono
* Evita ecrãs ou luzes fortes no teto nas 1 a 2 horas antes de deitar.
* Mantém o quarto fresco (entre 18 a 20°C é ideal para a maioria das pessoas), escuro e silencioso.
* Mantém um horário de despertar consistente todos os dias, incluindo fins de semana.
* Expõe-te a luz intensa (idealmente sol) na primeira hora após acordar.

## Quando acordas às 3 ou 4 da manhã
A pior coisa que podes fazer é ficar na cama ansiosamente a tentar forçar o sono — isso treina o teu cérebro a associar a cama ao estado de vigília. Em vez disso:

* Evita ver o telemóvel ou o relógio — saber a hora exata tende a aumentar a ansiedade.
* Se estiveres acordado há mais de 20 minutos, levanta-te e faz algo tranquilo com pouca luz (ler um livro em papel, alongamentos suaves) até sentires sono novamente.
* Experimenta respiração lenta e diafragmática (inspira 4 tempos, expira 6 a 8 tempos) para acalmar o sistema nervoso.

## Hábitos diurnos que afetam o sono noturno
* Evita cafeína depois do meio-dia ou da 1 da tarde — a sua meia-vida é de 5 a 7 horas, por isso o café da tarde ainda está no teu sistema a meia-noite.
* Limita o álcool. Ajuda a adormecer, mas fragmenta o sono na segunda metade da noite, o que provavelmente contribui para acordares às 3 ou 4 da manhã.
* O exercício regular melhora significativamente a qualidade do sono, mas tenta terminar treinos intensos pelo menos 2 a 3 horas antes de deitar.

## Rotina de descanso
Uma rotina consistente de 30 a 60 minutos antes de deitar sinaliza ao cérebro que o sono está a chegar. Pode incluir um duche quente (a descida subsequente da temperatura corporal promove o sono), leitura leve ou alongamentos suaves.`,
    },
    juan: {
      user: `Todos os anos na primavera costumo ter o nariz a pingar, olhos com comichão e garganta com comichão. Espirro com muita frequência. Felizmente não tenho febre. Serão estes os sintomas de uma constipação?`,
      assistant: `Estes sintomas parecem muito mais alergias sazonais (rinite alérgica, vulgarmente chamada "febre dos fenos") do que uma constipação. Eis porquê:

O padrão que describes — acontecer todos os anos na primavera, com nariz a pingar, olhos com comichão, garganta com comichão e espirros — é a apresentação clássica das alergias sazonais.

## O que aponta para alergias e não para uma constipação
* Acontece todas as primaveras, o que coincide com as épocas de pólen (o pólen das árvores atinge o pico na primavera)
* A comichão — especialmente nos olhos e na garganta — é uma marca característica das reações alérgicas, e não de infeções virais
* Ausência de febre, que é mais comum nas constipações
* As constipações normalmente resolvem-se em 7 a 10 dias; se os teus sintomas duram semanas, isso aponta fortemente para alergias

## Como diferem de uma constipação
* As constipações costumam vir acompanhadas de dores no corpo, cansaço e por vezes dor de garganta (em vez de comichão)
* Os sintomas de uma constipação tendem a evoluir ao longo dos dias (piorando e depois melhorando); os sintomas de alergia mantêm-se consistentes enquanto estás exposto ao gatilho
* As constipações são causadas por um vírus; as alergias são o sistema imunitário a reagir ao pólen ou a outros agentes transportados pelo ar

## O que podes considerar
* Anti-histamínicos sem receita (como cetirizina ou loratadina) e sprays nasais de corticosteroide são muitas vezes muito eficazes para os sintomas de alergias sazonais
* Registar quando os teus sintomas começam e terminam cada ano pode ajudar a confirmar o padrão
* Se os sintomas estiverem a afetar significativamente a tua qualidade de vida, um alergologista pode fazer testes cutâneos ou de sangue para identificar os teus gatilhos específicos e discutir opções como a imunoterapia

Dito isto, não sou médico, e vale a pena mencionar este padrão ao teu médico — especialmente se ainda não o fizeste — para que possam confirmar o diagnóstico e recomendar o melhor tratamento para ti.`,
    },
    nicolas: {
      user: `Podes partilhar uma receita de lasanha adaptada para pessoas intolerantes à lactose? Por favor usa ingredientes fáceis de encontrar.`,
      assistant: `## Lasanha Sem Lácteos
Uma lasanha farta e irresistível feita sem qualquer produto lácteo — nem vais ter saudades!

## Ingredientes para 6 porções
* 12 folhas de lasanha
* 2 colheres de sopa de azeite
* 1 cebola amarela, picada
* 4 dentes de alho, picados
* 500g de carne picada ou linguiça italiana
* 1 lata de tomate triturado (800g)
* 2 colheres de sopa de concentrado de tomate
* 1 colher de chá de orégãos secos
* 1 colher de chá de manjericão seco
* 1 colher de chá de sal
* ½ colher de chá de pimenta preta
* 200g de cajus crus, demolhados 4h ou de um dia para o outro
* 240ml de água
* 2 colheres de sopa de sumo de limão
* 3 colheres de sopa de levedura nutricional
* 200g de mozzarella vegana (ex: Violife ou Daiya), ralada

## Preparação
1 — Coze as folhas de lasanha: Coze as folhas de lasanha seguindo as instruções da embalagem até ficarem al dente. Escorre, rega com um pouco de azeite para não colarem e reserva.

2 — Prepara o molho de carne: Aquece o azeite numa frigideira grande em lume médio. Junta a cebola e cozinha até amolecer, cerca de 7 minutos. Adiciona o alho e cozinha mais 1 minuto. Adiciona a carne picada ou a linguiça e cozinha até dourar, desfazendo com a colher enquanto cozinha. Escorre o excesso de gordura.

3 — Apura o molho: Junta o tomate triturado, o concentrado de tomate, os orégãos, o manjericão, o sal e a pimenta. Deixa cozinhar em lume brando durante 15 minutos, mexendo ocasionalmente.

4 — Prepara o creme de cajus: Escorre os cajus demolhados e tritura com a água, o sumo de limão e a levedura nutricional até obteres um creme completamente liso e cremoso. Este é o substituto vegano da ricotta. Tempera com uma pitada de sal a gosto.

5 — Pré-aquece o forno: Pré-aquece a 190°C.

6 — Monta a lasanha: Numa travessa de 23×33 cm, espalha uma fina camada de molho de carne no fundo. Coloca 3 a 4 folhas de lasanha, depois ⅓ do creme de cajus e ⅓ do molho de carne. Repete por 3 camadas no total. Termina com o restante molho de carne e cobre uniformemente com a mozzarella vegana ralada.

7 — Coze tapada: Cobre bem com folha de alumínio e leva ao forno durante 30 minutos.

8 — Coze destapada: Retira a folha de alumínio e deixa cozer mais 15 minutos, até a superfície estar borbulhante e ligeiramente dourada.

9 — Repousa e serve: Deixa a lasanha repousar cerca de 10 minutos antes de cortar — isto ajuda a manter a forma. Serve com uma salada verde simples e pão crocante.

As substituições-chave são simples: um creme de cajus triturados substitui a ricotta (é cremoso e rico com um sabor muito neutro), e a mozzarella vegana ralada trata da camada derretida por cima. Todo o resto é completamente normal. Bom apetite!`,
    },
  },
};
