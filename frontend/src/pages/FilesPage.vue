<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { folderApi } from '@/api/client'
import type { FolderContents, FileItem, FolderItem } from '@/types'
import { FolderIcon, ArrowUpTrayIcon, Squares2X2Icon, ListBulletIcon } from '@heroicons/vue/24/outline'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import UploadQueue from '@/components/UploadQueue.vue'
import Breadcrumbs from '@/components/Breadcrumbs.vue'
import FileGrid from '@/components/FileGrid.vue'
import FileList from '@/components/FileList.vue'
import ContextMenu from '@/components/ContextMenu.vue'
import PreviewModal from '@/components/PreviewModal.vue'
import { ChunkedUploader, type UploadFile } from '@/services/chunkedUploader'
import { useFileActions } from '@/composables/useFileActions'

const router = useRouter()
const route = useRoute()

const contents = ref<FolderContents>({ folders: [], files: [] })
const loading = ref(false)
const currentFolderId = computed(() => route.params.folderId as string | undefined)
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploads = reactive<Map<string, UploadFile>>(new Map())

const viewMode = ref<'grid' | 'list'>('grid')
const selectedIds = ref<Set<string>>(new Set())

const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  itemId: '',
  isFolder: false,
})

const previewModal = reactive({
  visible: false,
  file: null as FileItem | null,
})

const uploader = new ChunkedUploader({
  chunkSize: 5 * 1024 * 1024,
  concurrency: 3,
  onProgress: (upload) => {
    uploads.set(upload.id, { ...upload })
  },
  onComplete: (upload) => {
    uploads.set(upload.id, { ...upload })
    loadContents()
  },
  onError: (upload) => {
    uploads.set(upload.id, { ...upload })
  },
})

const { renameFile, renameFolder, deleteFile, deleteFolder, downloadFile } = useFileActions(loadContents)

async function loadContents() {
  loading.value = true
  try {
    const response = await folderApi.getContents(currentFolderId.value || undefined)
    contents.value = response.data
  } catch (error) {
    console.error('Failed to load contents:', error)
  } finally {
    loading.value = false
  }
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

async function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (!files) return

  for (const file of files) {
    uploader.upload(file, currentFolderId.value)
  }

  input.value = ''
}

async function handleCreateFolder() {
  const name = prompt('Enter folder name:')
  if (!name) return

  try {
    await folderApi.create({ 
      name, 
      parentId: currentFolderId.value || undefined 
    })
    loadContents()
  } catch (error) {
    console.error('Failed to create folder:', error)
    alert('Failed to create folder')
  }
}

function handlePauseUpload(id: string) {
  uploader.pause(id)
}

function handleResumeUpload(id: string) {
  const upload = uploads.get(id)
  if (upload) {
    const file = new File([], upload.name, { type: upload.mimeType })
    uploader.resume(id, file)
  }
}

function handleCancelUpload(id: string) {
  uploader.cancel(id)
  uploads.delete(id)
}

function handleClearUploads() {
  uploader.clearCompleted()
}

function handleSelect(id: string, event: MouseEvent) {
  if (event.ctrlKey || event.metaKey) {
    if (selectedIds.value.has(id)) {
      selectedIds.value.delete(id)
    } else {
      selectedIds.value.add(id)
    }
  } else if (event.shiftKey && selectedIds.value.size > 0) {
    const allIds = [
      ...contents.value.folders.map(f => f.id),
      ...contents.value.files.map(f => f.id)
    ]
    const lastSelected = Array.from(selectedIds.value).pop()
    const lastIndex = allIds.indexOf(lastSelected || '')
    const currentIndex = allIds.indexOf(id)
    const start = Math.min(lastIndex, currentIndex)
    const end = Math.max(lastIndex, currentIndex)
    for (let i = start; i <= end; i++) {
      selectedIds.value.add(allIds[i])
    }
  } else {
    selectedIds.value.clear()
    selectedIds.value.add(id)
  }
}

function handleOpen(id: string, isFolder: boolean) {
  if (isFolder) {
    router.push(`/files/${id}`)
  } else {
    const file = contents.value.files.find(f => f.id === id)
    if (file) {
      previewModal.file = file
      previewModal.visible = true
    }
  }
}

function handleContextMenu(id: string, isFolder: boolean, event: MouseEvent) {
  if (!selectedIds.value.has(id)) {
    selectedIds.value.clear()
    selectedIds.value.add(id)
  }
  contextMenu.itemId = id
  contextMenu.isFolder = isFolder
  contextMenu.x = event.clientX
  contextMenu.y = event.clientY
  contextMenu.visible = true
}

function closeContextMenu() {
  contextMenu.visible = false
}

async function handleContextAction(action: string) {
  const id = contextMenu.itemId
  const isFolder = contextMenu.isFolder
  
  closeContextMenu()

  switch (action) {
    case 'open':
    case 'preview':
      handleOpen(id, isFolder)
      break
    case 'download':
      if (!isFolder) {
        const file = contents.value.files.find(f => f.id === id)
        if (file) await downloadFile(file)
      }
      break
    case 'rename':
      const newName = prompt('Enter new name:')
      if (newName) {
        if (isFolder) {
          await renameFolder(id, newName)
        } else {
          await renameFile(id, newName)
        }
      }
      break
    case 'delete':
      if (confirm('Are you sure you want to delete this item?')) {
        if (isFolder) {
          await deleteFolder(id)
        } else {
          await deleteFile(id)
        }
      }
      break
    case 'info':
      if (!isFolder) {
        const file = contents.value.files.find(f => f.id === id)
        if (file) {
          alert(`Name: ${file.name}\nSize: ${file.size}\nType: ${file.mimeType}\nCreated: ${file.createdAt}`)
        }
      }
      break
  }
}

function closePreview() {
  previewModal.visible = false
  previewModal.file = null
}

onMounted(() => {
  loadContents()
})
</script>

<template>
  <DashboardLayout>
    <div class="px-4 py-6 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center space-x-4">
          <h1 class="text-2xl font-semibold text-gray-900">Files</h1>
          <Breadcrumbs />
        </div>
        <div class="flex items-center space-x-3">
          <!-- View Toggle -->
          <div class="flex items-center border border-gray-300 rounded-md">
            <button
              @click="viewMode = 'grid'"
              class="p-2"
              :class="viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'"
            >
              <Squares2X2Icon class="h-5 w-5" />
            </button>
            <button
              @click="viewMode = 'list'"
              class="p-2"
              :class="viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'"
            >
              <ListBulletIcon class="h-5 w-5" />
            </button>
          </div>
          
          <button
            @click="triggerFileInput"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowUpTrayIcon class="h-5 w-5 mr-2" />
            Upload
          </button>
          <input
            ref="fileInputRef"
            type="file"
            multiple
            class="hidden"
            @change="handleFileSelect"
          />
          <button
            @click="handleCreateFolder"
            class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FolderIcon class="h-5 w-5 mr-2" />
            New Folder
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-500">Loading...</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="contents.folders.length === 0 && contents.files.length === 0" class="text-center py-12">
        <FolderIcon class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900">No files or folders</h3>
        <p class="mt-1 text-sm text-gray-500">Get started by uploading a file or creating a folder.</p>
      </div>

      <!-- File Browser -->
      <FileGrid
        v-else-if="viewMode === 'grid'"
        :folders="contents.folders"
        :files="contents.files"
        :selected-ids="selectedIds"
        @select="handleSelect"
        @open="handleOpen"
        @contextmenu="handleContextMenu"
      />
      
      <FileList
        v-else
        :folders="contents.folders"
        :files="contents.files"
        :selected-ids="selectedIds"
        @select="handleSelect"
        @open="handleOpen"
        @contextmenu="handleContextMenu"
      />

      <!-- Context Menu -->
      <ContextMenu
        v-if="contextMenu.visible"
        :x="contextMenu.x"
        :y="contextMenu.y"
        :is-folder="contextMenu.isFolder"
        @action="handleContextAction"
        @close="closeContextMenu"
      />

      <!-- Preview Modal -->
      <PreviewModal
        :file="previewModal.file"
        :visible="previewModal.visible"
        @close="closePreview"
      />

      <!-- Upload Queue -->
      <UploadQueue 
        :uploads="Array.from(uploads.values())"
        @pause="handlePauseUpload"
        @resume="handleResumeUpload"
        @cancel="handleCancelUpload"
        @clear="handleClearUploads"
      />
    </div>
  </DashboardLayout>
</template>
