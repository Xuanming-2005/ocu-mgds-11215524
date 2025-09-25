const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 初始化應用
const app = express();
const PORT = process.env.PORT || 3000;

// 中間件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// 連接數據庫
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('無法連接到數據庫:', err.message);
  } else {
    console.log('已連接到SQLite數據庫');
    createTables();
  }
});

// 創建數據表
function createTables() {
  // 留言表
  db.run(`CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  // 網址表
  db.run(`CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    category TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  // 回憶表
  db.run(`CREATE TABLE IF NOT EXISTS memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  console.log('數據表已創建');
}

// API路由 - 留言區
app.get('/api/comments', (req, res) => {
  db.all('SELECT * FROM comments ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/comments', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !message) {
    return res.status(400).json({ error: '姓名和留言內容為必填項' });
  }

  db.run('INSERT INTO comments (name, email, message) VALUES (?, ?, ?)',
    [name, email, message],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({
        id: this.lastID,
        success: true,
        message: '留言已成功添加'
      });
    }
  );
});

// API路由 - 網址專區
app.get('/api/links', (req, res) => {
  db.all('SELECT * FROM links ORDER BY category, title', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/links', (req, res) => {
  const { title, url, description, category } = req.body;
  if (!title || !url) {
    return res.status(400).json({ error: '標題和網址為必填項' });
  }

  db.run('INSERT INTO links (title, url, description, category) VALUES (?, ?, ?, ?)',
    [title, url, description, category],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({
        id: this.lastID,
        success: true,
        message: '網址已成功添加'
      });
    }
  );
});

// API路由 - 回憶點滴錄
app.get('/api/memories', (req, res) => {
  db.all('SELECT * FROM memories ORDER BY date DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/memories', (req, res) => {
  const { title, content, image_url, date } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: '標題和內容為必填項' });
  }

  db.run('INSERT INTO memories (title, content, image_url, date) VALUES (?, ?, ?, ?)',
    [title, content, image_url, date],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({
        id: this.lastID,
        success: true,
        message: '回憶已成功添加'
      });
    }
  );
});

// 啟動服務器
app.listen(PORT, () => {
  console.log(`服務器運行在 http://localhost:${PORT}`);
});

// 關閉數據庫連接
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('數據庫連接已關閉');
    process.exit(0);
  });
});