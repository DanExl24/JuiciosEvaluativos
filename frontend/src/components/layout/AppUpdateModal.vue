<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  checkForAppUpdates,
  downloadAndInstallApk,
  type UpdateInfo,
} from '../../services/appUpdate.service'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  'update-found': [hasUpdate: boolean]
}>()

const isLoading = ref(false)
const isDownloading = ref(false)
const updateInfo = ref<UpdateInfo | null>(null)
const errorMsg = ref<string | null>(null)

async function checkUpdates() {
  isLoading.value = true
  errorMsg.value = null
  try {
    const info = await checkForAppUpdates()
    updateInfo.value = info
    emit('update-found', info.hasUpdate)
  } catch (err) {
    errorMsg.value = 'No fue posible consultar el servidor de actualizaciones.'
    console.error('Error al verificar actualización:', err)
  } finally {
    isLoading.value = false
  }
}

async function handleDownload() {
  if (!updateInfo.value) return
  isDownloading.value = true
  try {
    await downloadAndInstallApk(updateInfo.value.downloadUrl)
  } catch (err) {
    console.error('Error al iniciar descarga:', err)
  } finally {
    setTimeout(() => {
      isDownloading.value = false
    }, 2000)
  }
}

function formatDate(isoStr: string): string {
  try {
    return new Date(isoStr).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return isoStr
  }
}

const statusBadge = computed(() => {
  if (!updateInfo.value) return null
  if (updateInfo.value.hasUpdate) {
    return {
      text: 'Nueva versión disponible',
      class: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      dotClass: 'bg-emerald-500 animate-pulse',
    }
  }
  return {
    text: 'Aplicación al día',
    class: 'bg-slate-100 text-slate-700 border-slate-300',
    dotClass: 'bg-slate-400',
  }
})

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      void checkUpdates()
    }
  },
  { immediate: true },
)
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in"
    @click.self="emit('close')"
  >
    <div
      class="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100 flex flex-col"
    >
      <!-- Modal Header -->
      <div class="relative bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-5 text-white">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div>
              <h3 class="text-base font-bold text-white">Actualizaciones de la App</h3>
              <p class="text-xs text-slate-300">Juicios Evaluativos SENA</p>
            </div>
          </div>

          <button
            type="button"
            class="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
            @click="emit('close')"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Modal Body -->
      <div class="p-6 space-y-5">
        <!-- Loading State -->
        <div v-if="isLoading" class="py-8 text-center space-y-3">
          <div class="inline-block h-8 w-8 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent"></div>
          <p class="text-sm font-medium text-slate-600">Verificando última versión en el repositorio...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="errorMsg" class="rounded-xl border border-red-200 bg-red-50 p-4 text-center space-y-2">
          <p class="text-sm text-red-700 font-medium">{{ errorMsg }}</p>
          <button
            type="button"
            class="text-xs font-semibold text-red-600 underline hover:text-red-800"
            @click="checkUpdates"
          >
            Reintentar
          </button>
        </div>

        <!-- Content State -->
        <div v-else-if="updateInfo" class="space-y-4">
          <!-- Status Banner -->
          <div
            v-if="statusBadge"
            class="flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-semibold"
            :class="statusBadge.class"
          >
            <div class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full" :class="statusBadge.dotClass"></span>
              <span>{{ statusBadge.text }}</span>
            </div>
            <span class="text-[0.65rem] opacity-75">{{ formatDate(updateInfo.publishedAt) }}</span>
          </div>

          <!-- Version Comparison Grid -->
          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-center">
              <span class="block text-[0.65rem] font-bold uppercase tracking-wider text-slate-500">Versión Instalada</span>
              <span class="mt-0.5 block text-base font-extrabold text-slate-800">v{{ updateInfo.currentVersion }}</span>
            </div>
            <div
              class="rounded-xl border p-3 text-center transition"
              :class="updateInfo.hasUpdate ? 'border-emerald-300 bg-emerald-50/60' : 'border-slate-200 bg-slate-50/70'"
            >
              <span class="block text-[0.65rem] font-bold uppercase tracking-wider" :class="updateInfo.hasUpdate ? 'text-emerald-700' : 'text-slate-500'">
                Última Versión
              </span>
              <span class="mt-0.5 block text-base font-extrabold" :class="updateInfo.hasUpdate ? 'text-emerald-900' : 'text-slate-800'">
                v{{ updateInfo.latestVersion }}
              </span>
            </div>
          </div>

          <!-- Release Notes -->
          <div class="space-y-1.5">
            <span class="block text-xs font-bold text-slate-700">Novedades de la actualización</span>
            <div class="max-h-36 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 whitespace-pre-line leading-relaxed">
              {{ updateInfo.releaseNotes }}
            </div>
          </div>

          <!-- Size & Extra Info -->
          <div class="flex items-center justify-between text-[0.7rem] text-slate-500 px-1">
            <span>Formato: APK para Android</span>
            <span v-if="updateInfo.apkSizeMb">Tamaño aprox: {{ updateInfo.apkSizeMb }} MB</span>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="bg-slate-50 border-t border-slate-100 p-4 flex items-center justify-end gap-2.5">
        <button
          type="button"
          class="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-200/60"
          @click="emit('close')"
        >
          Cerrar
        </button>

        <button
          v-if="updateInfo"
          type="button"
          class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
          :disabled="isDownloading"
          @click="handleDownload"
        >
          <svg
            v-if="isDownloading"
            class="h-4 w-4 animate-spin text-white"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <svg
            v-else
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span>
            {{ isDownloading ? 'Iniciando descarga...' : updateInfo.hasUpdate ? 'Descargar e Instalar Actualización' : 'Descargar Última Versión APK' }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>
