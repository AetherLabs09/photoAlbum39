<template>
  <div class="album-tree-item">
    <div 
      class="album-item"
      :class="{ active: currentAlbum?.id === album.id }"
      :style="{ paddingLeft: `${level * 16 + 12}px` }"
      @click="$emit('select', album)"
    >
      <el-icon 
        class="album-icon expand-icon" 
        v-if="album.children && album.children.length"
        @click.stop="expanded = !expanded"
      >
        <ArrowRight v-if="!expanded" />
        <ArrowDown v-else />
      </el-icon>
      <span class="album-icon" v-else></span>
      <el-icon class="album-icon"><Folder /></el-icon>
      <span class="album-name">{{ album.name }}</span>
      <span class="album-count">{{ album.media_count || 0 }}</span>
      <el-dropdown trigger="click" @command="handleCommand">
        <el-icon class="album-more" @click.stop>
          <MoreFilled />
        </el-icon>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="edit">
              <el-icon><Edit /></el-icon>重命名
            </el-dropdown-item>
            <el-dropdown-item command="top">
              <el-icon><Top /></el-icon>{{ album.is_top ? '取消置顶' : '置顶' }}
            </el-dropdown-item>
            <el-dropdown-item command="delete" divided>
              <el-icon><Delete /></el-icon>删除
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    <div v-show="expanded && album.children">
      <AlbumTreeItem
        v-for="child in album.children"
        :key="child.id"
        :album="child"
        :level="level + 1"
        @select="$emit('select', $event)"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAlbumStore } from '../stores'

const props = defineProps({
  album: Object,
  level: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['select', 'edit', 'delete'])

const albumStore = useAlbumStore()
const expanded = ref(true)

const currentAlbum = computed(() => albumStore.currentAlbum)

const handleCommand = (command) => {
  if (command === 'edit') {
    emit('edit', props.album)
  } else if (command === 'delete') {
    emit('delete', props.album)
  } else if (command === 'top') {
    albumStore.updateAlbum(props.album.id, { is_top: props.album.is_top ? 0 : 1 })
  }
}
</script>

<style scoped>
.album-tree-item .album-item {
  position: relative;
}

.album-tree-item .expand-icon {
  position: absolute;
  left: 0;
  cursor: pointer;
}

.album-tree-item .album-more {
  opacity: 0;
  transition: opacity 0.2s;
}

.album-tree-item .album-item:hover .album-more {
  opacity: 1;
}
</style>
