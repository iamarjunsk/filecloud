# FileCloud Development Roadmap Overview

This roadmap breaks down the FileCloud project into 10 distinct phases, ensuring a structured approach to building the self-hosted cloud storage solution.

| Phase                                | Title               | Focus                                                       |
| ------------------------------------ | ------------------- | ----------------------------------------------------------- |
| **[01](01_infrastructure.md)**       | Infrastructure & DB | Docker, Postgres, Redis, MinIO, Node.js Setup               |
| **[02](02_auth.md)**                 | Authentication      | User Management, JWT, Quotas, Security                      |
| **[03](03_core_files.md)**           | Core File System    | File/Folder Models, Basic S3/Local Storage, CRUD            |
| **[04](04_frontend_foundations.md)** | Frontend Foundation | Vue 3, Pinia, Router, UI Framework                          |
| **[05](05_advanced_upload.md)**      | Advanced Uploads    | **Critical**: Chunked, Resumable Uploads (Backend/Frontend) |
| **[06](06_file_management.md)**      | File Manager UI     | Grid/List View, Previews, Operations, Drag & Drop           |
| **[07](07_sync_sharing.md)**         | Sync & Sharing      | **Critical**: WebSocket Sync, Redis Pub/Sub, Share Links    |
| **[08](08_mobile_foundation.md)**    | Mobile Foundation   | Capacitor Setup, Android Build, Responsive Layouts          |
| **[09](09_native_features.md)**      | Native Features     | Background Uploads, Camera Sync, Biometrics, Offline        |
| **[10](10_production.md)**           | Production          | Performance, Security, CI/CD, Final Polish                  |

## Key Technical Highlights

- **Chunked Upload Protocol**: Custom implementation for reliability.
- **Offline-First**: Capacitor SQLite + Local Filesystem caching.
- **Real-Time Sync**: Socket.io + Redis for multi-device synchronization.
