const bcrypt = require('bcryptjs');
const db = require('../config/database');

const SALT_ROUNDS = 10;

const User = {
  findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  },

  findById(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  },

  all() {
    return db.prepare('SELECT id, name, email, role, batch, created_at FROM users ORDER BY created_at DESC').all();
  },

  countAll() {
    return db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  },

  newest() {
    return db.prepare('SELECT name, created_at FROM users ORDER BY created_at DESC LIMIT 1').get();
  },

  // criteria #4: password encryption via bcrypt hashing (never store plain text)
  create({ name, email, password, batch }) {
    const hash = bcrypt.hashSync(password, SALT_ROUNDS);
    const info = db.prepare(
      `INSERT INTO users (name, email, password, role, batch) VALUES (?,?,?,?,?)`
    ).run(name, email, hash, 'user', batch || null);
    return info.lastInsertRowid;
  },

  verifyPassword(plain, hash) {
    return bcrypt.compareSync(plain, hash);
  },

  updateRole(id, role) {
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
  },

  delete(id) {
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
  }
};

module.exports = User;
