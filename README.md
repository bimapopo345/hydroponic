# Fishtech V2

A full-stack application for monitoring aquarium water quality.

## Project Structure

```
fishtech-v2/
├── frontend/         # React frontend application
│   ├── src/         # Source files
│   └── ...          # Configuration files
└── backend/         # Express.js backend application
    ├── models/      # Database models
    └── server.js    # Main server file
```

## Development Setup

1. Install dependencies for all parts of the application:

```bash
npm run install:all
```

2. Create a `.env` file in the backend directory with the following variables:

```
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_uri
EMAIL_USER=your_email
EMAIL_PASS=your_email_app_password
```

3. Start the development servers:

```bash
npm run dev
```

This will start both the frontend (http://localhost:5173) and backend (http://localhost:5000) servers.

## Deployment

### Backend (Railways)

1. Create a new project on Railways
2. Connect your GitHub repository
3. Set the following environment variables:
   - NODE_ENV=production
   - PORT=5000
   - MONGODB_URI=your_mongodb_uri
   - EMAIL_USER=your_email
   - EMAIL_PASS=your_email_app_password

### Frontend (Vercel)

1. Create a new project on Vercel
2. Connect your GitHub repository
3. Set the build command to: `cd frontend && npm run build`
4. Set the output directory to: `frontend/dist`
5. Add the following environment variable:
   - VITE_API_URL=your_railways_backend_url

## Features

- User authentication (login/register)
- Password reset functionality
- Real-time water quality monitoring
- Historical data tracking
- User profile management
