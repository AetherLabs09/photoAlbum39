<template>
  <div class="header">
    <div class="header-left">
      <h3>{{ title }}</h3>
      <span class="media-count" v-if="mediaCount > 0">共 {{ mediaCount }} 项</span>
    </div>
    <div class="toolbar">
      <el-input
        v-model="searchText"
        placeholder="搜索照片..."
        prefix-icon="Search"
        clearable
        style="width: 200px;"
        @input="handleSearch"
      />
      <el-select v-model="filterType" placeholder="类型筛选" clearable style="width: 120px;" @change="handleFilter">
        <el-option label="全部" value="" />
        <el-option label="图片" value="image" />
        <el-option label="视频" value="video" />
      </el-select>
      <el-upload
        ref="uploadRef"
        :show-file-list="false"
        :before-upload="beforeUpload"
        :http-request="handleUpload"
        multiple
        accept="image/*,video/*"
      >
        <el-button type="primary">
          <el-icon><Upload /></el-icon>
          上传
        </el-button>
      </el-upload>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { useAlbumStore, useMediaStore } from '../stores'
import { ElMessage } from 'element-plus'

const albumStore = useAlbumStore()
const mediaStore = useMediaStore()

const searchText = ref('')
const filterType = ref('')
const showTimeline = inject('showTimeline')

const title = computed(() => albumStore.currentAlbum?.name || '全部照片')
const mediaCount = computed(() => mediaStore.mediaList.length)

const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isVideo = file.type.startsWith('video/')
  if (!isImage && !isVideo) {
    ElMessage.error('只能上传图片或视频文件')
    return false
  }
  const isLt500M = file.size / 1024 / 1024 < 500
  if (!isLt500M) {
    ElMessage.error('文件大小不能超过 500MB')
    return false
  }
  return true
}

const handleUpload = async (options) => {
  try {
    await mediaStore.uploadMedia([options.file], albumStore.currentAlbum?.id)
    ElMessage.success('上传成功')
    mediaStore.fetchMedia({ album_id: albumStore.currentAlbum?.id })
    mediaStore.fetchTimeline({ album_id: albumStore.currentAlbum?.id })
  } catch (error) {
    ElMessage.error('上传失败')
  }
}

const handleSearch = () => {
  mediaStore.fetchMedia({
    album_id: albumStore.currentAlbum?.id,
    search: searchText.value,
    type: filterType.value
  })
}

const handleFilter = () => {
  mediaStore.fetchMedia({
    album_id: albumStore.currentAlbum?.id,
    search: searchText.value,
    type: filterType.value
  })
}
</script>

<style scoped>
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h3 {
  margin: 0;
  font-size: 18px;
}

.media-count {
  color: #909399;
  font-size: 14px;
}
</style>
