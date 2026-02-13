# FileCloud Setup Guide

## Prerequisites

- WSL (Ubuntu) or Linux system
- Docker & Docker Compose
- Node.js 18+

---

## Quick Start

### 1. Clone & Setup

```bash
# Clone project
cd ~
git clone <repo-url>
cd filecloud

# Start databases
docker-compose up -d
```

### 2. Install Node.js (if needed)

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs
node -v
```

### 3. Setup Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

### 4. Setup Frontend (new terminal)

```bash
cd frontend
npm install
npm run dev
```

---

## Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | - |
| Backend API | http://localhost:3000 | - |
| MinIO Console | http://localhost:9001 | minioadmin / minioadmin |
| PostgreSQL | localhost:5432 | filecloud / filecloud_dev_password |
| Redis | localhost:6379 | - |

---

## Creating Admin & Users

### Option 1: Using API (curl)

**Register a regular user:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"John Doe"}'
```

**Register admin user:**
```bash
# First register normally, then update in database:

cd backend
npx prisma studio
# Or use SQL:
```

**Make user admin via database:**
```bash
cd backend

# Open SQL in prisma
npx prisma db execute --stdin <<< "UPDATE \"User\" SET \"isAdmin\" = true WHERE email = 'admin@example.com';"
```

### Option 2: Using Prisma Studio

```bash
cd backend
npx prisma studio
```

This opens a web interface where you can:
- View all users
- Edit `isAdmin` field to `true`
- Reset passwords

---

## Creating Admin via Seed Script

Create a seed file:

```bash
# backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@filecloud.com' },
    update: {},
    create: {
      email: 'admin@filecloud.com',
      name: 'Admin',
      password,
      isAdmin: true,
    },
  })
  
  console.log('Admin created:', admin.email)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

Run seed:

```bash
# Add to package.json scripts:
# "prisma:seed": "npx tsx prisma/seed.ts"

npm run prisma:seed
```

---

## Default User Roles

| Field | Regular User | Admin |
|-------|--------------|-------|
| isAdmin | false | true |
| quota | 10 GB | 100 GB |
| can delete any file | ❌ | ✅ |
| can view all users | ❌ | ✅ |
| can manage settings | ❌ | ✅ |

---

## Troubleshooting

### Docker not starting
```bash
# Check Docker status
sudo systemctl status docker

# Restart Docker
sudo systemctl restart docker
```

### Port already in use
```bash
# Find what's using the port
sudo lsof -i :5432
sudo lsof -i :6379
sudo lsof -i :9000
```

### Database connection error
```bash
# Wait for Docker to fully start
sleep 5
docker-compose ps
```

### Prisma error
```bash
# Reset database
npx prisma migrate reset

# Or recreate
npx prisma migrate dev --name init --force-reset
```

---

## Development Commands

```bash
# Backend
cd backend
npm run dev          # Start dev server
npm run build        # Build for production
npx prisma studio   # Database GUI

# Frontend
cd frontend
npm run dev         # Start dev server
npm run build      # Build for production

# Docker
docker-compose up -d        # Start all services
docker-compose down         # Stop all services
docker-compose logs -f     # View logs
```

---

## Production Deployment

See `docker-compose.production.yml` and the main README.md for production setup.

---

## Support

For issues, check:
1. Docker containers running: `docker ps`
2. Backend logs: `docker-compose logs backend`
3. Database connected: Visit http://localhost:3000/health
