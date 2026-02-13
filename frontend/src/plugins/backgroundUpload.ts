import { registerPlugin } from '@capacitor/core'

export interface BackgroundUploadOptions {
  filePath: string
  url: string
  headers?: Record<string, string>
}

export interface BackgroundUploadResult {
  success: boolean
  message?: string
}

export interface BackgroundUploadPlugin {
  enqueue(options: BackgroundUploadOptions): Promise<BackgroundUploadResult>
  cancelAll(): Promise<{ success: boolean }>
}

const BackgroundUpload = registerPlugin<BackgroundUploadPlugin>('BackgroundUpload')

export default BackgroundUpload
