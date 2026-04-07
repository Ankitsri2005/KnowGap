const db = require('./db');
const bcrypt = require('bcryptjs');

async function autoSeed() {
  try {
    // ─── 1. Seed Users ─────────────────────────────────────────────────────
    const userResult = await db.pool.query("SELECT COUNT(*) as count FROM users");
    const userCount = parseInt(userResult.rows[0].count);

    let teacherId;

    if (userCount === 0) {
      console.log('🌱 Seeding initial users...');
      const teacherPass = await bcrypt.hash('teacher123', 10);
      const studentPass = await bcrypt.hash('student123', 10);

      const teacherRow = await db.pool.query(
        "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING RETURNING id",
        ['Dr. Sharma', 'teacher@knowgap.com', teacherPass, 'teacher']
      );
      await db.pool.query(
        "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING",
        ['Rahul Kumar', 'student@knowgap.com', studentPass, 'student']
      );
      await db.pool.query(
        "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING",
        ['Priya Singh', 'priya@knowgap.com', studentPass, 'student']
      );

      teacherId = teacherRow.rows[0]?.id;
      console.log('✅ Users seeded!');
    } else {
      console.log('✅ Users already exist — skipping user seed.');
      const t = await db.pool.query("SELECT id FROM users WHERE role='teacher' LIMIT 1");
      teacherId = t.rows[0]?.id;
    }

    // ─── 2. Seed Subjects ──────────────────────────────────────────────────
    const subjResult = await db.pool.query("SELECT COUNT(*) as count FROM subjects");
    if (parseInt(subjResult.rows[0].count) > 0) {
      console.log('✅ Subjects already exist — skipping subject seed.');
      return;
    }

    console.log('🌱 Seeding subjects, topics, and questions...');

    const subjects = [
      {
        name: 'Mathematics',
        description: 'Algebra, Geometry, Trigonometry and more',
        topics: [
          {
            name: 'Algebra',
            questions: [
              { q: 'What is the value of x in 2x + 4 = 10?', a: '1', b: '2', c: '3', d: '4', ans: 'C', diff: 'easy' },
              { q: 'Simplify: 3(x + 2) - 2x', a: 'x + 6', b: 'x + 2', c: '5x + 6', d: 'x - 6', ans: 'A', diff: 'easy' },
              { q: 'If y = 2x² - 3x + 1, what is y when x = 2?', a: '2', b: '3', c: '5', d: '7', ans: 'B', diff: 'medium' },
              { q: 'Solve: x² - 5x + 6 = 0', a: 'x=1,2', b: 'x=2,3', c: 'x=3,4', d: 'x=1,6', ans: 'B', diff: 'medium' },
              { q: 'What is the slope of the line y = 3x - 7?', a: '-7', b: '7', c: '3', d: '-3', ans: 'C', diff: 'easy' },
            ]
          },
          {
            name: 'Geometry',
            questions: [
              { q: 'What is the sum of interior angles of a triangle?', a: '90°', b: '180°', c: '270°', d: '360°', ans: 'B', diff: 'easy' },
              { q: 'The area of a circle with radius 7 cm is?', a: '22 cm²', b: '44 cm²', c: '154 cm²', d: '308 cm²', ans: 'C', diff: 'easy' },
              { q: 'In a right-angled triangle, if one angle is 30°, the other acute angle is?', a: '30°', b: '45°', c: '60°', d: '90°', ans: 'C', diff: 'easy' },
              { q: 'The perimeter of a rectangle with length 8 and width 5 is?', a: '13', b: '26', c: '40', d: '80', ans: 'B', diff: 'easy' },
              { q: 'What is the volume of a cube with side 4 cm?', a: '16 cm³', b: '32 cm³', c: '48 cm³', d: '64 cm³', ans: 'D', diff: 'medium' },
            ]
          }
        ]
      },
      {
        name: 'Physics',
        description: 'Mechanics, Optics, Electricity and Thermodynamics',
        topics: [
          {
            name: 'Mechanics',
            questions: [
              { q: 'What is Newton\'s Second Law of Motion?', a: 'F = mv', b: 'F = ma', c: 'F = m/a', d: 'F = v/t', ans: 'B', diff: 'easy' },
              { q: 'The SI unit of force is?', a: 'Joule', b: 'Watt', c: 'Newton', d: 'Pascal', ans: 'C', diff: 'easy' },
              { q: 'A body at rest will remain at rest unless acted upon by an external force. This is?', a: 'Newton\'s 1st Law', b: 'Newton\'s 2nd Law', c: 'Newton\'s 3rd Law', d: 'Law of Gravitation', ans: 'A', diff: 'easy' },
              { q: 'The acceleration due to gravity on Earth is approximately?', a: '9.8 m/s²', b: '8.9 m/s²', c: '10.8 m/s²', d: '11.2 m/s²', ans: 'A', diff: 'easy' },
              { q: 'A car travels 100 km in 2 hours. Its average speed is?', a: '200 km/h', b: '50 km/h', c: '100 km/h', d: '75 km/h', ans: 'B', diff: 'easy' },
            ]
          },
          {
            name: 'Electricity',
            questions: [
              { q: 'Ohm\'s Law states that V =?', a: 'I/R', b: 'IR', c: 'I+R', d: 'I²R', ans: 'B', diff: 'easy' },
              { q: 'The SI unit of electric current is?', a: 'Volt', b: 'Ohm', c: 'Watt', d: 'Ampere', ans: 'D', diff: 'easy' },
              { q: 'In a parallel circuit, the voltage across each component is?', a: 'Different', b: 'Zero', c: 'The same', d: 'Divided equally', ans: 'C', diff: 'medium' },
              { q: 'Power in an electrical circuit is given by?', a: 'P = V/I', b: 'P = VI', c: 'P = V+I', d: 'P = V-I', ans: 'B', diff: 'easy' },
              { q: 'What does a resistor do in a circuit?', a: 'Amplifies current', b: 'Stores charge', c: 'Opposes current flow', d: 'Converts AC to DC', ans: 'C', diff: 'easy' },
            ]
          }
        ]
      },
      {
        name: 'Chemistry',
        description: 'Organic, Inorganic, and Physical Chemistry',
        topics: [
          {
            name: 'Periodic Table',
            questions: [
              { q: 'What is the atomic number of Carbon?', a: '4', b: '6', c: '8', d: '12', ans: 'B', diff: 'easy' },
              { q: 'Which element has the symbol "Na"?', a: 'Nitrogen', b: 'Neon', c: 'Sodium', d: 'Nickel', ans: 'C', diff: 'easy' },
              { q: 'The most electronegative element is?', a: 'Oxygen', b: 'Chlorine', c: 'Fluorine', d: 'Nitrogen', ans: 'C', diff: 'medium' },
              { q: 'How many elements are in Period 2 of the periodic table?', a: '2', b: '8', c: '18', d: '32', ans: 'B', diff: 'medium' },
              { q: 'Which gas makes up the highest percentage of Earth\'s atmosphere?', a: 'Oxygen', b: 'Carbon Dioxide', c: 'Argon', d: 'Nitrogen', ans: 'D', diff: 'easy' },
            ]
          },
          {
            name: 'Chemical Reactions',
            questions: [
              { q: 'What type of reaction is: A + B → AB?', a: 'Decomposition', b: 'Displacement', c: 'Combination', d: 'Combustion', ans: 'C', diff: 'easy' },
              { q: 'The product of photosynthesis is?', a: 'CO₂ and Water', b: 'Glucose and Oxygen', c: 'Glucose and CO₂', d: 'Oxygen and Water', ans: 'B', diff: 'easy' },
              { q: 'Rusting of iron is an example of?', a: 'Reduction', b: 'Oxidation', c: 'Neutralization', d: 'Decomposition', ans: 'B', diff: 'easy' },
              { q: 'Acids turn blue litmus paper?', a: 'Green', b: 'Purple', c: 'Red', d: 'Yellow', ans: 'C', diff: 'easy' },
              { q: 'The pH of pure water is?', a: '5', b: '6', c: '7', d: '8', ans: 'C', diff: 'easy' },
            ]
          }
        ]
      },
      {
        name: 'Computer Science',
        description: 'Programming, Data Structures, and Algorithms',
        topics: [
          {
            name: 'Programming Basics',
            questions: [
              { q: 'Which of the following is NOT a programming language?', a: 'Python', b: 'Java', c: 'HTML', d: 'C++', ans: 'C', diff: 'easy' },
              { q: 'What does "CPU" stand for?', a: 'Central Processing Unit', b: 'Core Processing Unit', c: 'Computer Processing Unit', d: 'Central Program Utility', ans: 'A', diff: 'easy' },
              { q: 'A loop that never ends is called?', a: 'Dead loop', b: 'Infinite loop', c: 'Endless loop', d: 'Forever loop', ans: 'B', diff: 'easy' },
              { q: 'Which data type stores True/False values?', a: 'Integer', b: 'String', c: 'Float', d: 'Boolean', ans: 'D', diff: 'easy' },
              { q: 'What is the time complexity of binary search?', a: 'O(n)', b: 'O(n²)', c: 'O(log n)', d: 'O(1)', ans: 'C', diff: 'medium' },
            ]
          },
          {
            name: 'Data Structures',
            questions: [
              { q: 'Which data structure uses LIFO order?', a: 'Queue', b: 'Stack', c: 'Array', d: 'Tree', ans: 'B', diff: 'easy' },
              { q: 'In a queue, elements are added at the?', a: 'Front', b: 'Middle', c: 'Rear', d: 'Random position', ans: 'C', diff: 'easy' },
              { q: 'A binary tree can have at most how many children per node?', a: '1', b: '2', c: '3', d: 'Unlimited', ans: 'B', diff: 'easy' },
              { q: 'Which sorting algorithm has O(n log n) average case?', a: 'Bubble Sort', b: 'Merge Sort', c: 'Selection Sort', d: 'Insertion Sort', ans: 'B', diff: 'medium' },
              { q: 'What does "RAM" stand for?', a: 'Random Access Memory', b: 'Read Access Memory', c: 'Rapid Access Module', d: 'Read And Modify', ans: 'A', diff: 'easy' },
            ]
          }
        ]
      },
      {
        name: 'Aptitude',
        description: 'Logical Reasoning, Quantitative Aptitude, and Verbal Ability',
        topics: [
          {
            name: 'Quantitative',
            questions: [
              { q: 'If a train travels 60 km in 1 hour, how far does it travel in 2.5 hours?', a: '120 km', b: '130 km', c: '150 km', d: '180 km', ans: 'C', diff: 'easy' },
              { q: 'What is 15% of 200?', a: '25', b: '30', c: '35', d: '20', ans: 'B', diff: 'easy' },
              { q: 'A shopkeeper sells an item at 20% profit. If the cost is ₹500, the selling price is?', a: '₹550', b: '₹580', c: '₹600', d: '₹620', ans: 'C', diff: 'easy' },
              { q: 'The average of 5, 10, 15, 20 and 25 is?', a: '10', b: '12', c: '15', d: '18', ans: 'C', diff: 'easy' },
              { q: 'If 4 workers complete a job in 6 days, how many days will 6 workers take?', a: '2', b: '3', c: '4', d: '5', ans: 'C', diff: 'medium' },
            ]
          },
          {
            name: 'Logical Reasoning',
            questions: [
              { q: 'Complete the series: 2, 4, 8, 16, ___', a: '24', b: '32', c: '30', d: '28', ans: 'B', diff: 'easy' },
              { q: 'If all cats are animals, and all animals have hearts, then?', a: 'All cats have hearts', b: 'No cats have hearts', c: 'Some cats have hearts', d: 'Cannot be determined', ans: 'A', diff: 'easy' },
              { q: 'A is taller than B. B is taller than C. Who is the shortest?', a: 'A', b: 'B', c: 'C', d: 'Cannot determine', ans: 'C', diff: 'easy' },
              { q: 'Find the odd one out: Apple, Mango, Banana, Carrot', a: 'Apple', b: 'Mango', c: 'Carrot', d: 'Banana', ans: 'C', diff: 'easy' },
              { q: 'What comes next: MON, TUE, WED, ___', a: 'SUN', b: 'FRI', c: 'THU', d: 'SAT', ans: 'C', diff: 'easy' },
            ]
          }
        ]
      }
    ];

    for (const subject of subjects) {
      // Insert subject
      const sRes = await db.pool.query(
        "INSERT INTO subjects (name, description, created_by) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING RETURNING id",
        [subject.name, subject.description, teacherId]
      );
      const subjectId = sRes.rows[0]?.id;
      if (!subjectId) continue; // already existed

      for (const topic of subject.topics) {
        // Insert topic
        const tRes = await db.pool.query(
          "INSERT INTO topics (name, subject_id) VALUES ($1, $2) RETURNING id",
          [topic.name, subjectId]
        );
        const topicId = tRes.rows[0]?.id;

        for (const q of topic.questions) {
          await db.pool.query(
            `INSERT INTO questions (question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, topic_id, subject_id, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [q.q, q.a, q.b, q.c, q.d, q.ans, q.diff, topicId, subjectId, teacherId]
          );
        }
      }

      console.log(`  ✅ Seeded subject: ${subject.name}`);
    }

    console.log('🎉 All subjects, topics, and questions seeded successfully!');
  } catch (err) {
    console.error('Seed error:', err.message);
  }
}

// Execute autoSeed if run directly via `node seed.js`
if (require.main === module) {
  autoSeed();
}

module.exports = autoSeed;