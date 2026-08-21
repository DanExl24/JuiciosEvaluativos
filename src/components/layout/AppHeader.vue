<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const emit = defineEmits<{
  (event: 'open-imports'): void
  (event: 'height-change', height: number): void
}>()

const route = useRoute()
const router = useRouter()

const views = [
  { path: '/import', label: 'Cargar CSV', description: 'Importación y control de carga' },
  { path: '/phases', label: 'Fases del Proyecto', description: 'Carga y estructuración de fases y competencias' },
  { path: '/dashboard', label: 'Dashboard general', description: 'Métricas y panorama general' },
  { path: '/tracking', label: 'Competencias y resultados', description: 'Consulta detallada por ficha' },
]

const currentPath = computed(() => route.path)
const headerElement = ref<HTMLElement | null>(null)
let resizeObserver: ResizeObserver | null = null

function emitHeight() {
  emit('height-change', headerElement.value?.offsetHeight ?? 0)
}

function navigateTo(path: string) {
  router.push(path)
}

onMounted(async () => {
  await nextTick()
  emitHeight()

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
  <header ref="headerElement" class="fixed inset-x-0 top-0 z-40 border-b border-emerald-950/10 bg-white/88 backdrop-blur shadow-sm">
    <div class="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
      <div class="flex items-center gap-6">
        <div class="shrink-0 border-r border-slate-200 pr-6">
          <p class="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-emerald-700 leading-none">Juicios Evaluativos</p>
          <h1 class="text-sm font-black tracking-tight text-slate-900 mt-0.5">Seguimiento Académico</h1>
        </div>

        <nav class="flex space-x-1 overflow-x-auto no-scrollbar">
          <button
            v-for="view in views"
            :key="view.path"
            class="shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition"
            :class="
              currentPath === view.path
                ? 'bg-emerald-50 text-emerald-800 border-b-2 border-emerald-500'
                : 'text-slate-600 hover:bg-emerald-50/50 hover:text-emerald-700'
            "
            type="button"
            @click="navigateTo(view.path)"
          >
            {{ view.label }}
          </button>
        </nav>
      </div>

      <button
        class="inline-flex items-center rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 shrink-0"
        type="button"
        @click="emit('open-imports')"
      >
        Archivos importados
      </button>
    </div>
  </header>
</template>
