# Backend Configuration Guide

## Environment Variables for Render Deployment

### Required Variables

```env
# ============================================
# DATABASE CONFIGURATION
# ============================================

# For SQLite (Simple, suitable for MVP)
DATABASE_URL=sqlite:///./osm_fut.db

# OR for PostgreSQL (Production, upgrade needed)
# DATABASE_URL=postgresql://username:password@hostname:port/database

# ============================================
# API CONFIGURATION
# ============================================

# RapidAPI Key for football player data
# Get from: https://rapidapi.com/api-sports/api/api-football
API_FOOTBALL_KEY=your_rapidapi_key_here

# API Football endpoint
API_FOOTBALL_BASE_URL=https://api-football-v1.p.rapidapi.com

# ============================================
# SERVER CONFIGURATION
# ============================================

# Server host (0.0.0.0 for Render)
SERVER_HOST=0.0.0.0

# Server port (Render assigns PORT env var, but we set 8080)
SERVER_PORT=8080

# ============================================
# CORS CONFIGURATION
# ============================================

# Frontend URLs (comma-separated)
# CRITICAL: Must include your Vercel frontend URL
CORS_ORIGINS=https://sot-your-project.vercel.app

# Example with multiple URLs:
# CORS_ORIGINS=https://sot-main.vercel.app,https://sot-staging.vercel.app

# ============================================
# DEPLOYMENT CONFIGURATION
# ============================================

# Environment (development, staging, production)
ENVIRONMENT=production

# Debug mode (set to false in production)
DEBUG=false

# ============================================
# SECURITY
# ============================================

# WebSocket timeout (seconds)
WS_TIMEOUT=300

# Max concurrent connections
MAX_CONNECTIONS=1000
```

## Step-by-Step Setup on Render

### 1. Create Web Service
1. Login to https://render.com
2. Click "New +" → "Web Service"
3. Connect GitHub repository: `https://github.com/saudr4e3-sketch/Sot`
4. Select "osm-fut-backend" as the service name

### 2. Configure Build Settings

**Environment**: Python 3

**Build Command**:
```bash
cd backend && pip install -r requirements.txt
```

**Start Command**:
```bash
cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### 3. Add Environment Variables

In Render dashboard → Environment:

| Key | Value | Required |
|-----|-------|----------|
| `DATABASE_URL` | `sqlite:///./osm_fut.db` | ✅ Yes |
| `API_FOOTBALL_KEY` | Your RapidAPI key | ✅ Yes |
| `API_FOOTBALL_BASE_URL` | `https://api-football-v1.p.rapidapi.com` | ✅ Yes |
| `CORS_ORIGINS` | Your Vercel frontend URL | ✅ Yes |
| `SERVER_HOST` | `0.0.0.0` | ✅ Yes |
| `SERVER_PORT` | `8080` | ✅ Yes |
| `DEBUG` | `false` | ✅ Yes |
| `ENVIRONMENT` | `production` | ✅ Yes |

### 4. Deploy

Click "Create Web Service" and wait for deployment.

---

## Getting API-Football Key

1. Visit https://rapidapi.com/api-sports/api/api-football
2. Click "Subscribe to Test" (free tier)
3. Authorize with GitHub or email
4. Go to your API dashboard
5. Find the API key in the top right
6. Copy and paste into Render environment

---

## Health Check Endpoints

### Test Backend is Running

```bash
# Health check
curl https://osm-fut-backend.onrender.com/health

# Expected response:
{"status": "healthy", "message": "Server is running"}
```

### Test WebSocket Connection

```bash
# From frontend console
const ws = new WebSocket('wss://osm-fut-backend.onrender.com/api/ws/game/test/player1')
ws.onopen = () => console.log('Connected!')
```

---

## Troubleshooting

### Backend won't start

1. Check logs in Render dashboard → "Logs" tab
2. Verify Python version: `python --version` (must be 3.9+)
3. Check requirements.txt exists in backend directory
4. Verify start command path is correct

### CORS errors

1. Ensure `CORS_ORIGINS` matches your Vercel URL exactly
2. Include `https://` in the URL
3. No trailing slash
4. Redeploy after changing

### WebSocket connection fails

1. Check `wss://` protocol (secure WebSocket)
2. Verify Render service is running
3. Check CORS configuration
4. Verify network allows WebSocket connections

### Database errors

1. For SQLite: Ensure directory is writable
2. For PostgreSQL: Verify connection string format
3. Check database credentials in environment

---

## Monitoring

### View Logs

Render Dashboard → Your Service → "Logs" tab

### Watch for:
- ✅ "Application startup complete"
- ⚠️ "WebSocket connection error"
- ❌ "Connection refused"

### Performance Metrics

Render Dashboard → "Metrics" tab:
- CPU Usage
- Memory Usage
- Response Time
- Error Rate

---

## Auto-Deploy on GitHub Push

Render automatically deploys when you push to GitHub:

1. Make code changes
2. `git commit -m "message"`
3. `git push origin main`
4. Check Render dashboard → "Deployments"
5. Service redeploys automatically

---

## Production Best Practices

✅ DO:
- Use environment variables for all secrets
- Set DEBUG=false in production
- Monitor logs regularly
- Use PostgreSQL for production databases
- Enable CORS only for trusted origins

❌ DON'T:
- Commit .env files
- Set DEBUG=true in production
- Expose API keys in logs
- Use hardcoded URLs
- Allow CORS from "*"

---

## Database Upgrade (Optional)

### Upgrade from SQLite to PostgreSQL

1. Add Render PostgreSQL add-on
2. Get connection string
3. Update `DATABASE_URL` in environment
4. Redeploy backend

Render handles database URL in `$DATABASE_URL` automatically.

---

**For full deployment guide, see: DEPLOYMENT_GUIDE.md**
