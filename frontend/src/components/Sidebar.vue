<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <h2>相册管理</h2>
    </div>
    <div class="sidebar-actions" style="padding: 10px;">
      <el-button type="primary" size="small" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        新建相册
      </el-button>
    </div>
    <div class="album-tree">
      <div 
        class="album-item"
        :class="{ active: !currentAlbum }"
        @click="selectAlbum(null)"
      >
        <el-icon class="album-icon"><PictureFilled /></el-icon>
        <span class="album-name">全部照片</span>
      </div>
      <AlbumTreeItem 
        v-for="album in albumTree" 
        :key="album.id"
        :album="album"
        :level="0"
        @select="selectAlbum"
        @edit="editAlbum"
        @delete="handleDeleteAlbum"
      />
    </div>

    <el-dialog v-model="showCreateDialog" title="新建相册" width="400px">
      <el-form :model="albumForm" label-width="80px">
        <el-form-item label="相册名称">
          <el-input v-model="albumForm.name" placeholder="请输入相册名称" />
        </el-form-item>
        <el-form-item label="父级相册">
          <el-tree-select
            v-model="albumForm.parent_id"
            :data="albumOptions"
            :props="{ label: 'name', value: 'id' }"
            placeholder="选择父级相册（可选）"
            clearable
            check-strictly
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreateAlbum">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showEditDialog" title="编辑相册" width="400px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="相册名称">
          <el-input v-model="editForm.name" placeholder="请输入相册名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleUpdateAlbum">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAlbumStore } from '../stores'
import AlbumTreeItem from './AlbumTreeItem.vue'

const router = useRouter()
const albumStore = useAlbumStore()

const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const albumForm = ref({ name: '', parent_id: null })
const editForm = ref({ id: '', name: '' })

const albumTree = computed(() => albumStore.albumTree)
const currentAlbum = computed(() => albumStore.currentAlbum)

const albumOptions = computed(() => {
  const buildOptions = (albums) => {
    return albums.map(album => ({
      ...album,
      children: album.children ? buildOptions(album.children) : undefined
    }))
  }
  return buildOptions(albumTree.value)
})

const selectAlbum = (album) => {
  albumStore.setCurrentAlbum(album)
  if (album) {
    router.push(`/album/${album.id}`)
  } else {
    router.push('/')
  }
}

const handleCreateAlbum = async () => {
  if (!albumForm.value.name.trim()) {
    ElMessage.warning('请输入相册名称')
    return
  }
  try {
    await albumStore.createAlbum(albumForm.value)
    ElMessage.success('创建成功')
    showCreateDialog.value = false
    albumForm.value = { name: '', parent_id: null }
  } catch (error) {
    ElMessage.error('创建失败')
  }
}

const editAlbum = (album) => {
  editForm.value = { id: album.id, name: album.name }
  showEditDialog.value = true
}

const handleUpdateAlbum = async () => {
  if (!editForm.value.name.trim()) {
    ElMessage.warning('请输入相册名称')
    return
  }
  try {
    await albumStore.updateAlbum(editForm.value.id, { name: editForm.value.name })
    ElMessage.success('更新成功')
    showEditDialog.value = false
  } catch (error) {
    ElMessage.error('更新失败')
  }
}

const handleDeleteAlbum = async (album) => {
  try {
    await ElMessageBox.confirm('确定要删除该相册吗？相册内的照片将移至未分类。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await albumStore.deleteAlbum(album.id)
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}
</script>
