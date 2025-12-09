# InsightEdge AI Forecasting Integration Guide

## 🎯 Overview

This guide explains how to run the complete InsightEdge system with integrated AI-powered financial forecasting.

## 📦 System Architecture

The system consists of three main components:

1. **Node.js Backend** (`Backend/`) - Port 5000
   - User authentication
   - Transaction CRUD operations
   - Forecast API endpoints
   
2. **FastAPI ML Backend** (`ML Model Backend/`) - Port 8000
   - Prophet-based ML forecasting
   - Transaction analysis
   - Forecast generation

3. **React Frontend** (`frontend/`) - Port 5173
   - Dashboard with financial insights
   - AI Forecasts page
   - Data visualization

All components share the same **MongoDB** database (`fy_project`).

## 🚀 Quick Start (Complete Setup)

### Prerequisites
- Node.js (v16+)
- Python (v3.10+)
- MongoDB (running locally or Atlas)
- npm or yarn

### Step 1: Start MongoDB

```bash
# Make sure MongoDB is running
mongod
```

### Step 2: Start Node.js Backend

```bash
cd Backend
npm install
npm run dev
```

Backend will start at: http://localhost:5000

### Step 3: Start FastAPI ML Backend

```bash
cd "ML Model Backend"
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

ML Backend will start at: http://localhost:8000

### Step 4: Start React Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will start at: http://localhost:5173

## 🔧 Configuration

### Backend Environment Variables

Create `Backend/.env`:
```env
MONGO_URI=mongodb://localhost:27017/fy_project
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
ML_BACKEND_URL=http://localhost:8000
```

### ML Backend Environment Variables

Create `ML Model Backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=fy_project
PORT=8000
HOST=0.0.0.0
ML_MODEL_PATH=./ml/
LOG_LEVEL=INFO
```

## 📊 API Endpoints

### Node.js Backend (Port 5000)

**Forecasts:**
- `GET /api/insightedge/forecast` - Get latest forecast
- `POST /api/insightedge/forecast/generate` - Generate new forecast
- `GET /api/insightedge/forecast/history` - Get forecast history
- `DELETE /api/insightedge/forecast/:id` - Delete forecast

### FastAPI ML Backend (Port 8000)

**Health Check:**
- `GET /api/health` - Check ML backend status

**Predictions:**
- `GET /api/predictions/forecast?userId={userId}&periods=30` - Generate forecast
- `POST /api/predictions/generate?userId={userId}` - Generate and save forecast

**Documentation:**
- `GET /docs` - Swagger UI
- `GET /redoc` - ReDoc

## 🧪 Testing the Integration

### 1. Test Database Connection

```bash
# Check MongoDB
mongosh
use fy_project
db.forecasts.find().limit(1)
```

### 2. Test Backend APIs

```bash
# Get forecast (requires authentication)
curl -X GET "http://localhost:5000/api/insightedge/forecast" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Generate forecast
curl -X POST "http://localhost:5000/api/insightedge/forecast/generate"
```

### 3. Test ML Backend

```bash
# Health check
curl http://localhost:8000/api/health

# Generate prediction
curl "http://localhost:8000/api/predictions/forecast?userId=USER_ID"
```

### 4. Test Frontend

1. Navigate to http://localhost:5173
2. Login/Register
3. Go to "Upload" and add transaction data
4. Navigate to "AI Forecasts"
5. Click "Generate AI Forecast"
6. View the forecast charts

## 🔄 Data Flow

```
1. User adds transactions via Frontend
   ↓
2. Data saved to MongoDB (transactions collection)
   ↓
3. User clicks "Generate AI Forecast"
   ↓
4. Frontend calls: POST /api/insightedge/forecast/generate
   ↓
5. Node.js backend calls: GET /api/predictions/forecast
   ↓
6. FastAPI ML backend:
   - Fetches transactions from MongoDB
   - Runs Prophet models on data
   - Generates 30-day forecast
   - Returns predictions
   ↓
7. Node.js backend saves forecast to MongoDB (forecasts collection)
   ↓
8. Frontend displays forecast with charts
```

## 📈 Using the AI Forecasts Dashboard

1. **Navigate to AI Forecasts** from the sidebar
2. **View Summary Cards** showing:
   - Projected Income
   - Projected Expense
   - Projected Net Profit

3. **Generate Forecast:**
   - Click "Generate AI Forecast" button
   - Wait for ML backend to process
   - Forecast appears automatically

4. **View Charts:**
   - Income Forecast with confidence intervals (green)
   - Expense Forecast with confidence intervals (red)
   - Net Profit Forecast (blue)
   - Shaded areas show prediction range

## 🎨 UI Features

- **Responsive Design** - Works on desktop and mobile
- **Loading States** - Visual feedback during API calls
- **Error Handling** - Graceful error messages
- **Auto-refresh** - Forecasts update automatically
- **Confidence Intervals** - Visual representation of uncertainty

## 🚨 Troubleshooting

### ML Backend Not Starting

**Issue**: FastAPI server won't start

**Solution**:
```bash
cd "ML Model Backend"
pip install -r requirements.txt
uvicorn main:app --reload
```

### MongoDB Connection Error

**Issue**: "Cannot connect to MongoDB"

**Solution**:
1. Ensure MongoDB is running: `mongod`
2. Check `MONGO_URI` in `.env` files
3. Verify MongoDB port: `mongosh --eval "db.runCommand({ping: 1})"`

### CORS Errors

**Issue**: "CORS policy error" in browser

**Solution**:
- Verify backend CORS settings include frontend URL
- Check that all servers are running on correct ports

### No Forecast Data

**Issue**: "No forecast found"

**Solution**:
1. Ensure you have transaction data in MongoDB
2. Click "Generate AI Forecast" button
3. Check ML backend logs for errors
4. Verify .pkl model files exist in `ml/` directory

### Forecasts Not Updating

**Issue**: Old forecasts showing

**Solution**:
1. Click "Generate AI Forecast" to create new forecast
2. Check MongoDB: `db.forecasts.find().sort({generated_at: -1})`
3. Clear browser cache and refresh

## 📝 Database Collections

The system uses these MongoDB collections:

- **users** - User accounts
- **transactions** - Transaction data (input for ML)
- **budgets** - Budget planning
- **balances** - Balance sheet data
- **forecasts** - Generated AI forecasts (output from ML)

## 🔒 Security Notes

- All API endpoints require JWT authentication
- User data is isolated by userId
- ML backend uses same MongoDB with proper access control
- Environment variables keep secrets secure

## 📚 Additional Resources

- **Node.js Backend**: See `Backend/README.md`
- **ML Backend**: See `ML Model Backend/README.md`
- **Frontend**: See `frontend/README.md`
- **API Docs**: http://localhost:8000/docs (ML Backend)

## ✅ Checklist

- [ ] MongoDB is running
- [ ] Node.js backend is running on port 5000
- [ ] FastAPI ML backend is running on port 8000
- [ ] React frontend is running on port 5173
- [ ] User is registered/logged in
- [ ] Transaction data exists in database
- [ ] ML models exist in `ML Model Backend/ml/` directory

## 🎯 Next Steps

1. Add more ML models for different forecast periods
2. Implement automated forecast generation
3. Add forecast accuracy metrics
4. Enable real-time forecast updates
5. Add export forecast functionality

---

**Need Help?** Check the individual component READMEs or review the API documentation.
