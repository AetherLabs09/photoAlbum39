import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const albumApi = {
  getAll: () => api.get('/albums'),
  getTree: () => api.get('/albums/tree'),
  getOne: (id) => api.get(`/albums/${id}`),
  create: (data) => api.post('/albums', data),
  update: (id, data) => api.put(`/albums/${id}`, data),
  delete: (id) => api.delete(`/albums/${id}`),
  move: (id, targetId) => api.post(`/albums/${id}/move`, { target_id: targetId }),
  setTop: (id, isTop) => api.post(`/albums/${id}/top`, { is_top: isTop })
}

export const mediaApi = {
  getAll: (params) => api.get('/media', { params }),
  getOne: (id) => api.get(`/media/${id}`),
  getTimeline: (params) => api.get('/media/timeline', { params }),
  upload: (formData, onProgress) => api.post('/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
  }),
  update: (id, data) => api.put(`/media/${id}`, data),
  delete: (id) => api.delete(`/media/${id}`),
  batchMove: (ids, albumId) => api.post('/media/batch/move', { ids, album_id: albumId }),
  batchDelete: (ids) => api.post('/media/batch/delete', { ids }),
  edit: (id, data) => api.post(`/media/${id}/edit`, data),
  saveNote: (id, content) => api.post(`/media/${id}/note`, { content })
}

export const tagApi = {
  getAll: () => api.get('/tags'),
  create: (name) => api.post('/tags', { name }),
  update: (id, name) => api.put(`/tags/${id}`, { name }),
  delete: (id) => api.delete(`/tags/${id}`),
  addToMedia: (mediaId, tagIds) => api.post(`/tags/media/${mediaId}`, { tag_ids: tagIds }),
  removeFromMedia: (mediaId, tagId) => api.delete(`/tags/media/${mediaId}/${tagId}`),
  batchAdd: (mediaIds, tagIds) => api.post('/tags/batch', { media_ids: mediaIds, tag_ids: tagIds }),
  search: (name) => api.get(`/tags/search/${name}`)
}

export default api
