const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
// var fs = require('fs');
// var path = require('path');

const sqlite = require('sqlite3').verbose();
// const DB_SQL = path.join(__dirname, './mydb.sql');
// const initSQL = fs.readFileSync(DB_SQL, 'utf-8');
// console.log('🚀 ~ initSQL:', initSQL);
const db = new sqlite.Database('./my.db', sqlite.OPEN_READWRITE, (err) => {
  if (err) return console.error(error);
});
// const sql = `CREATE TABLE IF NOT EXISTS users(ID INTEGER PRIMARY KEY, user, exercise)`;
const sql = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users(
  ID INTEGER PRIMARY KEY,
  user TEXT,
  exercise TEXT
);

CREATE TABLE IF NOT EXISTS exercises (
  exercise_id INTEGER PRIMARY KEY,
  exercise_name TEXT NOT NULL,
  user_id INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

`;

// const sqlDrop = `DROP TABLE IF EXISTS users`;
// db.run(sql);
db.run(sql, (err) => {
  if (err) {
    return console.error(err, 'adwadawd');
  }
  console.log('Tables created successfully');

  // Interact with the 'exercises' table here
});
// const sqlDrop = `DROP TABLE IF EXISTS users`;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.post('/api/users', (req, res) => {
  try {
    if (req.body.username && req.body.username.length) {
      db.run(`INSERT INTO users(user) VALUES(?)`, [req.body.username], function (err) {
        if (err) {
          return console.error(err.message);
        }
        res.json({
          username: req.body.username,
          _id: this.lastID,
        });
      });
    } else {
      res.status(400).json({ error: 'Username is required' });
    }
  } catch (e) {
    return res.json({
      status: 400,
      success: false,
    });
  }
});

app.get('/api/users', (req, res) => {
  db.all(`SELECT * FROM users`, [], (err, rows) => {
    if (err) {
      return console.error(err.message);
    }
    res.json(rows);
  });
});

app.delete('/api/users', (req, res) => {
  try {
    db.run(`DELETE FROM users`, function (err) {
      if (err) {
        return console.error(err.message);
      }
      res.json({
        status: 200,
        success: true,
      });
    });
  } catch (e) {
    return res.json({
      status: 400,
      success: false,
    });
  }
});

app.post('/api/users/:_id/exercises', (req, res) => {
  try {
    const userId = req.params._id;
    const { description, duration, date } = req.body;

    if (!description || !duration) {
      return res.status(400).json({ error: 'Description and duration are required' });
    }

    const sql = `INSERT INTO exercises(user_id, description, duration, date) VALUES(?, ?, ?, ?)`;
    db.run(sql, [userId, description, duration, date || new Date()], function (err) {
      if (err) {
        return console.error(err.message);
      }
      res.json({
        _id: userId,
        description,
        duration,
        date: date || new Date(),
      });
    });
  } catch (e) {
    return res.json({
      status: 400,
      success: false,
    });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
