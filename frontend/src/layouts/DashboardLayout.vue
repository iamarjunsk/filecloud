<script setup lang="ts">
import { ref } from 'vue'
import {
  HomeIcon,
  FolderIcon,
  ShareIcon,
  TrashIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const sidebarOpen = ref(true)

const navigation = [
  { name: 'Files', href: '/files', icon: FolderIcon },
  { name: 'Shared', href: '/shared', icon: ShareIcon },
  { name: 'Trash', href: '/trash', icon: TrashIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
]

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Sidebar -->
    <div class="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-10">
      <div class="flex flex-col h-full">
        <!-- Logo -->
        <div class="flex items-center h-16 px-6 border-b border-gray-200">
          <FolderIcon class="h-8 w-8 text-blue-600" />
          <span class="ml-2 text-xl font-semibold text-gray-900">FileCloud</span>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-3 py-4 space-y-1">
          <router-link
            v-for="item in navigation"
            :key="item.name"
            :to="item.href"
            class="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            active-class="bg-gray-100 text-gray-900"
          >
            <component
              :is="item.icon"
              class="mr-3 flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-gray-500"
            />
            {{ item.name }}
          </router-link>
        </nav>

        <!-- User section -->
        <div class="border-t border-gray-200 p-4">
          <div class="flex items-center">
            <div class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span class="text-sm font-medium text-blue-600">
                {{ authStore.user?.name?.[0] || authStore.user?.email[0] }}
              </span>
            </div>
            <div class="ml-3 flex-1">
              <p class="text-sm font-medium text-gray-900">
                {{ authStore.user?.name || authStore.user?.email }}
              </p>
              <p class="text-xs text-gray-500">{{ authStore.user?.email }}</p>
            </div>
            <button
              @click="handleLogout"
              class="ml-2 p-1 rounded-md text-gray-400 hover:text-gray-600"
            >
              <ArrowRightOnRectangleIcon class="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main content -->
    <div class="pl-64">
      <main class="flex-1">
        <slot />
      </main>
    </div>
  </div>
</template>
