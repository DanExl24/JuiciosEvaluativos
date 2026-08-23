# 📖 Historias de Usuario - Módulo de Fases del Proyecto Formativo (Project Phases)

---

# HU-PHS-001: Consulta y Exploración de Proyectos Formativos

## Historia
**Como** Coordinador Académico / Instructor  
**Quiero** visualizar la lista de proyectos formativos registrados en el sistema con su información institucional  
**Para** seleccionar un proyecto pedagógico e inspeccionar su distribución en fases formativas y actividades.

## Descripción
El usuario accede a la ruta `/phases`. El sistema consulta `GET /api/projects` y presenta una cuadrícula de proyectos que incluye: Código de Proyecto SOFIA, Nombre del Proyecto, Código y Denominación del Programa, Tiempo Estimado de Ejecución (meses) y Regional/Centro de formación. Al hacer clic en *"Explorar Fases y RAPs"*, se abre la vista interactiva de detalle del proyecto seleccionado.

## Criterios de Aceptación
- La lista de proyectos debe obtenerse desde `GET /api/projects`.
- Si no existen proyectos importados, debe mostrar un estado vacío con instrucciones y botón directo para subir el PDF del proyecto formativo.
- Cada tarjeta debe exhibir: Código de proyecto, Nombre, Código de Programa, Duración en meses, Regional y botón de acción.
- Al hacer clic en un proyecto, la vista debe transicionar a `ProjectPhasesDetailView.vue` sin recargar la página.

## Información Técnica
- **Prioridad**: Alta
- **Roles involucrados**: Coordinador Académico, Instructor
- **Reglas de negocio relacionadas**: RN-PHS-001, RN-PHS-002
- **Endpoints relacionados**: `GET /api/projects`
- **Componentes frontend relacionados**: `ProjectPhasesView.vue`
- **Controllers/Services relacionados**: `project.controller.ts` (`listProjects`), `projects.ts` (`getProjects`)

---

# HU-PHS-002: Visualización Jerárquica de Fases, Actividades de Proyecto y Competencias

## Historia
**Como** Instructor Líder / Diseñador Curricular  
**Quiero** navegar por las 4 fases del proyecto formativo y revisar las actividades estructuradas con sus competencias asociadas  
**Para** comprobar que la planeación pedagógica coincide con la ejecución de juicios evaluativos y medir el avance de cada fase.

## Descripción
Dentro del detalle del proyecto (`ProjectPhasesDetailView.vue`), el usuario cuenta con una barra de navegación con las 4 fases canónicas: **Análisis**, **Planeación**, **Ejecución** y **Evaluación**. Al seleccionar una fase:
- Se muestran 4 tarjetas de KPIs: Total de Actividades de Proyecto, Competencias Mapeadas (Aprobadas vs Pendientes), Resultados de Aprendizaje (Evaluados vs Por Evaluar) y Porcentaje de Cumplimiento de Fase.
- Se desglosan las Actividades de Proyecto estructuradas (ej. *Actividad 1*, *Actividad 2*).
- Dentro de cada actividad se despliegan las competencias vinculadas como acordeones interactivos que, al abrirse, muestran cada RAP con su código dual, descripción y estado de aprobación.
- Permite filtrar por una ficha específica o consultar el acumulado de todas las fichas del programa.

## Criterios de Aceptación
- Las fases deben ordenarse estrictamente en la secuencia pedagógica: `ANALISIS` (1), `PLANEACION` (2), `EJECUCION` (3), `EVALUACION` (4).
- La consulta de fases se realiza mediante `GET /api/projects/:projectId/phases?fichaId={id}`.
- Cada actividad de proyecto debe poder expandirse o colapsarse independientemente.
- Las competencias deben exhibir su `codigo_juicio` (SofiaPlus) y su `codigo_proyecto` (PDF) cuando existan.
- Cada RAP debe mostrar un indicador visual de logro (punto verde para aprobado, ámbar para pendiente).
- Incluye barra de herramientas para búsqueda textual y filtros rápidos de competencias (*Todas*, *Aprobadas*, *Pendientes*).

## Información Técnica
- **Prioridad**: Alta
- **Roles involucrados**: Instructor, Diseñador Curricular
- **Reglas de negocio relacionadas**: RN-PHS-003, RN-PHS-004, RN-PHS-005
- **Endpoints relacionados**: `GET /api/projects/:projectId/phases`
- **Componentes frontend relacionados**: `ProjectPhasesDetailView.vue`, `projectPhases.service.ts`
- **Controllers/Services relacionados**: `project.controller.ts` (`getPhases`), `projects.ts` (`getProjectPhases`)

---

# HU-PHS-003: Asignación y Desasignación Matricial de Competencias a Fases

## Historia
**Como** Diseñador Curricular / Administrador  
**Quiero** vincular o desvincular competencias a las fases del proyecto formativo  
**Para** corregir inconsistencias en la planeación curricular o estructurar competencias que quedaron sueltas tras la importación.

## Descripción
En la vista de detalle del proyecto, el usuario activa el **"Modo Asignación"** o navega a la pestaña de **"Competencias Sueltas"** (`unassigned`). Al seleccionar una competencia y pulsar *"Vincular Fase"*:
- Se abre un modal con casillas de verificación (*checkboxes*) para las 4 fases del proyecto (`ANALISIS`, `PLANEACION`, `EJECUCION`, `EVALUACION`).
- El usuario selecciona las fases a las que pertenece la competencia y confirma los cambios.
- El backend ejecuta las vinculaciones (`INSERT INTO fase_competencia` y `INSERT INTO fase_resultado`) o desvinculaciones (`DELETE FROM fase_competencia` y `DELETE FROM fase_resultado`) de forma atómica en una transacción.

## Criterios de Aceptación
- La lista de competencias no asignadas se obtiene desde `GET /api/projects/:projectId/unassigned`.
- La asignación invoca `POST /api/projects/phases/:phaseId/competencies/:competencyId`.
- La desasignación invoca `DELETE /api/projects/phases/:phaseId/competencies/:competencyId`.
- Al vincular una competencia a una fase, todos los resultados de aprendizaje pertenecientes a dicha competencia se vinculan automáticamente a la fase en la tabla `fase_resultado`.
- Al desvincular una competencia de una fase, todos sus RAPs se desvinculan de dicha fase en `fase_resultado`.
- Tras guardar los cambios, la vista se actualiza automáticamente reflejando la nueva estructura curricular.

## Información Técnica
- **Prioridad**: Media
- **Roles involucrados**: Diseñador Curricular, Administrador
- **Reglas de negocio relacionadas**: RN-PHS-006, RN-PHS-007
- **Endpoints relacionados**: `GET /api/projects/:projectId/unassigned`, `POST /api/projects/phases/:phaseId/competencies/:competencyId`, `DELETE /api/projects/phases/:phaseId/competencies/:competencyId`
- **Componentes frontend relacionados**: `ProjectPhasesDetailView.vue`
- **Controllers/Services relacionados**: `project.controller.ts` (`assignCompetency`, `unassign`, `getUnassigned`), `projects.ts` (`assignCompetencyToPhase`, `unassignCompetency`, `getUnassignedCompetencies`)

---

# HU-PHS-004: Deducción Cronológica de Deserción y Analítica de Retención por Fase

## Historia
**Como** Comité de Evaluación / Coordinador Académico  
**Quiero** consultar la distribución de aprendices retirados o trasladados atribuida a cada fase pedagógica  
**Para** identificar en qué etapa de la ruta formativa se presenta la mayor deserción y analizar las competencias donde desertaron.

## Descripción
En la pestaña *"Métricas de Aprendices"* del detalle del proyecto, el sistema aplica el algoritmo de **Deducción Inteligente de Desertores** (`getPhaseLearnerStats`). El algoritmo analiza la última fecha de juzgamiento de cada aprendiz con estado `'retiro voluntario'` o `'traslado'`, compara dicha fecha contra las fechas de referencia de cada fase en la ficha y le asigna la fase correspondiente. La pantalla presenta:
- Gráfico lineal de tendencias de deserción por fase formativa.
- Tarjetas con el desglose por tipo de novedad (*Desertores*, *Traslados*, *Retiros Voluntarios*) y porcentaje de cumplimiento.
- Tabla detallada de aprendices desertores indicando su documento, estado, última fecha de evaluación, competencia y resultado donde cesó su actividad formativa.

## Criterios de Aceptación
- La información de retención y deserción se consulta mediante `GET /api/projects/:projectId/phase-learner-stats?fichaId={id}`.
- Los aprendices activos (`'en formacion'`) se evalúan contra todos los resultados esperados de la fase (`fase_resultado`).
- Los aprendices desertores (`'retiro voluntario'`, `'traslado'`) se contabilizan únicamente en la fase donde tuvieron su última actividad registrada o juicio evaluativo antes del retiro.
- El gráfico de línea debe renderizar la tendencia a lo largo de las 4 fases (`Análisis` ➔ `Planeación` ➔ `Ejecución` ➔ `Evaluación`).
- La tabla de aprendices desertores debe detallar el último juicio y resultado de aprendizaje registrado.

## Información Técnica
- **Prioridad**: Alta
- **Roles involucrados**: Comité de Evaluación, Coordinador Académico
- **Reglas de negocio relacionadas**: RN-PHS-008, RN-PHS-009
- **Endpoints relacionados**: `GET /api/projects/:projectId/phase-learner-stats`
- **Componentes frontend relacionados**: `ProjectPhasesDetailView.vue`
- **Controllers/Services relacionados**: `project.controller.ts` (`getProjectLearnerStats`), `projects.ts` (`getPhaseLearnerStats`)

---

# HU-PHS-005: Eliminación Segura de Proyectos Formativos

## Historia
**Como** Administrador del Sistema  
**Quiero** eliminar un proyecto formativo obsoleto o duplicado  
**Para** mantener limpio el catálogo de proyectos pedagógicos del centro de formación.

## Descripción
En el modo editor del detalle del proyecto, el Administrador pulsa el botón de eliminar proyecto (ícono de papelera). Se solicita confirmación explícita y, al aceptar, el backend ejecuta la eliminación en cascada de la entidad `proyecto_formativo` en PostgreSQL.

## Criterios de Aceptación
- Requiere confirmación obligatoria: *"¿Estás seguro de que deseas eliminar este proyecto formativo? Esta acción no se puede deshacer."*
- Invoca `DELETE /api/projects/:projectId`.
- La eliminación del proyecto en base de datos preserva los programas y las fichas de formación existentes, retirando únicamente los registros de `proyecto_formativo`.
- Al finalizar, notifica al usuario y redirige al listado general de proyectos.

## Información Técnica
- **Prioridad**: Media
- **Roles involucrados**: Administrador del Sistema
- **Reglas de negocio relacionadas**: RN-PHS-002
- **Endpoints relacionados**: `DELETE /api/projects/:projectId`
- **Componentes frontend relacionados**: `ProjectPhasesDetailView.vue`
- **Controllers/Services relacionados**: `project.controller.ts` (`deleteProject`), `projects.ts` (`deleteProject`)
