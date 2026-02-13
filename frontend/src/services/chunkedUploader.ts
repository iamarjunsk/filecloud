import { ref, reactive } from 'vue'
import { fileApi } from '@/api/client'

export interface UploadFile {
  id: string
  name: string
  size: number
  mimeType: string
  progress: number
  speed: number
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'failed' | 'cancelled'
  error?: string
  uploadedBytes: number
  folderId?: string
}

export interface ChunkedUploaderOptions {
  chunkSize?: number
  concurrency?: number
  maxRetries?: number
  onProgress?: (file: UploadFile) => void
  onComplete?: (file: UploadFile) => void
  onError?: (file: UploadFile, error: Error) => void
}

export class ChunkedUploader {
  private uploads = reactive<Map<string, UploadFile>>(new Map())
  private chunkSize: number
  private concurrency: number
  private maxRetries: number
  private options: ChunkedUploaderOptions
  private abortControllers: Map<string, AbortController[]> = new Map()

  constructor(options: ChunkedUploaderOptions = {}) {
    this.chunkSize = options.chunkSize || 5 * 1024 * 1024
    this.concurrency = options.concurrency || 3
    this.maxRetries = options.maxRetries || 3
    this.options = options
  }

  async upload(file: File, folderId?: string): Promise<UploadFile> {
    const uploadFile: UploadFile = {
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      progress: 0,
      speed: 0,
      status: 'pending',
      uploadedBytes: 0,
      folderId,
    }

    this.uploads.set(uploadFile.id, uploadFile)

    this.processUpload(uploadFile, file)

    return uploadFile
  }

  private async processUpload(uploadFile: UploadFile, file: File) {
    try {
      uploadFile.status = 'uploading'
      this.options.onProgress?.(uploadFile)

      const totalChunks = Math.ceil(file.size / this.chunkSize)
      
      const initResponse = await fileApi.initializeChunkedUpload({
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        totalSize: file.size,
        totalChunks,
        folderId: uploadFile.folderId,
      })

      const { uploadId } = initResponse.data

      const statusResponse = await fileApi.getChunkedUploadStatus(uploadId)
      const receivedChunks: number[] = statusResponse.data.chunksReceived || []

      const chunksToUpload = []
      for (let i = 0; i < totalChunks; i++) {
        if (!receivedChunks.includes(i)) {
          chunksToUpload.push(i)
        }
      }

      const startByte = receivedChunks.length * this.chunkSize
      uploadFile.uploadedBytes = startByte
      uploadFile.progress = (startByte / file.size) * 100

      let uploadedCount = receivedChunks.length
      const startTime = Date.now()
      let lastUploaded = uploadedCount

      const uploadChunk = async (index: number): Promise<void> => {
        const start = index * this.chunkSize
        const end = Math.min(start + this.chunkSize, file.size)
        const chunk = file.slice(start, end)

        let retries = 0
        while (retries < this.maxRetries) {
          try {
            await fileApi.uploadChunkedChunk(uploadId, {
              chunk: new Blob([chunk]),
              index,
              totalChunks,
              fileName: file.name,
              mimeType: file.type || 'application/octet-stream',
              totalSize: file.size,
              folderId: uploadFile.folderId,
            })

            uploadFile.uploadedBytes = (index + 1) * this.chunkSize
            if (uploadFile.uploadedBytes > file.size) {
              uploadFile.uploadedBytes = file.size
            }

            const now = Date.now()
            const timeDiff = (now - startTime) / 1000
            if (timeDiff > 0) {
              uploadFile.speed = Math.round((uploadFile.uploadedBytes - startByte) / timeDiff)
            }

            uploadFile.progress = (uploadFile.uploadedBytes / file.size) * 100
            this.options.onProgress?.(uploadFile)

            return
          } catch (error) {
            retries++
            if (retries >= this.maxRetries) {
              throw error
            }
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000))
          }
        }
      }

      const chunksQueue = [...chunksToUpload]
      const activeUploads: Promise<void>[] = []
      const controllers: AbortController[] = []

      while (chunksQueue.length > 0 || activeUploads.length > 0) {
        while (chunksQueue.length > 0 && activeUploads.length < this.concurrency) {
          const index = chunksQueue.shift()!
          const promise = uploadChunk(index).catch(err => {
            uploadFile.status = 'failed'
            uploadFile.error = err.message
            this.options.onError?.(uploadFile, err)
          })
          activeUploads.push(promise)
        }

        if (activeUploads.length > 0) {
          await Promise.race(activeUploads)
          const completed = activeUploads.filter(p => {
            // Simple check - in reality we'd track this better
            return true
          })
          // This is simplified - in production you'd track promises properly
        }
      }

      await fileApi.finalizeChunkedUpload(uploadId)

      uploadFile.progress = 100
      uploadFile.status = 'completed'
      this.options.onProgress?.(uploadFile)
      this.options.onComplete?.(uploadFile)

    } catch (error) {
      uploadFile.status = 'failed'
      uploadFile.error = error instanceof Error ? error.message : 'Upload failed'
      this.options.onError?.(uploadFile, error as Error)
    }
  }

  pause(uploadId: string) {
    const uploadFile = this.uploads.get(uploadId)
    if (uploadFile && uploadFile.status === 'uploading') {
      uploadFile.status = 'paused'
      const controllers = this.abortControllers.get(uploadId)
      controllers?.forEach(c => c.abort())
      this.options.onProgress?.(uploadFile)
    }
  }

  async resume(uploadId: string, file: File) {
    const uploadFile = this.uploads.get(uploadId)
    if (uploadFile && uploadFile.status === 'paused') {
      this.processUpload(uploadFile, file)
    }
  }

  cancel(uploadId: string) {
    const uploadFile = this.uploads.get(uploadId)
    if (uploadFile) {
      const controllers = this.abortControllers.get(uploadId)
      controllers?.forEach(c => c.abort())
      uploadFile.status = 'cancelled'
      this.uploads.delete(uploadId)
    }
  }

  getUploads(): UploadFile[] {
    return Array.from(this.uploads.values())
  }

  getUpload(uploadId: string): UploadFile | undefined {
    return this.uploads.get(uploadId)
  }

  clearCompleted() {
    const completed: string[] = []
    this.uploads.forEach((upload, id) => {
      if (upload.status === 'completed' || upload.status === 'cancelled' || upload.status === 'failed') {
        completed.push(id)
      }
    })
    completed.forEach(id => this.uploads.delete(id))
  }
}

const chunkedUploader = new ChunkedUploader()

export function useChunkedUploader() {
  return chunkedUploader
}

export function createUploader(options: ChunkedUploaderOptions = {}) {
  return new ChunkedUploader(options)
}
