# 🎓 Módulo de Seguimiento Curricular (Academic Tracking)

## 📌 1. Descripción General del Módulo
El módulo **Academic Tracking** (Seguimiento Curricular) es el núcleo de consulta y supervisión del progreso pedagógico en **JuiciosEvaluativos**. Ofrece una arquitectura de doble perspectiva (*Catálogo General por Ficha* vs *Detalle Individual por Aprendiz*), permitiendo a los instructores y comités académicos inspeccionar con precisión el estado de cada competencia, resultado de aprendizaje (RAP) y juicio evaluativo emitido.

### Características Principales:
1. **Modo Dual de Visualización**:
   - **Vista de Catálogo Formativo**: Agrupa las competencias en acordeones multinivel interactivos, mostrando el número de aprendices aprobados, pendientes y desaprobados por cada RAP de la ficha.
   - **Vista de Detalle por Aprendiz**: Permite seleccionar a un aprendiz de la cohorte para consultar su historial de juicios, porcentaje individual de avance, resultados adeudados y funcionarios evaluadores responsables.
2. **Modal de Detalle de Resultado (`ResultDetailModal.vue`)**:
   - Inspección profunda de los aprendices evaluados en un RAP específico.
   - Filtro reactivo por estado de juicio (`aprobado`, `por evaluar`, `desaprobado`).
   - Tira de indicadores rápidos (Total, Aprobados, Pendientes, Cumplimiento).
3. **Generación y Exportación de Reportes en el Cliente**:
   - **Exportador a Excel (`excelReport.ts`)**: Construye libros `.xlsx` con hojas de cálculo formateadas mediante `SheetJS` incluyendo metadatos de ficha, competencia y matriz de aprendices.
   - **Exportador a PDF (`pdfReport.ts`)**: Genera documentos PDF vectoriales con cabeceras institucionales, resumen cuantitativo y tabla estilizada mediante `jsPDF` y `jspdf-autotable`.
4. **Búsqueda Normalizada Avanzada**: Búsqueda en vivo insensible a mayúsculas, minúsculas, espacios y tildes sobre nombres y códigos de competencias y resultados.

---

## 👥 2. Actores y Roles Involucrados
| Rol | Interacción en el Módulo |
| :--- | :--- |
| **Instructor / Docente Líder** | Realiza el seguimiento periódico de juicios de la ficha, identifica aprendices rezagados en sus competencias y genera reportes de notas para comités. |
| **Coordinador Académico / Comité de Evaluación** | Descarga reportes en PDF y Excel para actas de comité de seguimiento y plan de mejoramiento. |

---

## 🏛️ 3. Componentes Arquitectónicos del Módulo

### Frontend (`src/features/academic-tracking/`):
- **Vistas**:
  - `AcademicTrackingView.vue`: Orquestador principal con selector lateral de modo (Catálogo vs Aprendiz), acordeones desplegables, buscador normalizado y panel de detalle.
- **Componentes**:
  - `ResultDetailModal.vue`: Modal de inspección de aprendices por resultado con disparadores de exportación a Excel y PDF.
- **Composables**:
  - `useAcademicTracking.ts`: Lógica reactiva de carga de catálogo (`loadFormationCatalog`), detalle de aprendiz (`loadLearnerDetail`), expansión de acordeones y filtrado de catálogo.
- **Servicios**:
  - `tracking.service.ts`: Abstracción HTTP para `/api/formations/competencies`, `/api/learners/:id` y `/api/dashboard`.
- **Utilidades de Exportación (`src/utils/exporters/`)**:
  - `excelReport.ts`: Generación de reportes XLSX para resultados de aprendizaje y aprendices.
  - `pdfReport.ts`: Generación de actas y reportes PDF con autotables.

### Backend (`Database/src/`):
- **Controladores**:
  - `formation.controller.ts`: Endpoint `getFormationCompetencies`.
  - `learner.controller.ts`: Endpoint `getLearner`.
- **Servicios**:
  - `dashboard.ts`: Métodos `getFormationCompetencyCatalog` y `getLearnerDetail`.
- **Rutas**:
  - `routes/formation.routes.ts`: `GET /api/formations/competencies`.
  - `routes/learner.routes.ts`: `GET /api/learners/:learnerId`.

---

## 🔗 4. Matriz de Trazabilidad Rápida
| Historia de Usuario | Reglas de Negocio | Endpoints Relacionados | Componentes / Vistas |
| :--- | :--- | :--- | :--- |
| **HU-TRK-001**: Catálogo Curricular por Competencias y RAPs | RN-TRK-001, RN-TRK-002, RN-TRK-003 | `GET /api/formations/competencies` | `AcademicTrackingView.vue`, `useAcademicTracking.ts` |
| **HU-TRK-002**: Detalle Individual y Auditoría de Aprendiz | RN-TRK-004, RN-TRK-005 | `GET /api/learners/:learnerId` | `AcademicTrackingView.vue`, `useAcademicTracking.ts` |
| **HU-TRK-003**: Inspección Modal de Aprendices por Resultado | RN-TRK-006 | `GET /api/formations/competencies` | `ResultDetailModal.vue` |
| **HU-TRK-004**: Exportación de Reportes a Excel (.xlsx) | RN-TRK-007 | N/A (Cliente SheetJS) | `ResultDetailModal.vue`, `excelReport.ts` |
| **HU-TRK-005**: Exportación de Actas y Reportes a PDF | RN-TRK-008 | N/A (Cliente jsPDF) | `ResultDetailModal.vue`, `pdfReport.ts` |

---

## 📂 5. Documentos del Módulo
- [Historias de Usuario](file:///c:/Users/alejo/Downloads/juicioss/JuiciosEvaluativos/documentacion/modules/academic-tracking/historias_usuario.md)
- [Reglas de Negocio](file:///c:/Users/alejo/Downloads/juicioss/JuiciosEvaluativos/documentacion/modules/academic-tracking/reglas_negocio.md)
- [Casos de Uso](file:///c:/Users/alejo/Downloads/juicioss/JuiciosEvaluativos/documentacion/modules/academic-tracking/casos_uso.md)
