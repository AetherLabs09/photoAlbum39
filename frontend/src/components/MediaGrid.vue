<template>
  <div class="media-grid">
    <div
      v-for="media in mediaList"
      :key="media.id"
      class="media-item"
      :class="{ selected: isSelected(media) }"
      @click="handleClick(media)"
    >
      <el-checkbox
        class="checkbox"
        :model-value="isSelected(media)"
        @click.stop="toggleSelect(media)"
      />
      <img
        v-if="media.thumbnail_path"
        :src="media.thumbnail_path"
        :alt="media.original_name"
      />
      <img
        v-else-if="media.file_type === 'image'"
        :src="media.file_path"
        :alt="media.original_name"
      />
      <video
        v-else-if="media.file_type === 'video'"
        :src="media.file_path"
      />
      <span class="type-badge">{{ media.file_type === 'video' ? '视频' : '图片' }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useMediaStore } from '../stores'

const mediaStore = useMediaStore()

const mediaList = computed(() => mediaStore.mediaList)

const isSelected = (media) => {
  return mediaStore.selectedMedia.some(m => m.id === media.id)
}

const toggleSelect = (media) => {
  mediaStore.toggleSelection(media)
}

const handleClick = (media) => {
  mediaStore.setCurrentMedia(media)
}
</script>
