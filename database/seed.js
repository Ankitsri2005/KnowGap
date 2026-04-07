const db = require('./db'); // Ensure this points to your db.js file
const bcrypt = require('bcryptjs');

async function autoSeed() {
  // Wait for the 'users' table to be created first
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
    if (err) {
      console.error('Check seed error:', err.message);
      return;
    }
    
    if (!row) {
      console.log('⏳ Tables not ready yet. Retrying seed in 1 second...');
      setTimeout(autoSeed, 1000);
      return;
    }

    db.get("SELECT COUNT(*) as count FROM users", async (err, row) => {
      if (err) {
        console.error('Check seed error:', err.message);
        return;
      }

      if (row && row.count === 0) {
        console.log('🌱 Database is empty. Seeding initial users...');

        const teacherPass = await bcrypt.hash('teacher123', 10);
        const studentPass = await bcrypt.hash('student123', 10);

        db.serialize(() => {
          const stmt = db.prepare("INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
          
          stmt.run('Dr. Sharma', 'teacher@knowgap.com', teacherPass, 'teacher');
          stmt.run('Rahul Kumar', 'student@knowgap.com', studentPass, 'student');
          stmt.run('Priya Singh', 'priya@knowgap.com', studentPass, 'student');
          
          stmt.finalize();
        });

        console.log('✅ Users seeded successfully!');
      } else {
        console.log('✅ Database already has data — skipping auto-seed.');
      }
    });
  });
}

// Execute autoSeed if run directly via `node seed.js`
if (require.main === module) {
  autoSeed();
}

module.exports = autoSeed;