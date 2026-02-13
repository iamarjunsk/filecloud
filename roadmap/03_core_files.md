# Phase 3: Core File System Backend

**Goal**: Basic file storage and management API (Non-chunked for now).

## Deliverables

- [ ] File & Folder Database Models
- [ ] Storage Service Adapter (Local FS / MinIO S3)
- [ ] CRUD APIs for Files and Folders

## Technical Details

### 3.1 Database Schema (File/Folder)

Refine the `File` `Folder` `FileVersion` models from PRD.

- **Folder**: Self-referential relation (`parentId`).
- **File**: Link to Folder (nullable for root), User.
- **Soft Delete**: `isDeleted`, `deletedAt` for Trash feature.

### 3.2 Storage Adapter Pattern

Create an interface `StorageProvider` to switch between Local and S3.

```typescript
interface StorageProvider {
    upload(file: Buffer, path: string): Promise<string>; // returns key/path
    download(path: string): Promise<ReadableStream>;
    delete(path: string): Promise<void>;
    generatePresignedUrl(path: string): Promise<string>;
}
```

- Implement `MinioProvider` and `LocalProvider`.

### 3.3 Folder Management API

- `POST /api/folders`: Create folder (validate uniqueness in parent).
- `GET /api/folders`: List contents of a folder (by `parentId`).
- `DELETE /api/folders/:id`: Recursive soft delete.

### 3.4 Simple File API (MVP)

- `POST /api/files/upload`: Standard multipart upload (Multer).
- `GET /api/files/:id/download`: Stream file to client.
- `GET /api/files/:id/metadata`: Get file info.
- `DELETE /api/files/:id`: Soft delete.

### 3.5 Handling Quotas

- Middleware to check `User.used + File.size <= User.quota` before upload.
- Update `User.used` on successful upload/delete (atomic transaction).
