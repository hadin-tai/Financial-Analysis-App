# 🚀 InsightEdge - Quick Setup Guide

## Prerequisites
- Node.js v16+
- Python 3.10+
- MongoDB (local or Atlas)
- npm/yarn

## 🎯 ONE-COMMAND START (Windows)

```bash
START_ALL.bat
```

## 🎯 ONE-COMMAND START (Linux/Mac)

```bash
chmod +x START_ALL.sh && ./START_ALL.sh
```

## Manual Setup (3 Steps)

### 1. Start Node.js Backend
```bash
cd Backend
npm install
npm run dev
```
✅ Runs on: http://localhost:5000

### 2. Start FastAPI ML Backend
```bash
cd "ML Model Backend"
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
✅ Runs on: http://localhost:8000

### 3. Start React Frontend
```bash
cd frontend
npm install
npm run dev
```
✅ Runs on: http://localhost:5173

## 🎮 Quick Test

1. Open http://localhost:5173
2. Register/Login
3. Add transactions in "Upload" page
4. Go to "AI Forecasts" in sidebar
5. Click "Generate AI Forecast"
6. View predictions!

## 📊 Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **ML Backend API**: http://localhost:8000
- **ML API Docs**: http://localhost:8000/docs

## 🔧 Environment Variables

### Backend/.env
```env
MONGO_URI=mongodb://localhost:27017/fy_project
JWT_SECRET=your_secret_here
PORT=5000
ML_BACKEND_URL=http://localhost:8000
```

### ML Model Backend/.env
```env
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=fy_project
PORT=8000
```

## 📚 Documentation

- Full Guide: `INTEGRATION_GUIDE.md`
- Summary: `AI_FORECAST_INTEGRATION_SUMMARY.md`

## ⚡ Features

✅ AI-powered 30-day financial forecasts
✅ Income, Expense & Profit predictions  
✅ Confidence intervals visualization
✅ Interactive charts with Recharts
✅ Auto-refresh on data update
✅ Full authentication & security

---

**Need help?** Check `INTEGRATION_GUIDE.md` for detailed instructions!
