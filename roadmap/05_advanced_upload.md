# Phase 5: Advanced Upload Pipeline

**Goal**: Implement robust, resumable, chunked file uploads for large files and unreliable networks.

## Deliverables

- [ ] Backend: Chunked Upload API Endpoints
- [ ] Backend: File Assembly Service
- [ ] Frontend: Chunked Uploader Service (TypeScript Class)
- [ ] UI: Global Upload Progress Indicator

## Technical Architecture

### 5.1 Chunked Upload Protocol

- **Chunk Size**: 5MB (Configurable).
- **Concurrency**: 3 parallel chunks.
- **Flow**:
    1. Client splits file into chunks.
    2. Uploads chunks `POST /api/files/upload-chunk` (FormData: `chunk`, `index`, `uploadId`, `hash`).
    3. Server stores temp chunks.
    4. Client calls `POST /api/files/finalize-upload` on completion.
    5. Server assembles chunks, validates size/hash, moves to storage, deletes temp.

### 5.2 Backend Implementation

- **Temp Storage**: `uploads/temp/{uploadId}/`.
- **Cleanup Job**: Cron job to remove stale temp folders (>24h).
- **Endpoints**:
    - `POST /api/files/upload-chunk`: Idempotent handling (check if chunk exists).
    - `GET /api/files/upload-status/{uploadId}`: Return list of received chunks (for Resume).
    - `POST /api/files/finalize-upload`: Assembly logic.

### 5.3 Frontend Service (`ChunkedUploader.ts`)

- Features:
    - **Queue Management**: Manage multiple file uploads.
    - **Retry Logic**: Exponential backoff for failed chunks.
    - **Pause/Resume**: Abort requests, save state, resume by checking server status.
    - **Progress Tracking**: Calculate total progress from chunk progress.

### 5.4 UI Components

- `UploadQueue.vue`: Floating bottom-right panel.
- Shows individual file progress, speed, pause/cancel buttons.
- Minimizable to run in background (Web Worker optional for performance).
