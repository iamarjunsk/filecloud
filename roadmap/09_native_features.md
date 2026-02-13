# Phase 9: Native Features & Offline

**Goal**: Implement native Android capabilities for a premium mobile experience.

## Deliverables

- [ ] Custom Background Upload Plugin
- [ ] Camera Auto-Upload
- [ ] Biometric Authentication
- [ ] Offline Caching (SQLite/Filesystem)

## Technical Details

### 9.1 Background Upload Plugin

- **Why**: Standard JS `fetch` dies when app is backgrounded.
- **Impl**: Custom Capacitor Plugin (Kotlin).
- **Service**: Android Foreground Service with Notification.
- **Interface**: `BackgroundUpload.enqueue({ path, url, headers })`.

### 9.2 Camera Auto-Upload

- **Plugin**: `MediaScanner` / `PhotoLibrary`.
- **Logic**:
    - Monitor `MediaStore` for new images.
    - Check against local database of uploaded IDs.
    - Queue new items to Background Upload service.

### 9.3 Biometrics

- **Plugin**: `@capacitor-community/native-biometric` or official.
- **Flow**:
    - On App Resume/Launch -> Show Biometric Prompt.
    - Unlock App State on success.

### 9.4 Offline First

- **Storage**: `@capacitor/filesystem` for files, SQLite for metadata.
- **Logic**:
    - User marks folder offline -> Download all files to `Directory.Data`.
    - Database stores `localPath` mapping.
    - File Opener: Check if local exists -> open local; else -> stream/download.
