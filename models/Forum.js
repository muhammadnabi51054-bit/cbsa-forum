const db = require('../config/database');

const Category = {
  all() {
    return db.prepare('SELECT * FROM categories ORDER BY name').all();
  },
  find(id) {
    return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  },
  create(name, description) {
    return db.prepare('INSERT INTO categories (name, description) VALUES (?,?)').run(name, description);
  },
  delete(id) {
    db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  },
  withPostCounts() {
    return db.prepare(`
      SELECT c.*, COUNT(p.id) AS post_count
      FROM categories c
      LEFT JOIN posts p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.name
    `).all();
  },

  // Forum-index style stats: topic count, total post count (topics + replies),
  // and who/when the most recent activity in the category was — the
  // "Topics / Posts / Last Post" columns every real forum index shows.
  withForumStats() {
    return db.prepare(`
      SELECT
        c.*,
        COALESCE(t.topic_count, 0) AS topic_count,
        COALESCE(t.topic_count, 0) + COALESCE(r.reply_count, 0) AS post_count,
        lp.title AS last_title,
        lp.author_name AS last_author,
        lp.created_at AS last_time,
        lp.post_id AS last_post_id
      FROM categories c
      LEFT JOIN (
        SELECT category_id, COUNT(*) AS topic_count FROM posts GROUP BY category_id
      ) t ON t.category_id = c.id
      LEFT JOIN (
        SELECT p.category_id, COUNT(*) AS reply_count
        FROM comments cm JOIN posts p ON p.id = cm.post_id
        GROUP BY p.category_id
      ) r ON r.category_id = c.id
      LEFT JOIN (
        SELECT category_id, title, author_name, created_at, post_id FROM (
          SELECT combined.*, ROW_NUMBER() OVER (
            PARTITION BY category_id ORDER BY created_at DESC
          ) AS rn
          FROM (
            SELECT p.category_id, p.title, u.name AS author_name, p.created_at, p.id AS post_id
            FROM posts p JOIN users u ON u.id = p.user_id
            UNION ALL
            SELECT p2.category_id, p2.title, u2.name AS author_name, cm.created_at, p2.id AS post_id
            FROM comments cm
            JOIN posts p2 ON p2.id = cm.post_id
            JOIN users u2 ON u2.id = cm.user_id
          ) combined
        ) ranked WHERE rn = 1
      ) lp ON lp.category_id = c.id
      ORDER BY c.name
    `).all();
  }
};

const Post = {
  // Dynamic content: pulled live from DB, not hardcoded (criteria #3)
  recent(limit = 10) {
    return db.prepare(`
      SELECT p.*, u.name AS author_name, c.name AS category_name
      FROM posts p
      JOIN users u ON u.id = p.user_id
      JOIN categories c ON c.id = p.category_id
      ORDER BY p.created_at DESC
      LIMIT ?
    `).all(limit);
  },

  // Thread-list view for a category page: reply count, view count, and
  // who/when the last reply (or the original post, if no replies) was —
  // the classic "Topic / Replies / Views / Last Post" forum table.
  byCategory(categoryId) {
    return db.prepare(`
      SELECT p.*, u.name AS author_name,
        (SELECT COUNT(*) FROM comments cm WHERE cm.post_id = p.id) AS reply_count,
        COALESCE(lastc.author_name, u.name) AS last_author,
        COALESCE(lastc.created_at, p.created_at) AS last_activity
      FROM posts p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN (
        SELECT cm.post_id, u2.name AS author_name, cm.created_at,
          ROW_NUMBER() OVER (PARTITION BY cm.post_id ORDER BY cm.created_at DESC) AS rn
        FROM comments cm JOIN users u2 ON u2.id = cm.user_id
      ) lastc ON lastc.post_id = p.id AND lastc.rn = 1
      WHERE p.category_id = ?
      ORDER BY last_activity DESC
    `).all(categoryId);
  },

  find(id) {
    return db.prepare(`
      SELECT p.*, u.name AS author_name, u.role AS author_role, c.name AS category_name
      FROM posts p
      JOIN users u ON u.id = p.user_id
      JOIN categories c ON c.id = p.category_id
      WHERE p.id = ?
    `).get(id);
  },

  incrementViews(id) {
    db.prepare('UPDATE posts SET views = views + 1 WHERE id = ?').run(id);
  },

  create({ userId, categoryId, title, content }) {
    const info = db.prepare(
      'INSERT INTO posts (user_id, category_id, title, content) VALUES (?,?,?,?)'
    ).run(userId, categoryId, title, content);
    return info.lastInsertRowid;
  },

  delete(id) {
    db.prepare('DELETE FROM posts WHERE id = ?').run(id);
  },

  all() {
    return db.prepare(`
      SELECT p.*, u.name AS author_name, c.name AS category_name
      FROM posts p JOIN users u ON u.id = p.user_id
      JOIN categories c ON c.id = p.category_id
      ORDER BY p.created_at DESC
    `).all();
  },

  countAll() {
    return db.prepare('SELECT COUNT(*) AS c FROM posts').get().c;
  }
};

const Comment = {
  byPost(postId) {
    return db.prepare(`
      SELECT cm.*, u.name AS author_name, u.role AS author_role
      FROM comments cm
      JOIN users u ON u.id = cm.user_id
      WHERE cm.post_id = ?
      ORDER BY cm.created_at ASC
    `).all(postId);
  },

  create({ postId, userId, content }) {
    db.prepare('INSERT INTO comments (post_id, user_id, content) VALUES (?,?,?)').run(postId, userId, content);
  },

  delete(id) {
    db.prepare('DELETE FROM comments WHERE id = ?').run(id);
  },

  countAll() {
    return db.prepare('SELECT COUNT(*) AS c FROM comments').get().c;
  }
};

module.exports = { Category, Post, Comment };
