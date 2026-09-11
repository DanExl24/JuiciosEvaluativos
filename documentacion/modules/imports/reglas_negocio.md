# 📋 Reglas de Negocio - Módulo de Ingesta y Procesamiento (Imports)

---

## 1. Categoría: Formatos y Validaciones de Entrada

### RN-IMP-001: Formatos de Archivo y Normalización de Cabeceras
- **Identificador**: `RN-IMP-001`
- **Descripción**: El sistema únicamente procesa reportes de juicios evaluativos en formatos `.csv`, `.xlsx` y `.xls`. Durante el análisis sintáctico en el cliente, se debe eliminar automáticamente la marca de orden de bytes (BOM `\uFEFF`), limpiar espacios en blanco redundantes y detectar la fila de encabezados mediante la búsqueda de la columna `"Tipo de Documento"` o evaluando filas con 5 o más columnas con contenido textual válido.
- **Motivo**: Los archivos exportados desde SofiaPlus y Excel presentan frecuentemente inconsistencias en codificación UTF-8 con BOM, filas de títulos vacías o prefijos de metadatos antes de la matriz de aprendices.
- **Módulos afectados**: `imports`, `academic-tracking`, `dashboard`
- **Archivos donde se implementa**: `src/features/imports/composables/useFileParser.ts` (funciones `normalizeCell`, `findHeaderRowIndex`, `normalizeColumns`)
- **Endpoints relacionados**: `POST /api/import/csv`
- **Historias de usuario relacionadas**: `HU-IMP-001`

---

### RN-IMP-002: Separación Canónica de Código y Denominación
- **Identificador**: `RN-IMP-002`
- **Descripción**: En los campos de Competencia y Resultado de Aprendizaje que combinan el código numérico con su nombre (ejemplo: `"220501096 - Desarrollar la estructura de datos"` o `"36182 - Inducción"`), el sistema debe separar obligatoriamente el código numérico de la descripción mediante la expresión regular `/^([0-9]+)\s*-\s*(.+)$/`.
- **Motivo**: La base de datos requiere almacenar de forma diferenciada la clave del catálogo (`codigo`) y el detalle (`nombre`/`detalle`) para permitir indexación rápida, búsquedas y cálculos agregados.
- **Módulos afectados**: `imports`, `Database/src/services/csvImport.ts`
- **Archivos donde se implementa**: `Database/src/services/csvImport.ts` (`splitCodeAndName`)
- **Endpoints relacionados**: `POST /api/import/csv`
- **Historias de usuario relacionadas**: `HU-IMP-001`

---

### RN-IMP-003: Mapeo Estricto de Estados y Enums
- **Identificador**: `RN-IMP-003`
- **Descripción**: Los valores textuales del archivo deben normalizarse y mapearse estrictamente a los tipos enumerados de la base de datos PostgreSQL:
  - **Estado del Aprendiz**:
    - `"EN FORMACION"` ➔ `'en formacion'`
    - `"RETIRO VOLUNTARIO"` ➔ `'retiro voluntario'`
    - `"TRASLADADO"` o `"TRASLADO"` ➔ `'traslado'`
  - **Estado de la Formación / Ficha**:
    - `"EN EJECUCION"` ➔ `'en ejecucion'`
    - `"FINALIZADA"` ➔ `'finalizada'`
    - `"CANCELADA"` ➔ `'cancelada'`
  - **Modalidad de Formación**:
    - `"PRESENCIAL"` ➔ `'presencial'`
    - `"VIRTUAL"` ➔ `'virtual'`
    - `"A DISTANCIA"` ➔ `'a distancia'`
  - **Estado del Juicio Evaluativo**:
    - `"APROBADO"` ➔ `'aprobado'`
    - `"DESAPROBADO"` ➔ `'desaprobado'`
    - `"POR EVALUAR"` ➔ `'por evaluar'`
  Cualquier valor no reconocido genera una interrupción inmediata con error explicativo.
- **Motivo**: Preservar la integridad de los tipos `ENUM` de PostgreSQL y evitar que estados mal redactados generen errores de base de datos o distorsionen métricas.
- **Módulos afectados**: `imports`, `dashboard`, `academic-tracking`, `project-phases`
- **Archivos donde se implementa**: `Database/src/services/csvImport.ts` (`mapRequiredEnum`, `learnerStateMap`, `formationStateMap`, `modalidadMap`, `judgementStateMap`)
- **Endpoints relacionados**: `POST /api/import/csv`
- **Historias de usuario relacionadas**: `HU-IMP-001`

---

### RN-IMP-004: Normalización y Parseo Multiformato de Fechas SofiaPlus
- **Identificador**: `RN-IMP-004`
- **Descripción**: La columna `"Fecha y Hora del Juicio Evaluativo"` debe ser procesada para admitir fechas con formato `DD/MM/YYYY` o `DD-MM-YYYY`, acompañadas opcionalmente de horas en notación de 12 horas con sufijos de periodo (`a`, `p`, `am`, `pm`, `a.m.`, `p.m.`) o en notación militar de 24 horas, separadas por puntos o dos puntos (ej. `08/12/2025 18.16 a`, `15/10/2024 09:30 am`). El valor parseado debe convertirse a una marca de tiempo canónica ISO 8601 con zona horaria de Colombia (`America/Bogota`, `-05:00`). Valores vacíos o guiones `"-"` se convierten a `null`.
- **Motivo**: Las versiones de reportes exportadas de SofiaPlus varían según el navegador y la configuración regional, usando indistintamente puntos, guiones y marcas `a`/`p`.
- **Módulos afectados**: `imports`, `dashboard`, `academic-tracking`, `project-phases`
- **Archivos donde se implementa**: `Database/src/services/csvImport.ts` (`parseJudgementDate`), `Database/src/utils/date-parser.ts`
- **Endpoints relacionados**: `POST /api/import/csv`
- **Historias de usuario relacionadas**: `HU-IMP-001`

---

## 2. Categoría: Integridad de Datos y Transaccionalidad

### RN-IMP-005: Transaccionalidad Atómica Completa (ACID)
- **Identificador**: `RN-IMP-005`
- **Descripción**: Todo el proceso de inserción y actualización masiva de un archivo de juicios se debe ejecutar dentro de una única transacción SQL (`BEGIN` ➔ inserción iterativa ➔ `COMMIT`). Si ocurre un fallo en una sola fila o un error de constraint, se debe ejecutar un `ROLLBACK` completo.
- **Motivo**: Garantizar que la base de datos nunca quede en un estado incoherente o con datos parciales de una ficha.
- **Módulos afectados**: `imports`, `Database/src/controllers/import.controller.ts`, `Database/src/services/csvImport.ts`
- **Archivos donde se implementa**: `Database/src/controllers/import.controller.ts` (`importCsv`)
- **Endpoints relacionados**: `POST /api/import/csv`
- **Historias de usuario relacionadas**: `HU-IMP-001`

---

### RN-IMP-006: Prevención de Ingestas Duplicadas por Fingerprint SHA-256
- **Identificador**: `RN-IMP-006`
- **Descripción**: Antes de enviar la petición de importación al servidor, el frontend genera una huella digital SHA-256 combinando:
  - Nombre del archivo
  - Tamaño en bytes
  - Cantidad total de filas
  - Nombres de las columnas
  Si el fingerprint coincide con un registro previo en el store local del cliente, se bloquea la acción con un mensaje de alerta.
- **Motivo**: Evitar procesamiento redundante, sobrecarga en el servidor y reescritura innecesaria de juicios evaluativos.
- **Módulos afectados**: `imports`
- **Archivos donde se implementa**: `src/features/imports/stores/importHistory.store.ts` (`createImportFingerprint`, `wasAlreadyImported`), `src/features/imports/views/ImportWorkspaceView.vue`
- **Endpoints relacionados**: N/A (Validación del lado del cliente)
- **Historias de usuario relacionadas**: `HU-IMP-002`

---

### RN-IMP-007: Registro Inmutable de Auditoría en Servidor y Local
- **Identificador**: `RN-IMP-007`
- **Descripción**: Tras completarse con éxito la transacción en base de datos, el backend escribe de forma asíncrona un archivo `.json` en el directorio `logs/` nombrado con un timestamp y el nombre sanitizado del archivo (ejemplo: `2026-08-22T21-00-00-000Z_ReporteJuicios.json`). Asimismo, el frontend almacena una entrada en el almacén local del navegador.
- **Motivo**: Permitir auditoría forense, trazabilidad de quién importó qué información y respaldar las cargas realizadas.
- **Módulos afectados**: `imports`
- **Archivos donde se implementa**: `Database/src/utils/log-writer.ts` (`writeImportLog`), `Database/src/controllers/import.controller.ts`, `src/features/imports/stores/importHistory.store.ts`
- **Endpoints relacionados**: `POST /api/import/csv`, `GET /api/logs`, `GET /api/logs/:fileName`
- **Historias de usuario relacionadas**: `HU-IMP-003`

---

## 3. Categoría: Depuración y Ciclo de Vida de Fichas

### RN-IMP-008: Eliminación Segura en Cascada de Fichas
- **Identificador**: `RN-IMP-008`
- **Descripción**: Al solicitar la eliminación de una ficha (`ficha_caracterizacion`), el sistema ejecuta una transacción que elimina:
  1. Todos los registros en `juicios_evaluativos` vinculados a los aprendices pertenecientes a la ficha (`id_formacion`).
  2. Todos los aprendices de la tabla `aprendiz` pertenecientes a dicha formación.
  3. La formación correspondiente en la tabla `formacion`.
  4. Si tras eliminar la formación el programa (`programa`) no posee ninguna otra ficha vinculada, se eliminan sus fases en `fases` y el registro del programa en `programa`.
- **Motivo**: Mantener la integridad referencial y evitar registros huérfanos sin aprendices o programas vacíos sin fichas activas.
- **Módulos afectados**: `imports`, `dashboard`, `academic-tracking`, `project-phases`
- **Archivos donde se implementa**: `Database/src/services/formations.ts` (`deleteFormationByFicha`), `Database/src/controllers/formation.controller.ts`
- **Endpoints relacionados**: `DELETE /api/formations/:ficha`
- **Historias de usuario relacionadas**: `HU-IMP-004`

---

### RN-IMP-009: Descomposición y Extracción de Funcionarios Evaluadores
- **Identificador**: `RN-IMP-009`
- **Descripción**: Cuando una fila contiene datos en la columna `"Funcionario que registro el juicio evaluativo"`, el sistema analiza la cadena con la expresión `/^([A-Z]+)\s+([0-9]+)\s*-\s*(.+)$/i` para separar:
  - Tipo de documento (ej. `CC`, `TI`, `CE`)
  - Número de documento
  - Nombres y Apellidos (dividiendo los tokens de texto de manera balanceada)
  Si el valor es nulo o un guion `"-"`, el juicio se almacena con `id_funcionario = null`.
- **Motivo**: Registrar quién evaluó cada resultado de aprendizaje para posibilitar auditorías docentes en el seguimiento curricular.
- **Módulos afectados**: `imports`, `dashboard`, `academic-tracking`
- **Archivos donde se implementa**: `Database/src/services/csvImport.ts` (`splitFuncionario`, `ensureFuncionario`)
- **Endpoints relacionados**: `POST /api/import/csv`
- **Historias de usuario relacionadas**: `HU-IMP-001`

---

## 4. Categoría: Extracción y Procesamiento de Proyectos PDF

### RN-IMP-010: Restricción de Tipo MIME y Limpieza Temporal de PDFs
- **Identificador**: `RN-IMP-010`
- **Descripción**: El endpoint de extracción de proyectos solo procesa archivos con formato PDF válido. El archivo se almacena temporalmente en el directorio de subidas (`uploads/`) y **debe ser eliminado del disco obligatoriamente** en el bloque `finally` de la petición, garantizando que no se acumulen archivos temporales en el servidor.
- **Motivo**: Seguridad del servidor y prevención de saturación de almacenamiento en disco.
- **Módulos afectados**: `imports`, `project-phases`
- **Archivos donde se implementa**: `Database/src/controllers/import.controller.ts` (`extractProjectPdf`), `Database/src/middlewares/upload.ts`
- **Endpoints relacionados**: `POST /api/extract/project`
- **Historias de usuario relacionadas**: `HU-IMP-005`

---

### RN-IMP-011: Detección y Extracción de Secciones Pedagógicas en Proyectos
- **Identificador**: `RN-IMP-011`
- **Descripción**: El motor extractor `parse_pdf.py` identifica el inicio de la planeación curricular mediante las frases `"3. PLANEACION DEL PROYECTO"` o `"3.1 FASES DEL PROYECTO"` y detiene la extracción al alcanzar las secciones `"3.5"`, `"ORGANIZACION DEL PROYECTO"`, `"3.6"` o `"3.7"`. Mapea todas las actividades detectadas a una de las cuatro fases fijas (`ANALISIS`, `PLANEACION`, `EJECUCION`, `EVALUACION`).
- **Motivo**: Aislar con precisión la matriz curricular sin procesar tablas ajenas del proyecto (como presupuesto, personal o justificación).
- **Módulos afectados**: `imports`, `project-phases`
- **Archivos donde se implementa**: `parse_pdf.py` (`extract_project_data`)
- **Endpoints relacionados**: `POST /api/extract/project`
- **Historias de usuario relacionadas**: `HU-IMP-005`

---

### RN-IMP-012: Deduplicación y Ordenamiento de Actividades de Proyecto
- **Identificador**: `RN-IMP-012`
- **Descripción**: Las actividades extraídas de las tablas del PDF se limpian de espacios múltiples y se deduplican eliminando cadenas que sean subconjuntos de actividades más largas. Las actividades se ordenan numéricamente según el prefijo ordinal extraído (ejemplo: `1`, `2`, `3...`), asignando a actividades sin número el orden por defecto `999`.
- **Motivo**: Presentar una estructura limpia y ordenada en el visor curricular sin textos fragmentados producto de cortes de página del PDF.
- **Módulos afectados**: `imports`, `project-phases`
- **Archivos donde se implementa**: `parse_pdf.py` (`deduplicate_activities`, `get_act_num`)
- **Endpoints relacionados**: `POST /api/extract/project`
- **Historias de usuario relacionadas**: `HU-IMP-005`

---

## 5. Categoría: Protección Estricta contra Reportes Desactualizados o Manipulados

### RN-IMP-013: Detección y Bloqueo Total de Inconsistencias Curriculares
- **Identificador**: `RN-IMP-013`
- **Descripción**: Cuando se intenta importar un reporte para una ficha de formación que ya cuenta con juicios evaluativos en la base de datos, el sistema ejecuta una pre-validación de coherencia obligatoria (`validateReportConsistency`) antes de realizar cualquier actualización:
  1. **Regla de Inmutabilidad del `APROBADO`**: Si en la base de datos un resultado de aprendizaje ya está consolidado como `'aprobado'`, y en el archivo entrante dicho resultado figura como `'por evaluar'` o `'desaprobado'`, se cataloga como **Inconsistencia Crítica**.
  2. **Regla de No Regresión de Evaluación**: Si en la base de datos un resultado ya figura como `'desaprobado'`, y en el archivo entrante aparece como `'por evaluar'`, se cataloga como **Inconsistencia Crítica**.
  3. **Inmunidad ante Manipulación de Fechas**: La validación evalúa los estados de aprendizaje consolidados y no únicamente las marcas temporales del archivo. Por tanto, si un usuario altera manualmente la fecha de un reporte viejo para aparentar que es reciente, el archivo es **rechazado de inmediato** al contradecir los resultados ya aprobados.
  4. **Bloqueo Total sin Fusión Parcial (Cero Escritura)**: Ante la presencia de **al menos una inconsistencia**, el sistema interrumpe la ejecución, aborta la transacción con `ROLLBACK`, preserva el 100% de los datos legítimos de la ficha sin aplicar modificaciones parciales y responde con código HTTP `409 Conflict` (`REPORT_INCONSISTENCY`), suministrando el desglose de los aprendices y resultados en conflicto.
  5. **Doble Capa de Seguridad en Base de Datos**: Como medida de defensa en profundidad, la instrucción `ensureJuicio` implementa sentencias condicionales `CASE` en la cláusula `ON CONFLICT (id_resultado, id_aprendiz) DO UPDATE SET`, bloqueando a nivel de motor SQL cualquier degradación de un estado `'aprobado'`.
  6. **Aceptación de Reportes Progresivos**: Un reporte nuevo es procesado con éxito únicamente si es consistente: mantiene los resultados ya aprobados y promueve de `'por evaluar'` a `'aprobado'` los nuevos logros alcanzados por la ficha.
- **Motivo**: Blindar el sistema contra la degradación involuntaria de datos por carga de archivos antiguos, garantizar la inmutabilidad de los logros académicos de los aprendices e impedir que reportes fraudulentos o adulterados corrompan el historial oficial.
- **Módulos afectados**: `imports`, `academic-tracking`, `dashboard`
- **Archivos donde se implementa**:
  - `backend/src/services/csvImport.ts` (`validateReportConsistency`, `ReportInconsistencyError`, `ensureJuicio`)
  - `backend/src/controllers/import.controller.ts` (`importCsv`)
  - `backend/src/types.ts` (`ReportInconsistencyItem`)
  - `frontend/src/features/imports/types/import.types.ts` (`ReportInconsistencyDetails`)
  - `frontend/src/features/imports/views/ImportWorkspaceView.vue` (Alerta visual de seguridad y tabla interactiva de casos)
- **Endpoints relacionados**: `POST /api/import/csv` (HTTP 409 Conflict)
- **Historias de usuario relacionadas**: `HU-IMP-006`
