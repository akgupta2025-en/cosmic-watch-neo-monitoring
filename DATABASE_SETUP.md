# Cosmic Watch App - Setup Instructions

## Database & Authentication Setup

This app now includes user authentication with a SQLite database backend.

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation & Running

#### 1. Install Backend Dependencies
```bash
cd server
npm install
```

#### 2. Start the Backend Server
From the `server` directory:
```bash
npm start
```

You should see:
```
🚀 Cosmic Watch Server running on http://localhost:3001
📡 Database initialized at cosmic_watch.db
```

#### 3. Start the Frontend (in a new terminal)
From the `build-cosmic-watch-app` directory:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Features

#### Authentication
- **Sign Up**: Create a new account with name, email, and password
- **Login**: Login with your registered credentials
- **Demo Login**: Quick access without account creation
- **Logout**: Available in the sidebar after login

#### Database
User data is stored in SQLite (`server/cosmic_watch.db`):
- User accounts (name, email, password - hashed)
- User watchlist
- User alerts

#### API Endpoints
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login with credentials
- `GET /api/auth/profile` - Get current user profile
- `GET /api/watchlist` - Get user's watchlist
- `POST /api/watchlist/:asteroidId` - Add to watchlist
- `DELETE /api/watchlist/:asteroidId` - Remove from watchlist

### Default Behavior

1. **First Visit**: Redirected to login page
2. **No Account**: Click "Create Account" to sign up
3. **Have Account**: Login with your credentials
4. **Demo Mode**: Click "Demo Login" for testing without signup

### Database Structure

```
users
├── id (auto-increment)
├── name
├── email (unique)
├── password (hashed)
├── role (researcher/enthusiast)
├── created_at
└── updated_at

watchlist
├── id (auto-increment)
├── user_id (foreign key)
├── asteroid_id
└── created_at

alerts
├── id (auto-increment)
├── user_id (foreign key)
├── asteroid_id
├── asteroid_name
├── risk_level
├── alert_date
├── is_read
└── created_at
```

### Troubleshooting

**Error: "Failed to connect to server"**
- Make sure backend is running on port 3001
- Check that you ran `npm start` in the server directory

**Database Issues**
- Delete `server/cosmic_watch.db` and restart the server to reinitialize

**Port Already in Use**
- Backend uses port 3001
- Frontend uses port 5173
- Change ports in package.json if needed
