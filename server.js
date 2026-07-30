const express = require('express');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
require('dotenv').config();

const { attachUser } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const forumRoutes = require('./routes/forum');
const adminRoutes = require('./routes/admin');
const seed = require('./db/seed');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensures a working admin account + default categories always exist, even
// on hosts with ephemeral storage (e.g. Render's free tier wipes the SQLite
// file on every restart/spin-down). Safe to run every time — it only
// inserts rows when the tables are empty.
seed();

// ---- View engine ----
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// ---- Middleware ----
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware (uses in-memory store — fine for a project/demo;
// swap in a persistent store like connect-redis for production use)
app.use(session({
  secret: process.env.SESSION_SECRET || 'cbsa-super-secret-key-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 } // 1 week
}));

app.use(attachUser);

// ---- Routes ----
app.use('/', authRoutes);
app.use('/', forumRoutes);
app.use('/admin', adminRoutes);

// ---- 404 ----
app.use((req, res) => {
  res.status(404).render('error', { title: 'Not found', message: 'Page not found.' });
});

app.listen(PORT, () => {
  console.log(`CBSA Forum running at http://localhost:${PORT}`);
});
