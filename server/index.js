import express from 'express';
import fs from 'fs';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';
// Generate random ID helper
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Generate random ID helper
const getID = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// ==========================
// API ROUTES
// ==========================

// GET ALL INITIAL DATA
app.get('/api/state', (req, res) => {
  try {
    const students = db.prepare('SELECT * FROM students').all();
    
    const settingsRaw = db.prepare('SELECT * FROM settings WHERE id = 1').get();
    const settings = {
      ...settingsRaw,
      allowRepeat: !!settingsRaw.allowRepeat,
      autoDraw: !!settingsRaw.autoDraw
    };

    const historiesRaw = db.prepare('SELECT * FROM history ORDER BY timestamp DESC').all();
    const history = historiesRaw.map(h => {
      const winners = db.prepare('SELECT studentId as id, studentName as name, studentRegistration as registration FROM history_winners WHERE historyId = ?').all(h.id);
      return {
        id: h.id,
        timestamp: h.timestamp,
        settings: {
          winnerCount: h.winnerCountUsed,
          allowRepeat: !!h.allowRepeatUsed
        },
        winners
      };
    });

    res.json({ students, settings, history });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// STUDENTS
app.post('/api/students', (req, res) => {
  const newStudents = req.body; // Expecting array of {registration, name}
  if (!Array.isArray(newStudents)) return res.status(400).json({ error: "Invalid input" });
  
  const insert = db.prepare('INSERT OR IGNORE INTO students (id, registration, name) VALUES (?, ?, ?)');
  
  const transaction = db.transaction((items) => {
    for (const item of items) {
      insert.run(item.id || getID(), String(item.registration), item.name);
    }
  });

  try {
    transaction(newStudents);
    const all = db.prepare('SELECT * FROM students').all();
    res.json(all);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/students/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/students', (req, res) => {
  try {
    db.prepare('DELETE FROM students').run();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// SETTINGS
app.post('/api/settings', (req, res) => {
  const { winnerCount, allowRepeat, animationSpeed, animationDuration, autoDraw } = req.body;
  try {
    db.prepare(`
      UPDATE settings 
      SET winnerCount = ?, allowRepeat = ?, animationSpeed = ?, animationDuration = ?, autoDraw = ?
      WHERE id = 1
    `).run(winnerCount, allowRepeat ? 1 : 0, animationSpeed, animationDuration, autoDraw ? 1 : 0);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// HISTORY
app.post('/api/history', (req, res) => {
  const { id, timestamp, winners, settings } = req.body;
  
  const insertHist = db.prepare('INSERT INTO history (id, timestamp, winnerCountUsed, allowRepeatUsed) VALUES (?, ?, ?, ?)');
  const insertWinner = db.prepare('INSERT INTO history_winners (historyId, studentId, studentName, studentRegistration) VALUES (?, ?, ?, ?)');
  
  const transaction = db.transaction((h) => {
    insertHist.run(h.id, h.timestamp, h.settings.winnerCount, h.settings.allowRepeat ? 1 : 0);
    for (const w of h.winners) {
      insertWinner.run(h.id, w.id, w.name, w.registration);
    }
  });

  try {
    transaction({ id, timestamp, winners, settings });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/history/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM history WHERE id = ?').run(req.params.id);
    db.prepare('DELETE FROM history_winners WHERE historyId = ?').run(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/history', (req, res) => {
  try {
    db.prepare('DELETE FROM history').run();
    db.prepare('DELETE FROM history_winners').run();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// SERVE STATIC FRONTEND IN PROD
app.use(express.static(path.join(__dirname, '../dist')));

app.get(/.*/, (req, res) => {
  const indexPath = path.join(__dirname, '../dist/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("Dev mode active / Static frontend not built yet.");
  }
});

app.listen(PORT, () => {
  console.log(`Backend Server running on http://localhost:${PORT}`);
});

// Keep-alive prevent exit
setInterval(() => {}, 60000);

