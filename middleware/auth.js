// Ensures request comes from a logged-in user (criteria #1: authentication)
function requireLogin(req, res, next) {
  if (!req.session.user) {
    req.flashError = 'Please log in to continue.';
    return res.redirect('/login');
  }
  next();
}

// Ensures request comes from an admin user (criteria #2: at least two user types)
function requireAdmin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  if (req.session.user.role !== 'admin') {
    return res.status(403).render('error', {
      title: 'Access denied',
      message: 'You must be an administrator to view this page.',
      user: req.session.user
    });
  }
  next();
}

const { initials, avatarColor, timeAgo } = require('../utils/format');

// Makes the logged-in user (if any) available in every view without repeating code
function attachUser(req, res, next) {
  res.locals.user = req.session.user || null;
  res.locals.initials = initials;
  res.locals.avatarColor = avatarColor;
  res.locals.timeAgo = timeAgo;
  next();
}

module.exports = { requireLogin, requireAdmin, attachUser };
