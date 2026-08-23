# 📋 Reglas de Negocio - Módulo de Panorama Ejecutivo y Métricas (Dashboard)

---

## 1. Categoría: Métricas y Cálculo de Indicadores

### RN-DSH-001: Fórmula Canónica de Progreso y Cumplimiento
- **Identificador**: `RN-DSH-001`
- **Descripción**: Todo porcentaje de avance o cumplimiento académico a nivel de aprendiz, ficha o programa se calcula mediante la función:
  $$\text{Progreso (\%)} = \begin{cases} 0.0 & \text{si Total} = 0 \\ \text{round}\left(\frac{\text{Aprobados}}{\text{Total}} \times 100, 1\right) & \text{si Total} > 0 \end{cases}$$
- **Motivo**: Estandarizar la precisión métrica en todo el sistema a un único decimal y prevenir errores de división por cero cuando no existen juicios cargados.
- **Módulos afectados**: `dashboard`, `academic-tracking`, `project-phases`
- **Archivos donde se implementa**: `Database/src/services/dashboard.ts` (`buildProgress`), `src/utils/formatters/number.ts` (`formatPercent`)
- **Endpoints relacionados**: `GET /api/dashboard`, `GET /api/learners/:learnerId`, `GET /api/formations/competencies`
- **Historias de usuario relacionadas**: `HU-DSH-001`, `HU-DSH-004`

---

### RN-DSH-002: Clasificación de Aprendices en Panorama General
- **Identificador**: `RN-DSH-002`
- **Descripción**: La tarjeta de aprendices del Overview general debe discriminar a los aprendices en tres categorías mutuamente excluyentes basadas en el campo `aprendiz.estado`:
  1. **En Formación**: Aprendices con estado `'en formacion'`.
  2. **Retiro Voluntario**: Aprendices con estado `'retiro voluntario'`.
  3. **Traslado**: Aprendices con estado `'traslado'`.
  El conteo debe realizarse sobre identificadores distintos (`COUNT(DISTINCT a.id_aprendiz)`).
- **Motivo**: Proveer una distinción nítida entre la matrícula activa y los desertores para no sesgar las métricas de aprobación institucional.
- **Módulos afectados**: `dashboard`
- **Archivos donde se implementa**: `Database/src/services/dashboard.ts` (`overview.inTrainingCount`, `overview.retiredCount`, `overview.transferredCount`)
- **Endpoints relacionados**: `GET /api/dashboard`
- **Historias de usuario relacionadas**: `HU-DSH-001`

---

### RN-DSH-003: Cálculo del Promedio Global de Avance
- **Identificador**: `RN-DSH-003`
- **Descripción**: El indicador `averageProgress` del overview del dashboard representa la media aritmética del porcentaje de progreso individual de todos los aprendices resultantes del filtro aplicado:
  $$\text{averageProgress} = \frac{\sum_{i=1}^{N} \text{progreso\_aprendiz}_i}{N}$$
  Si no hay aprendices en el conjunto filtrado, el valor es exactamente `0.0`.
- **Motivo**: Reflejar el avance promedio real de la cohorte evaluada sin que aprendices con mayor número de resultados distorsionen el peso relativo de cada estudiante.
- **Módulos afectados**: `dashboard`
- **Archivos donde se implementa**: `Database/src/services/dashboard.ts` (`overview.averageProgress`)
- **Endpoints relacionados**: `GET /api/dashboard`
- **Historias de usuario relacionadas**: `HU-DSH-001`

---

## 2. Categoría: Filtros y Compatibilidad de Códigos Duales

### RN-DSH-004: Compatibilidad con Códigos Duales en Filtros SQL
- **Identificador**: `RN-DSH-004`
- **Descripción**: Cuando el usuario filtra por competencia (`competencia`) o por resultado (`resultado`), la cláusula SQL generada debe evaluar de forma disyuntiva los tres códigos posibles de la entidad:
  - Cláusula de Competencia: `(c.codigo = $X OR c.codigo_juicio = $X OR c.codigo_proyecto = $X)`
  - Cláusula de Resultado: `(r.codigo = $X OR r.codigo_juicio = $X OR r.codigo_proyecto = $X)`
- **Motivo**: En el SENA, los reportes de juicios evaluativos de SofiaPlus utilizan códigos de juicio internos (ej. `36182` para inducción o identificadores de 6 dígitos), mientras que las planeaciones de proyecto en PDF utilizan códigos normativos de competencia laboral (ej. `240201530`) o códigos de resultado de 6 a 9 dígitos.
- **Módulos afectados**: `dashboard`, `academic-tracking`, `project-phases`
- **Archivos donde se implementa**: `Database/src/services/dashboard.ts` (`buildWhere`)
- **Endpoints relacionados**: `GET /api/dashboard`, `GET /api/formations/competencies`
- **Historias de usuario relacionadas**: `HU-DSH-002`

---

### RN-DSH-005: Sincronización Transversal de Contexto Académico
- **Identificador**: `RN-DSH-005`
- **Descripción**: Cualquier cambio de ficha o aprendiz realizado en el selector del Dashboard debe actualizar el store global de Pinia (`academicContext.store`), preservando los filtros en memoria. Al navegar a las rutas `/tracking` o `/phases`, dichas vistas deben cargar por defecto los datos de la ficha seleccionada en el Dashboard.
- **Motivo**: Brindar una experiencia de usuario continua y evitar que el docente tenga que volver a elegir la ficha cada vez que cambia de pantalla.
- **Módulos afectados**: `dashboard`, `academic-tracking`, `imports`, `project-phases`
- **Archivos donde se implementa**: `src/stores/academicContext.store.ts`, `src/features/dashboard/views/DashboardGeneralView.vue`, `src/features/dashboard/composables/useDashboard.ts`
- **Endpoints relacionados**: `GET /api/dashboard`
- **Historias de usuario relacionadas**: `HU-DSH-002`

---

## 3. Categoría: Priorización y Trazabilidad de Auditoría

### RN-DSH-006: Priorización de Aprendices Rezagados
- **Identificador**: `RN-DSH-006`
- **Descripción**: La lista de aprendices pendientes (`pendingLearners`) debe filtrar estrictamente a los aprendices con `pendingResults > 0` y ordenarlos en orden descendente según la cantidad de juicios pendientes adeudados; en caso de empate en cantidad de pendientes, se ordenan alfabéticamente por apellido y nombre en español (`es`).
- **Motivo**: Permitir a los coordinadores enfocar los esfuerzos pedagógicos de inmediato en los aprendices que registran mayor rezago académico.
- **Módulos afectados**: `dashboard`
- **Archivos donde se implementa**: `Database/src/services/dashboard.ts` (`pendingLearners`)
- **Endpoints relacionados**: `GET /api/dashboard`
- **Historias de usuario relacionadas**: `HU-DSH-003`

---

### RN-DSH-007: Consolidación y Ordenamiento de Rankings de Competencias
- **Identificador**: `RN-DSH-007`
- **Descripción**: La agregación de competencias en el dashboard genera una tasa de aprobación (`approvalRate`). Las competencias se devuelven ordenadas primariamente por su `approvalRate` descendente, y secundariamente por su nombre alfabético (`a.name.localeCompare(b.name, 'es')`).
- **Motivo**: Garantizar consistencia en la visualización gráfica de ECharts (Radar y Barras) y facilitar comparativas entre cohortes.
- **Módulos afectados**: `dashboard`
- **Archivos donde se implementa**: `Database/src/services/dashboard.ts` (`competencies`)
- **Endpoints relacionados**: `GET /api/dashboard`
- **Historias de usuario relacionadas**: `HU-DSH-004`

---

### RN-DSH-008: Límite y Etiquetado de Juicios Recientes
- **Identificador**: `RN-DSH-008`
- **Descripción**: La lista de juicios recientes (`recentJudgements`) está limitada a los últimos 20 registros con fecha válida (`juicio_fecha IS NOT NULL`). Si el juicio no cuenta con funcionario asociado en la base de datos, el campo `funcionario` debe retornar el valor literal `"Sin funcionario"`; si cuenta con funcionario, debe concatenar: `"{tipo_doc} {num_doc} - {nombre} {apellido}"`.
- **Motivo**: Mantener un rendimiento de consulta óptimo limitando la cantidad de filas transferidas y brindar información clara de autoría evaluativa.
- **Módulos afectados**: `dashboard`
- **Archivos donde se implementa**: `Database/src/services/dashboard.ts` (`buildFuncionarioLabel`, `recentJudgements`)
- **Endpoints relacionados**: `GET /api/dashboard`
- **Historias de usuario relacionadas**: `HU-DSH-005`
