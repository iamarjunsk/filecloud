<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  FolderIcon,
  ShareIcon,
  TrashIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { mobileService } from '@/services/mobileService'

const authStore = useAuthStore()
const router = useRouter()
const sidebarOpen = ref(false)
const isMobile = ref(false)

const navigation = [
  { name: 'Files', href: '/files', icon: FolderIcon },
  { name: 'Shared', href: '/shared', icon: ShareIcon },
  { name: 'Trash', href: '/trash', icon: TrashIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
]

onMounted(() => {
  isMobile.value = mobileService.isMobile()
})

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Mobile Header -->
    <div v-if="isMobile" class="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-20 flex items-center px-4 safe-area-top">
      <button @click="toggleSidebar" class="p-2 -ml-2 text-gray-600">
        <Bars3Icon v-if="!sidebarOpen" class="h-6 w-6" />
        <XMarkIcon v-else class="h-6 w-6" />
      </button>
      <FolderIcon class="h-6 w-6 text-blue-600 ml-2" />
      <span class="ml-2 text-lg font-semibold text-gray-900">FileCloud</span>
    </div>

    <!-- Desktop Sidebar -->
    <div v-if="!isMobile" class="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-10">
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
            class="group flex items-center px-3 py-3 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900 touch-manipulation"
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
            <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span class="text-sm font-medium text-blue-600">
                {{ authStore.user?.name?.[0] || authStore.user?.email[0] }}
              </span>
            </div>
            <div class="ml-3 flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">
                {{ authStore.user?.name || authStore.user?.email }}
              </p>
              <p class="text-xs text-gray-500 truncate">{{ authStore.user?.email }}</p>
            </div>
            <button
              @click="handleLogout"
              class="ml-2 p-2 rounded-md text-gray-400 hover:text-gray-600 touch-manipulation"
            >
              <ArrowRightOnRectangleIcon class="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Sidebar Overlay -->
    <div v-if="isMobile && sidebarOpen" class="fixed inset-0 bg-black/50 z-30" @click="sidebarOpen = false">
      <div class="fixed inset-y-0 left-0 w-64 bg-white z-40" @click.stop>
        <div class="flex flex-col h-full">
          <div class="flex items-center h-16 px-6 border-b border-gray-200">
            <FolderIcon class="h-8 w-8 text-blue-600" />
            <span class="ml-2 text-xl font-semibold text-gray-900">FileCloud</span>
          </div>
          <nav class="flex-1 px-3 py-4 space-y-1">
            <router-link
              v-for="item in navigation"
              :key="item.name"
              :to="item.href"
              @click="sidebarOpen = false"
              class="group flex items-center px-3 py-3 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 touch-manipulation"
              active-class="bg-gray-100 text-gray-900"
            >
              <component
                :is="item.icon"
                class="mr-3 flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-gray-500"
              />
              {{ item.name }}
            </router-link>
          </nav>
        </div>
      </div>
    </div>

    <!-- Mobile Bottom Navigation -->
    <div v-if="isMobile" class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20 safe-area-bottom">
      <nav class="flex justify-around py-2">
        <router-link
          v-for="item in navigation"
          :key="item.name"
          :to="item.href"
          class="flex flex-col items-center px-4 py-2 text-gray-600 touch-manipulation"
          active-class="text-blue-600"
        >
          <component :is="item.icon" class="h-6 w-6" />
          <span class="text-xs mt-1">{{ item.name }}</span>
        </router-link>
      </nav>
    </div>

    <!-- Main content -->
    <div :class="isMobile ? 'pt-14 pb-16' : 'pl-64'">
      <main class="flex-1">
        <slot />
      </main>
    </div>
  </div>
</template>
