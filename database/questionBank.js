/**
 * Curated MCQ bank: subject → topic → questions.
 * Each topic has 12+ questions so tests can request up to 30 per subject.
 */

function q(text, a, b, c, d, correct, difficulty = 'medium') {
  return {
    question_text: text,
    option_a: a,
    option_b: b,
    option_c: c,
    option_d: d,
    correct_answer: correct,
    difficulty,
  };
}

const QUESTION_BANK = {
  Mathematics: {
    Algebra: [
      q('What is the value of x if 2x + 6 = 14?', '2', '4', '6', '8', 'B', 'easy'),
      q('Simplify: 3(x + 2) − 2x', 'x + 6', 'x + 2', '5x + 6', 'x − 6', 'A', 'easy'),
      q('Which is a solution to x² − 9 = 0?', 'x = 3 only', 'x = −3 only', 'x = 3 or x = −3', 'x = 9', 'C', 'easy'),
      q('Factor completely: x² − 5x + 6', '(x−2)(x−3)', '(x+2)(x+3)', '(x−1)(x−6)', '(x+1)(x+6)', 'A', 'medium'),
      q('What is the slope of the line y = −3x + 7?', '−3', '3', '7', '−7', 'A', 'easy'),
      q('Solve: |x − 4| = 2', 'x = 2 or 6', 'x = 2 only', 'x = 6 only', 'x = −2 or 2', 'A', 'medium'),
      q('Which expression is equivalent to (x²)(x³)?', 'x⁵', 'x⁶', 'x', '2x⁵', 'A', 'easy'),
      q('What is the y-intercept of y = 2x − 8?', '−8', '8', '2', '−2', 'A', 'easy'),
      q('Solve the system: x + y = 10 and x − y = 2', 'x=6, y=4', 'x=4, y=6', 'x=5, y=5', 'x=8, y=2', 'A', 'medium'),
      q('Which is the vertex form of a parabola opening upward?', 'y = a(x−h)² + k, a>0', 'y = ax + b', 'x = ay + b', 'y = −a(x−h)² + k', 'A', 'hard'),
      q('What is  (3×10⁴) × (2×10²) in scientific notation?', '6×10⁶', '5×10⁶', '6×10⁸', '5×10⁸', 'A', 'medium'),
      q('If f(x) = x² + 1, what is f(−3)?', '10', '8', '9', '−8', 'A', 'easy'),
    ],
    Geometry: [
      q('Sum of interior angles in a triangle is:', '180°', '90°', '360°', '270°', 'A', 'easy'),
      q('Area of a rectangle with length 8 cm and width 5 cm is:', '40 cm²', '13 cm²', '26 cm²', '80 cm²', 'A', 'easy'),
      q('Circumference of a circle with radius 7 cm is (use π≈22/7):', '44 cm', '49 cm', '14 cm', '154 cm', 'A', 'medium'),
      q('In a right triangle, legs 3 and 4. Hypotenuse length is:', '5', '6', '7', '12', 'A', 'easy'),
      q('Two angles are supplementary. One is 65°. The other is:', '115°', '25°', '65°', '180°', 'A', 'easy'),
      q('A square has side 6 cm. Its perimeter is:', '24 cm', '12 cm', '36 cm', '18 cm', 'A', 'easy'),
      q('Volume of a cube with edge 3 cm is:', '27 cm³', '9 cm³', '18 cm³', '6 cm³', 'A', 'medium'),
      q('Lines that never meet and are in the same plane are called:', 'Parallel', 'Perpendicular', 'Intersecting', 'Skew only', 'A', 'easy'),
      q('An isosceles triangle has:', 'Two equal sides', 'All sides equal', 'No equal sides', 'One right angle only', 'A', 'easy'),
      q('Area of a triangle with base 10 and height 4 is:', '20', '40', '14', '80', 'A', 'easy'),
      q('Each exterior angle of a regular hexagon measures:', '60°', '120°', '90°', '72°', 'A', 'hard'),
      q('If two triangles are similar, corresponding sides are:', 'Proportional', 'Always equal', 'Perpendicular', 'Parallel only', 'A', 'medium'),
    ],
  },
  Science: {
    Physics: [
      q('SI unit of force is:', 'Newton', 'Joule', 'Watt', 'Pascal', 'A', 'easy'),
      q('Speed is defined as:', 'Distance / time', 'Time / distance', 'Mass × velocity', 'Force / area', 'A', 'easy'),
      q('Acceleration due to gravity on Earth is approximately:', '9.8 m/s²', '98 m/s²', '1 m/s²', '0 m/s²', 'A', 'easy'),
      q('Ohm’s law states V equals:', 'IR', 'I/R', 'R/I', 'I+R', 'A', 'medium'),
      q('Kinetic energy formula is:', '½mv²', 'mgh', 'Fd', 'mv', 'A', 'medium'),
      q('A body at rest stays at rest unless acted on by a net force — this is:', 'Newton’s first law', 'Newton’s third law', 'Law of gravitation', 'Snell’s law', 'A', 'easy'),
      q('Unit of electric current is:', 'Ampere', 'Volt', 'Ohm', 'Coulomb', 'A', 'easy'),
      q('Frequency unit is:', 'Hertz', 'Newton', 'Tesla', 'Lumen', 'A', 'easy'),
      q('Power is measured in:', 'Watt', 'Joule', 'Newton', 'Pascal', 'A', 'easy'),
      q('When light bends passing from air to glass, the phenomenon is:', 'Refraction', 'Reflection', 'Diffraction', 'Polarization', 'A', 'medium'),
      q('Momentum is:', 'mass × velocity', 'mass / velocity', 'force × time only', 'energy / time', 'A', 'medium'),
      q('Sound cannot travel through:', 'Vacuum', 'Water', 'Steel', 'Air', 'A', 'easy'),
    ],
    Chemistry: [
      q('Atomic number represents number of:', 'Protons', 'Neutrons only', 'Electrons only in ion', 'Nucleons minus protons', 'A', 'easy'),
      q('pH of a neutral solution at 25°C is:', '7', '0', '14', '1', 'A', 'easy'),
      q('Chemical formula of water is:', 'H₂O', 'CO₂', 'NaCl', 'O₂', 'A', 'easy'),
      q('Process of a gas turning to liquid is called:', 'Condensation', 'Evaporation', 'Sublimation', 'Deposition', 'A', 'easy'),
      q('Avogadro’s number relates moles to:', 'Particles', 'Volume only', 'Mass only', 'Energy', 'A', 'hard'),
      q('An acid turns blue litmus:', 'Red', 'Green', 'Yellow', 'Unchanged', 'A', 'easy'),
      q('Noble gases are in group:', '18', '1', '2', '17', 'A', 'medium'),
      q('Rusting of iron is an example of:', 'Oxidation', 'Reduction only', 'Neutralization', 'Polymerization', 'A', 'medium'),
      q('Salt formed from HCl and NaOH is:', 'NaCl', 'NaOH', 'H₂O only', 'Na₂CO₃', 'A', 'medium'),
      q('Isotopes have same number of ___ but different ___:', 'protons; neutrons', 'neutrons; protons', 'electrons; protons', 'protons; electrons', 'A', 'medium'),
      q('Endothermic reaction:', 'Absorbs heat', 'Releases heat always', 'Has no energy change', 'Only occurs in plants', 'A', 'medium'),
      q('Molar mass of CO₂ (C=12, O=16) is approximately:', '44 g/mol', '28 g/mol', '32 g/mol', '16 g/mol', 'A', 'hard'),
    ],
  },
  English: {
    Grammar: [
      q('Choose the correct sentence:', 'She does not like coffee.', 'She do not like coffee.', 'She not likes coffee.', 'She doesn’t likes coffee.', 'A', 'easy'),
      q('Past tense of “go” is:', 'went', 'goed', 'gone only', 'going', 'A', 'easy'),
      q('Which word is a noun?', 'Happiness', 'Happy', 'Happily', 'Happen', 'A', 'easy'),
      q('Correct plural of “child” is:', 'children', 'childs', 'childes', 'childrens', 'A', 'easy'),
      q('Identify the adverb: “He ran quickly.”', 'quickly', 'He', 'ran', 'He ran', 'A', 'easy'),
      q('Which sentence uses the correct article?', 'An honest man', 'A honest man', 'An honesty man', 'The honest man is wrong here', 'A', 'medium'),
      q('Synonym of “begin”:', 'start', 'end', 'finish', 'close', 'A', 'easy'),
      q('Antonym of “ancient”:', 'modern', 'old', 'historic', 'aged', 'A', 'easy'),
      q('Correct possessive form:', "the students' books", 'the students books', 'the student’s books only always', 'the students book’s', 'A', 'medium'),
      q('Which is a compound sentence?', 'I studied, and I passed.', 'Running fast.', 'Because I was tired.', 'The red car.', 'A', 'medium'),
      q('“Their” vs “there”: pick correct — ___ going home.', "They're", 'Their', 'There', 'They', 'A', 'medium'),
      q('Passive voice of “She writes a letter.”', 'A letter is written by her.', 'She is written a letter.', 'A letter was write by her.', 'She wrote a letter by her.', 'A', 'hard'),
    ],
    Literature: [
      q('A story’s main character is often called the:', 'Protagonist', 'Antagonist only', 'Narrator always', 'Setting', 'A', 'easy'),
      q('A comparison without “like” or “as” is:', 'Metaphor', 'Simile', 'Alliteration', 'Hyperbole only', 'A', 'medium'),
      q('“The stars danced” is an example of:', 'Personification', 'Metaphor only', 'Irony', 'Oxymoron', 'A', 'medium'),
      q('The time and place of a story is the:', 'Setting', 'Theme', 'Plot climax', 'Conflict', 'A', 'easy'),
      q('A poem with 14 lines (traditional form) is often a:', 'Sonnet', 'Haiku', 'Limerick only', 'Epic', 'A', 'hard'),
      q('Theme in literature means:', 'Central idea or message', 'Main character name', 'Rhyme scheme', 'Chapter title', 'A', 'easy'),
      q('First-person narrator uses pronouns like:', 'I, we', 'He, she', 'They only', 'It exclusively for people', 'A', 'easy'),
      q('Drama is primarily written to be:', 'Performed on stage', 'Read silently only', 'Sung always', 'Painted', 'A', 'easy'),
      q('An exaggerated statement for effect is:', 'Hyperbole', 'Understatement', 'Foreshadowing', 'Flashback', 'A', 'medium'),
      q('Climax of a plot is:', 'Turning point of highest tension', 'Introduction', 'Resolution', 'Setting description', 'A', 'medium'),
      q('Shakespeare wrote primarily in:', 'English', 'Latin only', 'French', 'Greek only', 'A', 'easy'),
      q('A reference to another work or event is:', 'Allusion', 'Illusion', 'Allegory only always', 'Epilogue', 'A', 'hard'),
    ],
  },
  'Computer Science': {
    Programming: [
      q('Which data structure is LIFO?', 'Stack', 'Queue', 'Linked list only', 'Tree', 'A', 'easy'),
      q('Time complexity of binary search on sorted array is:', 'O(log n)', 'O(n)', 'O(n²)', 'O(1) always', 'A', 'medium'),
      q('In Python, which prints Hello?', 'print("Hello")', 'echo Hello', 'console.log("Hello")', 'printf Hello', 'A', 'easy'),
      q('A loop that runs while a condition is true is a:', 'while loop', 'goto only', 'switch', 'include', 'A', 'easy'),
      q('Which is NOT a programming paradigm?', 'Gravitational', 'Object-oriented', 'Functional', 'Procedural', 'A', 'medium'),
      q('Git command to clone a repository:', 'git clone <url>', 'git copy <url>', 'git pull only always', 'git init remote', 'A', 'easy'),
      q('HTML stands for:', 'HyperText Markup Language', 'HighText Machine Language', 'Home Tool Markup Language', 'Hyperlink Text Model', 'A', 'easy'),
      q('Which stores key-value pairs in JavaScript?', 'Object', 'Array only', 'String only', 'Number', 'A', 'easy'),
      q('Recursion needs a:', 'Base case', 'Global variable only', 'Infinite loop', 'Compiler bug', 'A', 'medium'),
      q('API means:', 'Application Programming Interface', 'Advanced Program Integration', 'Automated Protocol Internet', 'Application Process Input', 'A', 'easy'),
      q('Which sorting has average O(n log n)?', 'Merge sort', 'Bubble sort always best', 'Selection sort average n log n', 'None', 'A', 'hard'),
      q('Debugging means:', 'Finding and fixing errors', 'Writing documentation only', 'Deploying to cloud', 'Compiling faster', 'A', 'easy'),
    ],
    DBMS: [
      q('SQL stands for:', 'Structured Query Language', 'Simple Question Language', 'System Query List', 'Standard Quality Language', 'A', 'easy'),
      q('Primary key must be:', 'Unique and not null', 'Nullable', 'Always composite only', 'Same as foreign key', 'A', 'easy'),
      q('Which SQL clause filters rows?', 'WHERE', 'ORDER BY', 'GROUP BY only for filter', 'JOIN', 'A', 'easy'),
      q('MongoDB is a ___ database.', 'NoSQL / document', 'Relational only', 'Graph only', 'File system only', 'A', 'easy'),
      q('Normalization reduces:', 'Data redundancy', 'Security always', 'Network speed only', 'UI complexity', 'A', 'medium'),
      q('JOIN combines rows from:', 'Two or more tables', 'Only indexes', 'Only views', 'Logs only', 'A', 'medium'),
      q('ACID in transactions: C stands for:', 'Consistency', 'Concurrency only', 'Compression', 'Cluster', 'A', 'hard'),
      q('SELECT COUNT(*) returns:', 'Number of rows', 'Sum of values always', 'Average', 'Table name', 'A', 'easy'),
      q('Foreign key enforces:', 'Referential integrity', 'Encryption', 'Sorting', 'Indexing only', 'A', 'medium'),
      q('Index on a column helps:', 'Faster lookups', 'Slower writes always with no benefit', 'Delete tables', 'Change schema auto', 'A', 'medium'),
      q('DELETE removes:', 'Rows', 'Database always', 'Columns only without alter', 'Indexes only', 'A', 'easy'),
      q('In ER diagram, entity is shown as:', 'Rectangle', 'Diamond only', 'Ellipse only', 'Triangle only', 'A', 'medium'),
    ],
  },
};

const SUBJECTS_META = [
  { name: 'Mathematics', description: 'Algebra, geometry, and problem solving' },
  { name: 'Science', description: 'Physics and chemistry fundamentals' },
  { name: 'English', description: 'Grammar and literature skills' },
  { name: 'Computer Science', description: 'Programming and databases' },
];

function getTopicsForSubject(subjectName) {
  const bank = QUESTION_BANK[subjectName];
  if (!bank) return [];
  return Object.keys(bank);
}

module.exports = {
  QUESTION_BANK,
  SUBJECTS_META,
  getTopicsForSubject,
};
