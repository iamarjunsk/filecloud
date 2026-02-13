import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { wsClient, type FileEvent } from '@/services/webSocketClient'

export const useSyncStore = defineStore('sync', () => {
  const pendingEvents = ref<FileEvent[]>([])
  const isConnected = ref(false)

  const hasUpdates = computed(() => pendingEvents.value.length > 0)

  function initialize() {
    wsClient.connect()
    isConnected.value = true

    wsClient.onFileChange((event) => {
      pendingEvents.value.push(event)
    })

    wsClient.onFolderChange((event) => {
      pendingEvents.value.push(event)
    })
  }

  function disconnect() {
    wsClient.disconnect()
    isConnected.value = false
  }

  function joinFolder(folderId: string) {
    wsClient.joinFolder(folderId)
  }

  function leaveFolder(folderId: string) {
    wsClient.leaveFolder(folderId)
  }

  function clearPendingEvents() {
    pendingEvents.value = []
  }

  function consumeEvent(): FileEvent | undefined {
    return pendingEvents.value.shift()
  }

  return {
    pendingEvents,
    isConnected,
    hasUpdates,
    initialize,
    disconnect,
    joinFolder,
    leaveFolder,
    clearPendingEvents,
    consumeEvent,
  }
})
