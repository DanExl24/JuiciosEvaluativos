<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from './components/layout/AppHeader.vue'
import ImportsHistoryModal from './features/imports/views/ImportsHistoryModal.vue'

const route = useRoute()
const isImportsModalOpen = ref(false)
const headerHeight = ref(56)

const isLanding = computed(() => route.meta.layout === 'landing' || route.path === '/')

function openImportsModal() {
  isImportsModalOpen.value = true
}
</script>

<template>
  <div v-if="isLanding" class="w-full min-h-screen">
    <router-view />
  </div>

  <template v-else>
    <AppHeader
      @open-imports="openImportsModal"
      @height-change="headerHeight = $event"
    />

    <main
      class="mx-auto flex min-h-screen w-full max-w-7xl min-w-0 flex-col gap-6 px-4 pb-8 sm:px-6 lg:px-8"
      :style="{ paddingTop: `${headerHeight + 20}px` }"
    >
      <div class="w-full min-w-0">
        <router-view />
      </div>
    </main>

    <ImportsHistoryModal
      :open="isImportsModalOpen"
      @close="isImportsModalOpen = false"
    />
  </template>
</template>

