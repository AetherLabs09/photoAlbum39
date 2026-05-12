<template>
  <el-dialog 
    v-model="visible" 
    class="preview-dialog"
    width="80%"
    :show-close="false"
    @close="handleClose"
  >
    <template #header>
      <div class="preview-header">
        <span>{{ currentMedia?.original_name }}</span>
        <div class="preview-actions">
          <el-button text @click="handleEdit" v-if="currentMedia?.file_type === 'image'">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button text @click="handleDownload">
            <el-icon><Download /></el-icon>
            下载
          </el-button>
          <el-button text @click="showTags = true">
            <el-icon><PriceTag /></el-icon>
            标签
          </el-button>
          <el-button text @click="showNote = true">
            <el-icon><Document /></el-icon>
            备注
          </el-button>
          <el-button text @click="handleDelete">
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </div>
      </div>
    </template>
    <div class="preview-container">
      <img 
        v-if="currentMedia?.file_type === 'image'" 
        :src="currentMedia?.file_path" 
        :alt="currentMedia?.original_name"
      />
      <video 
        v-else-if="currentMedia?.file_type === 'video'"
        :src="currentMedia?.file_path"
        controls
        autoplay
      />
    </div>
    <div class="preview-nav">
      <el-button circle size="large" @click="prevMedia" :disabled="currentIndex <= 0">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <span>{{ currentIndex + 1 }} / {{ mediaList.length }}</span>
      <el-button circle size="large" @click="nextMedia" :disabled="currentIndex >= mediaList.length - 1">
        <el-icon><ArrowRight /></el-icon>
      </el-button>
    </div>
  </el-dialog>

  <el-dialog v-model="showTags" title="标签管理" width="400px">
    <el-select
      v-model="selectedTags"
      multiple
      filterable
      allow-create
      default-first-option
      placeholder="选择或创建标签"
      style="width: 100%"
    >
      <el-option
        v-for="tag in tags"
        :key="tag.id"
        :label="tag.name"
        :value="tag.id"
      />
    </el-select>
    <template #footer>
      <el-button @click="showTags = false">取消</el-button>
      <el-button type="primary" @click="saveTags">保存</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="showNote" title="添加备注" width="400px">
    <el-input
      v-model="noteContent"
      type="textarea"
      :rows="4"
      placeholder="请输入备注内容"
    />
    <template #footer>
      <el-button @click="showNote = false">取消</el-button>
      <el-button type="primary" @click="saveNote">保存</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="showEditor" title="图片编辑" width="600px">
    <div class="editor-tools">
      <el-button @click="rotateImage(90)">旋转90°</el-button>
      <el-button @click="rotateImage(-90)">旋转-90°</el-button>
    </div>
    <template #footer>
      <el-button @click="showEditor = false">取消</el-button>
      <el-button type="primary" @click="applyEdit">应用</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useMediaStore, useTagStore } from '../stores'
import { mediaApi } from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'

const mediaStore = useMediaStore()
const tagStore = useTagStore()

const visible = ref(false)
const showTags = ref(false)
const showNote = ref(false)
const showEditor = ref(false)
const selectedTags = ref([])
const noteContent = ref('')
const editOperation = ref(null)

const currentMedia = computed(() => mediaStore.currentMedia)
const mediaList = computed(() => mediaStore.mediaList)
const tags = computed(() => tagStore.tags)

const currentIndex = computed(() => {
  if (!currentMedia.value) return -1
  return mediaList.value.findIndex(m => m.id === currentMedia.value.id)
})

watch(currentMedia, (media) => {
  if (media) {
    visible.value = true
    if (media.tags) {
      selectedTags.value = media.tags.split(',').map(t => {
        const tag = tags.value.find(tag => tag.name === t)
        return tag?.id
      }).filter(Boolean)
    }
    noteContent.value = media.note || ''
  }
})

const handleClose = () => {
  mediaStore.setCurrentMedia(null)
}

const prevMedia = () => {
  if (currentIndex.value > 0) {
    mediaStore.setCurrentMedia(mediaList.value[currentIndex.value - 1])
  }
}

const nextMedia = () => {
  if (currentIndex.value < mediaList.value.length - 1) {
    mediaStore.setCurrentMedia(mediaList.value[currentIndex.value + 1])
  }
}

const handleDownload = () => {
  if (currentMedia.value) {
    const link = document.createElement('a')
    link.href = currentMedia.value.file_path
    link.download = currentMedia.value.original_name
    link.click()
  }
}

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm('确定要删除这张照片吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await mediaStore.deleteMedia(currentMedia.value.id)
    visible.value = false
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const saveTags = async () => {
  try {
    await tagStore.addTagsToMedia(currentMedia.value.id, selectedTags.value)
    ElMessage.success('标签保存成功')
    showTags.value = false
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const saveNote = async () => {
  try {
    await mediaApi.saveNote(currentMedia.value.id, noteContent.value)
    ElMessage.success('备注保存成功')
    showNote.value = false
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const handleEdit = () => {
  showEditor.value = true
}

const rotateImage = (angle) => {
  editOperation.value = { operation: 'rotate', params: { angle } }
}

const applyEdit = async () => {
  if (!editOperation.value) return
  try {
    const { data } = await mediaApi.edit(currentMedia.value.id, editOperation.value)
    ElMessage.success('编辑成功，已保存为新文件')
    showEditor.value = false
    mediaStore.fetchMedia({ album_id: mediaStore.currentAlbum?.id })
  } catch (error) {
    ElMessage.error('编辑失败')
  }
}
</script>

<style scoped>
.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.preview-actions {
  display: flex;
  gap: 8px;
}

.preview-nav {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 15px;
}

.editor-tools {
  display: flex;
  gap: 10px;
  justify-content: center;
  padding: 20px;
}
</style>
