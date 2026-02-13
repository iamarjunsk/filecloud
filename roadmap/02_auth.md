# Phase 2: Authentication & User Management

**Goal**: Secure user access and management with JWT.

## Deliverables

- [ ] User Database Model
- [ ] Authentication API (Register, Login, Refresh, Me)
- [ ] Password Hashing & Security
- [ ] Unit Tests for Auth Logic

## Technical Details

### 2.1 Database Schema (User)

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   // Argon2 or Bcrypt
  name      String
  quota     BigInt   @default(10737418240) // 10GB
  used      BigInt   @default(0)
  isAdmin   Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  files     File[]
  folders   Folder[]
  shares    Share[]
}
```

### 2.2 Auth Implementation

- **Library**: `jsonwebtoken` (JWT), `bcrypt` (Hashing).
- **Endpoints**:
    - `POST /api/auth/register`: Validate email, hash password, create user.
    - `POST /api/auth/login`: Verify creds, issue Access (15m) & Refresh (7d) tokens.
    - `POST /api/auth/refresh`: Rotate tokens.
    - `GET /api/auth/me`: Return user profile & quota.
    - `POST /api/auth/logout`: Invalidate refresh token (requires Redis blacklist or DB tracking).

### 2.3 Middleware

- `authenticate`: Verify JWT, attach `req.user`.
- `authorize(role)`: Check permissions (e.g. admin).

### 2.4 Testing

- Jest/Supertest for API endpoints.
- Verify invalid logins, token expiration, partial updates.
