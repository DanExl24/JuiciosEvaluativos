# 📋 Reglas de Negocio - Módulo de Seguimiento Curricular (Academic Tracking)

---

## 1. Categoría: Catálogo Curricular y Jerarquía Formativa

### RN-TRK-001: Agrupación Jerárquica Multinivel de Competencias y RAPs
- **Identificador**: `RN-TRK-001`
- **Descripción**: La información del catálogo formativo (`getFormationCompetencyCatalog`) debe organizarse estrictamente en una jerarquía de 3 niveles:
  $$\text{Ficha} \longrightarrow \text{Competencia} \longrightarrow \text{Resultado de Aprendizaje (RAP)}$$
  Cada RAP contiene la lista de aprendices matriculados con su estado de juicio evaluativo correspondiente.
- **Motivo**: Respetar la arquitectura curricular del SENA y permitir una navegación intuitiva y colapsable por niveles de abstracción pedagógica.
- **Módulos afectados**: `academic-tracking`, `dashboard`
- **Archivos donde se implementa**: `Database/src/services/dashboard.ts` (`getFormationCompetencyCatalog`)
- **Endpoints relacionados**: `GET /api/formations/competencies`
- **Historias de usuario relacionadas**: `HU-TRK-001`

---

### RN-TRK-002: Búsqueda Normalizada e Insensible a Caracteres Especiales
- **Identificador**: `RN-TRK-002`
- **Descripción**: El filtrado en vivo de competencias y resultados en el cliente debe ejecutarse mediante la función `normalizeSearchValue`, la cual aplica descomposición Unicode NFD (`.normalize('NFD')`), remueve marcas diacríticas (`/[\u0300-\u036f]/g`), convierte a minúsculas y elimina espacios extras. La búsqueda debe comparar simultáneamente contra:
  - Nombre de la competencia
  - Código canónico, `codigo_juicio` y `codigo_proyecto` de la competencia
  - Código canónico, `codigo_juicio` y `codigo_proyecto` del resultado
  - Descripción o detalle textual del resultado
- **Motivo**: Permitir al instructor localizar competencias o RAPs aun cuando ingrese términos con o sin tildes, mayúsculas o códigos parciales.
- **Módulos afectados**: `academic-tracking`, `dashboard`
- **Archivos donde se implementa**: `src/utils/search/textNormalizer.ts` (`normalizeSearchValue`), `src/features/academic-tracking/composables/useAcademicTracking.ts` (`filterCatalog`)
- **Endpoints relacionados**: N/A (Filtrado reactivo en Frontend)
- **Historias de usuario relacionadas**: `HU-TRK-001`

---

### RN-TRK-003: Cálculo de Progreso por Competencia y RAP
- **Identificador**: `RN-TRK-003`
- **Descripción**: Para cada resultado de aprendizaje en el catálogo:
  $$\text{progreso\_RAP (\%)} = \text{round}\left(\frac{\text{aprendices\_aprobados}}{\text{total\_aprendices\_evaluados}} \times 100, 1\right)$$
  Para cada competencia, el progreso corresponde a la relación acumulada de todos sus aprendices aprobados entre el total de aprendices evaluados en todos los RAPs de dicha competencia.
- **Motivo**: Proporcionar métricas cuantitativas homogéneas tanto a nivel de micro-resultado como de macro-competencia.
- **Módulos afectados**: `academic-tracking`
- **Archivos donde se implementa**: `Database/src/services/dashboard.ts` (`getFormationCompetencyCatalog`)
- **Endpoints relacionados**: `GET /api/formations/competencies`
- **Historias de usuario relacionadas**: `HU-TRK-001`

---

## 2. Categoría: Detalle Individual del Aprendiz

### RN-TRK-004: Trazabilidad Completa de Juicios por Aprendiz
- **Identificador**: `RN-TRK-004`
- **Descripción**: Al consultar el detalle de un aprendiz individual (`getLearnerDetail`), el sistema debe retornar:
  - La totalidad de competencias y resultados de aprendizaje del programa formativo al que pertenece el aprendiz.
  - El estado de juicio del aprendiz en cada RAP (`aprobado`, `por evaluar`, `desaprobado`).
  - La fecha y hora exacta del juzgamiento (`juicio_fecha`) en formato ISO con zona horaria de Colombia.
  - La identificación completa del funcionario evaluador.
  - El estado cuantitativo del resultado (`statusProgress = 100` si está aprobado, `0` si está pendiente o desaprobado).
- **Motivo**: Brindar una radiografía curricular completa para comités de evaluación y planes de mejoramiento.
- **Módulos afectados**: `academic-tracking`, `dashboard`
- **Archivos donde se implementa**: `Database/src/services/dashboard.ts` (`getLearnerDetail`), `Database/src/controllers/learner.controller.ts` (`getLearner`)
- **Endpoints relacionados**: `GET /api/learners/:learnerId`
- **Historias de usuario relacionadas**: `HU-TRK-002`

---

### RN-TRK-005: Validación Estricta de Identificador de Aprendiz
- **Identificador**: `RN-TRK-005`
- **Descripción**: El parámetro `learnerId` recibido en `/api/learners/:learnerId` debe ser un entero positivo estrictamente mayor a 0 (`Number.isInteger(learnerId) && learnerId > 0`). Si no cumple, el backend responde HTTP 400 (`{ error: 'El identificador del aprendiz no es valido.' }`). Si el aprendiz no existe en la base de datos, responde HTTP 404 (`{ error: 'No se encontro el aprendiz solicitado.' }`).
- **Motivo**: Prevenir inyecciones, consultas inválidas a la base de datos o fallos de ejecución no controlados.
- **Módulos afectados**: `academic-tracking`, `Database/src/controllers/learner.controller.ts`
- **Archivos donde se implementa**: `Database/src/controllers/learner.controller.ts` (`getLearner`)
- **Endpoints relacionados**: `GET /api/learners/:learnerId`
- **Historias de usuario relacionadas**: `HU-TRK-002`

---

## 3. Categoría: Exportación de Reportes y Seguridad en Cliente

### RN-TRK-006: Filtro Dinámico de Aprendices en Modal
- **Identificador**: `RN-TRK-006`
- **Descripción**: Cuando se aplica un filtro de juicio evaluativo en `ResultDetailModal.vue` (`aprobado`, `por evaluar`, `desaprobado`), la tabla y las funciones de exportación a Excel y PDF deben operar exclusivamente sobre el subconjunto de aprendices que cumplen dicho criterio. Si el filtro está vacío, se incluyen todos los aprendices del RAP.
- **Motivo**: Permitir la generación de reportes especializados (ej. reporte exclusivo de aprendices con juicio pendiente para citación a plan de mejora).
- **Módulos afectados**: `academic-tracking`
- **Archivos donde se implementa**: `src/features/academic-tracking/components/ResultDetailModal.vue` (`filteredLearners`, `handleExportExcel`, `handleExportPdf`)
- **Endpoints relacionados**: N/A (Frontend Component)
- **Historias de usuario relacionadas**: `HU-TRK-003`, `HU-TRK-004`, `HU-TRK-005`

---

### RN-TRK-007: Estándar de Formato en Libros de Excel (.xlsx)
- **Identificador**: `RN-TRK-007`
- **Descripción**: Los reportes exportados a Excel mediante `excelReport.ts` deben estructurarse con:
  - Fila 1: Título institucional y fecha de generación.
  - Fila 2: Metadatos (Ficha de Caracterización, Competencia, Resultado de Aprendizaje).
  - Fila 4 en adelante: Encabezados de tabla y registros de aprendices formateados con ancho de columnas automático para evitar truncamiento de texto.
  - Nombre de archivo sanitizado: `Reporte_Ficha_{ficha}_RAP_{codigo}.xlsx`.
- **Motivo**: Generar planillas electrónicas profesionales, legibles y listas para su uso por parte del equipo docente.
- **Módulos afectados**: `academic-tracking`
- **Archivos donde se implementa**: `src/utils/exporters/excelReport.ts` (`exportResultToExcel`, `exportLearnerToExcel`)
- **Endpoints relacionados**: N/A (Cliente)
- **Historias de usuario relacionadas**: `HU-TRK-004`

---

### RN-TRK-008: Estándar Tipográfico y Estilizado de Actas en PDF
- **Identificador**: `RN-TRK-008`
- **Descripción**: La exportación a PDF mediante `pdfReport.ts` debe aplicar la paleta institucional:
  - Encabezados de tabla en verde oscuro corporativo (`#059669` / RGB `[5, 150, 105]`).
  - Badges de juicio con colores normalizados: Verde (`#10b981`) para Aprobado, Ámbar (`#f59e0b`) para Por Evaluar, Rojo (`#ef4444`) para Desaprobado.
  - Paginación automática en el pie de página centrada con formato: `Página X de Y`.
  - Nombre de archivo sanitizado: `Reporte_Ficha_{ficha}_RAP_{codigo}.pdf`.
- **Motivo**: Proveer documentos imprimibles y archivables con alta calidad visual aptos para auditorías institucionales de calidad.
- **Módulos afectados**: `academic-tracking`
- **Archivos donde se implementa**: `src/utils/exporters/pdfReport.ts` (`exportResultToPdf`, `exportLearnerToPdf`)
- **Endpoints relacionados**: N/A (Cliente)
- **Historias de usuario relacionadas**: `HU-TRK-005`
