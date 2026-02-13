# Phase 7: Real-time Sync & Sharing

**Goal**: Enable real-time updates across devices and implement file sharing.

## Deliverables

- [ ] WebSocket Server (Socket.io)
- [ ] Redis Pub/Sub integration
- [ ] Frontend Sync Store (Pinia)
- [ ] Public Sharing Mechanism

## Technical Details

### 7.1 WebSocket Architecture

- **Server**: Socket.io server attached to Express.
- **Events**: `file:created`, `file:updated`, `file:deleted`.
- **Rooms**: Join rooms by `userId` or `folderId`.
- **Redis Adapter**: Enable horizontal scaling and pub/sub for events.

### 7.2 Sync Logic

- **Backend Trigger**: Database hooks (Prisma middleware) or Service layer emit events to Redis.
- **Frontend Listener**: `useSyncStore`.
- On `connect`: Authenticate with JWT.
- On `file:update`: Update local Pinia cache if viewing that folder.
- **Conflict Handling**: "Last Write Wins" for metadata. Versioning for file content.

### 7.3 Public Sharing

- **Model**: `Share` (token, fileId, expiresAt, password).
- **API**:
    - `POST /api/shares`: Generate token.
    - `GET /s/:token`: Public access page (Vue view).
    - `POST /s/:token/validate`: Password check.
- **Download**: `GET /api/public/:token/download`.
- **UI**: Share Dialog with link copy and settings.
