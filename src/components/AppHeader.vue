<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

type AppView = 'import' | 'dashboard' | 'competencies' | 'phases'

defineProps<{
  activeView: AppView
}>()

const emit = defineEmits<{
  (event: 'navigate', view: AppView): void
  (event: 'open-imports'): void
  (event: 'height-change', height: number): void
}>()

const views: Array<{ id: AppView; label: string; description: string }> = [
  { id: 'import', label: 'Cargar CSV', description: 'Importacion y control de carga' },
  { id: 'phases', label: 'Fases del Proyecto', description: 'Carga y estructuracion de fases y competencias' },
  { id: 'dashboard', label: 'Dashboard general', description: 'Metricas y panorama general' },
  { id: 'competencies', label: 'Competencias y resultados', description: 'Consulta detallada por ficha' },
]

const headerElement = ref<HTMLElement | null>(null)
let resizeObserver: ResizeObserver | null = null

function emitHeight() {
  emit('height-change', headerElement.value?.offsetHeight ?? 0)
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
    <div class="mx-auto flex w-full max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between py-3">
        <div class="flex items-center gap-4">
          <div>
            <p class="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-emerald-700 leading-none">Juicios Evaluativos</p>
            <h1 class="text-sm font-black tracking-tight text-slate-900 mt-0.5">Seguimiento Académico</h1>
          </div>
        </div>

        <button
          class="inline-flex items-center rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
          type="button"
          @click="emit('open-imports')"
        >
          Archivos importados
        </button>
      </div>

      <nav class="flex space-x-1 overflow-x-auto border-t border-slate-100 py-2 no-scrollbar">
        <button
          v-for="view in views"
          :key="view.id"
          class="shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition"
          :class="
            activeView === view.id
              ? 'bg-emerald-50 text-emerald-800 border-b-2 border-emerald-500'
              : 'text-slate-600 hover:bg-emerald-50/50 hover:text-emerald-700'
          "
          type="button"
          @click="emit('navigate', view.id)"
        >
          {{ view.label }}
        </button>
      </nav>
    </div>
  </header>
</template>
