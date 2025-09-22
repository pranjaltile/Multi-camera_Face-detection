
# Multi-Camera Face Detection System  

A microservices‑based application that enables:  
- Registering multiple RTSP cameras  
- Viewing live WebRTC camera feeds in the browser  
- Real‑time face detection with overlays  
- Instant alerts, pushed via WebSockets  

Deployed with a **TypeScript backend (Prisma + Vercel)**, a **Go worker for camera processing**, and a **web frontend**.  

---

## Features
- **User Dashboard** – register cameras by providing RTSP URLs.  
- **Streaming** – live camera feeds via WebRTC directly in the browser.  
- **Face Detection Simulation** – Go worker simulates detection until a proper ML pipeline is added.  
- **Alerts** – detections trigger alerts sent to the backend → broadcast to the frontend via WebSockets.  
- **Prisma ORM** – database layer for cameras, alerts, and users.  

---

## Project Structure

```
Multi-camera_Face-detection/
├── backend/       # TypeScript API (Prisma, Vercel-ready)
│   ├── src/
│   │   └── index.ts
│   ├── prisma/    # Prisma schema + migrations
│   ├── package.json
│   ├── tsconfig.json
│   └── ...
├── worker/        # Go worker (camera processor + alert simulator)
│   └── worker.go
├── frontend/      # Web dashboard (WebRTC streams + alert overlay)
└── README.md
```

---

## ⚙️ Backend Setup (TypeScript + Prisma)

### 1. Clone & install
```bash
git clone https://github.com/<your-user>/Multi-camera_Face-detection.git
cd Multi-camera_Face-detection/backend
npm install
```

### 2. Environment variables
Create `.env` in `backend/` with your database connection string:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/skylark"
JWT_SECRET="super-secret-key-change-this"
```

### 3. Prisma setup
```bash
# Push schema to DB
npm run db:push

# Generate Prisma client
npm run db:generate
```

### 4. Development
```bash
npm run dev
```
Runs in watch mode using `tsx`.

### 5. Build + Production
```bash
npm run build   # compile TypeScript → dist/
npm start       # start from dist/index.js
```

---

## Deployment on Vercel

### Important Prisma Fixes
Vercel caches dependencies, so Prisma Client may go stale.  
Fix: run `prisma generate` during builds.  

In `backend/package.json`:
```json
"scripts": {
  "dev": "tsx watch src/index.ts",
  "build": "tsc && prisma generate",
  "start": "node dist/index.js",
  "db:generate": "prisma generate",
  "db:push": "prisma db push",
  "postinstall": "prisma generate"
}
```

This guarantees Prisma Client is always fresh both locally and on Vercel.  

---

## Worker Setup (Go)

### Build & Run Worker
```bash
cd worker
go run worker.go
```

### Env vars
- `BACKEND_URL` – URL of backend (default: `http://localhost:3001`)  
- `PORT` – Worker HTTP port (default: `8080`)  

### Features
- Fetches registered cameras from backend (`/api/cameras`)  
- Simulates face detections (every ~8–10s)  
- Posts alerts to `/api/alerts`  
- Provides HTTP health endpoints:
  - `/health`
  - `/status`  

---

## Frontend
- Displays camera streams via WebRTC.  
- Connects to backend using WebSockets for alert updates.  
- Shows face detection overlays and plays alert sounds.   

---

## Alerts Flow
1. Worker runs detection.  
2. Worker sends alert → `POST /api/alerts`.  
3. Backend stores alert (via Prisma DB).  
4. Backend pings frontend via WebSocket broadcast.  
5. Frontend shows overlay notification instantly.  

---

## Troubleshooting

- **Prisma error on Vercel:**  
  Add `"postinstall": "prisma generate"` in `package.json`.  

- **`exports is not defined in ES module scope`:**  
  Remove `"type": "module"` from `package.json` or set `"module": "esnext"` in `tsconfig.json`.  

- **Worker sends no alerts:**  
  - Ensure backend has `/api/alerts` route.  
  - Fix JSON tags in Go structs (`json:"fieldName"`).  
  - Check worker logs for `Alert sent`.  

---

## Resources
- Prisma on Vercel: https://pris.ly/d/vercel-build  
- Hono (backend framework): https://hono.dev  
- WebRTC basics: https://webrtc.org  

---

## Roadmap
- Replace simulated detection with a real face detection ML model.  
- Add user authentication + roles.  
- Add persistent notifications and alert history UI.  
- Deploy worker as scalable service (Docker + Kubernetes).  



