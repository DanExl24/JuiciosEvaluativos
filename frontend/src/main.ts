import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { router } from './app/router'
import './style.css'
import App from './App.vue'
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

if (Capacitor.isNativePlatform()) {
  try {
    void StatusBar.setStyle({ style: Style.Dark })
    void StatusBar.setBackgroundColor({ color: '#0F172A' })
  } catch (err) {
    console.warn('StatusBar not available:', err)
  }

  void CapApp.addListener('backButton', ({ canGoBack }) => {
    const currentPath = router.currentRoute.value.path
    if (currentPath === '/dashboard' || currentPath === '/' || currentPath === '/landing') {
      void CapApp.exitApp()
    } else if (canGoBack) {
      window.history.back()
    } else {
      void router.replace('/dashboard')
    }
  })
}

app.mount('#app')
