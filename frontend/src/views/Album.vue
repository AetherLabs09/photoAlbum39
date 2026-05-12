<template>
  <div class="content-area">
    <MediaGrid v-if="mediaList.length > 0" />
    <div v-else class="empty-state">
      <el-icon><PictureFilled /></el-icon>
      <p>该相册暂无照片</p>
      <p>点击上方"上传"按钮添加照片</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useMediaStore, useAlbumStore } from '../stores'
import MediaGrid from '../components/MediaGrid.vue'

const route = useRoute()
const mediaStore = useMediaStore()
const albumStore = useAlbumStore()

const mediaList = computed(() => mediaStore.mediaList)

const loadAlbum = () => {
  const albumId = route.params.id
  const album = albumStore.albums.find(a => a.id === albumId)
  if (album) {
    albumStore.setCurrentAlbum(album)
    mediaStore.fetchMedia({ album_id: albumId })
    mediaStore.fetchTimeline({ album_id: albumId })
  }
}

onMounted(loadAlbum)

watch(() => route.params.id, loadAlbum)
</script>
