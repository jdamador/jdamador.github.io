/* data/english-data.js — English module content (B2/C1 → C1/C2). Edit freely.
   English content is written in English on purpose: this module is practice material.
   Links with `q` are web searches so they never break; `url` links point to the site's home page. */
window.MS = window.MS || {};
MS.en = {};

MS.en.skills = [
  { id: 'listening', en: 'Listening', es: 'Comprensión auditiva' },
  { id: 'speaking', en: 'Speaking', es: 'Expresión oral' },
  { id: 'reading', en: 'Reading', es: 'Lectura' },
  { id: 'writing', en: 'Writing', es: 'Escritura' },
  { id: 'vocabulary', en: 'Vocabulary', es: 'Vocabulario' },
  { id: 'grammar', en: 'Grammar', es: 'Gramática' },
];
// Self-rating scale (1..6). These are your own estimates, not test results.
MS.en.scale = ['B1', 'B2', 'B2+', 'C1', 'C1+', 'C2'];

/* Can-do statements: my own paraphrases of the idea of the CEFR descriptors (Council of Europe), not official text. */
MS.en.cando = {
  B2: [
    { id: 'b2l1', skill: 'listening', t: 'I can follow extended speech and fairly complex arguments on familiar topics.' },
    { id: 'b2l2', skill: 'listening', t: 'I can understand most TV news and current-affairs programmes.' },
    { id: 'b2l3', skill: 'listening', t: 'I can follow most films in standard English without subtitles.' },
    { id: 'b2s1', skill: 'speaking', t: 'I can talk with native speakers fluently enough that neither of us feels strain.' },
    { id: 'b2s2', skill: 'speaking', t: 'I can give clear, detailed descriptions on many subjects of interest.' },
    { id: 'b2s3', skill: 'speaking', t: 'I can explain a point of view and give the advantages and disadvantages of options.' },
    { id: 'b2r1', skill: 'reading', t: 'I can read articles and reports on current problems where the writer takes a stance.' },
    { id: 'b2r2', skill: 'reading', t: 'I can scan long texts to find the detail I need.' },
    { id: 'b2r3', skill: 'reading', t: 'I can understand contemporary prose fiction without a dictionary most of the time.' },
    { id: 'b2w1', skill: 'writing', t: 'I can write clear, detailed text on a wide range of subjects I know.' },
    { id: 'b2w2', skill: 'writing', t: 'I can write an essay or report that gives reasons for or against a view.' },
    { id: 'b2w3', skill: 'writing', t: 'I can choose a style that suits the reader (formal or informal).' },
    { id: 'b2v1', skill: 'vocabulary', t: 'I have enough vocabulary to describe and give opinions without searching for words much.' },
    { id: 'b2g1', skill: 'grammar', t: 'I have good grammatical control; my mistakes rarely cause misunderstanding.' },
  ],
  C1: [
    { id: 'c1l1', skill: 'listening', t: 'I can follow extended speech even when it is not clearly structured and connections are only implied.' },
    { id: 'c1l2', skill: 'listening', t: 'I can understand films and programmes with slang and idiom without much effort.' },
    { id: 'c1l3', skill: 'listening', t: 'I can pick up shifts of register, humour and unstated attitudes.' },
    { id: 'c1s1', skill: 'speaking', t: 'I can express myself fluently and spontaneously, almost without searching for words.' },
    { id: 'c1s2', skill: 'speaking', t: 'I can use the language flexibly for social, academic and professional purposes.' },
    { id: 'c1s3', skill: 'speaking', t: 'I can give detailed descriptions of complex subjects and round them off with a conclusion.' },
    { id: 'c1r1', skill: 'reading', t: 'I can understand long, demanding texts and notice differences in style.' },
    { id: 'c1r2', skill: 'reading', t: 'I can read specialised articles outside my field if I can use a dictionary now and then.' },
    { id: 'c1r3', skill: 'reading', t: 'I can read for stance and implied meaning, not only for facts.' },
    { id: 'c1w1', skill: 'writing', t: 'I can write clear, well-structured text and expand points at some length.' },
    { id: 'c1w2', skill: 'writing', t: 'I can write about complex subjects, underlining the points that matter most.' },
    { id: 'c1w3', skill: 'writing', t: 'I can vary structure, linking words and tone to suit the reader.' },
    { id: 'c1v1', skill: 'vocabulary', t: 'I can choose a precise word or phrase from a broad range, including idioms and collocations.' },
    { id: 'c1g1', skill: 'grammar', t: 'I keep consistent control of complex grammar; errors are rare and hard to spot.' },
  ],
};

MS.en.tests = [
  { name: 'Cambridge English: Test your English', url: 'https://www.cambridgeenglish.org/test-your-english/' },
  { name: 'British Council LearnEnglish: level test', q: 'British Council LearnEnglish English level test' },
  { name: 'EF SET (free English test)', url: 'https://www.efset.org' },
];

/* Goals. `w` re-weights the skill rotation in the weekly plan; `note` explains how the plan adapts. */
MS.en.goals = [
  { id: 'c1adv', en: 'Pass Cambridge C1 Advanced', es: 'Aprobar Cambridge C1 Advanced', exam: true, note: 'Adds timed exam-style practice and more writing. Check the current exam format on the official exam site before you plan.', over: { 4: ['exam', 'write'], 5: ['write', 'speak'] } },
  { id: 'c2prof', en: 'Pass Cambridge C2 Proficiency', es: 'Aprobar Cambridge C2 Proficiency', exam: true, note: 'Adds timed exam-style practice, precise vocabulary and longer reading. Check the current exam format on the official exam site.', over: { 4: ['exam', 'read'], 5: ['write', 'speak'] } },
  { id: 'ielts', en: 'IELTS 7.5', es: 'IELTS 7.5', exam: true, note: 'Adds timed exam-style practice for the four IELTS skills. Use the official practice materials and check the current format.', over: { 4: ['exam', 'listen'], 5: ['write', 'speak'] } },
  { id: 'toefl', en: 'TOEFL', es: 'TOEFL', exam: true, note: 'Adds timed exam-style practice. Use the official practice materials and check the current format.', over: { 4: ['exam', 'listen'], 5: ['write', 'speak'] } },
  { id: 'work', en: 'Work in English', es: 'Trabajar en inglés', note: 'Adds work-style writing (emails, summaries) and speaking (meetings, presentations).', over: { 3: ['write-work', 'vocab'], 5: ['speak-work', 'write-work'] } },
  { id: 'ease', en: 'Speak with ease', es: 'Hablar con soltura', note: 'Adds more shadowing and speaking, with listening to natural speech.', over: { 1: ['shadow', 'grammar'], 3: ['speak', 'vocab'], 4: ['listen', 'shadow'] } },
  { id: 'custom', en: 'My own goal', es: 'Mi propia meta', note: 'Uses the balanced mix. Write your goal in the box so you can see it every week.', over: {} },
];

/* Task library per skill. A weekly plan picks one per slot, rotating by week. */
MS.en.tasks = {
  listen: [
    'Listen to one episode of 6 Minute English. First without the transcript, then again with it. Note 5 phrases you did not know.',
    'Listen to a podcast episode at normal speed for the gist, then replay one 2-minute section three times and write what you hear.',
    'Watch a TED talk with English subtitles off. Pause every few minutes and say the main point aloud in one sentence.',
    'Listen to an interview or panel. Write down three opinions and the words the speakers used to disagree politely.',
  ],
  shadow: [
    'Shadow a 2-minute clip: listen once, then speak along a half-second behind. Repeat 5 times, then record yourself once.',
    'Pick 60 seconds of a speaker you like. Mark stress and pauses on the transcript, then shadow with those marks.',
    'Shadow one short section, then record it and compare your rhythm and linking with the original.',
  ],
  read: [
    'Read one long article (800 words or more) on a topic you do not usually read. Underline 5 collocations and summarise it in 3 sentences.',
    'Read an opinion piece. Write down the writer’s claim, two supporting points and one thing you disagree with.',
    'Read a chapter of a book you are reading for pleasure and copy out 3 sentences you would like to be able to write.',
    'Read two articles on the same news story from different outlets. List the differences in tone and word choice.',
  ],
  vocab: [
    'Review the due cards in your vocabulary journal, then add 5 new entries with an example sentence in your own words.',
    'Take 5 words from your journal and write a collocation list for each (verbs, adjectives, prepositions that go with it).',
    'Do the collocation trainer on your journal, then rewrite two of your example sentences to sound more natural.',
  ],
  write: [
    'Write 150–200 words giving your opinion on a news topic. Run the writing checklist before you stop.',
    'Summarise an article you read this week in 120 words, in your own words. Check repeated words and sentence length.',
    'Rewrite something you wrote last week, making it clearer and more varied. Compare the two versions.',
    'Write a formal email (complaint, request or application) of about 150 words. Check tone and linking words.',
  ],
  'write-work': [
    'Write a work email of 120–150 words that asks for something politely and clearly. Run the writing checklist.',
    'Write a one-paragraph summary of a document or meeting as you would for a colleague.',
  ],
  speak: [
    'Pick a random speaking prompt, speak for 1 minute and record yourself. Listen back and note 2 things to improve.',
    'Explain something you know well to an imaginary beginner for 2 minutes. Record it and look for fillers and repeated words.',
    'Talk about your week for 2 minutes using at least 5 phrases from your journal.',
  ],
  'speak-work': [
    'Practise a 2-minute update as if in a team meeting. Record it and check it is clear and organised.',
    'Practise answering “Tell me about your work” for 1 minute, then improve it and try again.',
  ],
  grammar: [
    'Study one advanced structure (for example inversion after negative adverbials, or mixed conditionals). Write 5 sentences about your own life.',
    'Look at your error log and choose your most frequent mistake. Write 5 correct sentences using it.',
    'Study the difference between two similar structures (for example “wish” and “if only”). Write 3 example pairs.',
  ],
  exam: [
    'Do one timed exam-style task from official or reliable practice material. Mark it honestly and note the three weakest points.',
    'Do one exam-style listening or reading section under time. Review every wrong answer and say why it was wrong.',
    'Do one timed writing task in exam conditions, then check it against the assessment criteria from the exam provider.',
  ],
  review: [
    'Weekly review: tick what you did, then answer the review prompts on the Tools page.',
  ],
};
MS.en.dayLabels = [
  { en: 'Monday', es: 'Lunes' }, { en: 'Tuesday', es: 'Martes' }, { en: 'Wednesday', es: 'Miércoles' },
  { en: 'Thursday', es: 'Jueves' }, { en: 'Friday', es: 'Viernes' }, { en: 'Saturday', es: 'Sábado' }, { en: 'Sunday', es: 'Domingo' },
];
// default skills per day (Mon..Sun)
MS.en.rotation = [['listen', 'vocab'], ['read', 'grammar'], ['speak', 'shadow'], ['write', 'vocab'], ['listen', 'read'], ['speak', 'write'], ['review', 'vocab']];

MS.en.roadmap = [
  { theme: 'Baseline and habits', focus: 'Take one level test (a rough estimate only), set your goal, rate your skills and fix a daily time slot.', out: 'A saved self-rating and a weekly plan you can actually keep.' },
  { theme: 'Listening at natural speed', focus: 'Move from graded to authentic audio. Use short clips, replay, and check against transcripts.', out: '5 listening log entries with an honest “how much I understood”.' },
  { theme: 'Vocabulary: collocations and phrasal verbs', focus: 'Learn phrases, not single words. Write your own example sentences.', out: '25 journal entries, each with collocations.' },
  { theme: 'Extensive reading', focus: 'Read a lot, mostly for pleasure, and guess new words from context before you look them up.', out: 'One long article or book chapter read every two days.' },
  { theme: 'Writing: structure and cohesion', focus: 'Paragraphs, topic sentences and linking words. Use the writing checklist every time.', out: 'Two pieces of 150–200 words, the second a rewrite of the first.' },
  { theme: 'Speaking fluency', focus: 'Speak for longer without stopping. Use discourse markers and recover from mistakes.', out: 'Three recordings of one minute, compared week to week.' },
  { theme: 'Advanced grammar', focus: 'Inversion, conditionals, cleft sentences, passives and reduced clauses, taught from your own error log.', out: 'An error log with your 5 most frequent mistakes, each with a corrected example.' },
  { theme: 'Register and tone', focus: 'Formal and informal versions of the same message. Notice what changes in words and structure.', out: 'The same message written in three registers.' },
  { theme: 'Idiom, nuance and hedging', focus: 'Softening, emphasising, and expressing degrees of certainty. Learn idioms in context, not lists.', out: '10 idioms or hedges used in your own speaking or writing.' },
  { theme: 'Accuracy and self-correction', focus: 'Edit your own writing for the mistakes in your error log. Catch errors while speaking.', out: 'A piece of writing with fewer repeated errors than week 5.' },
  { theme: 'Real-world or exam simulation', focus: 'Practise under real conditions: timed exam tasks if you have an exam goal, or a real conversation, meeting or presentation if not.', out: 'One full simulation, marked honestly.' },
  { theme: 'Final review and re-assessment', focus: 'Retake a level test, update your self-rating, and decide the next 12 weeks.', out: 'A new self-rating compared with week 1 and a next goal.' },
];

MS.en.prompts = [
  'Describe a place that changed how you think about something.',
  'Is working from home better than working in an office? Give reasons.',
  'Talk about a skill you would like to learn and why.',
  'Describe a difficult decision you had to make and what you learned.',
  'Should students be required to learn a second language? Why or why not?',
  'Explain a tradition from your country to someone who has never heard of it.',
  'What are the advantages and disadvantages of social media?',
  'Describe a person who has influenced you.',
  'How has technology changed the way people learn?',
  'Talk about a time something did not go as planned.',
  'What makes a good teacher?',
  'Is it better to travel alone or with other people?',
  'Describe a photograph that means something to you.',
  'Should cities ban cars from their centres? Give your opinion.',
  'What would you do with an extra hour every day?',
  'Talk about a book, film or series you would recommend and why.',
  'How important is it to keep up with the news?',
  'Describe a meal you remember well.',
  'What do you think the biggest challenge for young people today is?',
  'Compare how you study now with how you studied at school.',
  'Is money the most important factor when choosing a job?',
  'Talk about a risk you took and whether it was worth it.',
  'Describe how a hobby of yours works to someone who knows nothing about it.',
  'What changes would you make to your city?',
  'How do you deal with stress?',
  'Do you think people are more or less creative than in the past?',
  'Explain a mistake you often make in English and how you plan to fix it.',
  'What is the value of learning from failure?',
  'Talk about a place you would like to live and why.',
  'Argue for or against: “Learning a language is mostly about habit, not talent.”',
];

MS.en.writeChecklist = [
  { id: 'structure', title: 'Structure', items: ['There is a clear opening that states the purpose or position.', 'Each paragraph has one main idea, introduced by a topic sentence.', 'There is a conclusion that does more than repeat the opening.'] },
  { id: 'tone', title: 'Tone and audience', items: ['The register (formal or informal) matches the reader.', 'I have avoided contractions and slang if the text is formal.', 'The tone is consistent from start to end.'] },
  { id: 'linking', title: 'Linking words', items: ['I link ideas with more than “and”, “but” and “because”.', 'Linking words show the right relationship (contrast, cause, addition, result).', 'I do not start every sentence with a linking word.'] },
  { id: 'variety', title: 'Variety', items: ['Sentence length varies: short and long sentences mix.', 'I use different sentence openings.', 'I replace repeated words with precise alternatives.'] },
  { id: 'accuracy', title: 'Accuracy', items: ['I checked verb tenses and agreement.', 'I checked articles and prepositions (my usual weak spots).', 'I read it aloud once to catch awkward phrases.', 'I checked spelling and punctuation.'] },
];
MS.en.connectors = ['however', 'although', 'though', 'whereas', 'while', 'nevertheless', 'nonetheless', 'moreover', 'furthermore', 'in addition', 'therefore', 'consequently', 'as a result', 'despite', 'in spite of', 'on the other hand', 'in contrast', 'for instance', 'for example', 'in conclusion', 'to sum up', 'overall', 'firstly', 'secondly', 'finally', 'meanwhile', 'otherwise', 'unless', 'provided that', 'as long as', 'even though', 'besides', 'in particular', 'indeed'];
MS.en.stopwords = new Set('the a an and or but if then than that this these those to of in on at by for with from as is are was were be been being it its it\'s i you he she we they them his her our their my your not no so do does did done have has had will would can could should may might must about into over under up down out more most very just also there here which who whom what when where why how all any some such only own same other each both few much many one two'.split(' '));

/* Resources, grouped by skill. cost: 'free' | 'paid' | 'freemium' */
MS.en.resources = [
  { group: { en: 'Listening and speaking', es: 'Comprensión oral y expresión oral' }, items: [
    { name: 'BBC Learning English (6 Minute English, The English We Speak)', url: 'https://www.bbc.co.uk/learningenglish', cost: 'free', why: 'Short episodes with transcripts: good for daily listening and everyday phrases.' },
    { name: 'Luke’s English Podcast', q: 'Luke’s English Podcast', cost: 'free', why: 'Long, natural conversation with a teacher’s explanations: strong for C1 listening stamina.' },
    { name: 'English Learning for Curious Minds', q: 'English Learning for Curious Minds podcast', cost: 'free', why: 'Slow, clear stories with a script and vocabulary notes.' },
    { name: 'TED Talks (with transcripts)', url: 'https://www.ted.com/talks', cost: 'free', why: 'Prepared speeches on many topics; use the transcript to shadow and to steal phrases.' },
    { name: 'ELLLO', url: 'https://elllo.org', cost: 'free', why: 'Many accents and short real conversations with quizzes.' },
    { name: 'Rachel’s English', url: 'https://rachelsenglish.com', cost: 'free', why: 'Accent and pronunciation: stress, rhythm and linking explained slowly.' },
    { name: 'engVid', url: 'https://www.engvid.com', cost: 'free', why: 'Teacher-led video lessons on grammar, vocabulary and exam skills.' },
  ] },
  { group: { en: 'Reading', es: 'Lectura' }, items: [
    { name: 'BBC News', url: 'https://www.bbc.com/news', cost: 'free', why: 'Clear journalistic English on current topics; easy to read daily.' },
    { name: 'The Guardian', url: 'https://www.theguardian.com', cost: 'free', why: 'Opinion and long reads with a richer range of vocabulary and register.' },
    { name: 'The Economist', url: 'https://www.economist.com', cost: 'freemium', why: 'Dense, precise writing at C1/C2 level. Only some articles are free.' },
    { name: 'Medium', url: 'https://medium.com', cost: 'freemium', why: 'Personal essays and explainers on any topic; quality varies, so choose carefully.' },
    { name: 'Graded and authentic books', q: 'graded readers advanced English books', cost: 'paid', why: 'Extensive reading builds vocabulary fastest when the book is enjoyable and nearly easy.' },
    { name: 'Newsela', url: 'https://newsela.com', cost: 'freemium', why: 'The same article at different reading levels; mostly designed for schools, so use it only if it helps.' },
  ] },
  { group: { en: 'Vocabulary and grammar', es: 'Vocabulario y gramática' }, items: [
    { name: 'Cambridge Dictionary', url: 'https://dictionary.cambridge.org', cost: 'free', why: 'Learner definitions with example sentences and levels.' },
    { name: 'Oxford Learner’s Dictionaries', url: 'https://www.oxfordlearnersdictionaries.com', cost: 'free', why: 'Clear learner definitions and the Oxford 5000 word lists.' },
    { name: 'Vocabulary.com', url: 'https://www.vocabulary.com', cost: 'freemium', why: 'Adaptive word practice and clear explanations of nuance.' },
    { name: 'English Vocabulary in Use (Advanced)', q: 'English Vocabulary in Use Advanced Cambridge', cost: 'paid', why: 'Topic-based phrases and collocations at the level you want.' },
    { name: 'Advanced Grammar in Use', q: 'Advanced Grammar in Use Cambridge', cost: 'paid', why: 'Short units with exercises, good for filling specific gaps.' },
    { name: 'Collins COBUILD', q: 'Collins COBUILD dictionary online', cost: 'freemium', why: 'Definitions written as full sentences, which show how words are used.' },
    { name: 'Anki', url: 'https://apps.ankiweb.net', cost: 'free', why: 'Spaced-repetition flashcards. This site’s journal does the same; use Anki if you want them on your phone.' },
  ] },
  { group: { en: 'Writing', es: 'Escritura' }, items: [
    { name: 'LanguageTool', url: 'https://languagetool.org', cost: 'freemium', why: 'Free grammar and style checker. Treat its suggestions as hints, not rules.' },
    { name: 'Grammarly', url: 'https://www.grammarly.com', cost: 'freemium', why: 'Corrections and tone suggestions; the free tier covers the basics.' },
    { name: 'Cambridge C1 Advanced writing samples', q: 'Cambridge C1 Advanced writing sample answers examiner comments', cost: 'free', why: 'Real sample answers with examiner comments show what a pass looks like.' },
    { name: 'Hemingway Editor', url: 'https://hemingwayapp.com', cost: 'freemium', why: 'Highlights long, complex sentences. Useful for clarity, not for style.' },
  ] },
  { group: { en: 'Exams (only if you want one)', es: 'Exámenes (solo si quieres uno)' }, items: [
    { name: 'Cambridge C1 Advanced and C2 Proficiency', q: 'Cambridge C1 Advanced C2 Proficiency official preparation', cost: 'freemium', why: 'Official sample papers and guidance. Check dates, fees and centres on the official site.' },
    { name: 'IELTS', q: 'IELTS official practice materials', cost: 'freemium', why: 'Official practice tests and score information. Check current fees and formats yourself.' },
    { name: 'TOEFL', q: 'TOEFL iBT official practice', cost: 'freemium', why: 'Official practice from the test maker. Check current formats yourself.' },
  ] },
  { group: { en: 'Speaking partners', es: 'Compañeros de conversación' }, items: [
    { name: 'italki', url: 'https://www.italki.com', cost: 'paid', why: 'Paid one-to-one lessons or conversation with tutors; prices vary by tutor.' },
    { name: 'Tandem', url: 'https://www.tandem.net', cost: 'freemium', why: 'Language exchange: you help with Spanish, they help with English.' },
    { name: 'HelloTalk', q: 'HelloTalk language exchange', cost: 'freemium', why: 'Text and voice exchange with learners and native speakers.' },
    { name: 'Local conversation groups', q: 'English conversation group near me', cost: 'free', why: 'In-person practice builds the confidence that apps do not.' },
  ] },
];

MS.en.howto = [
  { t: 'Shadowing', d: 'Play a short clip and speak along a fraction of a second behind the speaker, copying rhythm, stress and linking. Five minutes a day beats an hour a week. Start with a 1–2 minute clip and repeat it until it feels easy.' },
  { t: 'Spaced repetition', d: 'Review a word just before you would forget it. The vocabulary journal here schedules that for you. Add phrases with your own example sentence, not a translation.' },
  { t: 'Extensive reading and listening', d: 'Read and listen to a lot of material that is nearly easy. You do not need to look up every word. Understanding 90–95% is a good target.' },
  { t: 'Output practice', d: 'Your English only improves in the places you use it. Speak and write every week, then get feedback from a teacher, a language partner or a checker tool.' },
  { t: 'Error log', d: 'Keep a short list of your most frequent mistakes, each with a corrected example. Review it before you write. Fixing five recurring mistakes is worth more than learning fifty new words.' },
];

MS.en.reviewPrompts = [
  'What improved this week? Give one specific example.',
  'What was hard, and why do you think it was hard?',
  'Which mistakes did I repeat?',
  'What will I do differently next week?',
];
