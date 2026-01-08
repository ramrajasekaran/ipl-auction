# IPL Auction - Deployment Guide

## Local Development

No environment variables needed - app uses defaults:
```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

Access: `http://localhost:5173`

---

## Production Deployment

### 1. Backend (Render)

**Create Web Service:**
- Repository: Your GitHub repo
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `node server.js`

**Environment Variables:**
| Variable | Value |
|----------|-------|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `CORS_ORIGIN` | `https://ipl-auction-frontend.vercel.app` (or your Vercel domain) |
| `JWT_SECRET` | Strong random string |
| `SESSION_SECRET` | Strong random string |
| `NODE_ENV` | `production` |

### 2. Frontend (Vercel)

**Deploy Settings:**
- Framework Preset: Vite
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

**Environment Variables:**
| Variable | Value |
|----------|-------|
| `VITE_SOCKET_URL` | `https://ipl-auction-8a8o.onrender.com` |
| `VITE_API_BASE` | `/api` |

---

## Architecture

```
[Browser] → [Vercel Frontend]
               ↓ Socket.IO (direct)
               ↓ API (/api/* proxy)
           [Render Backend] → [MongoDB Atlas]
```

- **API calls:** Proxied through Netlify → Render
- **Socket.IO:** Direct WebSocket connection to Render
