import { io, Socket } from 'socket.io-client'
import { ref, readonly } from 'vue'

export interface FileEvent {
  type: 'created' | 'updated' | 'deleted'
  userId: string
  folderId?: string | null
  fileId?: string
  data?: any
}

class WebSocketClient {
  private socket: Socket | null = null
  private _connected = ref(false)
  private _events = ref<FileEvent[]>([])

  public connected = readonly(this._connected)
  public events = readonly(this._events)

  connect() {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      console.warn('No token available for WebSocket connection')
      return
    }

    if (this.socket?.connected) {
      return
    }

    this.socket = io(window.location.origin, {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    this.socket.on('connect', () => {
      console.log('WebSocket connected')
      this._connected.value = true
    })

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected')
      this._connected.value = false
    })

    this.socket.on('file:change', (event: FileEvent) => {
      console.log('File event:', event)
      this._events.value.push(event)
    })

    this.socket.on('folder:change', (event: FileEvent) => {
      console.log('Folder event:', event)
      this._events.value.push(event)
    })

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this._connected.value = false
    }
  }

  joinFolder(folderId: string) {
    this.socket?.emit('join:folder', folderId)
  }

  leaveFolder(folderId: string) {
    this.socket?.emit('leave:folder', folderId)
  }

  clearEvents() {
    this._events.value = []
  }

  onFileChange(callback: (event: FileEvent) => void) {
    this.socket?.on('file:change', callback)
  }

  onFolderChange(callback: (event: FileEvent) => void) {
    this.socket?.on('folder:change', callback)
  }
}

export const wsClient = new WebSocketClient()
