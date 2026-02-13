import { ref } from 'vue'
import { fileApi, folderApi } from '@/api/client'
import type { FileItem, FolderItem } from '@/types'

export function useFileActions(onRefresh: () => void) {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function renameFile(id: string, newName: string) {
    loading.value = true
    error.value = null
    try {
      await fileApi.rename(id, { name: newName })
      onRefresh()
    } catch (e: any) {
      error.value = e.response?.data?.error || 'Failed to rename file'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function renameFolder(id: string, newName: string) {
    loading.value = true
    error.value = null
    try {
      await folderApi.rename(id, { name: newName })
      onRefresh()
    } catch (e: any) {
      error.value = e.response?.data?.error || 'Failed to rename folder'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteFile(id: string) {
    loading.value = true
    error.value = null
    try {
      await fileApi.delete(id)
      onRefresh()
    } catch (e: any) {
      error.value = e.response?.data?.error || 'Failed to delete file'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteFolder(id: string) {
    loading.value = true
    error.value = null
    try {
      await folderApi.delete(id)
      onRefresh()
    } catch (e: any) {
      error.value = e.response?.data?.error || 'Failed to delete folder'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function moveFile(fileId: string, targetFolderId: string | null) {
    loading.value = true
    error.value = null
    try {
      await fileApi.move(fileId, { folderId: targetFolderId })
      onRefresh()
    } catch (e: any) {
      error.value = e.response?.data?.error || 'Failed to move file'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function moveFolder(folderId: string, targetFolderId: string | null) {
    loading.value = true
    error.value = null
    try {
      await folderApi.move(folderId, { parentId: targetFolderId })
      onRefresh()
    } catch (e: any) {
      error.value = e.response?.data?.error || 'Failed to move folder'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function downloadFile(file: FileItem) {
    try {
      const response = await fileApi.download(file.id)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', file.name)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (e: any) {
      error.value = e.response?.data?.error || 'Failed to download file'
      throw e
    }
  }

  async function getFileMetadata(fileId: string): Promise<FileItem> {
    try {
      const response = await fileApi.getMetadata(fileId)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.error || 'Failed to get file info'
      throw e
    }
  }

  return {
    loading,
    error,
    renameFile,
    renameFolder,
    deleteFile,
    deleteFolder,
    moveFile,
    moveFolder,
    downloadFile,
    getFileMetadata,
  }
}
