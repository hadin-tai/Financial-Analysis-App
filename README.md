# FY Project - Financial Management System

A comprehensive financial management system with user authentication, transaction tracking, budget management, and financial analytics.

## Features

- 🔐 User Authentication (Register/Login)
- 💰 Transaction Management
- 📊 Budget Planning & Analysis
- 📈 Financial Analytics & Trends
- 📁 File Upload Support
- 📱 Responsive Design

## Project Structure

```
FY_Project/
├── Backend/          # Node.js + Express + MongoDB API
├── frontend/         # React + Vite + Tailwind CSS
```

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

## Quick Start

### 1. Backend Setup

```bash
cd Backend

# Install dependencies
npm install

# Create .env file with your configuration
echo "MONGO_URI=mongodb://localhost:27017/fy_project
JWT_SECRET=your_jwt_secret_key_here
PORT=5000" > .env

# Start development server
npm run dev
```

The backend will start at `http://localhost:5000`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will start at `http://localhost:5173`

### 3. Database Setup

Make sure MongoDB is running on your system. The application will automatically create the necessary collections when you first register a user.

## API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login

### Transactions
- `GET /api/transactions` - Get user transactions
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Budgets
- `GET /api/budgets` - Get user budgets
- `POST /api/budgets` - Create new budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget

## Environment Variables

### Backend (.env)
```env
MONGO_URI=mongodb://localhost:27017/fy_project
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
```

## Technologies Used

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing
- Multer for file uploads

### Frontend
- React 19
- Vite
- Tailwind CSS
- Axios for API calls
- React Router for navigation

## Development

### Backend Development
```bash
cd Backend
npm run dev  # Starts with nodemon for auto-reload
```

### Frontend Development
```bash
cd frontend
npm run dev  # Starts Vite dev server
```

## Building for Production

### Frontend
```bash
cd frontend
npm run build
```

### Backend
```bash
cd Backend
npm start
```

## Troubleshooting

1. **MongoDB Connection Error**: Ensure MongoDB is running and the connection string is correct
2. **Port Already in Use**: Change the PORT in .env file or kill the process using the port
3. **CORS Issues**: The backend is configured with CORS enabled for development

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.
