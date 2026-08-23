# 📚 Documentación Funcional del Sistema - JuiciosEvaluativos

Bienvenido al centro oficial de **Documentación Funcional y de Negocio** del sistema **JuiciosEvaluativos** (SENA). Esta documentación detalla exhaustivamente cada módulo funcional, historia de usuario, regla de negocio, caso de uso y flujo técnico del sistema.

---

## 🏛️ 1. Mapa General de Módulos Funcionales

```text
documentacion/
├── architecture/                     # Documentación Técnica de Arquitectura
│   ├── backend_architecture.md       # Arquitectura en capas Backend (Express + PostgreSQL)
│   └── frontend_architecture.md      # Arquitectura Feature-Driven Frontend (Vue 3 + Pinia)
├── graficas_interactivas.md          # Catálogo Técnico y Funcional de Gráficas Interactivas (ECharts & Chart.js)
├── plantilla-frontend-estructura.md  # Guía y plantilla de estructura de componentes
└── modules/                          # DOCUMENTACIÓN FUNCIONAL POR MÓDULOS
    ├── README.md                     # Índice general y matriz de trazabilidad (este archivo)
    │
    ├── imports/                      # 1. Módulo de Ingesta y Procesamiento de Datos
    │   ├── README.md                 # Resumen funcional del módulo
    │   ├── historias_usuario.md      # Historias de usuario (HU-IMP-001 a HU-IMP-005)
    │   ├── reglas_negocio.md         # Reglas de negocio (RN-IMP-001 a RN-IMP-012)
    │   └── casos_uso.md              # Casos de uso (CU-IMP-001 a CU-IMP-003)
    │
    ├── dashboard/                    # 2. Módulo de Panorama Ejecutivo y Métricas
    │   ├── README.md                 # Resumen funcional del módulo
    │   ├── historias_usuario.md      # Historias de usuario (HU-DSH-001 a HU-DSH-005)
    │   ├── reglas_negocio.md         # Reglas de negocio (RN-DSH-001 a RN-DSH-008)
    │   └── casos_uso.md              # Casos de uso (CU-DSH-001)
    │
    ├── academic-tracking/            # 3. Módulo de Seguimiento Curricular
    │   ├── README.md                 # Resumen funcional del módulo
    │   ├── historias_usuario.md      # Historias de usuario (HU-TRK-001 a HU-TRK-005)
    │   ├── reglas_negocio.md         # Reglas de negocio (RN-TRK-001 a RN-TRK-008)
    │   └── casos_uso.md              # Casos de uso (CU-TRK-001 a CU-TRK-003)
    │
    └── project-phases/               # 4. Módulo de Fases del Proyecto Formativo
        ├── README.md                 # Resumen funcional del módulo
        ├── historias_usuario.md      # Historias de usuario (HU-PHS-001 a HU-PHS-005)
        ├── reglas_negocio.md         # Reglas de negocio (RN-PHS-001 a RN-PHS-010)
        └── casos_uso.md              # Casos de uso (CU-PHS-001 a CU-PHS-003)
```

---

## 🧭 2. Resumen de Módulos

### 📦 [1. Módulo de Ingesta y Procesamiento de Datos (Imports)](file:///c:/Users/alejo/Downloads/juicioss/JuiciosEvaluativos/documentacion/modules/imports/README.md)
- **Propósito**: Carga y validación atómica de reportes SofiaPlus (`.csv`, `.xlsx`, `.xls`), prevención de duplicados por huella digital SHA-256, extracción de proyectos en PDF con motor Python, auditoría de logs y depuración segura de fichas en cascada.
- **Documentos**:
  - [Historias de Usuario (HU-IMP-001 a HU-IMP-005)](file:///c:/Users/alejo/Downloads/juicioss/JuiciosEvaluativos/documentacion/modules/imports/historias_usuario.md)
  - [Reglas de Negocio (RN-IMP-001 a RN-IMP-012)](file:///c:/Users/alejo/Downloads/juicioss/JuiciosEvaluativos/documentacion/modules/imports/reglas_negocio.md)
  - [Casos de Uso (CU-IMP-001 a CU-IMP-003)](file:///c:/Users/alejo/Downloads/juicioss/JuiciosEvaluativos/documentacion/modules/imports/casos_uso.md)

---

### 📊 [2. Módulo de Panorama Ejecutivo y Métricas (Dashboard)](file:///c:/Users/alejo/Downloads/juicioss/JuiciosEvaluativos/documentacion/modules/dashboard/README.md)
- **Propósito**: Visión ejecutiva del rendimiento institucional con gráficos interactivos ECharts (Gauge, Radar, Donut, Bar), clasificación de aprendices activos vs desertores, tabla priorizada de estudiantes rezagados, ranking de competencias y feed de juicios recientes.
- **Documentos**:
  - [Historias de Usuario (HU-DSH-001 a HU-DSH-005)](file:///c:/Users/alejo/Downloads/juicioss/JuiciosEvaluativos/documentacion/modules/dashboard/historias_usuario.md)
  - [Reglas de Negocio (RN-DSH-001 a RN-DSH-008)](file:///c:/Users/alejo/Downloads/juicioss/JuiciosEvaluativos/documentacion/modules/dashboard/reglas_negocio.md)
  - [Casos de Uso (CU-DSH-001)](file:///c:/Users/alejo/Downloads/juicioss/JuiciosEvaluativos/documentacion/modules/dashboard/casos_uso.md)

---

### 🎓 [3. Módulo de Seguimiento Curricular (Academic Tracking)](file:///c:/Users/alejo/Downloads/juicioss/JuiciosEvaluativos/documentacion/modules/academic-tracking/README.md)
- **Propósito**: Navegación dual por el catálogo de competencias de la ficha o por la hoja de vida evaluativa del aprendiz individual, modal de inspección por resultado y exportación nativa a libros de Excel (.xlsx) y actas institucionales en PDF (.pdf).
- **Documentos**:
  - [Historias de Usuario (HU-TRK-001 a HU-TRK-005)](file:///c:/Users/alejo/Downloads/juicioss/JuiciosEvaluativos/documentacion/modules/academic-tracking/historias_usuario.md)
  - [Reglas de Negocio (RN-TRK-001 a RN-TRK-008)](file:///c:/Users/alejo/Downloads/juicioss/JuiciosEvaluativos/documentacion/modules/academic-tracking/reglas_negocio.md)
  - [Casos de Uso (CU-TRK-001 a CU-TRK-003)](file:///c:/Users/alejo/Downloads/juicioss/JuiciosEvaluativos/documentacion/modules/academic-tracking/casos_uso.md)

---

### 🏗️ [4. Módulo de Fases del Proyecto Formativo (Project Phases)](file:///c:/Users/alejo/Downloads/juicioss/JuiciosEvaluativos/documentacion/modules/project-phases/README.md)
- **Propósito**: Gestión de proyectos pedagógicos estructurados en las 4 fases SENA (Análisis, Planeación, Ejecución, Evaluación), actividades de proyecto numeradas, sincronización de doble código (`codigo_juicio` vs `codigo_proyecto`), modo de asignación de competencias y algoritmo de deducción cronológica de deserción.
- **Documentos**:
  - [Historias de Usuario (HU-PHS-001 a HU-PHS-005)](file:///c:/Users/alejo/Downloads/juicioss/JuiciosEvaluativos/documentacion/modules/project-phases/historias_usuario.md)
  - [Reglas de Negocio (RN-PHS-001 a RN-PHS-010)](file:///c:/Users/alejo/Downloads/juicioss/JuiciosEvaluativos/documentacion/modules/project-phases/reglas_negocio.md)
  - [Casos de Uso (CU-PHS-001 a CU-PHS-003)](file:///c:/Users/alejo/Downloads/juicioss/JuiciosEvaluativos/documentacion/modules/project-phases/casos_uso.md)

---

## 🔄 3. Matriz General de Trazabilidad End-to-End

| HU | Regla de Negocio | Caso de Uso | Endpoint | Controller / Service | Componente / Vista |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **HU-IMP-001** | RN-IMP-001, RN-IMP-002, RN-IMP-003, RN-IMP-004, RN-IMP-005, RN-IMP-009 | CU-IMP-001 | `POST /api/import/csv` | `import.controller.ts` / `csvImport.ts` | `ImportWorkspaceView.vue`, `useFileParser.ts` |
| **HU-IMP-002** | RN-IMP-006 | CU-IMP-001 | N/A (Client SHA-256) | `importHistory.store.ts` | `ImportWorkspaceView.vue`, `importHistory.store.ts` |
| **HU-IMP-003** | RN-IMP-007 | CU-IMP-001 | `GET /api/logs`, `GET /api/logs/:file` | `import.controller.ts` / `log-writer.ts` | `ImportsHistoryModal.vue` |
| **HU-IMP-004** | RN-IMP-008 | CU-IMP-002 | `DELETE /api/formations/:ficha` | `formation.controller.ts` / `formations.ts` | `ImportWorkspaceView.vue`, `import.service.ts` |
| **HU-IMP-005** | RN-IMP-010, RN-IMP-011, RN-IMP-012 | CU-IMP-003 | `POST /api/extract/project` | `import.controller.ts` / `parse_pdf.py` | `ProjectPhasesView.vue`, `projectPhases.service.ts` |
| **HU-DSH-001** | RN-DSH-001, RN-DSH-002, RN-DSH-003 | CU-DSH-001 | `GET /api/dashboard` | `dashboard.controller.ts` / `dashboard.ts` | `DashboardGeneralView.vue`, `useDashboard.ts` |
| **HU-DSH-002** | RN-DSH-004, RN-DSH-005 | CU-DSH-001 | `GET /api/dashboard` | `dashboard.controller.ts` / `dashboard.ts` | `DashboardGeneralView.vue`, `academicContext.store.ts` |
| **HU-DSH-003** | RN-DSH-006 | CU-DSH-001 | `GET /api/dashboard` | `dashboard.ts` (`pendingLearners`) | `DashboardGeneralView.vue` (Tabla pendientes) |
| **HU-DSH-004** | RN-DSH-007 | CU-DSH-001 | `GET /api/dashboard` | `dashboard.ts` (`competencies`) | `DashboardGeneralView.vue` (Radar ECharts) |
| **HU-DSH-005** | RN-DSH-008 | CU-DSH-001 | `GET /api/dashboard` | `dashboard.ts` (`recentJudgements`) | `DashboardGeneralView.vue` (Feed auditoría) |
| **HU-TRK-001** | RN-TRK-001, RN-TRK-002, RN-TRK-003 | CU-TRK-001 | `GET /api/formations/competencies` | `formation.controller.ts` / `dashboard.ts` | `AcademicTrackingView.vue`, `useAcademicTracking.ts` |
| **HU-TRK-002** | RN-TRK-004, RN-TRK-005 | CU-TRK-002 | `GET /api/learners/:learnerId` | `learner.controller.ts` / `dashboard.ts` | `AcademicTrackingView.vue`, `useAcademicTracking.ts` |
| **HU-TRK-003** | RN-TRK-006 | CU-TRK-003 | `GET /api/formations/competencies` | `dashboard.ts` (`getFormationCatalog`) | `ResultDetailModal.vue` |
| **HU-TRK-004** | RN-TRK-007 | CU-TRK-003 | N/A (Cliente SheetJS) | `src/utils/exporters/excelReport.ts` | `ResultDetailModal.vue`, `excelReport.ts` |
| **HU-TRK-005** | RN-TRK-008 | CU-TRK-003 | N/A (Cliente jsPDF) | `src/utils/exporters/pdfReport.ts` | `ResultDetailModal.vue`, `pdfReport.ts` |
| **HU-PHS-001** | RN-PHS-001, RN-PHS-002 | CU-PHS-001 | `GET /api/projects` | `project.controller.ts` / `projects.ts` | `ProjectPhasesView.vue` |
| **HU-PHS-002** | RN-PHS-003, RN-PHS-004, RN-PHS-005 | CU-PHS-001 | `GET /api/projects/:id/phases` | `project.controller.ts` / `projects.ts` | `ProjectPhasesDetailView.vue` |
| **HU-PHS-003** | RN-PHS-006, RN-PHS-007 | CU-PHS-002 | `POST/DELETE /api/projects/phases/...` | `project.controller.ts` / `projects.ts` | `ProjectPhasesDetailView.vue` (Modal asignación) |
| **HU-PHS-004** | RN-PHS-008, RN-PHS-009 | CU-PHS-003 | `GET /api/projects/:id/phase-learner-stats` | `project.controller.ts` / `projects.ts` | `ProjectPhasesDetailView.vue` (Línea deserción) |
| **HU-PHS-005** | RN-PHS-010 | CU-PHS-001 | `POST /api/import/project` | `project.controller.ts` / `projects.ts` | `ProjectPhasesDetailView.vue`, `schema.ts` |

---

## 🎯 4. Plan de Mantenimiento y Buenas Prácticas Documentales
1. **No a la documentación desactualizada**: Cada vez que se cree un nuevo endpoint o regla en el backend/frontend, se debe registrar su correspondiente HU, RN y CU en el módulo asociado.
2. **Preservación de Trazabilidad**: Todo cambio en base de datos debe actualizar la matriz de trazabilidad y los contratos canónicos en `src/types/` y `Database/src/types/`.
3. **Validación Automática**: Antes de cada entrega, certificar que `npm run build` en el frontend y `npx tsx Database/tests/integration/services.test.ts` en el backend aprueben con 0 errores.
