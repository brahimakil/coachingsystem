# Coach Training System

A full-stack coaching football system with NestJS backend and React admin panel.

## Project Structure

- `coaching_system_backend/` - NestJS REST API
- `coaching_system_admin/` - React Admin Panel

## Backend Setup

### Prerequisites
- Node.js (v18 or higher)
- Firebase account

### Installation

1. Navigate to backend folder:
```bash
cd coaching_system_backend
```

2. Install dependencies:
```bash
npm install
```

3. Environment variables are already configured in `.env` file

4. **IMPORTANT**: You can now delete the `coachsystem-cc61b-firebase-adminsdk-fbsvc-2bef743bcd.json` file as all credentials are stored in `.env`

### Running the Backend

Development mode:
```bash
npm run start:dev
```

The backend will run on `http://localhost:3000`

### API Endpoints

- `POST /auth/register` - Register new admin
  - Body: `{ email, password, displayName }`
  
- `POST /auth/login` - Login admin
  - Body: `{ email, password }`

## Admin Panel Setup

### Installation

1. Navigate to admin folder:
```bash
cd coaching_system_admin
```

2. Install dependencies:
```bash
npm install
```

3. Environment variables are configured in `.env` with only the backend URL (no Firebase keys)

### Running the Admin Panel

Development mode:
```bash
npm run dev
```

The admin panel will run on `http://localhost:5173`

## Features Implemented

### Backend
- ✅ Firebase Admin SDK integration (credentials from .env only)
- ✅ Authentication API (register/login)
- ✅ CORS enabled for admin panel
- ✅ Global validation pipes
- ✅ Environment-based configuration

### Admin Panel
- ✅ Login page (API-driven)
- ✅ Registration page (API-driven)
- ✅ Protected routes with authentication
- ✅ Responsive dashboard layout
- ✅ Sidebar with menu items:
  - Coaches (placeholder)
  - Players (placeholder)
  - Subscriptions (placeholder)
  - Tasks (placeholder)
  - Logout
- ✅ Token-based authentication
- ✅ No Firebase configuration in frontend (100% API-driven)

## Usage

1. Start the backend server first
2. Start the admin panel
3. Register a new admin account at `/register`
4. Login with your credentials
5. Access the dashboard with sidebar navigation

## Security Notes

- All Firebase credentials are in backend `.env` only
- Admin panel has NO Firebase keys
- All authentication happens through backend APIs
- JWT tokens stored in localStorage
- Protected routes require authentication

## Next Steps

The following menu items are placeholders and ready for implementation:
- Coaches management
- Players management
- Subscriptions management
- Tasks management
