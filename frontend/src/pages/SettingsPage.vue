<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useBiometric } from '@/composables/useBiometric'
import { useAutoUploadStore } from '@/stores/autoUpload'
import { useOfflineStore } from '@/stores/offline'
import DashboardLayout from '@/layouts/DashboardLayout.vue'

const authStore = useAuthStore()
const { isAvailable, isEnabled, isUnlocked, biometricType, setEnabled, authenticate } = useBiometric()
const autoUploadStore = useAutoUploadStore()
const offlineStore = useOfflineStore()

const biometricLabel = computed(() => {
  switch (biometricType.value) {
    case 'fingerprint': return 'Fingerprint'
    case 'face': return 'Face ID'
    default: return 'Biometric'
  }
})

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

async function handleBiometricToggle() {
  if (isEnabled.value) {
    await setEnabled(false)
  } else {
    const result = await authenticate()
    if (result.success) {
      await setEnabled(true)
    }
  }
}

async function handleAutoUploadToggle() {
  await autoUploadStore.setEnabled(!autoUploadStore.isEnabled)
}

onMounted(() => {
  autoUploadStore.initialize()
  offlineStore.initialize()
})
</script>

<template>
  <DashboardLayout>
    <div class="px-4 py-6 sm:px-6 lg:px-8">
      <h1 class="text-2xl font-semibold text-gray-900 mb-6">Settings</h1>
      
      <div class="max-w-2xl space-y-6">
        <!-- Profile Section -->
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Profile</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Email</label>
              <p class="mt-1 text-gray-900">{{ authStore.user?.email }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Name</label>
              <p class="mt-1 text-gray-900">{{ authStore.user?.name || 'Not set' }}</p>
            </div>
          </div>
        </div>

        <!-- Storage Section -->
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Storage</h2>
          <div class="space-y-4">
            <div>
              <div class="flex justify-between text-sm text-gray-600 mb-1">
                <span>Used</span>
                <span>{{ (authStore.user?.usedQuota / 1024 / 1024 / 1024).toFixed(2) }} GB / {{ (authStore.user?.quota / 1024 / 1024 / 1024).toFixed(2) }} GB</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="bg-blue-600 h-2 rounded-full"
                  :style="{ width: `${((authStore.user?.usedQuota || 0) / (authStore.user?.quota || 1)) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Security Section -->
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Security</h2>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-700">{{ biometricLabel }}</p>
                <p class="text-xs text-gray-500">Use {{ biometricType }} to unlock the app</p>
              </div>
              <button
                v-if="isAvailable"
                @click="handleBiometricToggle"
                class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="isEnabled ? 'bg-blue-600' : 'bg-gray-200'"
              >
                <span
                  class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                  :class="isEnabled ? 'translate-x-5' : 'translate-x-0'"
                />
              </button>
              <p v-else class="text-sm text-gray-500">Not available</p>
            </div>
          </div>
        </div>

        <!-- Mobile Section -->
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Mobile</h2>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-700">Auto-upload Photos</p>
                <p class="text-xs text-gray-500">Automatically upload new photos</p>
              </div>
              <button
                @click="handleAutoUploadToggle"
                class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="autoUploadStore.isEnabled ? 'bg-blue-600' : 'bg-gray-200'"
              >
                <span
                  class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                  :class="autoUploadStore.isEnabled ? 'translate-x-5' : 'translate-x-0'"
                />
              </button>
            </div>

            <div class="pt-4 border-t border-gray-200">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-700">Offline Storage</p>
                  <p class="text-xs text-gray-500">{{ formatSize(offlineStore.getOfflineSize()) }} used</p>
                </div>
                <button
                  @click="offlineStore.clearAllOfflineFiles()"
                  class="text-sm text-red-600 hover:text-red-800"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>
