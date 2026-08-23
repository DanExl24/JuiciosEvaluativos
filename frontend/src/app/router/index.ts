import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.afterEach((to) => {
  if (to.meta.title && typeof to.meta.title === 'string') {
    document.title = to.meta.title
  }
})
