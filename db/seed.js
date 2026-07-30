const bcrypt = require('bcryptjs');
const db = require('../config/database');

function seed() {
  const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;

  if (userCount === 0) {
    const hash = bcrypt.hashSync('Admin@123', 10);
    db.prepare(
      `INSERT INTO users (name, email, password, role, batch, bio) VALUES (?,?,?,?,?,?)`
    ).run('Association Admin', 'admin@cbsa.com', hash, 'admin', 'N/A', 'Forum administrator');

    const demoHash = bcrypt.hashSync('User@123', 10);
    db.prepare(
      `INSERT INTO users (name, email, password, role, batch, bio) VALUES (?,?,?,?,?,?)`
    ).run('Rafiul Islam', 'rafiul@example.com', demoHash, 'user', '2022', 'CSE student, Cox\'s Bazar');

    console.log('Created default admin  -> email: admin@cbsa.com   password: Admin@123');
    console.log('Created demo user      -> email: rafiul@example.com password: User@123');
  } else {
    console.log('Users already exist, skipping user seed.');
  }

  const catCount = db.prepare('SELECT COUNT(*) AS c FROM categories').get().c;
  if (catCount === 0) {
    const cats = [
      ['General Discussion', 'Talk about anything related to CBSA members'],
      ['Admission & Study Help', 'Ask questions about admission, courses, and study tips'],
      ['Events & Reunions', 'Announcements for Cox\'s Bazar Student Association events'],
      ['Job & Internship', 'Share job/internship opportunities with fellow members'],
      ['Scholarship & Funding', 'Scholarship info for CBSA students']
    ];
    const insert = db.prepare('INSERT INTO categories (name, description) VALUES (?,?)');
    cats.forEach(c => insert.run(c[0], c[1]));
    console.log('Seeded default categories.');
  } else {
    console.log('Categories already exist, skipping category seed.');
  }
}

// Runnable directly (`npm run seed`) AND importable (server.js calls this on
// every startup so a Render free-tier restart — which wipes the ephemeral
// SQLite file — always comes back with a working admin login).
if (require.main === module) {
  seed();
}

module.exports = seed;
