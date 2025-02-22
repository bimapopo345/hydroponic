# Hydroponic Monitor

A full-stack application for monitoring aquarium water quality, built using a MERN (MongoDB, Express.js, React, Node.js) stack.

## Project Structure

```markdown
hydroponic-monitor/
├── backend/         # Express.js backend application
│   ├── models/      # Database models
│   ├── server.js    # Main server file
│   └── .env         # Environment variables
└── frontend/        # React frontend application
    ├── src/         # Source files
    ├── public/      # Public assets
    └── .env         # Environment variables
```

## Table of Contents

* [About](#about)
* [Features](#features)
* [Technology Stack](#technology-stack)
* [Prerequisites](#prerequisites)
* [Installation](#installation)
* [Usage](#usage)
* [API Documentation](#api-documentation)
* [Deployment](#deployment)
* [Contributing](#contributing)
* [License](#license)
* [Contact](#contact)

## About

Hydroponic Monitor is a web application designed to monitor and control hydroponic systems. It provides real-time data on water quality parameters such as TDS, EC, pH, and temperature. The application also allows users to adjust nutrient levels, monitor historical data, and receive alerts when parameters exceed safe thresholds.

## Features

* User authentication and authorization
* Real-time monitoring of water quality parameters (TDS, EC, pH, temperature)
* Historical data tracking and visualization
* Automated alert system for parameter threshold exceedance
* Nutrient level adjustment and control
* User profile management

## Technology Stack

### Backend

* **Express.js**: Node.js web framework for building the API
* **MongoDB**: NoSQL database for storing user data and hydroponic system information
* **Mongoose**: MongoDB ORM for interacting with the database
* **Bcrypt**: Password hashing library for secure authentication

### Frontend

* **React**: JavaScript library for building the user interface
* **Vite**: Development server and build tool for React applications
* **Tailwind CSS**: CSS framework for styling the application
* **Recharts**: Library for creating charts and visualizations

### Other Tools

* **Nodemon**: Development tool for automatically restarting the server on code changes
* **Concurrently**: Tool for running multiple commands concurrently

## Prerequisites

* Node.js (version 16 or higher)
* MongoDB (version 5 or higher)
* npm (version 8 or higher)
* Vite (version 2 or higher)

## Installation

```bash
# Clone the repository
git clone https://github.com/bimapopo345/hydroponic.git
cd hydroponic

# Install dependencies
npm install

# Create a .env file in the backend directory
cd backend
cp .env.example .env

# Create a .env file in the frontend directory
cd ../frontend
cp .env.example .env

# Start the development server
npm run dev
```

## Usage

1. Open a web browser and navigate to `http://localhost:5173`
2. Register a new user account or log in to an existing account
3. Configure your hydroponic system settings and parameters
4. Monitor real-time data and adjust nutrient levels as needed
5. View historical data and visualize trends

## API Documentation

The API documentation is available at `http://localhost:5000/api/docs`

## Deployment

The application can be deployed to a production environment using a cloud platform such as Heroku or Vercel.

### Backend Deployment

1. Create a new Heroku app and install the MongoDB add-on
2. Set environment variables for the MongoDB connection string and other settings
3. Deploy the backend code to Heroku using Git

### Frontend Deployment

1. Create a new Vercel app and link it to the frontend repository
2. Set environment variables for the API endpoint and other settings
3. Deploy the frontend code to Vercel

## Contributing

Contributions are welcome! Please submit a pull request with your changes and a brief description of the updates.

## License

The Hydroponic Monitor application is licensed under the MIT License.

## Contact

For questions, issues, or feedback, please contact the development team at [bimapopo345@gmail.com](mailto:bimapopo345@gmail.com)
