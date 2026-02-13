<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { folderApi } from '@/api/client'
import { HomeIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()

interface BreadcrumbItem {
  id: string | null
  name: string
}

const breadcrumbs = ref<BreadcrumbItem[]>([{ id: null, name: 'Home' }])
const loading = ref(false)

async function loadBreadcrumbs(folderId: string | null) {
  loading.value = true
  try {
    if (!folderId) {
      breadcrumbs.value = [{ id: null, name: 'Home' }]
      return
    }

    const path = await folderApi.getPath(folderId)
    breadcrumbs.value = [
      { id: null, name: 'Home' },
      ...path.data.map((p: any) => ({ id: p.id, name: p.name }))
    ]
  } catch (error) {
    console.error('Failed to load breadcrumbs:', error)
    breadcrumbs.value = [{ id: null, name: 'Home' }]
  } finally {
    loading.value = false
  }
}

function navigateTo(folderId: string | null) {
  if (folderId === null) {
    router.push('/files')
  } else {
    router.push(`/files/${folderId}`)
  }
}

watch(
  () => route.params.folderId,
  (newFolderId) => {
    loadBreadcrumbs(newFolderId as string || null)
  },
  { immediate: true }
)
</script>

<template>
  <nav class="flex items-center space-x-1 text-sm">
    <button
      @click="navigateTo(null)"
      class="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
    >
      <HomeIcon class="h-5 w-5" />
    </button>
    
    <template v-for="(item, index) in breadcrumbs.slice(1)" :key="item.id">
      <ChevronRightIcon class="h-4 w-4 text-gray-400" />
      <button
        @click="navigateTo(item.id)"
        class="text-gray-500 hover:text-gray-700 transition-colors"
        :class="{ 'font-medium text-gray-900': index === breadcrumbs.length - 2 }"
      >
        {{ item.name }}
      </button>
    </template>
  </nav>
</template>
