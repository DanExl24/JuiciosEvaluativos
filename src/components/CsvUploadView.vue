<script setup lang="ts">
import { ref } from 'vue'

import AppHeader from './AppHeader.vue'
import CompetenciesResultsView from './CompetenciesResultsView.vue'
import DashboardGeneralView from './DashboardGeneralView.vue'
import ImportWorkspaceView from './ImportWorkspaceView.vue'
import ImportsHistoryModal from './ImportsHistoryModal.vue'
import { removeImportHistoryByFicha } from '../utils/importHistory'

type AppView = 'import' | 'dashboard' | 'competencies'

const activeView = ref<AppView>('import')
const isImportsModalOpen = ref(false)
const refreshToken = ref(0)
const headerHeight = ref(0)
const competenciesFocus = ref({
  learnerId: null as number | null,
  ficha: '',
  nonce: 0,
})

function handleImported() {
  refreshToken.value += 1
}

function handleDeletedFicha(ficha: string) {
  removeImportHistoryByFicha(ficha)
  refreshToken.value += 1
}

function openImportsModal() {
  isImportsModalOpen.value = true
}

function handleOpenCompetencies(payload: { learnerId: number; ficha: string }) {
  competenciesFocus.value = {
    learnerId: payload.learnerId,
    ficha: payload.ficha,
    nonce: competenciesFocus.value.nonce + 1,
  }
  activeView.value = 'competencies'
}
</script>

<template>
  <AppHeader
    :active-view="activeView"
    @navigate="activeView = $event"
    @open-imports="openImportsModal"
    @height-change="headerHeight = $event"
  />

  <main
    class="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 pb-6 sm:px-6 lg:px-8 lg:pb-10"
    :style="{ paddingTop: `${headerHeight + 24}px` }"
  >
    <div class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_58%)]"></div>

    <ImportWorkspaceView
      v-if="activeView === 'import'"
      @imported="handleImported"
      @open-imports="openImportsModal"
      @deleted-ficha="handleDeletedFicha"
    />

    <DashboardGeneralView
      v-else-if="activeView === 'dashboard'"
      :refresh-token="refreshToken"
      @open-competencies="handleOpenCompetencies"
    />

    <CompetenciesResultsView
      v-else
      :refresh-token="refreshToken"
      :focus-learner-id="competenciesFocus.learnerId"
      :focus-ficha="competenciesFocus.ficha"
      :focus-nonce="competenciesFocus.nonce"
    />
  </main>

  <ImportsHistoryModal :open="isImportsModalOpen" @close="isImportsModalOpen = false" />
</template>
