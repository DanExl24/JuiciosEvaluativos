<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAcademicContextStore } from '../../stores/academicContext.store'
import { importService } from '../../features/imports/services/import.service'

const emit = defineEmits<{
  'open-imports': []
  'height-change': [height: number]
}>()

const route = useRoute()
const router = useRouter()
const academicStore = useAcademicContextStore()

const availableFichas = ref<string[]>([])
const headerElement = ref<HTMLElement | null>(null)
let resizeObserver: ResizeObserver | null = null

const navItems = [
  {
    path: '/import',
    label: 'Carga de Datos',
    icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
  },
  {
    path: '/phases',
    label: 'Fases y Proyecto',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  },
  {
    path: '/dashboard',
    label: 'Dashboard General',
    icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
  },
  {
    path: '/tracking',
    label: 'Seguimiento Curricular',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
]

const currentPath = computed(() => route.path)

async function loadFichas() {
  try {
    availableFichas.value = await importService.getAvailableFichas()
  } catch {
    availableFichas.value = []
  }
}

function handleFichaChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  academicStore.setFicha(value)
  academicStore.notifyRefresh()
}

function emitHeight() {
  emit('height-change', headerElement.value?.offsetHeight ?? 0)
}

function navigateTo(path: string) {
  router.push(path)
}

watch(() => academicStore.lastRefreshTimestamp, () => {
  void loadFichas()
})

onMounted(async () => {
  await nextTick()
  emitHeight()
  void loadFichas()

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => emitHeight())
    if (headerElement.value) {
      resizeObserver.observe(headerElement.value)
    }
  }

  window.addEventListener('resize', emitHeight)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  window.removeEventListener('resize', emitHeight)
})
</script>

<template>
  <header
    ref="headerElement"
    class="fixed inset-x-0 top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs"
  >
    <div class="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
      <!-- Brand & Global Context Selector -->
      <div class="flex items-center gap-4 lg:gap-6">
        <div class="flex items-center gap-2.5 cursor-pointer" @click="navigateTo('/dashboard')">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <span class="block text-[0.65rem] font-bold uppercase tracking-wider text-emerald-700 leading-tight">
              SENA · Formación
            </span>
            <span class="block text-sm font-bold tracking-tight text-slate-900 leading-tight">
              Juicios Evaluativos
            </span>
          </div>
        </div>

        <!-- Global Ficha Context Switcher -->
        <div class="hidden sm:flex items-center pl-4 border-l border-slate-200">
          <div class="relative">
            <select
              :value="academicStore.selectedFicha"
              class="h-8 appearance-none rounded-lg border border-slate-200 bg-slate-50/80 pl-2.5 pr-7 text-xs font-semibold text-slate-700 transition hover:border-slate-300 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/10 cursor-pointer"
              @change="handleFichaChange"
            >
              <option value="">Todas las Fichas</option>
              <option v-for="ficha in availableFichas" :key="ficha" :value="ficha">
                Ficha {{ ficha }}
              </option>
            </select>
            <div class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation Segmented Tabs -->
      <nav class="flex items-center gap-1 rounded-xl bg-slate-100/90 p-1">
        <button
          v-for="item in navItems"
          :key="item.path"
          class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition"
          :class="
            currentPath === item.path
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          "
          type="button"
          @click="navigateTo(item.path)"
        >
          <svg class="h-3.5 w-3.5 shrink-0 opacity-70" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
          </svg>
          <span class="hidden md:inline">{{ item.label }}</span>
        </button>
      </nav>

      <!-- History Modal Action -->
      <div class="flex items-center gap-2">
        <button
          class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:border-slate-300"
          type="button"
          @click="emit('open-imports')"
        >
          <svg class="h-3.5 w-3.5 text-slate-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="hidden sm:inline">Historial</span>
        </button>
      </div>
    </div>
  </header>
</template>
