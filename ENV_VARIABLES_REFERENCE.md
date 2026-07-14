# 🔐 Environment Variables Complete Reference

## Master Checklist

### Frontend (Vercel)

| Variable | Value | Required | Visible | Notes |
|----------|-------|----------|---------|-------|
| `NEXT_PUBLIC_WS_URL` | `https://osm-fut-backend.onrender.com` | ✅ | Browser | WebSocket URL |
| `NEXT_PUBLIC_API_URL` | `https://osm-fut-backend.onrender.com/api` | ✅ | Browser | REST API URL |
| `NEXT_PUBLIC_APP_NAME` | `OSM FUT Dual Battle` | ❌ | Browser | Display name |
| `NEXT_PUBLIC_APP_VERSION` | `1.0.0` | ❌ | Browser | Version number |

### Backend (Render)

| Variable | Value | Required | Visible | Notes |
|----------|-------|----------|---------|-------|
| `DATABASE_URL` | `sqlite:///./osm_fut.db` | ✅ | Server | Database connection |
| `API_FOOTBALL_KEY` | Your RapidAPI key | ✅ | Server | Player data API |
| `API_FOOTBALL_BASE_URL` | `https://api-football-v1.p.rapidapi.com` | ✅ | Server | API endpoint |
| `CORS_ORIGINS` | Your Vercel URL | ✅ | Server | Frontend origin |
| `SERVER_HOST` | `0.0.0.0` | ✅ | Server | Listen address |
| `SERVER_PORT` | `8080` | ✅ | Server | Listen port |
| `DEBUG` | `false` | ✅ | Server | Debug mode |
| `ENVIRONMENT` | `production` | ✅ | Server | Environment |

---

## Detailed Configuration

### FRONTEND VARIABLES

#### 1. NEXT_PUBLIC_WS_URL

**Purpose**: WebSocket connection for real-time game updates

**Type**: URL (Public - accessible in browser)

**Format**:
```
https://osm-fut-backend.onrender.com
```

**Protocol Handling**:
- Frontend receives: `https://`
- Automatically converts to: `wss://` (secure WebSocket)

**Example Usage** (in code):
```javascript
const wsUrl = `wss://${WS_URL.replace(/^https?:\/\//,'')}/api/ws/...`
```

**How It's Used**:
- Auction real-time updates
- 30-second timer synchronization
- Bid validation
- Match completion

---

#### 2. NEXT_PUBLIC_API_URL

**Purpose**: REST API calls

**Type**: URL (Public - accessible in browser)

**Format**:
```
https://osm-fut-backend.onrender.com/api
```

**How It's Used**:
- Fetch player list: `GET /api/players`
- Health checks: `GET /health`
- Player details: `GET /api/players/{id}`

---

#### 3. NEXT_PUBLIC_APP_NAME (Optional)

**Default**: OSM FUT Dual Battle

---

#### 4. NEXT_PUBLIC_APP_VERSION (Optional)

**Default**: 1.0.0

---

### BACKEND VARIABLES

#### 1. DATABASE_URL (Required)

**Purpose**: Database connection

**Options**:

**SQLite** (Simple, for development):
```
sqlite:///./osm_fut.db
```

**PostgreSQL** (Production):
```
postgresql://username:password@localhost:5432/osm_fut
```

**When to Use**:
- SQLite: MVP, testing, small scale
- PostgreSQL: Production, multiple concurrent users

---

#### 2. API_FOOTBALL_KEY (Required)

**Purpose**: Authentication for player data API

**How to Get**:
1. Visit https://rapidapi.com/api-sports/api/api-football
2. Click "Subscribe to Test" (free tier)
3. Authorize
4. Copy API key from dashboard

**Format**: Long alphanumeric string

**Example**:
```
ABC123DEF456GHI789JKL012MNO345PQR678
```

**Used For**:
- Fetching real player data
- Player ratings and statistics
- Team information

---

#### 3. API_FOOTBALL_BASE_URL (Required)

**Purpose**: Base endpoint for API calls

**Value**:
```
https://api-football-v1.p.rapidapi.com
```

**Don't Change**: This is the official endpoint

---

#### 4. CORS_ORIGINS (Required)

**Purpose**: Allow frontend to connect to backend

**Format**:
```
https://sot-your-project.vercel.app
```

**Multiple Origins** (comma-separated):
```
https://sot-main.vercel.app,https://sot-staging.vercel.app
```

**Important Notes**:
- ✅ Include `https://`
- ✅ No trailing slash
- ✅ Must match Vercel URL exactly
- ❌ Don't use `*` (security risk)
- ❌ Don't use `localhost` in production

**If CORS errors occur**:
1. Verify this value matches your Vercel URL
2. Redeploy backend
3. Check browser console for exact URL
4. Update if mismatch

---

#### 5. SERVER_HOST (Required)

**Purpose**: Which network interface to listen on

**Value**: `0.0.0.0` (all interfaces)

**For Render**: Always `0.0.0.0`

---

#### 6. SERVER_PORT (Required)

**Purpose**: Port number to listen on

**Value**: `8080`

**Note**: Render assigns PORT automatically; FastAPI will use $PORT if available

---

#### 7. DEBUG (Required)

**Purpose**: Enable/disable debug mode

**Values**:
- `false` - Production (recommended)
- `true` - Development only

**Production**: Always set to `false`

---

#### 8. ENVIRONMENT (Required)

**Purpose**: Define deployment environment

**Values**:
- `production` - Live environment
- `staging` - Pre-production testing
- `development` - Local development

**For Render**: Set to `production`

---

## Quick Setup Commands

### Test Backend Variables (Local)

```bash
cd backend

# Create .env file
cat > .env << EOF
DATABASE_URL=sqlite:///./osm_fut.db
API_FOOTBALL_KEY=your_key_here
API_FOOTBALL_BASE_URL=https://api-football-v1.p.rapidapi.com
CORS_ORIGINS=http://localhost:3000
SERVER_HOST=0.0.0.0
SERVER_PORT=8000
DEBUG=true
ENVIRONMENT=development
EOF

# Run backend
python -m uvicorn app.main:app --reload
```

### Test Frontend Variables (Local)

```bash
cd frontend

# Create .env.local file
cat > .env.local << EOF
NEXT_PUBLIC_WS_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000/api
EOF

# Run frontend
npm run dev
```

---

## Deployment Verification

### Check Frontend Variables

```bash
# Access Vercel-deployed site
# Open browser console (F12)
# Run:
console.log(process.env.NEXT_PUBLIC_WS_URL)
console.log(process.env.NEXT_PUBLIC_API_URL)

# Should output your Render URLs
```

### Check Backend Variables

```bash
# Call health endpoint
curl https://osm-fut-backend.onrender.com/health

# Should respond:
# {"status": "healthy", "message": "Server is running"}
```

### Test Connection

```bash
# From browser console on Vercel site:
const ws = new WebSocket('wss://osm-fut-backend.onrender.com/api/ws/game/test/player1')
ws.onopen = () => console.log('✅ WebSocket Connected!')
ws.onerror = (e) => console.error('❌ WebSocket Error', e)
```

---

## Troubleshooting

### Error: "WebSocket connection refused"

**Cause**: Backend URL incorrect or service not running

**Fix**:
1. Verify `NEXT_PUBLIC_WS_URL` is set
2. Check Render backend is running
3. Verify backend URL is correct
4. Redeploy frontend

### Error: "CORS error"

**Cause**: `CORS_ORIGINS` doesn't match frontend URL

**Fix**:
1. Get exact Vercel URL from browser
2. Update `CORS_ORIGINS` in Render environment
3. Include `https://`
4. Redeploy backend

### Error: "API_FOOTBALL_KEY invalid"

**Cause**: Wrong or expired API key

**Fix**:
1. Go to https://rapidapi.com/api-sports/api/api-football
2. Get fresh key
3. Update in Render environment
4. Redeploy backend

---

## Security Best Practices

✅ **DO**:
- Use `https://` URLs only
- Store secrets in environment variables
- Rotate API keys regularly
- Use different keys for dev/prod
- Monitor logs for errors

❌ **DON'T**:
- Commit `.env` files
- Use `http://` in production
- Share API keys
- Hardcode URLs
- Use `localhost` in production

---

## Summary Table

| What | Where | How |
|------|-------|-----|
| **WebSocket URL** | Vercel Env Vars | `NEXT_PUBLIC_WS_URL` |
| **API URL** | Vercel Env Vars | `NEXT_PUBLIC_API_URL` |
| **Database** | Render Env Vars | `DATABASE_URL` |
| **API Key** | Render Env Vars | `API_FOOTBALL_KEY` |
| **CORS** | Render Env Vars | `CORS_ORIGINS` |
| **Frontend** | Automatically synced | Git → Vercel |
| **Backend** | Automatically synced | Git → Render |

---

**For full deployment instructions: DEPLOYMENT_GUIDE.md**
