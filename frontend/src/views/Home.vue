<template>
  <div class="content-area">
    <MediaGrid v-if="mediaList.length > 0" />
    <div v-else class="empty-state">
      <el-icon><PictureFilled /></el-icon>
      <p>暂无照片</p>
      <p>点击上方"上传"按钮添加照片</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useMediaStore, useAlbumStore } from '../stores'
import MediaGrid from '../components/MediaGrid.vue'

const mediaStore = useMediaStore()
const albumStore = useAlbumStore()

const mediaList = computed(() => mediaStore.mediaList)

onMounted(() => {
  mediaStore.fetchMedia()
  mediaStore.fetchTimeline()
})

watch(() => albumStore.currentAlbum, () => {
  mediaStore.fetchMedia({ album_id: albumStore.currentAlbum?.id })
  mediaStore.fetchTimeline({ album_id: albumStore.currentAlbum?.id })
})
</script>
