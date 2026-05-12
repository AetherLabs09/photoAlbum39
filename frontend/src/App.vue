<template>
  <div class="app-container">
    <Sidebar />
    <div class="main-content">
      <Header />
      <router-view />
    </div>
    <Timeline v-if="showTimeline" />
    <PreviewDialog />
    <BatchActions />
  </div>
</template>

<script setup>
import { ref, onMounted, provide } from 'vue'
import Sidebar from './components/Sidebar.vue'
import Header from './components/Header.vue'
import Timeline from './components/Timeline.vue'
import PreviewDialog from './components/PreviewDialog.vue'
import BatchActions from './components/BatchActions.vue'
import { useAlbumStore, useTagStore } from './stores'

const albumStore = useAlbumStore()
const tagStore = useTagStore()
const showTimeline = ref(true)

provide('showTimeline', showTimeline)

onMounted(async () => {
  await albumStore.fetchAlbums()
  await albumStore.fetchAlbumTree()
  await tagStore.fetchTags()
})
</script>
