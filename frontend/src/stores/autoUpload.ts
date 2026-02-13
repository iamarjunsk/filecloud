import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Preferences } from '@capacitor/preferences'
import BackgroundUpload from '@/plugins/backgroundUpload'

interface MediaItem {
  id: string
  path: string
  name: string
  timestamp: number
}

export const useAutoUploadStore = defineStore('autoUpload', () => {
  const isEnabled = ref(false)
  const isWatching = ref(false)
  const lastSyncTime = ref<number>(0)
  const pendingUploads = ref<MediaItem[]>([])
  const uploadedIds = ref<Set<string>>(new Set())

  const STORAGE_KEYS = {
    ENABLED: 'auto_upload_enabled',
    LAST_SYNC: 'auto_upload_last_sync',
    UPLOADED_IDS: 'auto_upload_uploaded_ids',
  }

  async function initialize() {
    try {
      const enabled = await Preferences.get({ key: STORAGE_KEYS.ENABLED })
      isEnabled.value = enabled.value === 'true'

      const lastSync = await Preferences.get({ key: STORAGE_KEYS.LAST_SYNC })
      lastSyncTime.value = parseInt(lastSync.value || '0')

      const uploadedIdsStr = await Preferences.get({ key: STORAGE_KEYS.UPLOADED_IDS })
      if (uploadedIdsStr.value) {
        const ids = JSON.parse(uploadedIdsStr.value) as string[]
        uploadedIds.value = new Set(ids)
      }
    } catch (error) {
      console.error('Failed to initialize auto upload store:', error)
    }
  }

  async function setEnabled(enabled: boolean) {
    isEnabled.value = enabled
    await Preferences.set({ key: STORAGE_KEYS.ENABLED, value: enabled.toString() })

    if (enabled) {
      await startWatching()
    } else {
      await stopWatching()
    }
  }

  async function startWatching() {
    if (isWatching.value) return

    isWatching.value = true
    await scanMedia()
    
    setInterval(async () => {
      if (isEnabled.value) {
        await scanMedia()
      }
    }, 60000)
  }

  async function stopWatching() {
    isWatching.value = false
  }

  async function scanMedia() {
    try {
      console.log('Scanning for new media...')
      
      const mockNewItems: MediaItem[] = []
      
      for (const item of mockNewItems) {
        if (!uploadedIds.value.has(item.id)) {
          pendingUploads.value.push(item)
          await queueUpload(item)
        }
      }

      lastSyncTime.value = Date.now()
      await Preferences.set({ 
        key: STORAGE_KEYS.LAST_SYNC, 
        value: lastSyncTime.value.toString() 
      })
    } catch (error) {
      console.error('Failed to scan media:', error)
    }
  }

  async function queueUpload(item: MediaItem) {
    try {
      const apiUrl = localStorage.getItem('apiUrl') || '/api'
      
      await BackgroundUpload.enqueue({
        filePath: item.path,
        url: `${apiUrl}/files/upload`,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      })

      uploadedIds.value.add(item.id)
      await saveUploadedIds()
      
      pendingUploads.value = pendingUploads.value.filter(i => i.id !== item.id)
    } catch (error) {
      console.error('Failed to queue upload:', error)
    }
  }

  async function saveUploadedIds() {
    const ids = Array.from(uploadedIds.value)
    await Preferences.set({
      key: STORAGE_KEYS.UPLOADED_IDS,
      value: JSON.stringify(ids),
    })
  }

  async function clearUploadedHistory() {
    uploadedIds.value.clear()
    await Preferences.remove({ key: STORAGE_KEYS.UPLOADED_IDS })
  }

  return {
    isEnabled,
    isWatching,
    lastSyncTime,
    pendingUploads,
    initialize,
    setEnabled,
    startWatching,
    stopWatching,
    scanMedia,
    clearUploadedHistory,
  }
})
