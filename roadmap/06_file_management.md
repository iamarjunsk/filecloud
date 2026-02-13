# Phase 6: File Management UI

**Goal**: Build the core interface for browsing and managing files.

## Deliverables

- [ ] File Browser (Grid/List Views)
- [ ] Folder Navigation (Breadcrumbs)
- [ ] Context Menus & Actions
- [ ] File Previews

## Components

### 6.1 File Browser Components

- `FileBrowser.vue`: Main container. Handles fetching data based on route/current folder.
- `FileList.vue` / `FileGrid.vue`: Layouts.
- `FileIcon.vue`: Map mime-types to icons (Folder, Image, PDF, Code, Video).
- `Breadcrumbs.vue`: Navigation path visualization (`Home > Work > Project`).

### 6.2 Operations Logic (`useFileActions`)

- **Selection**: Click to select, Shift+Click range, Ctrl+Click multi.
- **Drag & Drop**:
    - Drop files from OS -> Upload.
    - Drop files into folders -> Move operation.
- **Actions**:
    - **Rename**: Inline edit or modal.
    - **Move**: Modal with folder tree picker.
    - **Delete**: Move to Trash (soft delete).
    - **Download**: Trigger browser download.

### 6.3 Context Menu

- Custom Right-Click menu.
- Options: Open, Download, Share, Rename, Move, Star, Info, Delete.

### 6.4 Preview System

- `PreviewModal.vue`: Overlay.
- **Images**: Display directly.
- **PDF**: Use object tag or `pdf.js`.
- **Video/Audio**: HTML5 players.
- **Text/Code**: Light syntax highlighter.
- **Others**: "No preview available" placeholder with Download button.
