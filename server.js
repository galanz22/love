const express = require('express');
const Database = require('better-sqlite3');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sanitizeHtml = require('sanitize-html');
const path = require('path');

const app = express();
const db = new Database('app.db');
const SECRET = 'change-this-secret'; // 生产环境放环境变量

// 建表
db.exec(`
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS posts(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id)
);
`);

app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));       // 前端页面
app.use('/uploads', express.static('uploads')); // 图片访问

// ---------- 鉴权中间件 ----------
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    req.user = jwt.verify(token, SECRET); // { id, username }
    next();
  } catch {
    res.status(401).json({ msg: '请先登录' });
  }
}

// ---------- 注册 ----------
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ msg: '账号密码不能为空' });
  const hash = bcrypt.hashSync(password, 10);
  try {
    db.prepare('INSERT INTO users(username, password_hash) VALUES(?,?)').run(username, hash);
    res.json({ msg: '注册成功' });
  } catch {
    res.status(400).json({ msg: '用户名已存在' });
  }
});

// ---------- 登录 ----------
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username=?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(400).json({ msg: '账号或密码错误' });
  }
  const token = jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: '7d' });
  res.json({ token, username: user.username });
});

// ---------- 图片上传 ----------
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['image/png', 'image/jpeg', 'image/gif'].includes(file.mimetype);
    cb(ok ? null : new Error('仅支持图片'), ok);
  }
});
app.post('/api/upload', auth, upload.single('image'), (req, res) => {
  res.json({ url: `/uploads/${req.file.filename}` });
});

// ---------- 发布文章 ----------
app.post('/api/posts', auth, (req, res) => {
  const raw = req.body.content || '';
  // 清洗 HTML：只允许安全标签，杜绝 XSS
  const clean = sanitizeHtml(raw, {
    allowedTags: ['p', 'br', 'b', 'strong', 'i', 'em', 'u', 'img', 'div', 'span', 'h1', 'h2', 'h3', 'ul', 'ol', 'li'],
    allowedAttributes: { img: ['src', 'alt'] }
  });
  if (!clean.trim()) return res.status(400).json({ msg: '内容不能为空' });
  db.prepare('INSERT INTO posts(user_id, content) VALUES(?,?)').run(req.user.id, clean);
  res.json({ msg: '发布成功' });
});

// ---------- 文章列表（含作者名） ----------
app.get('/api/posts', (req, res) => {
  const rows = db.prepare(`
    SELECT p.id, p.content, p.created_at, u.username
    FROM posts p JOIN users u ON p.user_id = u.id
    ORDER BY p.id DESC
  `).all();
  res.json(rows);
});

app.listen(3000, () => console.log('http://localhost:3000'));