import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'data.json');

// Initialize database structure
const defaultData = {
  users: [],
  watchlist: [],
  alerts: [],
};

// Load or create database
function loadDb() {
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading database:', error);
  }
  return defaultData;
}

// Save database
function saveDb(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving database:', error);
  }
}

// Initialize database
let db = loadDb();

export default {
  getAllUsers: () => db.users,
  getUserById: (id) => db.users.find((u) => u.id === id),
  getUserByEmail: (email) => db.users.find((u) => u.email === email),
  createUser: (user) => {
    db.users.push(user);
    saveDb(db);
    return user;
  },
  updateUser: (id, updates) => {
    const user = db.users.find((u) => u.id === id);
    if (user) {
      Object.assign(user, updates);
      saveDb(db);
    }
    return user;
  },
  
  getWatchlist: (userId) => db.watchlist.filter((w) => w.userId === userId),
  addToWatchlist: (userId, asteroidId) => {
    if (!db.watchlist.find((w) => w.userId === userId && w.asteroidId === asteroidId)) {
      const item = { userId, asteroidId, createdAt: new Date().toISOString() };
      db.watchlist.push(item);
      saveDb(db);
      return item;
    }
    return null;
  },
  removeFromWatchlist: (userId, asteroidId) => {
    const index = db.watchlist.findIndex((w) => w.userId === userId && w.asteroidId === asteroidId);
    if (index > -1) {
      db.watchlist.splice(index, 1);
      saveDb(db);
      return true;
    }
    return false;
  },

  getAlerts: (userId) => db.alerts.filter((a) => a.userId === userId),
  createAlert: (alert) => {
    db.alerts.push(alert);
    saveDb(db);
    return alert;
  },
  updateAlert: (id, updates) => {
    const alert = db.alerts.find((a) => a.id === id);
    if (alert) {
      Object.assign(alert, updates);
      saveDb(db);
    }
    return alert;
  },
};

