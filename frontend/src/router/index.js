import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/album/:id',
    name: 'Album',
    component: () => import('../views/Album.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
