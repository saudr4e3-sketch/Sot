# 🚀 OSM FUT Dual Battle - Deployment Guide

## Complete Step-by-Step Production Deployment

This guide covers deploying your game to **Vercel (Frontend)** and **Render (Backend)**.

---

## 📋 Quick Reference

| Component | Platform | Cost | Deploy Time |
|-----------|----------|------|-------------|
| **Frontend** | Vercel | Free | ~1-2 min |
| **Backend** | Render | Free (with limitations) | ~2-3 min |
| **Database** | PostgreSQL on Render | Free tier available | - |

---

## 🎯 Part 1: Frontend Deployment (Vercel)

### Step 1.1: Connect GitHub to Vercel

1. **Go to https://vercel.com**
2. Click **"Sign up"** → Choose **"Continue with GitHub"**
3. Authorize Vercel to access your GitHub account
4. You'll be redirected to your Vercel dashboard

### Step 1.2: Import Your Repository

1. Click **"New Project"** on your Vercel dashboard
2. Under **"Import Git Repository"**, paste:
   ```
   https://github.com/saudr4e3-sketch/Sot
   ```
3. Click **"Import"**

### Step 1.3: Configure Frontend Build Settings

1. **Framework Preset**: Select **"Next.js"**
2. **Root Directory**: Change to **`./frontend`**
3. **Build Command**: Keep default `npm run build`
4. **Output Directory**: Keep default `.next`
5. **Install Command**: Keep default `npm install`

### Step 1.4: Set Environment Variables (Critical!)

1. Scroll to **"Environment Variables"**
2. Add these variables:

| Variable Name | Value | Notes |
|---------------|-------|-------|
| `NEXT_PUBLIC_WS_URL` | `https://osm-fut-backend.onrender.com` | Backend WebSocket URL (you'll get this after deploying backend) |
| `NEXT_PUBLIC_API_URL` | `https://osm-fut-backend.onrender.com/api` | Backend API URL |

3. Click **"Add Environment Variable"** for each
4. **Important**: These must be prefixed with `NEXT_PUBLIC_` to be accessible in browser

### Step 1.5: Deploy

1. Click **"Deploy"**
2. Wait for deployment to complete (usually 1-2 minutes)
3. You'll see your Vercel URL: `https://sot-[random].vercel.app`

✅ **Frontend is now live!**

---

## 🎯 Part 2: Backend Deployment (Render)

### Step 2.1: Connect GitHub to Render

1. **Go to https://render.com**
2. Click **"Sign up"** → Choose **"GitHub"**
3. Authorize Render to access your GitHub account
4. You'll be redirected to your Render dashboard

### Step 2.2: Create a New Web Service

1. Click **"New +"** → Select **"Web Service"**
2. Under **"Public Git repository"**, enter:
   ```
   https://github.com/saudr4e3-sketch/Sot
   ```
3. Click **"Continue"**

### Step 2.3: Configure Backend Build Settings

1. **Name**: Enter `osm-fut-backend`
2. **Environment**: Select **"Python 3"**
3. **Build Command**: 
   ```bash
   cd backend && pip install -r requirements.txt
   ```
4. **Start Command**: 
   ```bash
   cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
5. **Plan**: Select **"Free"**

### Step 2.4: Set Environment Variables (Critical!)

1. Scroll to **"Environment"** section
2. Add these variables:

```env
DATABASE_URL=sqlite:///./osm_fut.db
API_FOOTBALL_KEY=your_api_key_here
API_FOOTBALL_BASE_URL=https://api-football-v1.p.rapidapi.com
CORS_ORIGINS=https://sot-[your-vercel-url].vercel.app
SERVER_HOST=0.0.0.0
SERVER_PORT=8080
DEBUG=false
```

**Important Notes:**
- Replace `sot-[your-vercel-url]` with your actual Vercel URL
- `DATABASE_URL`: SQLite is fine for development; upgrade to PostgreSQL for production
- `API_FOOTBALL_KEY`: Get free key from https://rapidapi.com/api-sports/api/api-football

### Step 2.5: Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (usually 2-3 minutes)
3. You'll see your Render URL: `https://osm-fut-backend.onrender.com`
4. Render will show logs - watch for "Application startup complete"

✅ **Backend is now live!**

---

## 🔄 Part 3: Update Frontend with Backend URL

Now that you have your backend URL, update the frontend:

### Step 3.1: Update Frontend Environment Variables

1. Go to **Vercel Dashboard** → Select your project
2. Click **"Settings"** → **"Environment Variables"**
3. Update the variable:
   - `NEXT_PUBLIC_WS_URL`: Set to `https://osm-fut-backend.onrender.com`
   - `NEXT_PUBLIC_API_URL`: Set to `https://osm-fut-backend.onrender.com/api`

### Step 3.2: Redeploy Frontend

1. Go to **"Deployments"** tab
2. Click the three dots (...) on the latest deployment
3. Select **"Redeploy"**
4. Wait for redeployment to complete

✅ **Frontend and Backend are now connected!**

---

## 📋 Complete Environment Variables Checklist

### ✅ Frontend (.env.local or Vercel)

```env
# WebSocket & API Connections
NEXT_PUBLIC_WS_URL=https://osm-fut-backend.onrender.com
NEXT_PUBLIC_API_URL=https://osm-fut-backend.onrender.com/api

# Other frontend configs
NEXT_PUBLIC_APP_NAME=OSM FUT Dual Battle
NEXT_PUBLIC_APP_VERSION=1.0.0
```

**Important**: 
- Prefix with `NEXT_PUBLIC_` for browser access
- No secrets should be prefixed with `NEXT_PUBLIC_`

### ✅ Backend (.env or Render)

```env
# Database
DATABASE_URL=sqlite:///./osm_fut.db
# OR for PostgreSQL (upgrade to Render PostgreSQL):
# DATABASE_URL=postgresql://user:password@host:port/database

# API Configuration
API_FOOTBALL_KEY=your_rapidapi_key_here
API_FOOTBALL_BASE_URL=https://api-football-v1.p.rapidapi.com

# Server Configuration
SERVER_HOST=0.0.0.0
SERVER_PORT=8080
DEBUG=false

# CORS (Frontend URL)
CORS_ORIGINS=https://your-vercel-url.vercel.app

# Environment
ENVIRONMENT=production
```

---

## 🔗 Part 4: Integration Testing

### Step 4.1: Test WebSocket Connection

1. Open your Vercel frontend: `https://sot-[your-url].vercel.app`
2. Open **Developer Console** (F12)
3. Enter player IDs and start a game
4. Check console logs:
   - Should see: `[WebSocket] ✅ Connected`
   - Should show backend URL in logs

### Step 4.2: Verify CORS Configuration

If you see CORS errors:

1. Check backend environment variable `CORS_ORIGINS`
2. Must include your Vercel URL exactly
3. Example:
   ```
   CORS_ORIGINS=https://sot-myproject.vercel.app,https://sot-myproject-staging.vercel.app
   ```

### Step 4.3: Test Game Flow

✅ **Checklist:**
- [ ] Can enter player IDs on home page
- [ ] WebSocket connects successfully
- [ ] Auction starts and timer counts down
- [ ] Can place bids
- [ ] Can skip
- [ ] Mystery cards are generated
- [ ] Auction completes
- [ ] Can start match simulation
- [ ] Match simulation shows live commentary
- [ ] Footer shows developer signature

---

## 🐛 Troubleshooting

### Problem: "WebSocket connection error"

**Solution:**
1. Check `NEXT_PUBLIC_WS_URL` in Vercel
2. Ensure Render backend is running (check Render dashboard)
3. Verify CORS_ORIGINS in Render backend matches Vercel URL
4. Redeploy both services

### Problem: "CORS error"

**Solution:**
1. Update `CORS_ORIGINS` in Render backend environment
2. Must be exact Vercel URL (include https://)
3. Redeploy backend after changing

### Problem: "Backend shows 'Application failed to start'"

**Solution:**
1. Check Render logs (click "Logs" tab)
2. Verify all environment variables are set
3. Check Python version (must be 3.9+)
4. Verify `requirements.txt` path is correct

### Problem: "502 Bad Gateway"

**Solution:**
1. Backend is likely starting - wait 30 seconds
2. If persists, check Render logs
3. Verify Start Command is correct

---

## 🎯 API Keys Setup

### Getting API-Football Key

1. Go to https://rapidapi.com/api-sports/api/api-football
2. Click **"Subscribe to Test"** (free tier)
3. Copy your API key from the dashboard
4. Add to Render backend environment as `API_FOOTBALL_KEY`

---

## 📊 Production Monitoring

### Monitor Frontend (Vercel)
- Dashboard → Your Project → "Analytics"
- View page speed, requests, errors

### Monitor Backend (Render)
- Dashboard → Your Service → "Logs"
- Watch for errors in real-time
- Check CPU/Memory usage

---

## 🚀 Deployment URLs

Once deployed:

**Frontend**: `https://sot-[your-project].vercel.app`
**Backend**: `https://osm-fut-backend.onrender.com`

---

## 📝 Deployment Checklist

- [ ] GitHub repository is public and connected
- [ ] Vercel project created and linked
- [ ] Frontend environment variables set in Vercel
- [ ] Render service created and linked
- [ ] Backend environment variables set in Render
- [ ] Frontend redeployed with correct backend URL
- [ ] WebSocket connection tested
- [ ] Game flow tested end-to-end
- [ ] CORS configured correctly
- [ ] API-Football key obtained and set
- [ ] Monitoring enabled on both platforms
- [ ] Shared deployment URLs with team

---

## 🔐 Security Best Practices

✅ **DO:**
- Use HTTPS URLs only
- Never commit `.env` files
- Rotate API keys regularly
- Monitor backend logs for errors
- Use environment variables for secrets

❌ **DON'T:**
- Hardcode API keys in code
- Share `.env` files
- Use HTTP (always HTTPS)
- Expose secrets in logs

---

## 📞 Support

**Vercel Issues**: https://vercel.com/support
**Render Issues**: https://render.com/docs
**FastAPI Issues**: https://fastapi.tiangolo.com
**Next.js Issues**: https://nextjs.org/docs

---

## ✅ Final Status

Once complete, your game is:
- ✅ Live and accessible globally
- ✅ Auto-deployed on GitHub updates
- ✅ Real-time WebSocket enabled
- ✅ Fully functional for players
- ✅ Monitored and logged

**Your OSM FUT Dual Battle is LIVE! 🎮**

---

**Developer**: Saud Yahya Al-Faifi | 0535103986
