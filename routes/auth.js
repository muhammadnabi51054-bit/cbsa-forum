const express = require('express');
const router = express.Router();
const User = require('../models/User');

// ---- Registration (criteria #1) ----
router.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('register', { title: 'Register', error: null, old: {} });
});

router.post('/register', (req, res) => {
  const { name, email, password, confirm_password, batch } = req.body;

  if (!name || !email || !password || !confirm_password) {
    return res.render('register', { title: 'Register', error: 'All required fields must be filled.', old: req.body });
  }
  if (password.length < 6) {
    return res.render('register', { title: 'Register', error: 'Password must be at least 6 characters.', old: req.body });
  }
  if (password !== confirm_password) {
    return res.render('register', { title: 'Register', error: 'Passwords do not match.', old: req.body });
  }
  if (User.findByEmail(email)) {
    return res.render('register', { title: 'Register', error: 'An account with this email already exists.', old: req.body });
  }

  const userId = User.create({ name, email, password, batch }); // password gets bcrypt-hashed inside model
  const user = User.findById(userId);
  req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  res.redirect('/dashboard');
});

// ---- Login (criteria #1) ----
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('login', { title: 'Login', error: null, old: {} });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = User.findByEmail(email);

  if (!user || !User.verifyPassword(password, user.password)) {
    return res.render('login', { title: 'Login', error: 'Invalid email or password.', old: req.body });
  }

  req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  res.redirect(user.role === 'admin' ? '/admin' : '/dashboard');
});

// ---- Logout ----
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;
