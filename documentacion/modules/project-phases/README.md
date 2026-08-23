# 🏗️ Módulo de Fases del Proyecto Formativo (Project Phases)

## 📌 1. Descripción General del Módulo
El módulo **Project Phases** (Fases del Proyecto Formativo) es el pilar de estructuración pedagógica y analítica curricular del sistema **JuiciosEvaluativos**. Su misión es cerrar la brecha entre la planeación formativa del SENA (documentada en proyectos oficiales) y la ejecución real de juicios evaluativos en SofiaPlus.

### Capacidades Esenciales:
1. **Gestión Integral de Proyectos Formativos**:
   - Catálogo de proyectos registrados con código SOFIA, nombre, programa, duración en meses, regional y centro de formación.
   - Eliminación atómica y segura de proyectos formativos con sus vínculos.
2. **Jerarquía Curricular de 4 Fases**:
   - Mapeo estricto a las 4 fases pedagógicas del SENA: `ANALISIS` (Fase 1), `PLANEACION` (Fase 2), `EJECUCION` (Fase 3) y `EVALUACION` (Fase 4).
   - Estructuración de **Actividades de Proyecto** numeradas dentro de cada fase (almacenadas en `fase_actividad`).
   - Asociación matricial de competencias y resultados de aprendizaje (RAPs) a cada actividad de proyecto (`fase_competencia`, `fase_resultado`).
3. **Mecanismo de Doble Código (Dual-Code Contract)**:
   - Sincronización transparente entre el `codigo_juicio` (usado por SofiaPlus para calificar) y el `codigo_proyecto` (código normativo de 6 a 9 dígitos del proyecto formativo).
4. **Modo de Asignación y Gestión de Competencias Sueltas**:
   - Detección de competencias huérfanas sin fase (`unassigned`).
   - Modal interactivo de vinculación y desvinculación manual de competencias a fases (`fase_competencia` y `fase_resultado`).
5. **Algoritmo de Deducción Inteligente de Deserción Curricular**:
   - Análisis cronológico y de última fecha de actividad para ubicar con exactitud en qué fase pedagógica se retiró o trasladó cada aprendiz desertor.
   - Gráfico de tendencias de deserción (*Line Chart* con relleno de área) y conteos por novedad (*Retiro Voluntario* vs *Traslado*).

---

## 👥 2. Actores y Roles Involucrados
| Rol | Interacción en el Módulo |
| :--- | :--- |
| **Diseñador Curricular / Coordinador Académico** | Importa proyectos en PDF, ajusta la asignación de competencias a fases y actividades, y supervisa la integridad de la matriz curricular. |
| **Instructor Líder / Comité de Evaluación** | Analiza las métricas de cumplimiento de cada fase formativa y evalúa las estadísticas de retención y deserción por fase. |

---

## 🏛️ 3. Componentes Arquitectónicos del Módulo

### Frontend (`src/features/project-phases/`):
- **Vistas**:
  - `ProjectPhasesView.vue`: Grid de proyectos formativos, estado vacío (*EmptyState*) y modal de subida de PDF.
  - `ProjectPhasesDetailView.vue`: Vista principal de detalle organizada en navegación por fases, tarjetas de KPIs de fase, actividades colapsables, acordeones de competencias, vista de competencias sueltas, gráfico de deserción y modal de vinculación.
- **Servicios**:
  - `projectPhases.service.ts`: Abstracción HTTP para `/api/projects`, `/api/projects/:id/phases`, `/api/projects/:id/phase-learner-stats`, `/api/projects/:id/unassigned`, `/api/projects/phases/:phaseId/competencies/:competencyId` y `/api/extract/project`.
- **Tipos**:
  - `types/projectPhases.types.ts`: Modelos de proyectos, estadísticas de fase y aprendices desertores.
  - `src/types/curriculum.types.ts`: Contratos canónicos transversales (`CurricularPhase`, `CurricularCompetency`, `CurricularOutcome`, `CurricularActivity`).

### Backend (`Database/src/`):
- **Controladores**:
  - `project.controller.ts`: Endpoints `listProjects`, `getPhases`, `getProjectLearnerStats`, `getProjectFichas`, `getUnassigned`, `assignCompetency`, `unassign`, `deleteProject`, `importProject`.
- **Servicios**:
  - `projects.ts`: Lógica transaccional de importación (`importProject`), lectura jerárquica (`getProjectPhases`), vinculación (`assignCompetencyToPhase`, `unassignCompetency`), eliminación (`deleteProject`) y el algoritmo avanzado de deserción (`getPhaseLearnerStats`).
  - `schema.ts`: Migración automática de tablas (`fase_actividad`, `fase_competencia`, `fase_resultado`, `codigo_juicio`, `codigo_proyecto`).
- **Rutas**:
  - `routes/project.routes.ts`: Definición de todos los endpoints de proyectos bajo `/api`.

---

## 🔗 4. Matriz de Trazabilidad Rápida
| Historia de Usuario | Reglas de Negocio | Endpoints Relacionados | Componentes / Vistas |
| :--- | :--- | :--- | :--- |
| **HU-PHS-001**: Gestión y Consulta de Proyectos Formativos | RN-PHS-001, RN-PHS-002 | `GET /api/projects`, `DELETE /api/projects/:id` | `ProjectPhasesView.vue`, `ProjectPhasesDetailView.vue` |
| **HU-PHS-002**: Estructura de Fases y Actividades de Proyecto | RN-PHS-003, RN-PHS-004, RN-PHS-005 | `GET /api/projects/:id/phases` | `ProjectPhasesDetailView.vue` |
| **HU-PHS-003**: Asignación Matricial y Competencias Sueltas | RN-PHS-006, RN-PHS-007 | `GET /api/projects/:id/unassigned`, `POST /api/projects/phases/:phaseId/competencies/:competencyId` | `ProjectPhasesDetailView.vue` |
| **HU-PHS-004**: Deducción Cronológica de Deserción por Fase | RN-PHS-008, RN-PHS-009 | `GET /api/projects/:id/phase-learner-stats` | `ProjectPhasesDetailView.vue` (Analítica de deserción) |
| **HU-PHS-005**: Mapeo Inteligente con Doble Código (Dual-Code) | RN-PHS-010 | `POST /api/import/project`, `GET /api/projects/:id/phases` | `projects.ts`, `schema.ts` |

---

## 📂 5. Documentos del Módulo
- [Historias de Usuario](file:///c:/Users/alejo/Downloads/juicioss/JuiciosEvaluativos/documentacion/modules/project-phases/historias_usuario.md)
- [Reglas de Negocio](file:///c:/Users/alejo/Downloads/juicioss/JuiciosEvaluativos/documentacion/modules/project-phases/reglas_negocio.md)
- [Casos de Uso](file:///c:/Users/alejo/Downloads/juicioss/JuiciosEvaluativos/documentacion/modules/project-phases/casos_uso.md)
