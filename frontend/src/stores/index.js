import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { albumApi, mediaApi, tagApi } from '../api'

export const useAlbumStore = defineStore('album', () => {
  const albums = ref([])
  const albumTree = ref([])
  const currentAlbum = ref(null)
  const loading = ref(false)

  const fetchAlbums = async () => {
    loading.value = true
    try {
      const { data } = await albumApi.getAll()
      albums.value = data
    } catch (error) {
      console.error('Failed to fetch albums:', error)
    } finally {
      loading.value = false
    }
  }

  const fetchAlbumTree = async () => {
    try {
      const { data } = await albumApi.getTree()
      albumTree.value = data
    } catch (error) {
      console.error('Failed to fetch album tree:', error)
    }
  }

  const createAlbum = async (albumData) => {
    const { data } = await albumApi.create(albumData)
    await fetchAlbums()
    await fetchAlbumTree()
    return data
  }

  const updateAlbum = async (id, albumData) => {
    const { data } = await albumApi.update(id, albumData)
    await fetchAlbums()
    await fetchAlbumTree()
    return data
  }

  const deleteAlbum = async (id) => {
    await albumApi.delete(id)
    await fetchAlbums()
    await fetchAlbumTree()
  }

  const setCurrentAlbum = (album) => {
    currentAlbum.value = album
  }

  return {
    albums,
    albumTree,
    currentAlbum,
    loading,
    fetchAlbums,
    fetchAlbumTree,
    createAlbum,
    updateAlbum,
    deleteAlbum,
    setCurrentAlbum
  }
})

export const useMediaStore = defineStore('media', () => {
  const mediaList = ref([])
  const selectedMedia = ref([])
  const timeline = ref({})
  const loading = ref(false)
  const currentMedia = ref(null)

  const selectedCount = computed(() => selectedMedia.value.length)

  const fetchMedia = async (params) => {
    loading.value = true
    try {
      const { data } = await mediaApi.getAll(params)
      mediaList.value = data
    } catch (error) {
      console.error('Failed to fetch media:', error)
    } finally {
      loading.value = false
    }
  }

  const fetchTimeline = async (params) => {
    try {
      const { data } = await mediaApi.getTimeline(params)
      timeline.value = data
    } catch (error) {
      console.error('Failed to fetch timeline:', error)
    }
  }

  const uploadMedia = async (files, albumId, onProgress) => {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })
    if (albumId) {
      formData.append('album_id', albumId)
    }
    const { data } = await mediaApi.upload(formData, onProgress)
    return data
  }

  const deleteMedia = async (id) => {
    await mediaApi.delete(id)
    mediaList.value = mediaList.value.filter(m => m.id !== id)
  }

  const toggleSelection = (media) => {
    const index = selectedMedia.value.findIndex(m => m.id === media.id)
    if (index > -1) {
      selectedMedia.value.splice(index, 1)
    } else {
      selectedMedia.value.push(media)
    }
  }

  const selectAll = () => {
    selectedMedia.value = [...mediaList.value]
  }

  const clearSelection = () => {
    selectedMedia.value = []
  }

  const batchDelete = async () => {
    const ids = selectedMedia.value.map(m => m.id)
    await mediaApi.batchDelete(ids)
    mediaList.value = mediaList.value.filter(m => !ids.includes(m.id))
    clearSelection()
  }

  const batchMove = async (albumId) => {
    const ids = selectedMedia.value.map(m => m.id)
    await mediaApi.batchMove(ids, albumId)
    clearSelection()
  }

  const setCurrentMedia = (media) => {
    currentMedia.value = media
  }

  return {
    mediaList,
    selectedMedia,
    timeline,
    loading,
    currentMedia,
    selectedCount,
    fetchMedia,
    fetchTimeline,
    uploadMedia,
    deleteMedia,
    toggleSelection,
    selectAll,
    clearSelection,
    batchDelete,
    batchMove,
    setCurrentMedia
  }
})

export const useTagStore = defineStore('tag', () => {
  const tags = ref([])
  const loading = ref(false)

  const fetchTags = async () => {
    loading.value = true
    try {
      const { data } = await tagApi.getAll()
      tags.value = data
    } catch (error) {
      console.error('Failed to fetch tags:', error)
    } finally {
      loading.value = false
    }
  }

  const createTag = async (name) => {
    const { data } = await tagApi.create(name)
    await fetchTags()
    return data
  }

  const deleteTag = async (id) => {
    await tagApi.delete(id)
    await fetchTags()
  }

  const addTagsToMedia = async (mediaId, tagIds) => {
    await tagApi.addToMedia(mediaId, tagIds)
  }

  const batchAddTags = async (mediaIds, tagIds) => {
    await tagApi.batchAdd(mediaIds, tagIds)
  }

  return {
    tags,
    loading,
    fetchTags,
    createTag,
    deleteTag,
    addTagsToMedia,
    batchAddTags
  }
})
