<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import {
  EyeIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  PencilIcon,
  FolderArrowMoveIcon,
  TrashIcon,
  InformationCircleIcon,
} from '@heroicons/vue/24/outline'

interface MenuItem {
  id: string
  label: string
  icon: any
  danger?: boolean
  divider?: boolean
}

const props = defineProps<{
  x: number
  y: number
  isFolder: boolean
}>()

const emit = defineEmits<{
  (e: 'action', action: string): void
  (e: 'close'): void
}>()

const menuRef = ref<HTMLElement | null>(null)

const menuItems = computed<MenuItem[]>(() => {
  const items: MenuItem[] = [
    { id: 'open', label: 'Open', icon: EyeIcon },
  ]

  if (!props.isFolder) {
    items.push({ id: 'preview', label: 'Preview', icon: EyeIcon })
  }

  items.push(
    { id: 'download', label: 'Download', icon: ArrowDownTrayIcon },
    { id: 'divider1', label: '', icon: '', divider: true },
    { id: 'rename', label: 'Rename', icon: PencilIcon },
    { id: 'move', label: 'Move to...', icon: FolderArrowMoveIcon },
    { id: 'share', label: 'Share', icon: ShareIcon },
    { id: 'divider2', label: '', icon: '', divider: true },
    { id: 'info', label: 'Details', icon: InformationCircleIcon },
    { id: 'divider3', label: '', icon: '', divider: true },
    { id: 'delete', label: 'Delete', icon: TrashIcon, danger: true }
  )

  return items
})

const adjustedPosition = computed(() => {
  const menuWidth = 180
  const menuHeight = menuItems.value.length * 36 + 16
  
  let x = props.x
  let y = props.y
  
  if (x + menuWidth > window.innerWidth) {
    x = window.innerWidth - menuWidth - 10
  }
  
  if (y + menuHeight > window.innerHeight) {
    y = window.innerHeight - menuHeight - 10
  }
  
  return { x, y }
})

function handleAction(action: string) {
  emit('action', action)
}

function handleClickOutside(event: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('contextmenu', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('contextmenu', handleClickOutside)
})
</script>

<template>
  <div
    ref="menuRef"
    class="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[180px]"
    :style="{ left: `${adjustedPosition.x}px`, top: `${adjustedPosition.y}px` }"
  >
    <template v-for="item in menuItems" :key="item.id">
      <div v-if="item.divider" class="my-1 border-t border-gray-100"></div>
      <button
        v-else
        @click="handleAction(item.id)"
        class="w-full flex items-center px-3 py-2 text-sm text-left hover:bg-gray-100 transition-colors"
        :class="item.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'"
      >
        <component :is="item.icon" class="h-4 w-4 mr-3" />
        {{ item.label }}
      </button>
    </template>
  </div>
</template>
