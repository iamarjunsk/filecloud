export interface User {
  id: string
  email: string
  name: string | null
  avatar: string | null
  quota: number
  usedQuota: number
  isAdmin: boolean
  createdAt: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface FileItem {
  id: string
  name: string
  mimeType: string
  size: number
  path: string
  storageKey: string
  thumbnailKey: string | null
  isPublic: boolean
  userId: string
  folderId: string | null
  createdAt: string
  updatedAt: string
}

export interface FolderItem {
  id: string
  name: string
  path: string
  parentId: string | null
  userId: string
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

export interface FolderContents {
  folders: FolderItem[]
  files: FileItem[]
}
