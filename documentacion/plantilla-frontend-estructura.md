# 🏛️ Guía y Plantilla de Arquitectura de Carpetas del Frontend (Vue 3 + TypeScript)

## 1. Propósito y Filosofía
Este documento establece la convención arquitectónica oficial para el desarrollo del frontend. Utiliza un enfoque híbrido **Feature-Driven / Vertical Slice Architecture** combinado con **Capas Compartidas**.

Su objetivo es que cualquier desarrollador o agente de IA pueda:
- Comprender rápidamente la organización del proyecto.
- Localizar de inmediato dónde debe implementarse una nueva funcionalidad.
- Distinguir responsabilidades entre componentes, composables, servicios, stores, utilidades y tipos.
- Evitar duplicación de lógica y acoplamiento innecesario entre módulos.
- Mantener una separación clara entre funcionalidades específicas y recursos compartidos transversales.
- Incorporar nuevas funcionalidades sin degradar progresivamente la arquitectura.

> **Regla de Oro:**  
> **Todo el código específico de un dominio de negocio debe permanecer dentro de `features/`. Solo la infraestructura transversal y los componentes verdaderamente agnósticos al negocio pueden vivir en las capas globales.**

---

## 2. Estructura General de Directorios

```text
src/
├── app/                  # Infraestructura de arranque, router y config global
├── assets/               # Recursos estáticos (estilos globales, imágenes, fuentes)
├── components/           # Componentes UI compartidos y agnósticos al negocio
│   ├── ui/               # Botones, inputs, modales base (sin conocimiento del dominio)
│   ├── layout/           # AppHeader, AppLayout, Sidebar
│   └── common/           # LoadingSpinner, EmptyState, StatCards
├── features/             # MÓDULOS DE NEGOCIO ENCAPSULADOS (Vertical Slices)
│   └── <feature-name>/   # Dominio encapsulado (views, components, composables, services, stores, types)
├── services/             # Infraestructura HTTP global y clientes base
│   └── api/              # HttpClient centralizado (fetch/axios wrapper), interceptores y errores
├── stores/               # Estado global compartido transversalmente (Pinia)
├── types/                # Contratos canónicos globales compartidos por múltiples módulos
├── utils/                # Funciones puras e independientes de Vue (formatters, exporters, search)
├── App.vue               # Layout maestro raíz con <router-view />
└── main.ts               # Entrypoint de arranque (Vue + Pinia + Router + CSS)
```

---

## 3. Anatomía Estándar de una Feature (`features/<name>/`)

Cada funcionalidad de negocio debe ser un módulo autosuficiente.

```text
src/features/<feature-name>/
├── components/           # Componentes exclusivos de esta funcionalidad
├── composables/          # Lógica reactiva (ref, computed, watchers, validaciones)
├── services/             # Endpoints y llamadas HTTP específicos de este dominio
├── stores/               # Estado local de Pinia exclusivo de la feature (opcional)
├── types/                # Interfaces y Types de TypeScript exclusivos de esta feature
└── views/                # Vistas orquestadoras asociadas a rutas en el Router
```

> ⚠️ **Regla YAGNI (No a la sobrearquitectura):**  
> Crea únicamente las subcarpetas que la feature realmente necesita. Si una vista no requiere store local ni llamadas HTTP complejas, **no crees carpetas vacías**.

---

## 4. Gestión Estricta de Tipos en TypeScript (`types/` vs `features/*/types/`)

Para evitar que `src/types/` se convierta en un monolito inmanejable, clasifica los tipos con esta regla:

```text
                                ¿Dónde va el Type/Interface?
                                             │
               ┌─────────────────────────────┴─────────────────────────────┐
               ▼                                                           ▼
¿Pertenece a una sola feature?                             ¿Es compartido por ≥2 features 
     (p. ej. CsvPayload,                                    o representa un Contrato Canónico 
    DashboardFilterOptions)                                  con el Backend / Infraestructura?
               │                                                           │
               ▼                                                           ▼
src/features/<feature>/types/                                         src/types/
    └── <feature>.types.ts                                                ├── api.types.ts
                                                                          └── curriculum.types.ts
```

* **`src/types/` (Globales):** Contratos canónicos del dominio central que atraviesan todo el sistema (ej. `CurricularPhase`, `CurricularCompetency`) y tipos de transporte HTTP (`ApiResponse`, `ApiErrorResponse`).
* **`src/features/<name>/types/` (Locales):** Todo payload, DTO, filtro o interfaz que solo tenga sentido dentro de esa pantalla o flujo.

---

## 5. Flujo Canónico Unidireccional de Responsabilidades

```text
[ Usuario / Interfaz ]
       │
       ▼
 1. View (Orquestador de ruta)
       │
       ├─────────────────────────► Component (UI local de la feature)
       ▼
 2. Composable (Lógica reactiva, refs, computed)
       │
       ├─────────────────────────► Store (Pinia global o de la feature)
       ▼
 3. Feature Service (Endpoints y parámetros específicos)
       │
       ▼
 4. HttpClient (Infraestructura HTTP global en services/api/client.ts)
       │
       ▼
[ Backend API / Database ]
```

### Responsabilidad de cada capa:
1. **View (`views/`):** Conecta la ruta con los composables y compone la pantalla. **No contiene llamadas `fetch` directas ni lógica pesada.**
2. **Component (`components/`):** Muestra datos y emite eventos (`props` / `emits`).
3. **Composable (`composables/`):** Maneja el estado reactivo (`ref`, `computed`, `watch`) y coordina las acciones del usuario con los servicios.
4. **Service (`services/`):** Conoce las URLs, los verbos HTTP (`GET`, `POST`), los parámetros y los payloads. No tiene conocimiento del DOM ni de Vue.
5. **HttpClient (`services/api/`):** Abstrae la configuración base, inyección de headers, timeouts y control de errores.

---

## 6. Árbol de Decisión: "¿Dónde debo colocar este archivo?"

| Si vas a crear... | Y cumple con... | Ubicación correcta |
| :--- | :--- | :--- |
| **Componente** | Solo se usa en una pantalla de negocio | `src/features/<feature>/components/` |
| **Componente** | Es un elemento visual genérico (botón, modal, input) | `src/components/ui/` |
| **Componente** | Es parte de la estructura visual base (header, sidebar) | `src/components/layout/` |
| **Lógica Reactiva** | Maneja estado de un flujo de negocio | `src/features/<feature>/composables/` |
| **Llamada API** | Consulta endpoints de un módulo de negocio | `src/features/<feature>/services/` |
| **Estado Pinia** | Debe persistir y compartirse entre diferentes vistas | `src/stores/` |
| **Estado Pinia** | Solo se comparte entre subcomponentes de una feature | `src/features/<feature>/stores/` |
| **Función Pura** | Formatea fechas, números o exporta a PDF/Excel sin usar Vue | `src/utils/<category>/` |
| **Type / Interface** | Modela una respuesta de endpoint específica de una vista | `src/features/<feature>/types/` |
| **Type / Interface** | Modela un contrato canónico de todo el sistema | `src/types/` |

---

## 7. Reglas de Dependencia entre Features

> 🚫 **PROHIBIDO:** Una feature **NUNCA** debe importar componentes internos de otra feature.

```text
❌ Incorrecto:
import LearnerTable from '@/features/academic-tracking/components/LearnerTable.vue'
// (dentro de features/dashboard/)

✅ Correcto:
// 1. Si el componente es realmente genérico -> Promover a src/components/common/
// 2. Si el estado es compartido -> Mover la sincronización a src/stores/academicContext.store.ts
// 3. Si la navegación lo requiere -> Usar router.push('/tracking?learner=123')
```

---

## 8. Convenciones de Nomenclatura

| Elemento | Convención | Ejemplo |
| :--- | :--- | :--- |
| **Vistas** | `PascalCase` + sufijo `View.vue` | `AcademicTrackingView.vue` |
| **Componentes** | `PascalCase.vue` | `ResultDetailModal.vue`, `BaseButton.vue` |
| **Composables** | `camelCase` + prefijo `use` | `useFileParser.ts`, `useDashboard.ts` |
| **Servicios** | `camelCase` + sufijo `.service.ts` | `tracking.service.ts`, `import.service.ts` |
| **Stores** | `camelCase` + sufijo `.store.ts` | `academicContext.store.ts` |
| **Types** | `camelCase` + sufijo `.types.ts` | `tracking.types.ts`, `curriculum.types.ts` |
| **Utils** | `camelCase.ts` | `date.ts`, `number.ts`, `pdfReport.ts` |

---

## 9. Checklist Rápido para PRs y Nuevas Funcionalidades

Antes de dar por terminada una tarea en el frontend, verifica:
- [ ] ¿El código del dominio está encapsulado en `src/features/<mi-feature>/`?
- [ ] ¿Las llamadas HTTP están dentro de un `.service.ts` usando `apiClient`?
- [ ] ¿Los types específicos del módulo están en `features/<mi-feature>/types/` y no contaminando `src/types/`?
- [ ] ¿La vista actúa como orquestador y no supera un tamaño razonable (~200-400 líneas)?
- [ ] ¿Las funciones auxiliares (formatters, cálculos) están en `src/utils/` sin duplicarse?
- [ ] ¿El comando `npx vue-tsc --noEmit` y `npm run build` compilan con 0 errores?
