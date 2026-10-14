import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'
import { Capacitor } from '@capacitor/core'

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  const isNative = Capacitor.isNativePlatform()
  const isDownloaded =
    typeof window !== 'undefined' &&
    window.localStorage.getItem('juicios_apk_downloaded') === 'true'

  // 1. En la app nativa (APK instalada en el teléfono), NUNCA mostrar la landing page
  if (isNative) {
    if (to.path === '/' || to.path === '/landing' || to.meta.layout === 'landing') {
      return { path: '/dashboard', replace: true }
    }
  }

  // 2. En dispositivos/navegadores que ya descargaron la APK (móvil o desktop)
  // Al entrar a la raíz '/', redirigir directamente al dashboard (salvo que usen ?force=true)
  if ((to.path === '/' || to.name === 'landing') && isDownloaded && to.query.force !== 'true') {
    return { path: '/dashboard', replace: true }
  }
})

router.afterEach((to) => {
  if (to.meta.title && typeof to.meta.title === 'string') {
    document.title = to.meta.title
  }
})

