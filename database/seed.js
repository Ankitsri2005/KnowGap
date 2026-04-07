const db = require('./db');
const bcrypt = require('bcryptjs');

async function autoSeed() {
  try {
    // Check if users table has data
    const result = await db.pool.query("SELECT COUNT(*) as count FROM users");
    const count = parseInt(result.rows[0].count);

    if (count === 0) {
      console.log('🌱 Database is empty. Seeding initial users...');

      const teacherPass = await bcrypt.hash('teacher123', 10);
      const studentPass = await bcrypt.hash('student123', 10);

      await db.pool.query(
        "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING",
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

      console.log('✅ Users seeded successfully!');
    } else {
      console.log('✅ Database already has data — skipping auto-seed.');
    }
  } catch (err) {
    console.error('Seed error:', err.message);
  }
}

// Execute autoSeed if run directly via `node seed.js`
if (require.main === module) {
  autoSeed();
}

module.exports = autoSeed;