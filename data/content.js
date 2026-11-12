/* data/content.js — Japanese module content. Edit freely: plain objects, {en, es} for every visible string.
   Rule: nothing here is invented course content. Links with `q` are web searches so they never break. */
window.MS = window.MS || {};
MS.content = {};

/* ---------- Rules page ---------- */
MS.content.rules = [
  {
    id: 'dakuten',
    title: { en: 'Dakuten and handakuten', es: 'Dakuten y handakuten' },
    body: [
      { en: 'Two small marks change the sound of a kana. Dakuten (゛) voices the consonant: か → が, さ → ざ, た → だ, は → ば. Handakuten (゜) goes only on the は row and makes a p sound: は → ぱ. The marks work the same way in katakana (カ → ガ, ハ → パ).', es: 'Dos marcas pequeñas cambian el sonido de un kana. El dakuten (゛) sonoriza la consonante: か → が, さ → ざ, た → だ, は → ば. El handakuten (゜) solo va en la fila は y da un sonido p: は → ぱ. En katakana funciona igual (カ → ガ, ハ → パ).' },
      { en: 'じ and ぢ sound the same, and so do ず and づ. ぢ and づ are rare; in most words you will write じ and ず. Katakana ヴ is used for a “v” sound in foreign words.', es: 'じ y ぢ suenan igual, y también ず y づ. ぢ y づ son raros; en la mayoría de las palabras escribirás じ y ず. El katakana ヴ se usa para un sonido “v” en palabras extranjeras.' },
    ],
    examples: [
      { ja: 'かぎ', en: 'key', es: 'llave' }, { ja: 'てがみ', en: 'letter', es: 'carta' }, { ja: 'だいがく', en: 'university', es: 'universidad' },
      { ja: 'ぶた', en: 'pig', es: 'cerdo' }, { ja: 'ぱん', en: 'bread', es: 'pan' }, { ja: 'ざっし', en: 'magazine', es: 'revista' },
    ],
  },
  {
    id: 'sokuon',
    title: { en: 'Small っ: the double consonant', es: 'っ pequeña: la consonante doble' },
    body: [
      { en: 'A small っ is not read as a sound of its own. It is a short pause that makes the next consonant longer. Compare きて (kite) with きって (kitte). It appears mostly before k, s, t, p sounds (including sh, ch, ts).', es: 'Una っ pequeña no se lee como sonido propio. Es una breve pausa que alarga la consonante siguiente. Compara きて (kite) con きって (kitte). Aparece sobre todo antes de sonidos k, s, t, p (incluyendo sh, ch, ts).' },
      { en: 'In katakana loanwords you will also see it before other consonants, as in ベッド (bed).', es: 'En préstamos en katakana también la verás antes de otras consonantes, como en ベッド (cama).' },
    ],
    examples: [
      { ja: 'きって', en: 'stamp', es: 'sello' }, { ja: 'がっこう', en: 'school', es: 'escuela' }, { ja: 'ちょっと', en: 'a little', es: 'un poco' },
      { ja: 'にっぽん', en: 'Japan (one reading)', es: 'Japón (una lectura)' }, { ja: 'ベッド', en: 'bed', es: 'cama' }, { ja: 'コップ', en: 'cup / glass', es: 'vaso' },
    ],
  },
  {
    id: 'long',
    title: { en: 'Long vowels', es: 'Vocales largas' },
    body: [
      { en: 'A long vowel lasts two beats, and length can change the meaning (おばさん “aunt”, おばあさん “grandmother”). In hiragana you add a vowel kana: ああ, いい, うう. After え-row kana the added kana is usually い (えい), and after お-row kana it is usually う (おう). Both are read as a long えー / おー.', es: 'Una vocal larga dura dos tiempos y la duración puede cambiar el significado (おばさん “tía”, おばあさん “abuela”). En hiragana se añade un kana de vocal: ああ, いい, うう. Tras la fila え lo habitual es い (えい) y tras la fila お lo habitual es う (おう). Ambos se leen como えー / おー largas.' },
      { en: 'There are exceptions, written with ええ and おお: おねえさん, おおきい, とおい. Learn these words as they come.', es: 'Hay excepciones, escritas con ええ y おお: おねえさん, おおきい, とおい. Aprende esas palabras a medida que aparezcan.' },
      { en: 'In katakana the long vowel mark ー does the whole job: コーヒー, ラーメン, ケーキ, ノート.', es: 'En katakana la marca de vocal larga ー hace todo el trabajo: コーヒー, ラーメン, ケーキ, ノート.' },
    ],
    examples: [
      { ja: 'おかあさん', en: 'mother', es: 'madre' }, { ja: 'おにいさん', en: 'older brother', es: 'hermano mayor' }, { ja: 'くうき', en: 'air', es: 'aire' },
      { ja: 'せんせい', en: 'teacher', es: 'profesor/a' }, { ja: 'ありがとう', en: 'thank you', es: 'gracias' }, { ja: 'とうきょう', en: 'Tokyo', es: 'Tokio' },
      { ja: 'おおきい', en: 'big', es: 'grande' }, { ja: 'コーヒー', en: 'coffee', es: 'café' }, { ja: 'ラーメン', en: 'ramen', es: 'ramen' },
    ],
  },
  {
    id: 'yoon',
    title: { en: 'Combination kana (yōon)', es: 'Kana combinados (yōon)' },
    body: [
      { en: 'A kana from the い column (き, し, ち, に, ひ, み, り, ぎ, じ, び, ぴ) followed by a small ゃ, ゅ or ょ becomes one syllable: きゃ kya, しゅ shu, ちょ cho. The second kana must be written small. Compare きゃ (one syllable, kya) with きや (two syllables, ki-ya).', es: 'Un kana de la columna い (き, し, ち, に, ひ, み, り, ぎ, じ, び, ぴ) seguido de una ゃ, ゅ o ょ pequeña forma una sola sílaba: きゃ kya, しゅ shu, ちょ cho. El segundo kana debe escribirse pequeño. Compara きゃ (una sílaba, kya) con きや (dos sílabas, ki-ya).' },
      { en: 'Katakana also has extra small-vowel combinations for foreign sounds, such as ファ, ティ, ウィ. Your course may or may not cover them yet.', es: 'El katakana también tiene combinaciones extra con vocales pequeñas para sonidos extranjeros, como ファ, ティ, ウィ. Tu curso puede que aún no las cubra.' },
    ],
    examples: [
      { ja: 'きゃく', en: 'guest, customer', es: 'invitado, cliente' }, { ja: 'しゅくだい', en: 'homework', es: 'tarea' }, { ja: 'ひゃく', en: 'one hundred', es: 'cien' },
      { ja: 'りょこう', en: 'trip', es: 'viaje' }, { ja: 'びょういん', en: 'hospital', es: 'hospital' }, { ja: 'ちゃいろ', en: 'brown', es: 'marrón' },
    ],
  },
  {
    id: 'particles',
    title: { en: 'The particles は, を, へ', es: 'Las partículas は, を, へ' },
    body: [
      { en: 'Three kana are read differently when they work as particles: は is read “wa”, を is read “o”, and へ is read “e”. In every other word they keep their normal sounds. を is only used as a particle. The greetings こんにちは and こんばんは also end in は read “wa”.', es: 'Tres kana se leen distinto cuando funcionan como partículas: は se lee “wa”, を se lee “o” y へ se lee “e”. En cualquier otra palabra mantienen su sonido normal. を solo se usa como partícula. Los saludos こんにちは y こんばんは también terminan en は leída “wa”.' },
      { en: 'Japanese is normally written without spaces; the spaces below are only to help beginners see the particles.', es: 'El japonés normalmente se escribe sin espacios; los espacios de abajo solo ayudan a los principiantes a ver las partículas.' },
    ],
    examples: [
      { ja: 'わたし は がくせい です', en: 'I am a student (read: watashi wa gakusei desu)', es: 'Soy estudiante (se lee: watashi wa gakusei desu)' },
      { ja: 'ほん を よみます', en: 'I read a book (read: hon o yomimasu)', es: 'Leo un libro (se lee: hon o yomimasu)' },
      { ja: 'がっこう へ いきます', en: 'I go to school (read: gakkō e ikimasu)', es: 'Voy a la escuela (se lee: gakkō e ikimasu)' },
    ],
  },
  {
    id: 'pitfalls',
    title: { en: 'Common look-alike pitfalls', es: 'Confusiones frecuentes' },
    body: [
      { en: 'Use the stroke order animation on the chart to see the exact shapes. These notes are hints, not a substitute.', es: 'Usa la animación de orden de trazos en la tabla para ver las formas exactas. Estas notas son pistas, no un sustituto.' },
    ],
    list: [
      { ja: 'し · つ · そ · ん', en: 'し curves like a fish hook. つ is a wide curve lying on its side. そ has a sharp zigzag near the top. ん ends with a tail that sweeps out to the right.', es: 'し se curva como un anzuelo. つ es una curva ancha tumbada. そ tiene un zigzag marcado arriba. ん termina con una cola que se abre hacia la derecha.' },
      { ja: 'ぬ · め', en: 'ぬ finishes with a loop; め does not.', es: 'ぬ termina con un lazo; め no.' },
      { ja: 'わ · れ · ね', en: 'All three start with a long vertical stroke on the left. ね ends in a loop. れ and わ do not: れ flicks outwards, わ curves round at the bottom.', es: 'Los tres empiezan con un trazo vertical largo a la izquierda. ね termina en un lazo. れ y わ no: れ se abre hacia afuera, わ se curva abajo.' },
      { ja: 'は · ほ', en: 'ほ has one extra horizontal stroke.', es: 'ほ tiene un trazo horizontal extra.' },
      { ja: 'る · ろ', en: 'る ends with a small loop; ろ does not.', es: 'る termina con un pequeño lazo; ろ no.' },
      { ja: 'シ · ツ · ソ · ン', en: 'ソ and ツ: the long stroke starts at the top and falls to the left. ン and シ: the long stroke starts at the bottom left and sweeps up to the right. シ has its two short strokes side by side; ツ has them standing more upright.', es: 'ソ y ツ: el trazo largo empieza arriba y cae hacia la izquierda. ン y シ: el trazo largo empieza abajo a la izquierda y sube hacia la derecha. シ tiene sus dos trazos cortos uno al lado del otro; en ツ están más verticales.' },
      { ja: 'ク · ケ · タ', en: 'ク is two strokes; ケ and タ are three.', es: 'ク tiene dos trazos; ケ y タ tienen tres.' },
      { ja: 'ウ · ワ · フ', en: 'ウ has a short stroke on top; ワ has two strokes without it; フ is a single stroke.', es: 'ウ tiene un trazo corto arriba; ワ tiene dos trazos sin él; フ es un solo trazo.' },
    ],
  },
];

/* ---------- Study plan (suggested pace; your course comes first) ---------- */
MS.content.plan = {
  note: {
    en: 'This is a suggested pace for an introductory course. If your teacher sets a different order, follow your teacher and edit nothing here: just tick what you have done.',
    es: 'Este es un ritmo sugerido para un curso introductorio. Si tu profesor marca otro orden, sigue a tu profesor: aquí solo marca lo que ya hiciste.',
  },
  phases: [
    { id: 'p1', title: { en: 'Hiragana mastery (about 2 weeks)', es: 'Dominar hiragana (unas 2 semanas)' }, tasks: [
      { id: 'p1a', en: 'Week 1: learn the あ, か, さ, た, な rows, about one row a day. Write each kana 10 times, saying it aloud.', es: 'Semana 1: aprende las filas あ, か, さ, た, な, más o menos una por día. Escribe cada kana 10 veces diciéndolo en voz alta.' },
      { id: 'p1b', en: 'Week 1: do the daily 10 minutes session on the Practice page.', es: 'Semana 1: haz la sesión diaria de 10 minutos en la página Práctica.' },
      { id: 'p1c', en: 'Week 1 weekend: run a Quiz on rows あ to な.', es: 'Fin de semana de la semana 1: haz un Quiz de las filas あ a な.' },
      { id: 'p1d', en: 'Week 2: learn the は, ま, や, ら, わ rows, ん and を.', es: 'Semana 2: aprende las filas は, ま, や, ら, わ, además de ん y を.' },
      { id: 'p1e', en: 'Week 2: learn dakuten and handakuten (が to ぽ).', es: 'Semana 2: aprende dakuten y handakuten (が a ぽ).' },
      { id: 'p1f', en: 'End of week 2: run an Exam simulation on all hiragana. Aim for 90% or more, then fix the weak kana.', es: 'Fin de la semana 2: haz un Simulador de examen con todo el hiragana. Apunta a 90% o más y luego corrige los kana débiles.' },
    ] },
    { id: 'p2', title: { en: 'Katakana review (about 1 week)', es: 'Repaso de katakana (aprox. 1 semana)' }, tasks: [
      { id: 'p2a', en: 'On the chart, mark the katakana you already know.', es: 'En la tabla, marca los katakana que ya conoces.' },
      { id: 'p2b', en: 'Do the hiragana ↔ katakana conversion drill every day. It uses what you know to speed up hiragana.', es: 'Haz a diario el ejercicio de conversión hiragana ↔ katakana. Usa lo que ya sabes para acelerar el hiragana.' },
      { id: 'p2c', en: 'Run the look-alike drill for シ/ツ/ソ/ン until you stop mixing them up.', es: 'Haz el ejercicio de parecidos con シ/ツ/ソ/ン hasta que dejes de confundirlos.' },
      { id: 'p2d', en: 'Read ten katakana words aloud (for example コーヒー, ラーメン).', es: 'Lee en voz alta diez palabras en katakana (por ejemplo コーヒー, ラーメン).' },
    ] },
    { id: 'p3', title: { en: 'Combination kana (about 1 week)', es: 'Kana combinados (aprox. 1 semana)' }, tasks: [
      { id: 'p3a', en: 'Study small っ and write きて / きって side by side.', es: 'Estudia la っ pequeña y escribe きて / きって lado a lado.' },
      { id: 'p3b', en: 'Study yōon (きゃ, しゅ, ちょ…) and write each row twice.', es: 'Estudia los yōon (きゃ, しゅ, ちょ…) y escribe cada fila dos veces.' },
      { id: 'p3c', en: 'Study long vowels (ああ, いい, うう, えい, おう, ー).', es: 'Estudia las vocales largas (ああ, いい, うう, えい, おう, ー).' },
      { id: 'p3d', en: 'Do the voicing and length drill with audio.', es: 'Haz el ejercicio de sonorización y duración con audio.' },
    ] },
    { id: 'p4', title: { en: 'Class vocabulary (from week 3, ongoing)', es: 'Vocabulario de clase (desde la semana 3, continuo)' }, tasks: [
      { id: 'p4a', en: 'After each class, add the new words on the Words page, with the lesson number as the set.', es: 'Después de cada clase, agrega las palabras nuevas en la página Palabras, con el número de lección como conjunto.' },
      { id: 'p4b', en: 'Practise them by writing from memory, not only by recognising them.', es: 'Practícalas escribiendo de memoria, no solo reconociéndolas.' },
      { id: 'p4c', en: 'Mark words that keep failing as difficult.', es: 'Marca como difíciles las palabras que siguen fallando.' },
    ] },
    { id: 'p5', title: { en: 'Simple sentences (when your class gets there)', es: 'Oraciones simples (cuando tu clase llegue)' }, tasks: [
      { id: 'p5a', en: 'Read the particles は, を, へ on the Rules page and say each example aloud.', es: 'Lee las partículas は, を, へ en la página Reglas y di cada ejemplo en voz alta.' },
      { id: 'p5b', en: 'Copy five sentences from your class notes, by hand, in kana.', es: 'Copia a mano, en kana, cinco oraciones de tus apuntes de clase.' },
      { id: 'p5c', en: 'Write three sentences a week with class vocabulary and ask your teacher to check them.', es: 'Escribe tres oraciones por semana con vocabulario de clase y pide a tu profesor que las revise.' },
    ] },
  ],
  weekly: [
    { id: 'wk1', en: 'Run a Quiz on this week’s material.', es: 'Haz un Quiz con el material de esta semana.' },
    { id: 'wk2', en: 'Clear the mistake bank: get each item right twice.', es: 'Vacía el banco de errores: acierta cada ítem dos veces.' },
    { id: 'wk3', en: 'Look at the heat map and choose two weak kana to drill.', es: 'Mira el mapa de calor y elige dos kana débiles para practicar.' },
    { id: 'wk4', en: 'Write this week’s new words by hand.', es: 'Escribe a mano las palabras nuevas de la semana.' },
    { id: 'wk5', en: 'Write down two questions for your teacher.', es: 'Anota dos preguntas para tu profesor.' },
  ],
  before: [
    { id: 'bq1', en: 'Ask your teacher what the quiz covers (kana, words, sentences) and the format.', es: 'Pregunta a tu profesor qué cubre el quiz (kana, palabras, oraciones) y el formato.' },
    { id: 'bq2', en: 'Enter the quiz date on the Today page to get a countdown plan.', es: 'Ingresa la fecha del quiz en la página Hoy para obtener un plan con cuenta regresiva.' },
    { id: 'bq3', en: 'Three or four days before: take one Exam simulation.', es: 'Tres o cuatro días antes: haz un Simulador de examen.' },
    { id: 'bq4', en: 'Day before: clear the mistake bank and hand-write the 10 hardest kana or words.', es: 'El día anterior: vacía el banco de errores y escribe a mano los 10 kana o palabras más difíciles.' },
    { id: 'bq5', en: 'Pack pencils and an eraser. Sleep properly.', es: 'Lleva lápices y borrador. Duerme bien.' },
    { id: 'bq6', en: 'Morning of: five minutes of the daily session as a warm-up, nothing new.', es: 'La mañana del quiz: cinco minutos de la sesión diaria como calentamiento, nada nuevo.' },
  ],
};

/* Countdown milestones: days before the quiz (negative) → what to do. Used on the Today page. */
MS.content.countdown = [
  { d: -14, en: 'Finish learning any kana you still do not know.', es: 'Termina de aprender los kana que aún no conoces.' },
  { d: -10, en: 'Enter all the class words for the quiz on the Words page.', es: 'Ingresa todas las palabras de clase del quiz en la página Palabras.' },
  { d: -7, en: 'Take a first Exam simulation. Note your weak kana.', es: 'Haz un primer Simulador de examen. Anota tus kana débiles.' },
  { d: -5, en: 'Drill the weak kana: look-alike and voicing drills.', es: 'Practica los kana débiles: ejercicios de parecidos y sonorización.' },
  { d: -3, en: 'Take a second Exam simulation and compare.', es: 'Haz un segundo Simulador de examen y compara.' },
  { d: -2, en: 'Clear the mistake bank.', es: 'Vacía el banco de errores.' },
  { d: -1, en: 'Light day: one daily session, hand-write the hardest items, sleep.', es: 'Día ligero: una sesión diaria, escribe a mano lo más difícil, duerme.' },
  { d: 0, en: 'Quiz day: five minutes of warm-up only.', es: 'Día del quiz: solo cinco minutos de calentamiento.' },
];

/* ---------- Resources ---------- */
// cost: 'free' | 'paid' | 'freemium'. `url` = a site address, `q` = search words (a search link, never breaks).
MS.content.resources = [
  { name: 'NHK WORLD-JAPAN: Easy Japanese', q: 'NHK WORLD-JAPAN Easy Japanese lessons', cost: 'free', why: { en: 'Short lessons with everyday phrases, made for beginners.', es: 'Lecciones cortas con frases cotidianas, hechas para principiantes.' } },
  { name: 'Tae Kim’s Guide to Learning Japanese', url: 'https://guidetojapanese.org/learn/', cost: 'free', why: { en: 'A clear grammar guide you can read in order once the kana are solid.', es: 'Una guía de gramática clara para leer en orden cuando los kana ya estén firmes.' } },
  { name: 'Tofugu: hiragana and katakana guides', q: 'Tofugu learn hiragana guide', cost: 'free', why: { en: 'Mnemonics and charts that explain why each kana looks the way it does.', es: 'Reglas mnemotécnicas y tablas que explican por qué cada kana se ve como se ve.' } },
  { name: 'Genki (textbook)', q: 'Genki an integrated course in elementary Japanese', cost: 'paid', why: { en: 'A common course textbook. If your course uses it, tell me and I can match the vocabulary sets to its lessons.', es: 'Un libro de texto muy usado en cursos. Si tu curso lo usa, dímelo y puedo ajustar los conjuntos de vocabulario a sus lecciones.' } },
  { name: 'JLPT official sample questions', q: 'JLPT official sample questions N5', cost: 'free', why: { en: 'The real exam format, from the people who run it. Useful later, not needed for a first quiz.', es: 'El formato real del examen, de quienes lo organizan. Útil más adelante, no hace falta para un primer quiz.' } },
  { name: 'Japanese from Zero (YouTube)', q: 'Japanese from Zero George Trombley YouTube', cost: 'free', why: { en: 'Slow, spoken explanations that follow a beginner course order.', es: 'Explicaciones habladas y pausadas que siguen el orden de un curso de principiantes.' } },
  { name: 'JapanesePod101', q: 'JapanesePod101', cost: 'freemium', why: { en: 'Audio lessons by native speakers; a good source of listening practice. Most content needs a subscription.', es: 'Lecciones de audio con hablantes nativos; buena fuente de práctica auditiva. La mayoría del contenido requiere suscripción.' } },
  { name: 'Anki with a shared kana deck', url: 'https://apps.ankiweb.net', cost: 'free', why: { en: 'Flashcards with spaced repetition. This site already does the same, so use Anki only if you want cards on your phone.', es: 'Tarjetas con repetición espaciada. Este sitio ya hace lo mismo; usa Anki solo si quieres tarjetas en el teléfono.' } },
  { name: 'Duolingo or Busuu', q: 'Duolingo Japanese course', cost: 'freemium', why: { en: 'Light daily practice to keep the habit. It will not replace a class or writing by hand.', es: 'Práctica ligera diaria para mantener el hábito. No reemplaza una clase ni escribir a mano.' } },
  { name: 'HelloTalk or Tandem', q: 'HelloTalk language exchange', cost: 'freemium', why: { en: 'Exchange messages with Japanese speakers who want to learn Spanish or English. Wait until you can read hiragana.', es: 'Intercambia mensajes con hablantes de japonés que quieren aprender español o inglés. Espera a poder leer hiragana.' } },
  { name: { en: 'Your school’s own materials', es: 'Los materiales de tu escuela' }, cost: 'free', why: { en: 'The quiz is written from these. Keep them first.', es: 'El quiz se escribe a partir de ellos. Mantenlos como prioridad.' } },
];
