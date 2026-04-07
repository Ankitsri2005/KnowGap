const db = require('./db');
const bcrypt = require('bcryptjs');


function generateTopicQuestions(topicName) {
  const genericQs = [];
  const baseQuestions = [
    { prefix: "What is the primary concept behind", diff: "easy" },
    { prefix: "How do you calculate variables in", diff: "medium" },
    { prefix: "Which of the following best describes", diff: "easy" },
    { prefix: "Identify the false statement regarding", diff: "medium" },
    { prefix: "Solve a complex scenario involving", diff: "hard" },
    { prefix: "What is the standard unit or measure in", diff: "easy" },
    { prefix: "What is the advanced application of", diff: "hard" },
    { prefix: "Who is credited with discovering", diff: "medium" },
    { prefix: "Explain the edge-case behavior of", diff: "hard" },
    { prefix: "Which formula is strictly used for", diff: "medium" }
  ];

  for (let i = 0; i < 10; i++) {
    const letters = ['A', 'B', 'C', 'D'];
    const correctAns = letters[i % 4];
    genericQs.push({
      q: `${baseQuestions[i].prefix} ${topicName}?`,
      a: i % 4 === 0 ? `Correct answer for Q${i + 1}` : `Distractor A for Q${i + 1}`,
      b: i % 4 === 1 ? `Correct answer for Q${i + 1}` : `Distractor B for Q${i + 1}`,
      c: i % 4 === 2 ? `Correct answer for Q${i + 1}` : `Distractor C for Q${i + 1}`,
      d: i % 4 === 3 ? `Correct answer for Q${i + 1}` : `Distractor D for Q${i + 1}`,
      ans: correctAns,
      diff: baseQuestions[i].diff
    });
  }
  return genericQs;
}

async function seed() {
  console.log('🌱 Trashing old data and seeding database...');
  await new Promise(r => setTimeout(r, 1000)); 

  // Clear existing to avoid duplicates on multi-seed runs
  db.serialize(() => {
    db.run("DELETE FROM test_answers");
    db.run("DELETE FROM test_sessions");
    db.run("DELETE FROM gap_analysis");
    db.run("DELETE FROM questions");
    db.run("DELETE FROM topics");
    db.run("DELETE FROM subjects");
    db.run("DELETE FROM users");
  });

  await new Promise(r => setTimeout(r, 1000));

  const teacherPass = await bcrypt.hash('teacher123', 10);
  const studentPass = await bcrypt.hash('student123', 10);

  // Create users
  db.run(`INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)`, ['Dr. Sharma', 'teacher@knowgap.com', teacherPass, 'teacher']);
  db.run(`INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)`, ['Rahul Kumar', 'student@knowgap.com', studentPass, 'student']);
  db.run(`INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)`, ['Priya Singh', 'priya@knowgap.com', studentPass, 'student']);

  await new Promise(r => setTimeout(r, 500));

  // Base Curriculum Definitions
  const curriculum = [
    {
      name: 'Mathematics', desc: 'Core mathematics concepts including algebra and calculus',
      topics: ['Algebra', 'Geometry', 'Calculus', 'Statistics', 'Trigonometry']
    },
    {
      name: 'Physics', desc: 'Fundamental physics principles and mechanics',
      topics: ['Mechanics', 'Electricity', 'Optics', 'Thermodynamics']
    },
    {
      name: 'Computer Science', desc: 'Programming, data structures, and algorithms',
      topics: ['Data Structures', 'Algorithms', 'Programming Basics', 'Databases', 'Networking']
    },
    {
      name: 'Chemistry', desc: 'Chemical concepts, molecular structures, and reactions',
      topics: ['Reactions', 'Periodic Table', 'Organic Chemistry', 'Inorganic Chemistry']
    },
    {
      name: 'Aptitude', desc: 'Quantitative reasoning, logic, and general problem-solving abilities',
      topics: ['Logical Reasoning', 'Quantitative Aptitude', 'Data Interpretation']
    }
  ];

  // Specific high-quality questions for a few core subjects so it looks real
  const hardcodedQuestions = {
    'Algebra': [
      { q: 'If x + 5 = 12, what is x?', a: '5', b: '6', c: '7', d: '8', ans: 'C', diff: 'easy' },
      { q: 'Solve: 2x - 3 = 11', a: '5', b: '6', c: '7', d: '8', ans: 'C', diff: 'easy' },
      { q: 'Factor: x² - 9', a: '(x+3)(x-3)', b: '(x-3)²', c: '(x+9)(x-1)', d: '(x+3)²', ans: 'A', diff: 'medium' },
      { q: 'If f(x) = 2x + 1, find f(3)', a: '5', b: '6', c: '7', d: '8', ans: 'C', diff: 'easy' },
      { q: 'Which is a linear equation?', a: 'y = x²', b: 'y = 2x + 3', c: 'y = 1/x', d: 'y = √x', ans: 'B', diff: 'easy' },
      { q: 'Solve: x² - 5x + 6 = 0', a: 'x=1,6', b: 'x=2,3', c: 'x=-2,3', d: 'x=2,-3', ans: 'B', diff: 'medium' },
      { q: 'Find x: 3(x + 2) = 21', a: '4', b: '5', c: '6', d: '7', ans: 'B', diff: 'medium' },
      { q: 'What is the y-intercept of y = 4x - 7?', a: '4', b: '-7', c: '7', d: '0', ans: 'B', diff: 'easy' },
      { q: 'Expand (a+b)²', a: 'a²+b²', b: 'a²+2ab+b²', c: 'a²-2ab+b²', d: 'a²+ab+b²', ans: 'B', diff: 'medium' },
      { q: 'Solve a system: x+y=5, x-y=1', a: 'x=3,y=2', b: 'x=2,y=3', c: 'x=4,y=1', d: 'x=1,y=4', ans: 'A', diff: 'hard' }
    ],
    'Data Structures': [
      { q: 'What structure uses LIFO?', a: 'Queue', b: 'Stack', c: 'Tree', d: 'Graph', ans: 'B', diff: 'easy' },
      { q: 'A binary tree node has at most how many children?', a: '1', b: '2', c: '3', d: '4', ans: 'B', diff: 'easy' },
      { q: 'Time complexity to access array element by index?', a: 'O(n)', b: 'O(log n)', c: 'O(1)', d: 'O(n²)', ans: 'C', diff: 'medium' },
      { q: 'What structure uses FIFO?', a: 'Stack', b: 'Queue', c: 'Tree', d: 'Graph', ans: 'B', diff: 'easy' },
      { q: 'Advantage of Linked Lists over Arrays?', a: 'Fixed size', b: 'Dynamic memory allocation', c: 'Faster random access', d: 'Uses less memory', ans: 'B', diff: 'medium' },
      { q: 'What data structure is used to implement a graph search BFS?', a: 'Stack', b: 'Queue', c: 'Heap', d: 'Hash Table', ans: 'B', diff: 'hard' },
      { q: 'Which data structure allows O(1) average lookup time?', a: 'Array', b: 'Linked List', c: 'Hash Table', d: 'Binary Search Tree', ans: 'C', diff: 'medium' },
      { q: 'A graph with no cycles is called a?', a: 'Tree', b: 'Network', c: 'Complete Graph', d: 'Bipartite Graph', ans: 'A', diff: 'easy' },
      { q: 'Which is non-linear?', a: 'Array', b: 'Linked List', c: 'Queue', d: 'Tree', ans: 'D', diff: 'easy' },
      { q: 'In a Min-Heap, the root node is always?', a: 'The maximum element', b: 'The minimum element', c: 'The average', d: 'The median', ans: 'B', diff: 'hard' }
    ],
    'Logical Reasoning': [
      { q: 'If all bloops are razzies and all razzies are lazzies, all bloops are definitely lazzies?', a: 'True', b: 'False', c: 'Cannot be determined', d: 'None of these', ans: 'A', diff: 'easy' },
      { q: 'Look at this series: 2, 6, 18, 54, ... What number should come next?', a: '108', b: '148', c: '162', d: '216', ans: 'C', diff: 'medium' },
      { q: 'Which word does NOT belong with the others?', a: 'Leopard', b: 'Cougar', c: 'Elephant', d: 'Lion', ans: 'C', diff: 'easy' },
      { q: 'CUP is to LIP as BIRD is to?', a: 'BUSH', b: 'GRASS', c: 'FOREST', d: 'BEAK', ans: 'D', diff: 'medium' },
      { q: 'If 3 cats can catch 3 bunnies in 3 minutes, how long will it take 100 cats to catch 100 bunnies?', a: '100 minutes', b: '3 minutes', c: '300 minutes', d: '1 minute', ans: 'B', diff: 'hard' },
      { q: 'Odometer is to mileage as compass is to:', a: 'Speed', b: 'Hiking', c: 'Needle', d: 'Direction', ans: 'D', diff: 'easy' },
      { q: 'If A is the brother of B; B is the sister of C; and C is the father of D, how is D related to A?', a: 'Brother', b: 'Nephew or Niece', c: 'Cousin', d: 'Uncle', ans: 'B', diff: 'hard' },
      { q: 'Find the odd one out: 3, 5, 11, 14, 17, 21', a: '14', b: '21', c: '5', d: '11', ans: 'A', diff: 'medium' },
      { q: 'Which number completes the pattern? 8, 27, 64, 125, ?', a: '216', b: '225', c: '256', d: '343', ans: 'A', diff: 'medium' },
      { q: 'SCD, TEF, UGH, ___, WKL', a: 'CMN', b: 'UJI', c: 'VIJ', d: 'IJT', ans: 'C', diff: 'hard' }
    ]
  };

  db.serialize(() => {
    // 1. Fetch teacher ID
    db.get("SELECT id FROM users WHERE email='teacher@knowgap.com'", (err, teacher) => {
      if (!teacher) return console.error("Teacher not found!");
      const tId = teacher.id;

      // 2. Iterate Subjects
      curriculum.forEach(subject => {
        db.run(`INSERT INTO subjects (name, description, created_by) VALUES (?,?,?)`, [subject.name, subject.desc, tId], function () {
          const sId = this.lastID;

          // 3. Iterate Topics
          subject.topics.forEach(topicName => {
            db.run(`INSERT INTO topics (name, subject_id) VALUES (?,?)`, [topicName, sId], function () {
              const tid = this.lastID;

              // 4. Generate & Insert 10 Questions
              // Use hardcoded if available, else fallback to 10 generic generated ones
              let questions = hardcodedQuestions[topicName];
              if (!questions || questions.length < 10) {
                questions = generateTopicQuestions(topicName);
              }

              questions.slice(0, 10).forEach(q => {
                db.run(`INSERT INTO questions (question_text,option_a,option_b,option_c,option_d,correct_answer,difficulty,topic_id,subject_id,created_by)
                  VALUES (?,?,?,?,?,?,?,?,?,?)`,
                  [q.q, q.a, q.b, q.c, q.d, q.ans, q.diff, tid, sId, tId]);
              });
            });
          });
        });
      });
    });
  });

  setTimeout(() => {
    console.log('✅ Seed complete! Every topic has exactly 10 questions inserted.');
    console.log('👨‍🏫 Teacher: teacher@knowgap.com / teacher123');
    console.log('👨‍🎓 Student: student@knowgap.com / student123');
    db.close();
    process.exit(0);
  }, 3000);
}

seed().catch(console.error);
