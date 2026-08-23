# 📋 Reglas de Negocio - Módulo de Fases del Proyecto Formativo (Project Phases)

---

## 1. Categoría: Estructura Curricular y Fases Formativas

### RN-PHS-001: Cardinalidad y Secuencia Canónica de las 4 Fases
- **Identificador**: `RN-PHS-001`
- **Descripción**: Todo proyecto formativo del SENA se estructura de forma obligatoria en 4 fases pedagógicas ordenadas secuencialmente:
  1. `ANALISIS` (Orden 1)
  2. `PLANEACION` (Orden 2)
  3. `EJECUCION` (Orden 3)
  4. `EVALUACION` (Orden 4)
  Las fases pertenecen al programa formativo (`id_programa`) y se almacenan con restricción de unicidad compuesta: `UNIQUE (nombre, id_programa)`.
- **Motivo**: Respetar el ciclo formativo oficial del modelo pedagógico del SENA y evitar fases duplicadas en el mismo programa.
- **Módulos afectados**: `project-phases`, `Database/src/services/schema.ts`, `Database/src/services/projects.ts`
- **Archivos donde se implementa**: `Database/src/services/projects.ts` (`importProject`, `getProjectPhases`), `Database/src/services/schema.ts`
- **Endpoints relacionados**: `GET /api/projects/:projectId/phases`, `POST /api/import/project`
- **Historias de usuario relacionadas**: `HU-PHS-001`, `HU-PHS-002`

---

### RN-PHS-002: Requisito de Existencia Previa del Programa al Importar Proyecto
- **Identificador**: `RN-PHS-002`
- **Descripción**: Para importar un proyecto formativo (`importProject`), el programa (`programa.codigo`) debe existir previamente en la base de datos (haber sido creado mediante la importación del CSV/Excel de juicios). Si no existe, se rechaza la importación con el mensaje:
  *"El programa con código {programCode} no se encontró en la base de datos. Por favor, importe el CSV primero."*
- **Motivo**: Garantizar la integridad referencial entre el proyecto pedagógico y los aprendices/fichas existentes.
- **Módulos afectados**: `project-phases`, `imports`
- **Archivos donde se implementa**: `Database/src/services/projects.ts` (`importProject`)
- **Endpoints relacionados**: `POST /api/import/project`
- **Historias de usuario relacionadas**: `HU-PHS-001`

---

### RN-PHS-003: Estructuración de Actividades de Proyecto en Fases
- **Identificador**: `RN-PHS-003`
- **Descripción**: Cada fase formativa puede contener múltiples **Actividades de Proyecto** registradas en la tabla `fase_actividad`. Cada actividad posee:
  - `id_actividad`: Clave primaria autoincremental.
  - `id_fase`: Referencia a la fase en `fases`.
  - `numero`: Número entero que representa el orden de la actividad (extraído del prefijo de texto, ej. `1`, `2`).
  - `descripcion`: Texto descriptivo completo de la actividad de proyecto.
  - Restricción de unicidad: `CONSTRAINT uq_fase_actividad UNIQUE (id_fase, descripcion)`.
- **Motivo**: Representar fielmente las actividades definidas en la planeación pedagógica y permitir asociar competencias y RAPs a actividades específicas dentro de cada fase.
- **Módulos afectados**: `project-phases`, `Database/src/services/schema.ts`, `Database/src/services/projects.ts`
- **Archivos donde se implementa**: `Database/src/services/schema.ts`, `Database/src/services/projects.ts` (`importProject`, `getProjectPhases`)
- **Endpoints relacionados**: `GET /api/projects/:projectId/phases`, `POST /api/import/project`
- **Historias de usuario relacionadas**: `HU-PHS-002`

---

### RN-PHS-004: Asignación Inteligente de RAPs a Actividades en Fases Multiactividad
- **Identificador**: `RN-PHS-004`
- **Descripción**: Cuando una fase formativa posee múltiples actividades (caso típico de la fase de `ANALISIS`):
  1. La **Actividad 1** (Inducción) agrupa exclusivamente los resultados de la competencia de Inducción (`nombre ILIKE '%INDUCCI%'` o `codigo_juicio = '36182'` o `codigo_proyecto = '240201530'`).
  2. La **Actividad 2** y subsiguientes agrupan los resultados técnicos y transversales del proyecto.
  Si una fase posee una única actividad, todos los RAPs de dicha fase se asignan automáticamente a su única actividad.
- **Motivo**: En los programas del SENA, la Inducción constituye la primera actividad de la fase de Análisis y debe estar claramente diferenciada de la formulación técnica del proyecto.
- **Módulos afectados**: `project-phases`, `Database/src/services/schema.ts`, `Database/src/services/projects.ts`
- **Archivos donde se implementa**: `Database/src/services/schema.ts` (Backfill inteligente), `Database/src/services/projects.ts` (`getProjectPhases`)
- **Endpoints relacionados**: `GET /api/projects/:projectId/phases`
- **Historias de usuario relacionadas**: `HU-PHS-002`

---

### RN-PHS-005: Fallback de Asignación a Actividades
- **Identificador**: `RN-PHS-005`
- **Descripción**: Si una competencia pertenece a una fase pero ninguno de sus RAPs tiene un `id_actividad` explícito que coincida con las actividades estructuradas, la competencia y sus RAPs se asignan automáticamente a la última actividad de la fase como mecanismo de contingencia visual.
- **Motivo**: Prevenir que competencias válidas queden invisibles en la interfaz de usuario por falta de mapeo fino a nivel de subactividad.
- **Módulos afectados**: `project-phases`
- **Archivos donde se implementa**: `Database/src/services/projects.ts` (`getProjectPhases`)
- **Endpoints relacionados**: `GET /api/projects/:projectId/phases`
- **Historias de usuario relacionadas**: `HU-PHS-002`

---

## 2. Categoría: Asignación Matricial y Competencias Sueltas

### RN-PHS-006: Sincronización en Cascada de RAPs al Vincular Competencia
- **Identificador**: `RN-PHS-006`
- **Descripción**: Al vincular una competencia a una fase (`assignCompetencyToPhase`):
  1. Se inserta el registro en `fase_competencia (id_fase, id_competencia) ON CONFLICT DO NOTHING`.
  2. Automáticamente se insertan **todos los resultados de aprendizaje** de dicha competencia en `fase_resultado (id_fase, id_resultado) ON CONFLICT DO NOTHING`.
  La operación debe ejecutarse dentro de una transacción SQL (`BEGIN` ➔ `COMMIT`).
- **Motivo**: Garantizar que la fase herede inmediatamente todos los micro-resultados evaluables de la competencia sin requerir vinculaciones manuales individuales.
- **Módulos afectados**: `project-phases`, `Database/src/services/projects.ts`
- **Archivos donde se implementa**: `Database/src/services/projects.ts` (`assignCompetencyToPhase`)
- **Endpoints relacionados**: `POST /api/projects/phases/:phaseId/competencies/:competencyId`
- **Historias de usuario relacionadas**: `HU-PHS-003`

---

### RN-PHS-007: Desvinculación Total de RAPs al Desasignar Competencia
- **Identificador**: `RN-PHS-007`
- **Descripción**: Al desvincular una competencia de una fase (`unassignCompetency`):
  1. Se elimina la fila de `fase_competencia` para el par `(id_competencia, id_fase)`.
  2. Se eliminan todas las filas de `fase_resultado` asociadas a los RAPs de esa competencia en dicha fase.
  La operación se ejecuta en una transacción SQL atómica.
- **Motivo**: Evitar resultados de aprendizaje huérfanos asociados a fases de las que su competencia madre ya fue retirada.
- **Módulos afectados**: `project-phases`, `Database/src/services/projects.ts`
- **Archivos donde se implementa**: `Database/src/services/projects.ts` (`unassignCompetency`)
- **Endpoints relacionados**: `DELETE /api/projects/phases/:phaseId/competencies/:competencyId`
- **Historias de usuario relacionadas**: `HU-PHS-003`

---

## 3. Categoría: Algoritmo de Deducción de Deserción y Métricas

### RN-PHS-008: Deducción Cronológica de Fase para Aprendices Desertores
- **Identificador**: `RN-PHS-008`
- **Descripción**: Para los aprendices en estado de retiro (`'retiro voluntario'` o `'traslado'`), el sistema deduce la fase formativa donde ocurrió la deserción aplicando el siguiente algoritmo:
  1. Se localiza el último juicio evaluativo emitido del aprendiz (`ORDER BY je.fecha DESC NULLS LAST, je.id_juicio DESC`).
  2. Se identifica la fase base a la que pertenece el resultado de dicho último juicio (`fase_resultado`).
  3. Si el último juicio tiene fecha registrada (`ultima_fecha`), se compara contra las **fechas de referencia** de cada fase en la ficha (`MAX(je.fecha)` de los aprendices activos en esa fase).
  4. Si una fase posterior tiene una fecha de referencia mayor que la última fecha del aprendiz, el aprendiz se asigna a dicha fase; de lo contrario, se conserva la fase base del resultado.
  5. Si el aprendiz no tiene fecha ni juicios evaluados, permanece en la fase base inicial (`ANALISIS`).
- **Motivo**: En SofiaPlus, la fecha de retiro administrativo no siempre coincide con el momento en que el estudiante dejó de asistir. La actividad evaluativa real y su contraste con el avance del grupo determinan con precisión científica en qué fase desertó el estudiante.
- **Módulos afectados**: `project-phases`, `Database/src/services/projects.ts`
- **Archivos donde se implementa**: `Database/src/services/projects.ts` (`getPhaseLearnerStats`)
- **Endpoints relacionados**: `GET /api/projects/:projectId/phase-learner-stats`
- **Historias de usuario relacionadas**: `HU-PHS-004`

---

### RN-PHS-009: Diferenciación de Población Activa vs Desertora en Cumplimiento de Fase
- **Identificador**: `RN-PHS-009`
- **Descripción**: El cálculo de juicios esperados y porcentaje de cumplimiento de cada fase (`progressPercentage`) en `getPhaseLearnerStats` aplica reglas diferenciadas:
  - **Aprendices Activos (`'en formacion'`)**: Se espera que completen la totalidad de resultados asociados a la fase en `fase_resultado`.
  - **Aprendices Retirados / Trasladados**: Solo se contabilizan en la fase si tuvieron actividad real demostrada (juicio distinto a `'por evaluar'` o con fecha no nula).
- **Motivo**: Evitar que los aprendices que desertaron en la fase 1 inflen artificialmente los juicios pendientes esperados de las fases 2, 3 y 4, lo que degradaría incorrectamente las métricas de éxito de los estudiantes que continúan activos.
- **Módulos afectados**: `project-phases`, `Database/src/services/projects.ts`
- **Archivos donde se implementa**: `Database/src/services/projects.ts` (`getPhaseLearnerStats`, CTE `phase_expected_results`)
- **Endpoints relacionados**: `GET /api/projects/:projectId/phase-learner-stats`
- **Historias de usuario relacionadas**: `HU-PHS-004`

---

## 4. Categoría: Doble Código (Dual-Code Contract)

### RN-PHS-010: Preservación y Sincronización del Contrato de Doble Código
- **Identificador**: `RN-PHS-010`
- **Descripción**: Las tablas `competencia` y `resultados_aprendizaje` mantienen dos columnas de código:
  1. `codigo_juicio`: Código con el que SofiaPlus registra los juicios evaluativos (ej. `36182`).
  2. `codigo_proyecto`: Código normativo formal extraído del proyecto formativo en PDF (ej. `240201530` o `22050109601`).
  Durante la importación del PDF, si un código coincide con los resultados existentes, se actualiza `codigo_proyecto`. En todas las consultas del frontend (`CurricularOutcome`, `CurricularCompetency`), el campo principal `codigo` resuelve con prioridad de fallback: `codigo_proyecto ?? codigo_juicio ?? codigo`.
- **Motivo**: Resolver de forma definitiva la ambigüedad histórica entre los códigos de juicios de SofiaPlus y los códigos de competencias del diseño curricular oficial.
- **Módulos afectados**: `project-phases`, `imports`, `dashboard`, `academic-tracking`
- **Archivos donde se implementa**: `Database/src/services/schema.ts`, `Database/src/services/projects.ts` (`importProject`, `getProjectPhases`), `Database/src/services/dashboard.ts`
- **Endpoints relacionados**: `POST /api/import/project`, `GET /api/projects/:projectId/phases`, `GET /api/dashboard`
- **Historias de usuario relacionadas**: `HU-PHS-002`, `HU-PHS-005`
