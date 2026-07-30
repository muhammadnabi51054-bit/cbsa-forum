const express = require('express');
const router = express.Router();
const { requireLogin } = require('../middleware/auth');
const { Category, Post, Comment } = require('../models/Forum');
const User = require('../models/User');

// Home page — dynamic: pulls live categories + recent posts from DB (criteria #3)
router.get('/', (req, res) => {
  const categories = Category.withForumStats();
  const recentPosts = Post.recent(6);
  const forumStats = {
    memberCount: User.countAll(),
    topicCount: Post.countAll(),
    postCount: Post.countAll() + Comment.countAll(),
    newestMember: User.newest()
  };
  res.render('home', { title: 'Cox\'s Bazar Student Association', categories, recentPosts, forumStats });
});

router.get('/dashboard', requireLogin, (req, res) => {
  const categories = Category.all();
  const recentPosts = Post.recent(5);
  res.render('dashboard', { title: 'Dashboard', categories, recentPosts });
});

router.get('/category/:id', (req, res) => {
  const category = Category.find(req.params.id);
  if (!category) return res.status(404).render('error', { title: 'Not found', message: 'Category not found.' });
  const posts = Post.byCategory(req.params.id);
  res.render('category', { title: category.name, category, posts });
});

router.get('/post/new', requireLogin, (req, res) => {
  const categories = Category.all();
  res.render('new-post', { title: 'New Post', categories, error: null, old: {} });
});

router.post('/post/new', requireLogin, (req, res) => {
  const { title, content, category_id } = req.body;
  if (!title || !content || !category_id) {
    const categories = Category.all();
    return res.render('new-post', { title: 'New Post', categories, error: 'All fields are required.', old: req.body });
  }
  const postId = Post.create({ userId: req.session.user.id, categoryId: category_id, title, content });
  res.redirect(`/post/${postId}`);
});

router.get('/post/:id', (req, res) => {
  const post = Post.find(req.params.id);
  if (!post) return res.status(404).render('error', { title: 'Not found', message: 'Post not found.' });
  Post.incrementViews(req.params.id);
  const comments = Comment.byPost(req.params.id);
  res.render('post', { title: post.title, post, comments });
});

router.post('/post/:id/comment', requireLogin, (req, res) => {
  const { content } = req.body;
  if (content && content.trim().length > 0) {
    Comment.create({ postId: req.params.id, userId: req.session.user.id, content: content.trim() });
  }
  res.redirect(`/post/${req.params.id}`);
});

router.post('/post/:id/delete', requireLogin, (req, res) => {
  const post = Post.find(req.params.id);
  if (!post) return res.status(404).render('error', { title: 'Not found', message: 'Post not found.' });
  // Only the author or an admin may delete
  if (post.user_id !== req.session.user.id && req.session.user.role !== 'admin') {
    return res.status(403).render('error', { title: 'Forbidden', message: 'You cannot delete this post.' });
  }
  Post.delete(req.params.id);
  res.redirect('/dashboard');
});

router.get('/profile', requireLogin, (req, res) => {
  const user = User.findById(req.session.user.id);
  res.render('profile', { title: 'My Profile', profile: user });
});

module.exports = router;
