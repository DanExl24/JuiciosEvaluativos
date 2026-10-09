<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// URL oficial de descarga directa del APK generado
const apkDownloadUrl = ref(
  'https://github.com/DanExl24/JuiciosEvaluativos/releases/download/v1.0.0/app-debug.apk',
)
const githubRepoUrl = 'https://github.com/DanExl24/JuiciosEvaluativos'
const actionsUrl = 'https://github.com/DanExl24/JuiciosEvaluativos/actions'

const copied = ref(false)

function copyDownloadLink() {
  navigator.clipboard.writeText(apkDownloadUrl.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2500)
}

function navigateToApp() {
  router.push('/dashboard')
}

function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white font-sans antialiased overflow-x-hidden">
    <!-- Background Glow Effects -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div class="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-emerald-600/20 via-teal-500/10 to-transparent blur-3xl opacity-70"></div>
      <div class="absolute top-[35%] -left-48 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full"></div>
      <div class="absolute top-[65%] -right-48 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full"></div>
      <div class="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>
    </div>

    <!-- Sticky Navigation -->
    <header class="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 transition-all">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <!-- Logo -->
        <div class="flex items-center gap-3.5 cursor-pointer" @click="scrollToSection('hero')">
          <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
            <svg class="w-6 h-6 text-slate-950 font-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-lg font-extrabold tracking-tight text-white">Juicios<span class="text-emerald-400">Evaluativos</span></span>
              <span class="px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">SENA</span>
            </div>
            <p class="text-xs text-slate-400 hidden sm:block">Gestión Curricular & Analítica Académica</p>
          </div>
        </div>

        <!-- Links -->
        <nav class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <button @click="scrollToSection('about')" class="hover:text-emerald-400 transition-colors">¿De qué trata?</button>
          <button @click="scrollToSection('modules')" class="hover:text-emerald-400 transition-colors">Módulos</button>
          <button @click="scrollToSection('app-mobile')" class="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
            <span>App Android</span>
            <span class="inline-flex items-center px-1.5 py-0.2 text-[10px] font-bold bg-emerald-500 text-slate-950 rounded">.APK</span>
          </button>
          <button @click="scrollToSection('installation')" class="hover:text-emerald-400 transition-colors">Instalación</button>
        </nav>

        <!-- Action CTAs -->
        <div class="flex items-center gap-3">
          <button
            @click="navigateToApp"
            class="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/70 rounded-xl transition-all shadow-sm"
          >
            Abrir Web
          </button>
          <a
            :href="apkDownloadUrl"
            download="juicios-evaluativos.apk"
            class="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0001s.4482-.9997.9993-.9997c.552 0 1.0001.4482 1.0001.9997 0 .5515-.4481 1.0001-1.0001 1.0001m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0001s.4482-.9997.9993-.9997c.552 0 1.0001.4482 1.0001.9997 0 .5515-.4481 1.0001-1.0001 1.0001m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.4116 13.8533 8.125 12 8.125c-1.8533 0-3.5902.2866-5.1368.8247L4.8409 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.75h24c-.3432-4.0911-2.6889-7.5633-6.1185-9.4286"/>
            </svg>
            <span>Descargar .APK</span>
          </a>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="relative z-10">
      <!-- 🚀 Hero Section -->
      <section id="hero" class="pt-16 pb-24 lg:pt-28 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div class="text-center max-w-4xl mx-auto">
          <!-- Notification Pill -->
          <div class="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold mb-8 animate-fade-in shadow-inner">
            <span class="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Nueva Versión Móvil 1.0 Disponible</span>
            <span class="text-slate-500">•</span>
            <span class="text-emerald-400 underline decoration-emerald-500/50 cursor-pointer" @click="scrollToSection('app-mobile')">Descarga directa en .APK &rarr;</span>
          </div>

          <!-- Hero Headline -->
          <h1 class="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] mb-6">
            Gestión Inteligente y Trazabilidad de <br class="hidden sm:block" />
            <span class="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Juicios Evaluativos SENA
            </span>
          </h1>

          <!-- Hero Subtitle -->
          <p class="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-10">
            La plataforma definitiva para la ingesta de reportes de <strong>SofiaPlus</strong>, seguimiento curricular en tiempo real, detección temprana de rezagos y articulación de las <strong>4 fases del proyecto formativo</strong>.
          </p>

          <!-- Dual Call to Actions -->
          <div class="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-16">
            <a
              :href="apkDownloadUrl"
              download="juicios-evaluativos.apk"
              class="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-base text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0001s.4482-.9997.9993-.9997c.552 0 1.0001.4482 1.0001.9997 0 .5515-.4481 1.0001-1.0001 1.0001m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0001s.4482-.9997.9993-.9997c.552 0 1.0001.4482 1.0001.9997 0 .5515-.4481 1.0001-1.0001 1.0001m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.4116 13.8533 8.125 12 8.125c-1.8533 0-3.5902.2866-5.1368.8247L4.8409 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.75h24c-.3432-4.0911-2.6889-7.5633-6.1185-9.4286"/>
              </svg>
              <span>Descargar APK para Android</span>
              <span class="text-xs bg-slate-950/20 px-2 py-0.5 rounded-full font-mono">v1.0</span>
            </a>

            <button
              @click="navigateToApp"
              class="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-semibold text-base text-white bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 shadow-lg hover:border-slate-600 transition-all hover:-translate-y-0.5"
            >
              <span>Acceder al Sistema Web</span>
              <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
              </svg>
            </button>
          </div>

          <!-- Feature Pills -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto pt-6 border-t border-slate-800/80 text-left">
            <div class="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <span class="text-emerald-400 font-bold text-lg">⚡</span>
              <div>
                <p class="text-xs font-semibold text-white">Ingesta Atómica</p>
                <p class="text-[11px] text-slate-400">CSV, XLSX y XLS</p>
              </div>
            </div>
            <div class="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <span class="text-teal-400 font-bold text-lg">📊</span>
              <div>
                <p class="text-xs font-semibold text-white">Apache ECharts</p>
                <p class="text-[11px] text-slate-400">Tacómetros y Radars</p>
              </div>
            </div>
            <div class="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <span class="text-cyan-400 font-bold text-lg">📄</span>
              <div>
                <p class="text-xs font-semibold text-white">Exportación Nativa</p>
                <p class="text-[11px] text-slate-400">Actas PDF y Excel</p>
              </div>
            </div>
            <div class="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <span class="text-emerald-400 font-bold text-lg">📱</span>
              <div>
                <p class="text-xs font-semibold text-white">App Autónoma</p>
                <p class="text-[11px] text-slate-400">Sin Google Play Store</p>
              </div>
            </div>
          </div>
        </div>

        <!-- UI Preview / Mockup Interactive Visual -->
        <div class="mt-16 sm:mt-24 relative max-w-5xl mx-auto">
          <div class="relative rounded-2xl lg:rounded-3xl p-2 sm:p-4 bg-gradient-to-b from-slate-800/70 to-slate-900/90 border border-slate-700/70 shadow-2xl shadow-emerald-500/10 backdrop-blur-xl">
            <!-- Mockup Window Bar -->
            <div class="flex items-center justify-between px-4 py-2 border-b border-slate-800 text-xs text-slate-400">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
                <span class="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                <span class="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
              </div>
              <span class="font-mono text-[11px] bg-slate-950 px-3 py-1 rounded-md border border-slate-800">
                https://juicios-evaluativos-jp.adsoproject.dev/dashboard
              </span>
              <span class="text-[10px] text-emerald-400 font-mono">CONECTADO</span>
            </div>

            <!-- Simulated Dashboard Preview -->
            <div class="p-6 bg-slate-950/90 rounded-b-xl grid grid-cols-1 md:grid-cols-3 gap-6">
              <!-- KPI Card 1 -->
              <div class="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80">
                <div class="flex justify-between items-start">
                  <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Avance General Ficha</span>
                  <span class="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Activo</span>
                </div>
                <div class="mt-3 flex items-baseline gap-2">
                  <span class="text-3xl font-extrabold text-white">87.5%</span>
                  <span class="text-xs text-emerald-400 font-medium">↑ Cumplimiento curricular</span>
                </div>
                <div class="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                  <div class="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full" style="width: 87.5%"></div>
                </div>
              </div>

              <!-- KPI Card 2 -->
              <div class="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80">
                <div class="flex justify-between items-start">
                  <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Aprendices Matriculados</span>
                  <span class="text-xs font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">Cohorte ADSO</span>
                </div>
                <div class="mt-3 flex items-baseline gap-2">
                  <span class="text-3xl font-extrabold text-white">32</span>
                  <span class="text-xs text-slate-400 font-medium">En formación activa</span>
                </div>
                <div class="flex items-center gap-4 mt-3 text-xs text-slate-400">
                  <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-400"></span> 28 Al día</span>
                  <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-amber-400"></span> 4 Rezagados</span>
                </div>
              </div>

              <!-- KPI Card 3 -->
              <div class="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80">
                <div class="flex justify-between items-start">
                  <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Juicios Evaluativos</span>
                  <span class="text-xs font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">SofiaPlus</span>
                </div>
                <div class="mt-3 flex items-baseline gap-2">
                  <span class="text-3xl font-extrabold text-white">1,420</span>
                  <span class="text-xs text-slate-400 font-medium">Evaluaciones procesadas</span>
                </div>
                <div class="flex items-center gap-4 mt-3 text-xs text-slate-400">
                  <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-400"></span> 1,290 Aprobados</span>
                  <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-rose-400"></span> 130 Por Evaluar</span>
                </div>
              </div>

              <!-- Table Preview Row -->
              <div class="md:col-span-3 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                <div class="flex justify-between items-center mb-3">
                  <span class="text-xs font-bold text-slate-300 uppercase">Alertas de Aprendices con Juicios Pendientes</span>
                  <button @click="navigateToApp" class="text-xs text-emerald-400 hover:underline">Ver en Dashboard &rarr;</button>
                </div>
                <div class="space-y-2 text-xs">
                  <div class="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
                    <span class="font-medium text-white">GARCÍA PÉREZ JUAN DAVID</span>
                    <span class="text-slate-400">CC 1024567890</span>
                    <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">2 Pendientes</span>
                  </div>
                  <div class="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
                    <span class="font-medium text-white">RODRÍGUEZ MORENO LAURA SOFÍA</span>
                    <span class="text-slate-400">TI 1002345678</span>
                    <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">1 Pendiente</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 🏛️ ¿De qué trata el proyecto? -->
      <section id="about" class="py-24 border-t border-slate-850 bg-slate-900/30">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center max-w-3xl mx-auto mb-16">
            <span class="text-xs font-bold uppercase tracking-widest text-emerald-400">Dominio & Misión Institucional</span>
            <h2 class="text-3xl sm:text-5xl font-extrabold text-white mt-3">
              ¿Por qué nace JuiciosEvaluativos?
            </h2>
            <p class="text-base sm:text-lg text-slate-300 mt-4 leading-relaxed">
              En el SENA, la evaluación es 100% cualitativa basada en resultados de aprendizaje (RAP) y competencias laborales. Los instructores deben contrastar reportes tabulares complejos de <strong>SofiaPlus</strong> con documentos de proyectos formativos en PDF.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="p-8 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 transition-all">
              <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl font-bold mb-6">
                01
              </div>
              <h3 class="text-xl font-bold text-white mb-3">El Problema Histórico</h3>
              <p class="text-sm text-slate-300 leading-relaxed">
                Reportes manuales descargados de SofiaPlus que se desactualizan, carpetas dispersas y falta de visibilidad en tiempo real para coordinaciones académicas y comités de seguimiento.
              </p>
            </div>

            <div class="p-8 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-teal-500/40 transition-all">
              <div class="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center text-xl font-bold mb-6">
                02
              </div>
              <h3 class="text-xl font-bold text-white mb-3">La Solución Integral</h3>
              <p class="text-sm text-slate-300 leading-relaxed">
                Un motor que ingesta, valida atómicamente la integridad de los datos, previene inconsistencias (HTTP 409) y traduce hojas de cálculo planas en dashboards ejecutivos con Apache ECharts.
              </p>
            </div>

            <div class="p-8 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 transition-all">
              <div class="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center text-xl font-bold mb-6">
                03
              </div>
              <h3 class="text-xl font-bold text-white mb-3">Impacto Pedagógico</h3>
              <p class="text-sm text-slate-300 leading-relaxed">
                Trazabilidad exacta en las 4 fases SENA (Análisis, Planeación, Ejecución, Evaluación), permitiendo saber con precisión matemática en qué fase desertó un aprendiz y qué competencias faltan calificar.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- 📦 Módulos Funcionales -->
      <section id="modules" class="py-24 border-t border-slate-850">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center max-w-3xl mx-auto mb-16">
            <span class="text-xs font-bold uppercase tracking-widest text-emerald-400">Arquitectura Funcional</span>
            <h2 class="text-3xl sm:text-5xl font-extrabold text-white mt-3">
              Los 4 Módulos Canónicos del Sistema
            </h2>
            <p class="text-base sm:text-lg text-slate-300 mt-4 leading-relaxed">
              Diseñados con estricta separación de responsabilidades y contratos tipados end-to-end.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Módulo 1 -->
            <div class="p-8 rounded-3xl bg-gradient-to-br from-slate-900/90 to-slate-900/40 border border-slate-800 hover:border-emerald-500/50 transition-all group">
              <div class="flex items-center gap-4 mb-5">
                <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                  </svg>
                </div>
                <div>
                  <h3 class="text-xl font-bold text-white">1. Ingesta y Procesamiento de Datos</h3>
                  <p class="text-xs text-emerald-400 font-mono">Módulo Imports</p>
                </div>
              </div>
              <ul class="space-y-2.5 text-sm text-slate-300">
                <li class="flex items-start gap-2.5">
                  <span class="text-emerald-400 mt-0.5">✓</span>
                  <span>Carga atómica de reportes SofiaPlus (CSV, XLSX, XLS) con detección automática de delimitadores y encodings.</span>
                </li>
                <li class="flex items-start gap-2.5">
                  <span class="text-emerald-400 mt-0.5">✓</span>
                  <span>Prevención de duplicados por huella digital criptográfica SHA-256.</span>
                </li>
                <li class="flex items-start gap-2.5">
                  <span class="text-emerald-400 mt-0.5">✓</span>
                  <span>Extractor inteligente en Python (pdfplumber) para proyectos pedagógicos en PDF.</span>
                </li>
              </ul>
            </div>

            <!-- Módulo 2 -->
            <div class="p-8 rounded-3xl bg-gradient-to-br from-slate-900/90 to-slate-900/40 border border-slate-800 hover:border-teal-500/50 transition-all group">
              <div class="flex items-center gap-4 mb-5">
                <div class="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/>
                  </svg>
                </div>
                <div>
                  <h3 class="text-xl font-bold text-white">2. Panorama Ejecutivo y Métricas</h3>
                  <p class="text-xs text-teal-400 font-mono">Módulo Dashboard</p>
                </div>
              </div>
              <ul class="space-y-2.5 text-sm text-slate-300">
                <li class="flex items-start gap-2.5">
                  <span class="text-teal-400 mt-0.5">✓</span>
                  <span>Gráficos interactivos ECharts: Gauge (tacómetro de avance), Radar de competencias y Barras de rezago.</span>
                </li>
                <li class="flex items-start gap-2.5">
                  <span class="text-teal-400 mt-0.5">✓</span>
                  <span>Tabla priorizada de aprendices con juicios pendientes para citaciones a comités de evaluación.</span>
                </li>
                <li class="flex items-start gap-2.5">
                  <span class="text-teal-400 mt-0.5">✓</span>
                  <span>Feed de auditoría cronológico con los últimos 20 juicios emitidos y funcionarios responsables.</span>
                </li>
              </ul>
            </div>

            <!-- Módulo 3 -->
            <div class="p-8 rounded-3xl bg-gradient-to-br from-slate-900/90 to-slate-900/40 border border-slate-800 hover:border-cyan-500/50 transition-all group">
              <div class="flex items-center gap-4 mb-5">
                <div class="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <div>
                  <h3 class="text-xl font-bold text-white">3. Seguimiento Curricular</h3>
                  <p class="text-xs text-cyan-400 font-mono">Módulo Academic Tracking</p>
                </div>
              </div>
              <ul class="space-y-2.5 text-sm text-slate-300">
                <li class="flex items-start gap-2.5">
                  <span class="text-cyan-400 mt-0.5">✓</span>
                  <span>Navegación dual: Catálogo general de la cohorte vs Expediente y notas individuales por aprendiz.</span>
                </li>
                <li class="flex items-start gap-2.5">
                  <span class="text-cyan-400 mt-0.5">✓</span>
                  <span>Modal de inspección por resultado de aprendizaje con filtros de aprobados vs desaprobados.</span>
                </li>
                <li class="flex items-start gap-2.5">
                  <span class="text-cyan-400 mt-0.5">✓</span>
                  <span>Exportación nativa de reportes a libros de Excel (.xlsx) y actas institucionales en PDF (.pdf).</span>
                </li>
              </ul>
            </div>

            <!-- Módulo 4 -->
            <div class="p-8 rounded-3xl bg-gradient-to-br from-slate-900/90 to-slate-900/40 border border-slate-800 hover:border-emerald-500/50 transition-all group">
              <div class="flex items-center gap-4 mb-5">
                <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                  </svg>
                </div>
                <div>
                  <h3 class="text-xl font-bold text-white">4. Fases del Proyecto Formativo</h3>
                  <p class="text-xs text-emerald-400 font-mono">Módulo Project Phases</p>
                </div>
              </div>
              <ul class="space-y-2.5 text-sm text-slate-300">
                <li class="flex items-start gap-2.5">
                  <span class="text-emerald-400 mt-0.5">✓</span>
                  <span>Estructuración jerárquica en las 4 fases SENA (Análisis, Planeación, Ejecución, Evaluación).</span>
                </li>
                <li class="flex items-start gap-2.5">
                  <span class="text-emerald-400 mt-0.5">✓</span>
                  <span>Mecanismo de Doble Código (Dual-Code) para sincronizar código de juicio con código normativo de proyecto.</span>
                </li>
                <li class="flex items-start gap-2.5">
                  <span class="text-emerald-400 mt-0.5">✓</span>
                  <span>Algoritmo de deducción cronológica de deserción por fase pedagógica con tendencias visuales.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- 📱 App Móvil Android (.APK) Showcase -->
      <section id="app-mobile" class="py-24 border-t border-slate-850 bg-gradient-to-b from-slate-900/50 via-slate-950 to-slate-950 relative overflow-hidden">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="p-8 sm:p-14 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-teal-950/40 border border-emerald-500/30 shadow-2xl relative overflow-hidden">
            <!-- Background highlight -->
            <div class="absolute -right-20 -bottom-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <!-- Left info -->
              <div class="lg:col-span-7">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-5">
                  <span>📱 Distribución Oficial Autónoma</span>
                </div>
                <h2 class="text-3xl sm:text-5xl font-extrabold text-white leading-tight">
                  Lleva JuiciosEvaluativos en tu Teléfono Android
                </h2>
                <p class="text-slate-300 text-base sm:text-lg mt-4 leading-relaxed">
                  Diseñado para instructores líderes y directivos: consulta el estado de las fichas en cualquier momento, comparte actas en PDF o Excel por WhatsApp directamente desde tu celular, sin necesidad de encender la computadora.
                </p>

                <!-- Key benefits -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 my-8">
                  <div class="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                      🚀
                    </div>
                    <div>
                      <p class="text-sm font-bold text-white">Instalación Directa</p>
                      <p class="text-xs text-slate-400">Descarga el .apk e instala</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <div class="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                      📤
                    </div>
                    <div>
                      <p class="text-sm font-bold text-white">Compartir Nativo</p>
                      <p class="text-xs text-slate-400">Envía PDFs y Excels con 1 tap</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <div class="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                      🔒
                    </div>
                    <div>
                      <p class="text-sm font-bold text-white">Conexión Segura</p>
                      <p class="text-xs text-slate-400">API remota con cifrado HTTPS</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <div class="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                      ⚡
                    </div>
                    <div>
                      <p class="text-sm font-bold text-white">Motor Capacitor</p>
                      <p class="text-xs text-slate-400">Rendimiento nativo fluido</p>
                    </div>
                  </div>
                </div>

                <!-- CTA and Copy Button -->
                <div class="flex flex-wrap items-center gap-4">
                  <a
                    :href="apkDownloadUrl"
                    download="juicios-evaluativos.apk"
                    class="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-extrabold text-base text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.02]"
                  >
                    <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0001s.4482-.9997.9993-.9997c.552 0 1.0001.4482 1.0001.9997 0 .5515-.4481 1.0001-1.0001 1.0001m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0001s.4482-.9997.9993-.9997c.552 0 1.0001.4482 1.0001.9997 0 .5515-.4481 1.0001-1.0001 1.0001m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.4116 13.8533 8.125 12 8.125c-1.8533 0-3.5902.2866-5.1368.8247L4.8409 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.75h24c-.3432-4.0911-2.6889-7.5633-6.1185-9.4286"/>
                    </svg>
                    <span>Descargar .APK Directo</span>
                  </a>

                  <button
                    @click="copyDownloadLink"
                    class="inline-flex items-center gap-2 px-5 py-4 rounded-2xl font-semibold text-sm text-slate-300 bg-slate-950/80 hover:bg-slate-900 border border-slate-700/80 transition-all"
                  >
                    <svg v-if="!copied" class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/>
                    </svg>
                    <svg v-else class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    <span>{{ copied ? '¡Enlace copiado!' : 'Copiar enlace' }}</span>
                  </button>
                </div>
              </div>

              <!-- Right QR Card & Specs -->
              <div class="lg:col-span-5 flex flex-col items-center">
                <div class="w-full max-w-sm p-6 rounded-3xl bg-slate-950/90 border border-slate-800 text-center shadow-2xl relative">
                  <!-- Decorative badge -->
                  <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px] uppercase tracking-wider">
                    Escanea y Descarga
                  </div>

                  <!-- QR Code Vector Visual -->
                  <div class="mt-4 p-4 rounded-2xl bg-white mx-auto inline-block shadow-inner">
                    <!-- Crisp clean QR Code SVG leading to download -->
                    <svg class="w-44 h-44 text-slate-950" viewBox="0 0 29 29" fill="currentColor">
                      <!-- Corner Marker Top-Left -->
                      <path d="M2 2h7v7H2zm1 1v5h5V3zM4 4h3v3H4z"/>
                      <!-- Corner Marker Top-Right -->
                      <path d="M20 2h7v7h-7zm1 1v5h5V3zm1 1h3v3h-3z"/>
                      <!-- Corner Marker Bottom-Left -->
                      <path d="M2 20h7v7H2zm1 1v5h5v-5zM4 22h3v3H4z"/>
                      <!-- Data Pattern Elements -->
                      <rect x="11" y="2" width="2" height="2"/>
                      <rect x="15" y="2" width="3" height="1"/>
                      <rect x="10" y="5" width="2" height="3"/>
                      <rect x="14" y="6" width="3" height="2"/>
                      <rect x="11" y="10" width="2" height="2"/>
                      <rect x="2" y="11" width="3" height="2"/>
                      <rect x="6" y="12" width="2" height="3"/>
                      <rect x="10" y="14" width="3" height="1"/>
                      <rect x="14" y="11" width="2" height="4"/>
                      <rect x="18" y="11" width="2" height="2"/>
                      <rect x="22" y="11" width="3" height="1"/>
                      <rect x="25" y="13" width="2" height="4"/>
                      <rect x="11" y="18" width="2" height="3"/>
                      <rect x="15" y="17" width="3" height="2"/>
                      <rect x="10" y="23" width="2" height="4"/>
                      <rect x="14" y="21" width="2" height="2"/>
                      <rect x="18" y="20" width="3" height="2"/>
                      <rect x="23" y="19" width="4" height="2"/>
                      <rect x="20" y="23" width="2" height="4"/>
                      <rect x="24" y="23" width="3" height="2"/>
                    </svg>
                  </div>

                  <p class="text-xs text-slate-400 mt-4">
                    Apunta con la cámara de tu smartphone Android para iniciar la descarga del instalador.
                  </p>

                  <div class="mt-4 pt-4 border-t border-slate-800 text-left text-xs text-slate-400 space-y-1">
                    <p><strong class="text-slate-300">Versión:</strong> 1.0.0 (Capacitor 8)</p>
                    <p><strong class="text-slate-300">Compatibilidad:</strong> Android 8.0 Oreo o superior</p>
                    <p><strong class="text-slate-300">Tamaño:</strong> ~18 MB (Sin dependencias externas)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 🛠️ Guía de Instalación en 3 Pasos -->
      <section id="installation" class="py-24 border-t border-slate-850">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center max-w-3xl mx-auto mb-16">
            <span class="text-xs font-bold uppercase tracking-widest text-emerald-400">Guía Práctica</span>
            <h2 class="text-3xl sm:text-5xl font-extrabold text-white mt-3">
              ¿Cómo instalar el .APK en Android?
            </h2>
            <p class="text-base sm:text-lg text-slate-300 mt-4 leading-relaxed">
              Al tratarse de una distribución institucional interna sin pasar por Google Play, la instalación se realiza en 3 pasos sencillos y seguros.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <!-- Paso 1 -->
            <div class="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 relative">
              <span class="text-4xl font-extrabold text-emerald-500/30">01</span>
              <h3 class="text-lg font-bold text-white mt-2 mb-2">Descarga el Archivo</h3>
              <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Haz clic en el botón de <strong>Descargar APK</strong> o escanea el código QR desde tu teléfono. El navegador guardará el archivo <code class="text-emerald-400 bg-slate-950 px-1 py-0.5 rounded">app-debug.apk</code> en la carpeta de Descargas.
              </p>
            </div>

            <!-- Paso 2 -->
            <div class="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 relative">
              <span class="text-4xl font-extrabold text-teal-500/30">02</span>
              <h3 class="text-lg font-bold text-white mt-2 mb-2">Permite Orígenes Desconocidos</h3>
              <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Si Android muestra la advertencia <em>"El archivo puede ser dañino"</em>, selecciona <strong>Descargar de todos modos</strong>. Al abrir el archivo, pulsa en <em>"Permitir instalar aplicaciones desde esta fuente"</em>.
              </p>
            </div>

            <!-- Paso 3 -->
            <div class="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 relative">
              <span class="text-4xl font-extrabold text-cyan-500/30">03</span>
              <h3 class="text-lg font-bold text-white mt-2 mb-2">Instala y Disfruta</h3>
              <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Presiona <strong>Instalar</strong>. Una vez completado, encontrarás el icono de <strong>Juicios Evaluativos</strong> en tu cajón de aplicaciones listo para consultar y compartir reportes.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- ❓ Preguntas Frecuentes (FAQ) -->
      <section class="py-24 border-t border-slate-850 bg-slate-900/20">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16">
            <span class="text-xs font-bold uppercase tracking-widest text-emerald-400">Dudas Frecuentes</span>
            <h2 class="text-3xl sm:text-4xl font-extrabold text-white mt-3">
              Preguntas Frecuentes
            </h2>
          </div>

          <div class="space-y-6">
            <div class="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
              <h3 class="text-base font-bold text-white mb-2">¿Por qué el archivo se descarga directamente y no desde Google Play Store?</h3>
              <p class="text-sm text-slate-300 leading-relaxed">
                Es una aplicación interna para uso educativo y pedagógico del SENA. La distribución directa en formato APK garantiza que los instructores y directivos tengan acceso inmediato a las últimas versiones y compilaciones sin trabas burocráticas ni cuentas de desarrollador de terceros.
              </p>
            </div>

            <div class="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
              <h3 class="text-base font-bold text-white mb-2">¿Los datos en la aplicación móvil están sincronizados con la web?</h3>
              <p class="text-sm text-slate-300 leading-relaxed">
                Sí, al 100%. La app móvil y la plataforma web consumen la misma API REST centralizada y base de datos PostgreSQL en el VPS. Si un instructor califica o sube un reporte en la web, se refleja al instante en el teléfono.
              </p>
            </div>

            <div class="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
              <h3 class="text-base font-bold text-white mb-2">¿Cómo se actualiza la aplicación cuando hay cambios?</h3>
              <p class="text-sm text-slate-300 leading-relaxed">
                Cada vez que se suben mejoras al repositorio, nuestro sistema de compilación en GitHub Actions genera una nueva versión del archivo APK. Solo debes descargar el archivo nuevamente e instalarlo encima para actualizar la versión existente.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="border-t border-slate-800/80 bg-slate-950 py-12 text-slate-400 text-xs">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            S
          </div>
          <div>
            <p class="text-white font-bold">SENA • Análisis y Desarrollo de Software (ADSO)</p>
            <p class="text-[11px] text-slate-500">Sistema JuiciosEvaluativos • Todos los derechos reservados</p>
          </div>
        </div>

        <div class="flex items-center gap-6">
          <a :href="githubRepoUrl" target="_blank" rel="noopener noreferrer" class="hover:text-emerald-400 transition-colors">GitHub Repository</a>
          <a :href="actionsUrl" target="_blank" rel="noopener noreferrer" class="hover:text-emerald-400 transition-colors">Compilaciones CI/CD</a>
          <button @click="navigateToApp" class="hover:text-emerald-400 transition-colors">Plataforma Web</button>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.6s ease-out forwards;
}
</style>
