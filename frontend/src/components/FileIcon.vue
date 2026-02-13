<script setup lang="ts">
import { computed } from 'vue'
import {
  FolderIcon,
  DocumentIcon,
  PhotoIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  DocumentArrowDownIcon,
  ArchiveBoxIcon,
} from '@heroicons/vue/24/outline'

const props = defineProps<{
  name: string
  mimeType: string
  isFolder?: boolean
  size?: 'sm' | 'md' | 'lg'
}>()

const iconSize = computed(() => {
  switch (props.size) {
    case 'sm': return 'h-8 w-8'
    case 'lg': return 'h-16 w-16'
    default: return 'h-12 w-12'
  }
})

const iconComponent = computed(() => {
  if (props.isFolder) return FolderIcon

  const type = props.mimeType.toLowerCase()
  
  if (type.startsWith('image/')) return PhotoIcon
  if (type.startsWith('video/')) return VideoCameraIcon
  if (type.startsWith('audio/')) return MusicalNoteIcon
  if (type === 'application/pdf') return DocumentTextIcon
  if (type.startsWith('text/') || type.includes('javascript') || type.includes('json') || type.includes('xml') || type.includes('html')) return CodeBracketIcon
  if (type.includes('zip') || type.includes('rar') || type.includes('tar') || type.includes('gz') || type.includes('7z')) return ArchiveBoxIcon
  if (type.startsWith('application/') || type.startsWith('text/')) return DocumentIcon
  
  return DocumentIcon
})

const iconColor = computed(() => {
  if (props.isFolder) return 'text-yellow-500'
  
  const type = props.mimeType.toLowerCase()
  
  if (type.startsWith('image/')) return 'text-pink-500'
  if (type.startsWith('video/')) return 'text-purple-500'
  if (type.startsWith('audio/')) return 'text-green-500'
  if (type === 'application/pdf') return 'text-red-500'
  if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return 'text-yellow-600'
  if (type.startsWith('text/') || type.includes('code') || type.includes('json')) return 'text-gray-600'
  
  return 'text-gray-400'
})
</script>

<template>
  <component 
    :is="iconComponent" 
    :class="[iconSize, iconColor]"
  />
</template>
