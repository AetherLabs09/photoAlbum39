<template>
  <div v-if="selectedCount > 0" class="batch-actions">
    <span>已选择 {{ selectedCount }} 项</span>
    <el-button size="small" @click="handleSelectAll">全选</el-button>
    <el-button size="small" @click="handleClearSelection">取消选择</el-button>
    <el-button size="small" @click="showMoveDialog = true">
      <el-icon><FolderOpened /></el-icon>
      移动
    </el-button>
    <el-button size="small" @click="showTagsDialog = true">
      <el-icon><PriceTag /></el-icon>
      标签
    </el-button>
    <el-button size="small" @click="handleDownload">
      <el-icon><Download /></el-icon>
      下载
    </el-button>
    <el-button size="small" type="danger" @click="handleBatchDelete">
      <el-icon><Delete /></el-icon>
      删除
    </el-button>
  </div>

  <el-dialog v-model="showMoveDialog" title="移动到相册" width="400px">
    <el-tree-select
      v-model="targetAlbumId"
      :data="albumOptions"
      :props="{ label: 'name', value: 'id' }"
      placeholder="选择目标相册"
      check-strictly
      style="width: 100%"
    />
    <template #footer>
      <el-button @click="showMoveDialog = false">取消</el-button>
      <el-button type="primary" @click="handleBatchMove">确定</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="showTagsDialog" title="批量添加标签" width="400px">
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
      <el-button @click="showTagsDialog = false">取消</el-button>
      <el-button type="primary" @click="handleBatchTags">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useMediaStore, useAlbumStore, useTagStore } from '../stores'
import { ElMessage, ElMessageBox } from 'element-plus'

const mediaStore = useMediaStore()
const albumStore = useAlbumStore()
const tagStore = useTagStore()

const showMoveDialog = ref(false)
const showTagsDialog = ref(false)
const targetAlbumId = ref(null)
const selectedTags = ref([])

const selectedCount = computed(() => mediaStore.selectedCount)
const tags = computed(() => tagStore.tags)

const albumOptions = computed(() => {
  const buildOptions = (albums) => {
    return albums.map(album => ({
      ...album,
      children: album.children ? buildOptions(album.children) : undefined
    }))
  }
  return buildOptions(albumStore.albumTree)
})

const handleSelectAll = () => {
  mediaStore.selectAll()
}

const handleClearSelection = () => {
  mediaStore.clearSelection()
}

const handleBatchMove = async () => {
  if (!targetAlbumId.value) {
    ElMessage.warning('请选择目标相册')
    return
  }
  try {
    await mediaStore.batchMove(targetAlbumId.value)
    ElMessage.success('移动成功')
    showMoveDialog.value = false
    targetAlbumId.value = null
  } catch (error) {
    ElMessage.error('移动失败')
  }
}

const handleBatchTags = async () => {
  if (selectedTags.value.length === 0) {
    ElMessage.warning('请选择标签')
    return
  }
  try {
    const mediaIds = mediaStore.selectedMedia.map(m => m.id)
    await tagStore.batchAddTags(mediaIds, selectedTags.value)
    ElMessage.success('标签添加成功')
    showTagsDialog.value = false
    selectedTags.value = []
  } catch (error) {
    ElMessage.error('添加失败')
  }
}

const handleDownload = () => {
  mediaStore.selectedMedia.forEach(media => {
    const link = document.createElement('a')
    link.href = media.file_path
    link.download = media.original_name
    link.click()
  })
}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedCount.value} 项吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await mediaStore.batchDelete()
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}
</script>
