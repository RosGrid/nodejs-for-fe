const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = 3000;
const cors = require('cors');
require('dotenv').config();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Connect to SQLite database
const db = new sqlite3.Database('./users.db', (err) => {
  if (err) {
    console.error(err.message);
  } else {
    db.run(
      `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE
    )`,
      (err) => {
        if (err) {
          console.error(err.message);
        }
      }
    );

    db.run(
      `CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      description TEXT NOT NULL,
      duration INTEGER NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY(userId) REFERENCES users(id)
    )`,
      (err) => {
        if (err) {
          console.error(err.message);
        }
      }
    );
  }
});

// POST /api/users to create a new user
app.post('/api/users', (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }
  db.run(`INSERT INTO users (username) VALUES (?)`, [username], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID, username });
  });
});

app.get('/api/users', (req, res) => {
  db.all(`SELECT id, username FROM users`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/users/:_id/exercises', (req, res) => {
  const { description, duration } = req.body;
  const date = req.body.date ? req.body.date : new Date().toISOString().split('T')[0];
  const userId = req.params._id;

  if (!description || !duration) {
    return res.status(400).json({ error: 'Description and duration are required' });
  }

  db.run(`INSERT INTO exercises (userId, description, duration, date) VALUES (?, ?, ?, ?)`, [userId, description, duration, date], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ userId, exerciseId: this.lastID, description, duration, date });
  });
});

app.get('/api/users/:_id/logs', (req, res) => {
  const { from, to, limit } = req.query;
  const userId = req.params._id;
  let query = `SELECT e.id, e.description, e.duration, e.date FROM exercises e WHERE e.userId = ?`;
  let queryParams = [userId];

  if (from) {
    query += ` AND e.date >= ?`;
    queryParams.push(from);
  }

  if (to) {
    query += ` AND e.date <= ?`;
    queryParams.push(to);
  }

  db.all(query, queryParams, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const log = rows.slice(0, limit ? parseInt(limit) : rows.length);
    res.json({ userId, log, count: log.length });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
