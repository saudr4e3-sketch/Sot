# Frontend Configuration Guide

## Environment Variables for Vercel Deployment

### Required Variables

```env
# ============================================
# WEBSOCKET & API CONFIGURATION
# ============================================

# Must be prefixed with NEXT_PUBLIC_ to access in browser

# WebSocket URL (for real-time game sync)
# Example: https://osm-fut-backend.onrender.com
NEXT_PUBLIC_WS_URL=https://osm-fut-backend.onrender.com

# REST API URL (for player data, health checks)
# Example: https://osm-fut-backend.onrender.com/api
NEXT_PUBLIC_API_URL=https://osm-fut-backend.onrender.com/api

# ============================================
# APPLICATION CONFIGURATION
# ============================================

# App name (shown in header)
NEXT_PUBLIC_APP_NAME=OSM FUT Dual Battle

# App version
NEXT_PUBLIC_APP_VERSION=1.0.0

# ============================================
# ANALYTICS (OPTIONAL)
# ============================================

# Google Analytics ID (if using)
# NEXT_PUBLIC_GA_ID=G-xxxxxxxxxx

# ============================================
# IMPORTANT NOTES
# ============================================

# ✅ DO prefix with NEXT_PUBLIC_ for browser access
# ✅ Secure variables (no prefix) stay in Node.js layer
# ❌ DON'T put secrets with NEXT_PUBLIC_ prefix
# ❌ DON'T commit .env.local to Git
```

## Step-by-Step Setup on Vercel

### 1. Import Repository
1. Login to https://vercel.com
2. Click "New Project"
3. "Import Git Repository"
4. Enter: `https://github.com/saudr4e3-sketch/Sot`
5. Click "Import"

### 2. Configure Project

**Framework Preset**: Next.js

**Root Directory**: Change to `./frontend`

**Build Command**: `npm run build`

**Install Command**: `npm install`

**Output Directory**: `.next` (default)

### 3. Add Environment Variables

Scroll to "Environment Variables" section:

| Variable | Value | Scope |
|----------|-------|-------|
| `NEXT_PUBLIC_WS_URL` | Your Render backend URL | Production |
| `NEXT_PUBLIC_API_URL` | Your Render backend URL + `/api` | Production |
| `NEXT_PUBLIC_APP_NAME` | OSM FUT Dual Battle | Production |
| `NEXT_PUBLIC_APP_VERSION` | 1.0.0 | Production |

### 4. Deploy

Click "Deploy" and wait for completion (1-2 minutes).

Your frontend URL: `https://sot-[project-name].vercel.app`

---

## Environment Variable Details

### NEXT_PUBLIC_WS_URL

**Purpose**: WebSocket connection for real-time auction

**Format**:
```
Protocol: https:// (becomes wss:// for WebSocket)
Host: osm-fut-backend.onrender.com
Port: Auto (Render handles)
```

**Example**:
```
NEXT_PUBLIC_WS_URL=https://osm-fut-backend.onrender.com
```

**Used In**:
- `src/hooks/useWebSocket.ts`
- Real-time bid updates
- Timer synchronization

### NEXT_PUBLIC_API_URL

**Purpose**: REST API calls for player data

**Format**:
```
https://osm-fut-backend.onrender.com/api
```

**Used In**:
- Player list endpoints
- Health checks
- Game initialization

---

## Development vs Production

### Local Development (.env.local)

```env
NEXT_PUBLIC_WS_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### Production (Vercel)

```env
NEXT_PUBLIC_WS_URL=https://osm-fut-backend.onrender.com
NEXT_PUBLIC_API_URL=https://osm-fut-backend.onrender.com/api
```

---

## Testing Environment Variables

### Check Environment Variables are Set

```javascript
// Open browser console on your Vercel site
console.log(process.env.NEXT_PUBLIC_WS_URL)
console.log(process.env.NEXT_PUBLIC_API_URL)
```

### Should output:
```
https://osm-fut-backend.onrender.com
https://osm-fut-backend.onrender.com/api
```

---

## Troubleshooting

### "undefined" environment variables

1. Check variables are set in Vercel dashboard
2. Must be prefixed with `NEXT_PUBLIC_`
3. Redeploy after adding variables
4. Clear browser cache

### WebSocket URL is "localhost"

1. Check Vercel environment variables
2. Ensure production values are set
3. Redeploy frontend

### CORS errors in browser console

1. Verify `NEXT_PUBLIC_WS_URL` is correct
2. Check backend `CORS_ORIGINS` includes your Vercel URL
3. Redeploy both services

---

## Auto-Deploy on GitHub Push

Vercel automatically deploys when you push to GitHub:

1. Make frontend changes
2. `cd frontend`
3. `git add .`
4. `git commit -m "Update frontend"`
5. `git push origin main`
6. Vercel auto-deploys (check dashboard)
7. New build deployed to CDN

---

## Production Best Practices

✅ DO:
- Use `https://` URLs only (becomes `wss://` for WebSocket)
- Set all `NEXT_PUBLIC_` variables in Vercel
- Redeploy after changing environment variables
- Monitor browser console for errors
- Test all game features after deployment

❌ DON'T:
- Commit `.env.local` to Git
- Use `localhost` URLs in production
- Expose secrets in `NEXT_PUBLIC_` variables
- Hardcode URLs in code

---

## Redeploying After Changes

### Option 1: Auto-Deploy via GitHub
```bash
git push origin main  # Automatic redeploy
```

### Option 2: Manual Redeploy in Vercel
1. Vercel Dashboard → Your Project
2. "Deployments" tab
3. Click "..." on latest deployment
4. Select "Redeploy"

---

## Monitoring Frontend

### Vercel Analytics
- Dashboard → Your Project → "Analytics"
- View page load times
- Monitor error rates
- Track user regions

### Browser DevTools
- F12 → Network tab → Monitor WebSocket
- F12 → Console → Watch for errors
- F12 → Application → Check environment vars

---

**For full deployment guide, see: DEPLOYMENT_GUIDE.md**
