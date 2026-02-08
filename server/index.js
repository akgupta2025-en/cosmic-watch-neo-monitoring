import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from './db.js';

const app = express();
const PORT = 3001;
const JWT_SECRET = 'cosmic-watch-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Auth Endpoints

// Sign up
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, role = 'enthusiast' } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already exists
    if (db.getUserByEmail(email)) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      id: uuidv4(),
      name,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date().toISOString(),
    };

    db.createUser(user);

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    // Find user
    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user profile
app.get('/api/auth/profile', authenticateToken, (req, res) => {
  try {
    const user = db.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Watchlist Endpoints

// Get watchlist
app.get('/api/watchlist', authenticateToken, (req, res) => {
  try {
    const watchlist = db.getWatchlist(req.user.id);
    res.json(watchlist);
  } catch (error) {
    console.error('Get watchlist error:', error);
    res.status(500).json({ error: 'Failed to get watchlist' });
  }
});

// Add to watchlist
app.post('/api/watchlist/:asteroidId', authenticateToken, (req, res) => {
  try {
    const { asteroidId } = req.params;
    const result = db.addToWatchlist(req.user.id, asteroidId);
    if (result) {
      res.json({ success: true, item: result });
    } else {
      res.status(400).json({ error: 'Already in watchlist' });
    }
  } catch (error) {
    console.error('Add to watchlist error:', error);
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
});

// Remove from watchlist
app.delete('/api/watchlist/:asteroidId', authenticateToken, (req, res) => {
  try {
    const { asteroidId } = req.params;
    const success = db.removeFromWatchlist(req.user.id, asteroidId);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Item not in watchlist' });
    }
  } catch (error) {
    console.error('Remove from watchlist error:', error);
    res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
});

// Alerts Endpoints

// Get alerts
app.get('/api/alerts', authenticateToken, (req, res) => {
  try {
    const alerts = db.getAlerts(req.user.id);
    res.json(alerts);
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Failed to get alerts' });
  }
});

// Create alert
app.post('/api/alerts', authenticateToken, (req, res) => {
  try {
    const { asteroidId, asteroidName, riskLevel, alertDate } = req.body;

    if (!asteroidId || !asteroidName || !riskLevel) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const alert = {
      id: uuidv4(),
      userId: req.user.id,
      asteroidId,
      asteroidName,
      riskLevel,
      alertDate: alertDate || new Date().toISOString(),
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    db.createAlert(alert);
    res.json(alert);
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// Update alert
app.put('/api/alerts/:alertId', authenticateToken, (req, res) => {
  try {
    const { alertId } = req.params;
    const updates = req.body;

    const alert = db.updateAlert(alertId, updates);
    if (alert) {
      res.json(alert);
    } else {
      res.status(404).json({ error: 'Alert not found' });
    }
  } catch (error) {
    console.error('Update alert error:', error);
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 Cosmic Watch Server running on http://localhost:' + PORT);
  console.log('📡 Database initialized at server/data.json\n');
});
