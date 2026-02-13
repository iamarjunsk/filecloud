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
  <div class="space-y-6">
    <!-- Folders -->
    <div v-if="folders.length > 0">
      <h2 class="text-sm font-medium text-gray-500 mb-2">Folders</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        <div
          v-for="folder in folders"
          :key="folder.id"
          @click="handleClick(folder.id, true, $event)"
          @contextmenu="handleContextMenu(folder.id, true, $event)"
          class="group flex flex-col items-center p-3 bg-white border rounded-lg hover:shadow-md cursor-pointer transition-all"
          :class="selectedIds.has(folder.id) ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'"
        >
          <FileIcon name="folder" mimeType="" isFolder :size="'lg'" />
          <span class="mt-2 text-sm text-gray-900 truncate w-full text-center">{{ folder.name }}</span>
        </div>
      </div>
    </div>

    <!-- Files -->
    <div v-if="files.length > 0">
      <h2 class="text-sm font-medium text-gray-500 mb-2">Files</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        <div
          v-for="file in files"
          :key="file.id"
          @click="handleClick(file.id, false, $event)"
          @contextmenu="handleContextMenu(file.id, false, $event)"
          @dblclick="emit('open', file.id, false)"
          class="group flex flex-col items-center p-3 bg-white border rounded-lg hover:shadow-md cursor-pointer transition-all"
          :class="selectedIds.has(file.id) ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'"
        >
          <FileIcon :name="file.name" :mimeType="file.mimeType" :size="'lg'" />
          <span class="mt-2 text-sm text-gray-900 truncate w-full text-center">{{ file.name }}</span>
          <span class="text-xs text-gray-500">{{ formatSize(Number(file.size)) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
