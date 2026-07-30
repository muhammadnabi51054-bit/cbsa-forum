const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const User = require('../models/User');
const { Category, Post } = require('../models/Forum');

router.use(requireAdmin); // every route below requires the 'admin' role (criteria #2)

router.get('/', (req, res) => {
  const stats = {
    userCount: User.all().length,
    postCount: Post.countAll(),
    categoryCount: Category.all().length
  };
  res.render('admin/dashboard', { title: 'Admin Dashboard', stats });
});

router.get('/users', (req, res) => {
  const users = User.all();
  res.render('admin/users', { title: 'Manage Users', users });
});

router.post('/users/:id/role', (req, res) => {
  const { role } = req.body;
  if (['admin', 'user'].includes(role)) {
    User.updateRole(req.params.id, role);
  }
  res.redirect('/admin/users');
});

router.post('/users/:id/delete', (req, res) => {
  if (parseInt(req.params.id, 10) === req.session.user.id) {
    return res.redirect('/admin/users'); // safety: an admin can't delete themselves here
  }
  User.delete(req.params.id);
  res.redirect('/admin/users');
});

router.get('/posts', (req, res) => {
  const posts = Post.all();
  res.render('admin/posts', { title: 'Manage Posts', posts });
});

router.post('/posts/:id/delete', (req, res) => {
  Post.delete(req.params.id);
  res.redirect('/admin/posts');
});

router.get('/categories', (req, res) => {
  const categories = Category.withPostCounts();
  res.render('admin/categories', { title: 'Manage Categories', categories, error: null });
});

router.post('/categories', (req, res) => {
  const { name, description } = req.body;
  if (name && name.trim()) {
    try {
      Category.create(name.trim(), description || '');
    } catch (e) {
      const categories = Category.withPostCounts();
      return res.render('admin/categories', { title: 'Manage Categories', categories, error: 'Category name must be unique.' });
    }
  }
  res.redirect('/admin/categories');
});

router.post('/categories/:id/delete', (req, res) => {
  Category.delete(req.params.id);
  res.redirect('/admin/categories');
});

module.exports = router;
