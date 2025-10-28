const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(bodyParser.json());

// DB 파일
const DB_PATH = path.join(__dirname, 'data', 'events.db');
const dbDir = path.join(__dirname, 'data');
const fs = require('fs');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    start TEXT NOT NULL,
    end TEXT NOT NULL,
    color TEXT NOT NULL
  )`);
});

// CORS for local file testing
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// 정적 파일 서빙 (homepage 폴더)
app.use('/', express.static(path.join(__dirname, 'homepage')));

// REST API: events
app.get('/api/events', (req, res) => {
  db.all('SELECT * FROM events ORDER BY id', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(r => ({ id: r.id, title: r.title, start: r.start, end: r.end, color: r.color })));
  });
});

app.post('/api/events', (req, res) => {
  const { title, start, end, color } = req.body;
  if (!title || !start || !end || !color) return res.status(400).json({ error: 'missing fields' });
  const stmt = db.prepare('INSERT INTO events (title, start, end, color) VALUES (?, ?, ?, ?)');
  stmt.run(title, start, end, color, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, title, start, end, color });
  });
});

app.put('/api/events/:id', (req, res) => {
  const id = Number(req.params.id);
  const { title, start, end, color } = req.body;
  db.run('UPDATE events SET title = ?, start = ?, end = ?, color = ? WHERE id = ?', [title, start, end, color, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'not found' });
    res.json({ id, title, start, end, color });
  });
});

app.delete('/api/events/:id', (req, res) => {
  const id = Number(req.params.id);
  db.run('DELETE FROM events WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'not found' });
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
