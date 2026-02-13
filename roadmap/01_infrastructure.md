# Phase 1: Infrastructure & Database Setup

**Goal**: Establish a robust backend environment with containerized services.

## Deliverables

- [ ] Docker Compose environment (PostgreSQL, Redis, MinIO)
- [ ] Node.js Express Server Scaffolding
- [ ] Database Schema Migration (Prisma)
- [ ] Basic System Health Check API

## Technical Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: PostgreSQL (v15+)
- **ORM**: Prisma
- **Cache**: Redis (v7+)
- **Storage**: MinIO (S3 compatible)

## Tasks

### 1.1 Project Scaffolding

- Initialize monorepo structure: `backend/`, `frontend/`.
- Setup `backend` package.json with TypeScript, ESLint, Prettier.
- Configure `tsconfig.json` for Node.js.

### 1.2 Docker Infrastructure

- Create `docker-compose.yml`:
    - **PostgreSQL**: Port 5432, specific user/db.
    - **Redis**: Port 6379, usage for caching/queues.
    - **MinIO**: Ports 9000/9001, create default buckets (`files`, `thumbnails`).
- Ensure persistent volumes for all services.

### 1.3 Database Setup

- Initialize Prisma: `npx prisma init`.
- Define initial `schema.prisma` (User, File, Folder models - Draft 1).
- Run migrations: `npx prisma migrate dev --name init`.

### 1.4 Express Server

- Setup `src/app.ts` and `src/server.ts`.
- Implement Global Error Handling Middleware.
- Implement Request Logger (Morgan/Pino).
- Create `GET /health` endpoint checking DB/Redis/S3 connectivity.
