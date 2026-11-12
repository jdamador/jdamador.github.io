/* data/vocab-sets.js: ready-made beginner vocabulary, grouped by topic. Kana only (no kanji yet).
   Each word: [kana, English, Spanish]. Add a set to Words from the Vocabulary sets page.
   Edit freely; tools/list-audio.js records audio for every word here. */
window.MS = window.MS || {};
MS.vocabSets = [
  { id: 'numbers', title: { en: 'Numbers', es: 'Números' }, words: [
    ['ゼロ', '0 (zero)', '0 (cero)'], ['いち', '1 (one)', '1 (uno)'], ['に', '2 (two)', '2 (dos)'], ['さん', '3 (three)', '3 (tres)'],
    ['よん', '4 (four)', '4 (cuatro)'], ['ご', '5 (five)', '5 (cinco)'], ['ろく', '6 (six)', '6 (seis)'], ['なな', '7 (seven)', '7 (siete)'],
    ['はち', '8 (eight)', '8 (ocho)'], ['きゅう', '9 (nine)', '9 (nueve)'], ['じゅう', '10 (ten)', '10 (diez)'], ['ひゃく', '100 (one hundred)', '100 (cien)'],
    ['せん', '1000 (one thousand)', '1000 (mil)'], ['いちまん', '10000 (ten thousand)', '10000 (diez mil)'],
  ] },
  { id: 'colors', title: { en: 'Colors', es: 'Colores' }, words: [
    ['あか', 'red', 'rojo'], ['あお', 'blue', 'azul'], ['きいろ', 'yellow', 'amarillo'], ['みどり', 'green', 'verde'], ['しろ', 'white', 'blanco'],
    ['くろ', 'black', 'negro'], ['ちゃいろ', 'brown', 'marrón'], ['むらさき', 'purple', 'morado'], ['ピンク', 'pink', 'rosado'], ['オレンジ', 'orange (color)', 'anaranjado'],
  ] },
  { id: 'family', title: { en: 'Family', es: 'Familia' }, words: [
    ['かぞく', 'family', 'familia'], ['ちち', 'my father', 'mi padre'], ['はは', 'my mother', 'mi madre'], ['あに', 'my older brother', 'mi hermano mayor'],
    ['あね', 'my older sister', 'mi hermana mayor'], ['おとうと', 'younger brother', 'hermano menor'], ['いもうと', 'younger sister', 'hermana menor'],
    ['そふ', 'my grandfather', 'mi abuelo'], ['そぼ', 'my grandmother', 'mi abuela'], ['こども', 'child', 'niño'],
  ] },
  { id: 'food', title: { en: 'Food and drink', es: 'Comida y bebida' }, words: [
    ['みず', 'water', 'agua'], ['おちゃ', 'green tea', 'té verde'], ['コーヒー', 'coffee', 'café'], ['ぎゅうにゅう', 'milk', 'leche'], ['ごはん', 'cooked rice', 'arroz cocido'],
    ['パン', 'bread', 'pan'], ['たまご', 'egg', 'huevo'], ['にく', 'meat', 'carne'], ['さかな', 'fish', 'pescado'], ['やさい', 'vegetables', 'verduras'],
    ['くだもの', 'fruit', 'fruta'], ['りんご', 'apple', 'manzana'], ['バナナ', 'banana', 'banano'],
  ] },
  { id: 'animals', title: { en: 'Animals', es: 'Animales' }, words: [
    ['いぬ', 'dog', 'perro'], ['ねこ', 'cat', 'gato'], ['とり', 'bird', 'pájaro'], ['うま', 'horse', 'caballo'], ['うし', 'cow', 'vaca'],
    ['ぶた', 'pig', 'cerdo'], ['さる', 'monkey', 'mono'], ['うさぎ', 'rabbit', 'conejo'], ['くま', 'bear', 'oso'], ['ねずみ', 'mouse', 'ratón'],
  ] },
  { id: 'days', title: { en: 'Days of the week', es: 'Días de la semana' }, words: [
    ['げつようび', 'Monday', 'lunes'], ['かようび', 'Tuesday', 'martes'], ['すいようび', 'Wednesday', 'miércoles'], ['もくようび', 'Thursday', 'jueves'],
    ['きんようび', 'Friday', 'viernes'], ['どようび', 'Saturday', 'sábado'], ['にちようび', 'Sunday', 'domingo'],
  ] },
  { id: 'time', title: { en: 'Time words', es: 'Palabras de tiempo' }, words: [
    ['きょう', 'today', 'hoy'], ['あした', 'tomorrow', 'mañana'], ['きのう', 'yesterday', 'ayer'], ['いま', 'now', 'ahora'],
    ['あさ', 'morning', 'mañana (parte del día)'], ['ひる', 'noon, daytime', 'mediodía'], ['よる', 'night', 'noche'], ['まいにち', 'every day', 'todos los días'],
  ] },
  { id: 'body', title: { en: 'Body', es: 'Cuerpo' }, words: [
    ['あたま', 'head', 'cabeza'], ['かお', 'face', 'cara'], ['め', 'eye', 'ojo'], ['みみ', 'ear', 'oreja'], ['はな', 'nose', 'nariz'],
    ['くち', 'mouth', 'boca'], ['て', 'hand', 'mano'], ['あし', 'leg, foot', 'pierna, pie'],
  ] },
  { id: 'greetings', title: { en: 'Greetings', es: 'Saludos' }, words: [
    ['おはよう', 'good morning (casual)', 'buenos días (informal)'], ['こんにちは', 'hello, good afternoon', 'hola, buenas tardes'], ['こんばんは', 'good evening', 'buenas noches (saludo)'],
    ['さようなら', 'goodbye', 'adiós'], ['おやすみなさい', 'good night', 'buenas noches (al dormir)'], ['ありがとう', 'thank you', 'gracias'],
    ['すみません', 'excuse me, sorry', 'disculpe, perdón'], ['はじめまして', 'nice to meet you', 'mucho gusto'],
  ] },
  { id: 'classroom', title: { en: 'Classroom', es: 'Clase' }, words: [
    ['せんせい', 'teacher', 'profesor'], ['がくせい', 'student', 'estudiante'], ['がっこう', 'school', 'escuela'], ['ほん', 'book', 'libro'],
    ['えんぴつ', 'pencil', 'lápiz'], ['ノート', 'notebook', 'cuaderno'], ['つくえ', 'desk', 'escritorio'], ['いす', 'chair', 'silla'],
  ] },
];
