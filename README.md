# FileCloud

A full-featured file management application with cloud storage, real-time sync, and mobile support.

## Features

- **Authentication** - JWT-based auth with refresh tokens
- **File Management** - Upload, download, organize files in folders
- **Chunked Uploads** - Resumable large file uploads (5MB chunks)
- **Real-time Sync** - WebSocket-based live updates across devices
- **Public Sharing** - Share files via password-protected links
- **Mobile App** - Native Android app via Capacitor
- **Biometric Auth** - Fingerprint/Face ID on mobile
- **Offline Support** - Download files for offline access
- **Auto-upload** - Background photo backup on mobile

## Tech Stack

### Backend
- Node.js + Express
- PostgreSQL + Prisma
- Redis (caching/sessions)
- MinIO (S3-compatible storage)
- Socket.io (WebSocket)
- Sharp (image thumbnails)

### Frontend
- Vue 3 + TypeScript
- Pinia (state management)
- Vue Router
- Tailwind CSS
- Capacitor (mobile wrapper)

## Project Structure

```
filecloud/
├── backend/              # Express API server
│   ├── src/
│   │   ├── config/      # Configuration
│   │   ├── controllers/ # Route handlers
│   │   ├── middleware/  # Auth, rate limiting
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   └── app.ts       # Express app
│   ├── prisma/          # Database schema
│   └── Dockerfile
├── frontend/            # Vue 3 web app
│   ├── src/
│   │   ├── api/        # Axios client
│   │   ├── components/ # Vue components
│   │   ├── composables/ # Vue composables
│   │   ├── layouts/    # Page layouts
│   │   ├── pages/      # Route pages
│   │   ├── services/   # Business services
│   │   ├── stores/     # Pinia stores
│   │   └── router/     # Vue Router
│   └── Dockerfile
├── nginx/              # Nginx configs
├── docker-compose.yml  # Development setup
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- npm or yarn

### Development Setup

1. **Start infrastructure services:**
```bash
docker-compose up -d
```

2. **Setup backend:**
```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run dev
```

3. **Setup frontend:**
```bash
cd frontend
npm install
npm run dev
```

4. **Access the app:**
- Web: http://localhost:5173
- API: http://localhost:3000

### Production Deployment

1. **Configure environment:**
```bash
cp backend/.env.production backend/.env
# Edit with your production values
```

2. **Build and run:**
```bash
docker-compose -f docker-compose.production.yml up -d --build
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get profile

### Files
- `POST /api/files/upload` - Upload file
- `GET /api/files/:id` - Get metadata
- `GET /api/files/:id/download` - Download
- `DELETE /api/files/:id` - Delete
- `PATCH /api/files/:id` - Rename

### Folders
- `POST /api/folders` - Create folder
- `GET /api/folders` - List contents
- `DELETE /api/folders/:id` - Delete

### Sharing
- `POST /api/shares` - Create share link
- `GET /api/shares/me` - List user shares
- `GET /s/:token` - Access shared file

## Mobile Development

```bash
cd frontend

# Add Android platform
npx cap add android

# Open in Android Studio
npx cap open android

# Build APK
npx cap sync android
npx cap build android
```

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
JWT_SECRET=your-secret
```

## License

MIT
