<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { XMarkIcon, ArrowDownTrayIcon, DocumentIcon } from '@heroicons/vue/24/outline'
import { fileApi } from '@/api/client'
import type { FileItem } from '@/types'

const props = defineProps<{
  file: FileItem | null
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const previewUrl = ref<string | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const isImage = computed(() => props.file?.mimeType.startsWith('image/'))
const isPdf = computed(() => props.file?.mimeType === 'application/pdf')
const isVideo = computed(() => props.file?.mimeType.startsWith('video/'))
const isAudio = computed(() => props.file?.mimeType.startsWith('audio/'))
const isText = computed(() => props.file?.mimeType.startsWith('text/'))

async function loadPreview() {
  if (!props.file) return
  
  loading.value = true
  error.value = null
  previewUrl.value = null
  
  try {
    if (isImage.value || isPdf.value || isVideo.value || isAudio.value || isText.value) {
      const response = await fileApi.getPresignedUrl(props.file.id)
      previewUrl.value = response.data.url
    }
  } catch (e) {
    error.value = 'Failed to load preview'
    console.error(e)
  } finally {
    loading.value = false
  }
}

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
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function handleClose() {
  emit('close')
}

function handleDownload() {
  if (!props.file) return
  window.open(`/api/files/${props.file.id}/download`, '_blank')
}

watch(() => props.file, loadPreview)
</script>

<template>
  <div
    v-if="visible && file"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    @click.self="handleClose"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div class="flex items-center space-x-3 min-w-0">
          <DocumentIcon class="h-6 w-6 text-gray-400 flex-shrink-0" />
          <h3 class="text-lg font-medium text-gray-900 truncate">{{ file.name }}</h3>
        </div>
        <div class="flex items-center space-x-2">
          <button
            @click="handleDownload"
            class="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
            title="Download"
          >
            <ArrowDownTrayIcon class="h-5 w-5" />
          </button>
          <button
            @click="handleClose"
            class="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
          >
            <XMarkIcon class="h-5 w-5" />
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-auto p-4 bg-gray-100">
        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center h-full">
          <div class="text-gray-500">Loading preview...</div>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="flex flex-col items-center justify-center h-full">
          <DocumentIcon class="h-24 w-24 text-gray-300 mb-4" />
          <p class="text-gray-500 mb-4">{{ error }}</p>
          <button
            @click="handleDownload"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Download File
          </button>
        </div>

        <!-- Image Preview -->
        <img
          v-else-if="isImage && previewUrl"
          :src="previewUrl"
          :alt="file.name"
          class="max-w-full max-h-[70vh] mx-auto object-contain"
        />

        <!-- PDF Preview -->
        <iframe
          v-else-if="isPdf && previewUrl"
          :src="previewUrl"
          class="w-full h-[70vh] border-0"
        ></iframe>

        <!-- Video Preview -->
        <video
          v-else-if="isVideo && previewUrl"
          :src="previewUrl"
          controls
          class="max-w-full max-h-[70vh] mx-auto"
        ></video>

        <!-- Audio Preview -->
        <audio
          v-else-if="isAudio && previewUrl"
          :src="previewUrl"
          controls
          class="w-full"
        ></audio>

        <!-- Text Preview -->
        <iframe
          v-else-if="isText && previewUrl"
          :src="previewUrl"
          class="w-full h-[70vh] border-0 bg-white"
        ></iframe>

        <!-- No Preview -->
        <div v-else class="flex flex-col items-center justify-center h-full">
          <DocumentIcon class="h-24 w-24 text-gray-300 mb-4" />
          <p class="text-gray-500 mb-4">No preview available</p>
          <button
            @click="handleDownload"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Download File
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <div class="flex items-center justify-between text-sm text-gray-500">
          <span>{{ file.mimeType }}</span>
          <span>{{ formatSize(Number(file.size)) }}</span>
          <span>{{ formatDate(file.updatedAt) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
