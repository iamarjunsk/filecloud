<script setup lang="ts">
import type { FileItem, FolderItem } from '@/types'
import FileIcon from '@/components/FileIcon.vue'

const props = defineProps<{
  folders: FolderItem[]
  files: FileItem[]
  selectedIds: Set<string>
}>()

const emit = defineEmits<{
  (e: 'select', id: string, event: MouseEvent): void
  (e: 'open', id: string, isFolder: boolean): void
  (e: 'contextmenu', id: string, isFolder: boolean, event: MouseEvent): void
}>()

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function handleClick(id: string, isFolder: boolean, event: MouseEvent) {
  emit('select', id, event)
  emit('open', id, isFolder)
}

function handleContextMenu(id: string, isFolder: boolean, event: MouseEvent) {
  event.preventDefault()
  emit('contextmenu', id, isFolder, event)
}
</script>

<template>
  <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <!-- Header -->
    <div class="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
      <div class="col-span-6">Name</div>
      <div class="col-span-2">Size</div>
      <div class="col-span-4">Modified</div>
    </div>

    <!-- Content -->
    <div class="divide-y divide-gray-100">
      <!-- Folders -->
      <div
        v-for="folder in folders"
        :key="folder.id"
        @click="handleClick(folder.id, true, $event)"
        @contextmenu="handleContextMenu(folder.id, true, $event)"
        class="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
        :class="selectedIds.has(folder.id) ? 'bg-blue-50' : ''"
      >
        <div class="col-span-6 flex items-center space-x-3">
          <FileIcon name="folder" mimeType="" isFolder />
          <span class="text-sm text-gray-900 truncate">{{ folder.name }}</span>
        </div>
        <div class="col-span-2 flex items-center text-sm text-gray-500">--</div>
        <div class="col-span-4 flex items-center text-sm text-gray-500">
          {{ formatDate(folder.updatedAt) }}
        </div>
      </div>

      <!-- Files -->
      <div
        v-for="file in files"
        :key="file.id"
        @click="handleClick(file.id, false, $event)"
        @contextmenu="handleContextMenu(file.id, false, $event)"
        @dblclick="emit('open', file.id, false)"
        class="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
        :class="selectedIds.has(file.id) ? 'bg-blue-50' : ''"
      >
        <div class="col-span-6 flex items-center space-x-3">
          <FileIcon :name="file.name" :mimeType="file.mimeType" />
          <span class="text-sm text-gray-900 truncate">{{ file.name }}</span>
        </div>
        <div class="col-span-2 flex items-center text-sm text-gray-500">
          {{ formatSize(Number(file.size)) }}
        </div>
        <div class="col-span-4 flex items-center text-sm text-gray-500">
          {{ formatDate(file.updatedAt) }}
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="folders.length === 0 && files.length === 0" class="px-4 py-12 text-center text-gray-500">
        No files or folders
      </div>
    </div>
  </div>
</template>
