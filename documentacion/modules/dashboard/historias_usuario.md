# 📖 Historias de Usuario - Módulo de Panorama Ejecutivo y Métricas (Dashboard)

---

# HU-DSH-001: Visualización del Panorama Ejecutivo y Métricas Clave (KPIs)

## Historia
**Como** Coordinador Académico / Directivo  
**Quiero** visualizar un panel de control con indicadores cuantitativos y gráficos de avance  
**Para** evaluar el rendimiento general de las fichas de formación, el volumen de aprendices activos y la tasa de cumplimiento del programa.

## Descripción
El usuario ingresa a la vista principal del Dashboard (`/dashboard`), donde se renderiza un conjunto de tarjetas de métricas (*StatCards*) y componentes gráficos interactivos de *Apache ECharts*. El panel consolida:
- Total de Programas y Fichas activas.
- Total de Aprendices, desglosados en *En Formación*, *Retiro Voluntario* y *Traslado*.
- Total de Juicios Evaluativos emitidos (*Aprobados*, *Desaprobados*, *Por Evaluar*).
- Tacómetro (*Gauge Chart*) con el porcentaje promedio de avance curricular.
- Gráfico de dona (*Pie Chart*) con la distribución del estado de los aprendices.
- Gráfico de radar (*Radar Chart*) con el nivel de cumplimiento de las principales competencias.

## Criterios de Aceptación
- Las tarjetas de KPI deben calcularse en tiempo real a partir de los datos consolidados devueltos por el backend.
- El porcentaje de avance promedio debe reflejar la relación: `(juicios_aprobados / total_juicios_esperados) * 100`, redondeado a un decimal.
- Los gráficos de ECharts deben ser totalmente responsivos y redimensionarse adecuadamente ante cambios de pantalla.
- Si no hay datos registrados, el sistema debe mostrar un estado vacío informativo (*EmptyState*) sin romper el renderizado.
- Debe soportar navegación fluida entre pestañas analíticas: *Panorama General*, *Fases del Proyecto*, *Métricas por Aprendiz*, y *Competencias*.

## Información Técnica
- **Prioridad**: Alta
- **Roles involucrados**: Coordinador Académico, Directivo, Instructor
- **Reglas de negocio relacionadas**: RN-DSH-001, RN-DSH-002, RN-DSH-003
- **Endpoints relacionados**: `GET /api/dashboard`
- **Componentes frontend relacionados**: `DashboardGeneralView.vue`, `useDashboard.ts`
- **Controllers/Services relacionados**: `dashboard.controller.ts` (`getDashboard`), `dashboard.ts` (`getDashboardData`, `queryJoinedRows`)

---

# HU-DSH-002: Filtrado Multidimensional en Cascada y Persistencia de Contexto

## Historia
**Como** Instructor / Coordinador Académico  
**Quiero** aplicar filtros dinámicos por Estado, Ficha, Juicio, Competencia, Resultado y Aprendiz  
**Para** focalizar el análisis métrico en una cohorte formativa o grupo específico de resultados.

## Descripción
En la parte superior del Dashboard se dispone de una barra de filtros. Al seleccionar una **Ficha de Caracterización**, las opciones de competencias, resultados y aprendices se recalculan automáticamente en cascada en el cliente. Asimismo, el cambio de ficha actualiza el store global transversal (`academicContext.store`), de modo que si el usuario navega hacia el módulo de Seguimiento Curricular (`/tracking`), la selección permanece activa.

## Criterios de Aceptación
- La barra de filtros debe permitir filtrar por:
  1. `ficha`: Código de la ficha de caracterización.
  2. `estado`: Estado del aprendiz (`en formacion`, `retiro voluntario`, `traslado`).
  3. `juicio`: Estado de calificación (`aprobado`, `desaprobado`, `por evaluar`).
  4. `competencia`: Código o clave de la competencia.
  5. `resultado`: Código del resultado de aprendizaje.
  6. `aprendiz`: Identificador del aprendiz.
- Al cambiar la ficha seleccionada, las listas desplegables de competencias, aprendices y resultados deben restringirse únicamente a los elementos pertenecientes a dicha ficha.
- La selección de ficha debe sincronizarse con `academicContext.store` y persistir en la sesión.
- Debe incluir un botón para restablecer o limpiar todos los filtros aplicados.
- Cada cambio de filtro debe invocar nuevamente el servicio con los parámetros correspondientes (`useDashboard.fetchDashboard(filters)`).

## Información Técnica
- **Prioridad**: Alta
- **Roles involucrados**: Instructor, Coordinador Académico
- **Reglas de negocio relacionadas**: RN-DSH-004, RN-DSH-005
- **Endpoints relacionados**: `GET /api/dashboard`
- **Componentes frontend relacionados**: `DashboardGeneralView.vue`, `academicContext.store.ts`
- **Controllers/Services relacionados**: `dashboard.controller.ts` (`readFilters`), `dashboard.ts` (`buildWhere`)

---

# HU-DSH-003: Detección y Seguimiento de Aprendices Rezagados

## Historia
**Como** Instructor Líder de Ficha  
**Quiero** consultar una lista priorizada de aprendices con juicios evaluativos pendientes  
**Para** identificar casos de riesgo de deserción, coordinar planes de mejoramiento y citar a comités de evaluación.

## Descripción
En el Dashboard se incluye una sección dedicada a aprendices con juicios pendientes de evaluar. La tabla ordena a los aprendices descendentemente según la cantidad de resultados pendientes (`pendingResults > 0`), mostrando su nombre completo, documento, estado actual, barra de progreso porcentual, lista de competencias pendientes y un botón de acción rápida que redirige directamente a la ficha individual del aprendiz en el módulo de Seguimiento Curricular.

## Criterios de Aceptación
- La tabla debe listar únicamente aprendices que tengan al menos 1 juicio con estado `'por evaluar'`.
- El listado debe ordenarse de mayor a menor número de juicios pendientes.
- Cada fila debe mostrar: Nombre completo, Tipo y Número de Documento, Estado (`en formacion`, etc.), Porcentaje de Avance, Cantidad de Juicios Pendientes y Badges con los nombres de las competencias adeudadas.
- Al hacer clic en el botón de inspección o en el aprendiz, el sistema debe fijar el `selectedLearnerId` en `academicContext.store` y navegar a `/tracking`.
- Debe contar con un campo de búsqueda en vivo para filtrar aprendices por nombre o documento.

## Información Técnica
- **Prioridad**: Alta
- **Roles involucrados**: Instructor, Comité de Evaluación
- **Reglas de negocio relacionadas**: RN-DSH-006
- **Endpoints relacionados**: `GET /api/dashboard`
- **Componentes frontend relacionados**: `DashboardGeneralView.vue`, `academicContext.store.ts`
- **Controllers/Services relacionados**: `dashboard.ts` (`pendingLearners`, `learnerMap`)

---

# HU-DSH-004: Ranking y Tasa de Aprobación por Competencia

## Historia
**Como** Coordinador Académico / Instructor  
**Quiero** visualizar el ranking de competencias formativas ordenadas por su tasa de aprobación  
**Para** detectar qué competencias presentan mayor dificultad o retraso en la emisión de juicios evaluativos.

## Descripción
El Dashboard consolida todas las competencias de la ficha o programa activo, calculando para cada una:
- Total de juicios evaluativos asociados.
- Cantidad de juicios aprobados, pendientes y desaprobados.
- Tasa de aprobación porcentual: `(aprobados / total) * 100`.
Se presentan ordenadas mediante gráficos de barras de ECharts y tarjetas detalladas con códigos duales (código Sofia/juicio y código de proyecto pedagógico).

## Criterios de Aceptación
- El cálculo de tasa de aprobación por competencia debe realizarse sobre el total de juicios registrados para dicha competencia en la ficha/programa.
- El ranking debe ordenar las competencias desde la de mayor tasa de aprobación hasta la de menor tasa.
- Debe exhibir el código de juicio (`codigo_juicio`) y el código del proyecto formativo (`codigo_proyecto`) cuando estén disponibles.
- El gráfico de radar debe incluir las principales competencias activas con escalas de 0 a 100%.

## Información Técnica
- **Prioridad**: Media
- **Roles involucrados**: Coordinador Académico, Instructor
- **Reglas de negocio relacionadas**: RN-DSH-007
- **Endpoints relacionados**: `GET /api/dashboard`
- **Componentes frontend relacionados**: `DashboardGeneralView.vue`
- **Controllers/Services relacionados**: `dashboard.ts` (`competenciaMap`, `competencies`)

---

# HU-DSH-005: Feed Cronológico de Juicios Evaluativos Recientes

## Historia
**Como** Auditor Académico / Coordinador  
**Quiero** ver la lista de los últimos 20 juicios evaluativos registrados en el sistema  
**Para** supervisar la actividad evaluativa reciente de los instructores y comprobar la fecha y hora de emisión.

## Descripción
En la sección inferior del Dashboard se despliega una tabla o feed de actividad con los 20 juicios más recientes que tengan una fecha y hora registrada. Cada registro indica el nombre del aprendiz, la ficha, el nombre de la competencia, el detalle del resultado de aprendizaje, el estado del juicio emitido (`aprobado`, `desaprobado`, `por evaluar`), la marca de tiempo formateada y la identificación del funcionario evaluador.

## Criterios de Aceptación
- Debe listar un máximo de 20 registros ordenados cronológicamente de forma descendente por `registeredAt`.
- Solo se deben incluir juicios que posean una fecha válida (`juicio_fecha IS NOT NULL`).
- Debe mostrar el nombre completo y documento del funcionario que evaluó el resultado. Si no tiene funcionario asociado, debe indicar *"Sin funcionario"*.
- La fecha debe ser legible y respetar la zona horaria colombiana (`America/Bogota`).

## Información Técnica
- **Prioridad**: Baja
- **Roles involucrados**: Auditor Académico, Coordinador
- **Reglas de negocio relacionadas**: RN-DSH-008
- **Endpoints relacionados**: `GET /api/dashboard`
- **Componentes frontend relacionados**: `DashboardGeneralView.vue`
- **Controllers/Services relacionados**: `dashboard.ts` (`recentJudgements`, `buildFuncionarioLabel`)
