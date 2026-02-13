<script setup lang="ts">
import { ref, computed } from 'vue'
import { XMarkIcon, LinkIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/vue/24/outline'
import { shareApi } from '@/api/client'

const props = defineProps<{
  visible: boolean
  itemId: string
  itemType: 'file' | 'folder'
  itemName: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'shared'): void
}>()

const loading = ref(false)
const error = ref<string | null>(null)
const shareLink = ref<string | null>(null)
const copied = ref(false)
const expiresIn = ref<number | null>(null)
const requirePassword = ref(false)
const password = ref('')

const expirationOptions = [
  { value: null, label: 'Never' },
  { value: 3600, label: '1 hour' },
  { value: 86400, label: '24 hours' },
  { value: 604800, label: '7 days' },
  { value: 2592000, label: '30 days' },
]

async function createShare() {
  loading.value = true
  error.value = null

  try {
    const data: any = {
      [props.itemType === 'file' ? 'fileId' : 'folderId']: props.itemId,
    }

    if (expiresIn.value) {
      data.expiresIn = expiresIn.value
    }

    if (requirePassword.value && password.value) {
      data.password = password.value
    }

    const response = await shareApi.create(data)
    const token = response.data.token
    
    shareLink.value = `${window.location.origin}/s/${token}`
  } catch (e: any) {
    error.value = e.response?.data?.error || 'Failed to create share'
  } finally {
    loading.value = false
  }
}

async function copyLink() {
  if (!shareLink.value) return
  
  await navigator.clipboard.writeText(shareLink.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

function handleClose() {
  shareLink.value = null
  error.value = null
  expiresIn.value = null
  requirePassword.value = false
  password.value = ''
  emit('close')
}
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    @click.self="handleClose"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">Share "{{ itemName }}"</h3>
        <button
          @click="handleClose"
          class="text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon class="h-5 w-5" />
        </button>
      </div>

      <!-- Content -->
      <div class="px-6 py-4 space-y-4">
        <!-- Error -->
        <div v-if="error" class="rounded-md bg-red-50 p-3">
          <p class="text-sm text-red-800">{{ error }}</p>
        </div>

        <!-- Share Link -->
        <div v-if="shareLink">
          <label class="block text-sm font-medium text-gray-700 mb-2">Share link</label>
          <div class="flex items-center space-x-2">
            <div class="flex-1 flex items-center px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
              <LinkIcon class="h-5 w-5 text-gray-400 mr-2" />
              <span class="text-sm text-gray-600 truncate">{{ shareLink }}</span>
            </div>
            <button
              @click="copyLink"
              class="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
              :class="copied ? 'text-green-600' : 'text-gray-400'"
            >
              <CheckIcon v-if="copied" class="h-5 w-5" />
              <ClipboardDocumentIcon v-else class="h-5 w-5" />
            </button>
          </div>
          <p v-if="copied" class="mt-1 text-sm text-green-600">Copied to clipboard!</p>
        </div>

        <!-- Options -->
        <div v-else>
          <!-- Expiration -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Link expiration</label>
            <select
              v-model="expiresIn"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option v-for="opt in expirationOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>

          <!-- Password -->
          <div class="mt-4">
            <label class="flex items-center">
              <input
                v-model="requirePassword"
                type="checkbox"
                class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span class="ml-2 text-sm text-gray-700">Require password</span>
            </label>
            <div v-if="requirePassword" class="mt-2">
              <input
                v-model="password"
                type="password"
                placeholder="Enter password"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
        <button
          @click="handleClose"
          class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          Cancel
        </button>
        <button
          v-if="!shareLink"
          @click="createShare"
          :disabled="loading"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {{ loading ? 'Creating...' : 'Create Share Link' }}
        </button>
        <button
          v-else
          @click="shareLink = null"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Create Another
        </button>
      </div>
    </div>
  </div>
</template>
