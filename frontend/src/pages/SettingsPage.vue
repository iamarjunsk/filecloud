<script setup lang="ts">
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
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
      </div>
    </div>
  </DashboardLayout>
</template>
