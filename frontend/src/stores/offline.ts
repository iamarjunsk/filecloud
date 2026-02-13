import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Preferences } from '@capacitor/preferences'
import type { FileItem, FolderItem } from '@/types'
import { fileApi } from '@/api/client'

interface OfflineFile {
  id: string
  name: string
  localPath: string
  remotePath: string
  size: number
  mimeType: string
  folderId: string | null
  downloadedAt: number
}

export const useOfflineStore = defineStore('offline', () => {
  const offlineFiles = ref<OfflineFile[]>([])
  const isInitialized = ref(false)
  const isOffline = ref(!navigator.onLine)

  const STORAGE_KEY = 'offline_files'

  async function initialize() {
    if (!Capacitor.isNativePlatform()) {
      isInitialized.value = true
      return
    }

    window.addEventListener('online', () => {
      isOffline.value = false
      syncPendingChanges()
    })

    window.addEventListener('offline', () => {
      isOffline.value = true
    })

    try {
      const stored = await Preferences.get({ key: STORAGE_KEY })
      if (stored.value) {
        offlineFiles.value = JSON.parse(stored.value)
      }
    } catch (error) {
      console.error('Failed to load offline files:', error)
    }

    isInitialized.value = true
  }

  async function saveOfflineFiles() {
    await Preferences.set({
      key: STORAGE_KEY,
      value: JSON.stringify(offlineFiles.value),
    })
  }

  async function downloadFileForOffline(file: FileItem, folderId: string | null): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.warn('Offline storage is only available on mobile platforms')
      return
    }

    try {
      const response = await fileApi.download(file.id)
      const blob = new Blob([response.data])
      
      const folder = folderId || 'root'
      const localPath = `offline/${folder}/${file.id}_${file.name}`
      
      await Filesystem.writeFile({
        path: localPath,
        data: blob,
        directory: Directory.Data,
        encoding: 'binary',
      })

      const offlineFile: OfflineFile = {
        id: file.id,
        name: file.name,
        localPath,
        remotePath: file.path,
        size: Number(file.size),
        mimeType: file.mimeType,
        folderId,
        downloadedAt: Date.now(),
      }

      offlineFiles.value.push(offlineFile)
      await saveOfflineFiles()
    } catch (error) {
      console.error('Failed to download file for offline:', error)
      throw error
    }
  }

  async function removeFromOffline(fileId: string) {
    const file = offlineFiles.value.find(f => f.id === fileId)
    if (!file) return

    try {
      if (Capacitor.isNativePlatform()) {
        await Filesystem.deleteFile({
          path: file.localPath,
          directory: Directory.Data,
        })
      }
    } catch (error) {
      console.error('Failed to delete local file:', error)
    }

    offlineFiles.value = offlineFiles.value.filter(f => f.id !== fileId)
    await saveOfflineFiles()
  }

  function isFileAvailableOffline(fileId: string): boolean {
    return offlineFiles.value.some(f => f.id === fileId)
  }

  function getOfflineFile(fileId: string): OfflineFile | undefined {
    return offlineFiles.value.find(f => f.id === fileId)
  }

  async function getLocalFileUrl(fileId: string): Promise<string | null> {
    const file = getOfflineFile(fileId)
    if (!file) return null

    if (!Capacitor.isNativePlatform()) {
      return null
    }

    try {
      const result = await Filesystem.getUri({
        path: file.localPath,
        directory: Directory.Data,
      })
      return result.uri
    } catch (error) {
      console.error('Failed to get local file URI:', error)
      return null
    }
  }

  async function clearAllOfflineFiles() {
    if (Capacitor.isNativePlatform()) {
      try {
        await Filesystem.deleteFolder({
          path: 'offline',
          directory: Directory.Data,
        })
      } catch (error) {
        console.error('Failed to clear offline folder:', error)
      }
    }

    offlineFiles.value = []
    await saveOfflineFiles()
  }

  function getOfflineSize(): number {
    return offlineFiles.value.reduce((acc, f) => acc + f.size, 0)
  }

  async function syncPendingChanges() {
    if (isOffline.value) return

    console.log('Syncing pending changes...')
  }

  return {
    offlineFiles,
    isInitialized,
    isOffline,
    initialize,
    downloadFileForOffline,
    removeFromOffline,
    isFileAvailableOffline,
    getOfflineFile,
    getLocalFileUrl,
    clearAllOfflineFiles,
    getOfflineSize,
    syncPendingChanges,
  }
})
