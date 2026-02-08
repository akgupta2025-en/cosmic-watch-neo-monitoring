# Cosmic Watch API - Postman Documentation

## Setup Instructions

1. **Import the Collection**
   - Open Postman
   - Click "Import" in the top left
   - Select the `Cosmic_Watch_API.postman_collection.json` file
   - The collection will be imported with all endpoints

2. **Environment Variables**
   - The collection includes two environment variables:
     - `baseUrl`: Set to `http://localhost:3001` (default)
     - `token`: Will be automatically set when you login

3. **Authentication Flow**
   - First, use the "Sign Up" endpoint to create an account
   - Then use the "Login" endpoint to get a JWT token
   - The token will be automatically used in other endpoints

## API Endpoints

### Authentication
- **POST** `/api/auth/signup` - Create a new user account
- **POST** `/api/auth/login` - Login and get JWT token
- **GET** `/api/auth/profile` - Get current user profile (requires auth)

### Watchlist
- **GET** `/api/watchlist` - Get user's watchlist (requires auth)
- **POST** `/api/watchlist/:asteroidId` - Add asteroid to watchlist (requires auth)
- **DELETE** `/api/watchlist/:asteroidId` - Remove from watchlist (requires auth)

### Alerts
- **GET** `/api/alerts` - Get user's alerts (requires auth)
- **POST** `/api/alerts` - Create new alert (requires auth)
- **PUT** `/api/alerts/:alertId` - Update alert (requires auth)

### System
- **GET** `/api/health` - Health check endpoint

## Example Usage

1. **Sign Up**
   ```json
   {
     "name": "John Doe",
     "email": "john@example.com",
     "password": "password123",
     "role": "enthusiast"
   }
   ```

2. **Login**
   ```json
   {
     "email": "john@example.com",
     "password": "password123"
   }
   ```

3. **Add to Watchlist**
   - URL: `POST /api/watchlist/12345`
   - Replace `12345` with actual asteroid ID

## Testing Tips

- Use the "Health Check" endpoint first to verify the server is running
- After login, the token is automatically stored and used in subsequent requests
- Check the response body for error messages if requests fail
- Make sure the backend server is running on port 3001 before testing
