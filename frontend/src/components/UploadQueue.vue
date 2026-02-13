<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  XMarkIcon, 
  ArrowUpTrayIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  PauseIcon,
  PlayIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/vue/24/outline'
import type { UploadFile } from '@/services/chunkedUploader'

const props = defineProps<{
  uploads: UploadFile[]
}>()

const emit = defineEmits<{
  (e: 'pause', id: string): void
  (e: 'resume', id: string): void
  (e: 'cancel', id: string): void
  (e: 'clear'): void
}>()

const isMinimized = ref(false)
const isExpanded = ref(true)

const activeUploads = computed(() => 
  props.uploads.filter(u => u.status === 'uploading' || u.status === 'pending' || u.status === 'paused')
)

const completedUploads = computed(() => 
  props.uploads.filter(u => u.status === 'completed' || u.status === 'failed' || u.status === 'cancelled')
)

const totalProgress = computed(() => {
  if (activeUploads.value.length === 0) return 0
  const total = activeUploads.value.reduce((acc, u) => acc + u.progress, 0)
  return Math.round(total / activeUploads.value.length)
})

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatSpeed(bytesPerSec: number): string {
  return formatSize(bytesPerSec) + '/s'
}
</script>

<template>
  <div
    v-if="uploads.length > 0"
    class="fixed bottom-4 right-4 z-50 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
  >
    <!-- Header -->
    <div 
      class="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer"
      @click="isExpanded = !isExpanded"
    >
      <div class="flex items-center space-x-2">
        <ArrowUpTrayIcon class="h-5 w-5 text-blue-600" />
        <span class="font-medium text-gray-900">
          {{ activeUploads.length > 0 ? `Uploading ${activeUploads.length} file(s)` : 'Upload Complete' }}
        </span>
      </div>
      <div class="flex items-center space-x-1">
        <button
          v-if="completedUploads.length > 0"
          @click.stop="emit('clear')"
          class="p-1 text-gray-400 hover:text-gray-600"
        >
          <TrashIcon class="h-4 w-4" />
        </button>
        <component 
          :is="isExpanded ? ChevronDownIcon : ChevronUpIcon" 
          class="h-5 w-5 text-gray-400" 
        />
      </div>
    </div>

    <!-- Progress Bar -->
    <div v-if="activeUploads.length > 0" class="px-4 py-2 bg-blue-50">
      <div class="flex items-center justify-between text-sm text-gray-600 mb-1">
        <span>Total Progress</span>
        <span>{{ totalProgress }}%</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div 
          class="bg-blue-600 h-2 rounded-full transition-all duration-300"
          :style="{ width: `${totalProgress}%` }"
        ></div>
      </div>
    </div>

    <!-- Upload List -->
    <div v-if="isExpanded" class="max-h-64 overflow-y-auto">
      <div
        v-for="upload in uploads"
        :key="upload.id"
        class="px-4 py-3 border-b border-gray-100 last:border-b-0"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{{ upload.name }}</p>
            <p class="text-xs text-gray-500">
              <span v-if="upload.status === 'uploading'">
                {{ formatSize(upload.uploadedBytes) }} / {{ formatSize(upload.size) }}
                <span v-if="upload.speed > 0"> · {{ formatSpeed(upload.speed) }}</span>
              </span>
              <span v-else-if="upload.status === 'pending'">Waiting...</span>
              <span v-else-if="upload.status === 'paused'">Paused</span>
              <span v-else-if="upload.status === 'completed'" class="text-green-600">Completed</span>
              <span v-else-if="upload.status === 'failed'" class="text-red-600">Failed: {{ upload.error }}</span>
              <span v-else-if="upload.status === 'cancelled'" class="text-gray-500">Cancelled</span>
            </p>
          </div>
          
          <!-- Actions -->
          <div class="flex items-center space-x-1 ml-2">
            <button
              v-if="upload.status === 'uploading'"
              @click="emit('pause', upload.id)"
              class="p-1 text-gray-400 hover:text-gray-600"
            >
              <PauseIcon class="h-4 w-4" />
            </button>
            <button
              v-if="upload.status === 'paused'"
              @click="emit('resume', upload.id)"
              class="p-1 text-gray-400 hover:text-gray-600"
            >
              <PlayIcon class="h-4 w-4" />
            </button>
            <button
              v-if="upload.status !== 'completed'"
              @click="emit('cancel', upload.id)"
              class="p-1 text-gray-400 hover:text-red-600"
            >
              <XMarkIcon class="h-4 w-4" />
            </button>
            <CheckCircleIcon
              v-if="upload.status === 'completed'"
              class="h-5 w-5 text-green-500"
            />
            <ExclamationCircleIcon
              v-if="upload.status === 'failed'"
              class="h-5 w-5 text-red-500"
            />
          </div>
        </div>

        <!-- Individual Progress -->
        <div v-if="upload.status === 'uploading' || upload.status === 'paused'" class="mt-2">
          <div class="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              class="h-1.5 rounded-full transition-all duration-300"
              :class="upload.status === 'paused' ? 'bg-yellow-500' : 'bg-blue-600'"
              :style="{ width: `${upload.progress}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
