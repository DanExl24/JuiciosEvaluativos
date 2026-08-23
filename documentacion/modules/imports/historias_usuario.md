# 📖 Historias de Usuario - Módulo de Ingesta y Procesamiento (Imports)

---

# HU-IMP-001: Carga y Procesamiento Masivo de Archivos SofiaPlus

## Historia
**Como** Administrador del Sistema / Instructor  
**Quiero** arrastrar o seleccionar un archivo de juicios evaluativos en formato `.csv`, `.xlsx` o `.xls`  
**Para** registrar y actualizar automáticamente en la base de datos la información académica de programas, fichas, aprendices, competencias, resultados de aprendizaje y juicios evaluativos.

## Descripción
El usuario accede al área de ingesta (*workspace* de importación) y suministra un archivo exportado directamente de la plataforma SofiaPlus. El frontend analiza la estructura del archivo mediante *PapaParse* o *SheetJS*, separa los metadatos de cabecera (Programa, Versión, Denominación, Ficha, Estado y Modalidad) de la matriz de registros de aprendices, y genera una vista previa tabular. Tras la confirmación del usuario, se envía la carga estructurada al backend, donde se ejecuta una transacción atómica completa que crea o actualiza las entidades correspondientes en PostgreSQL y retorna un resumen consolidado de la operación.

## Criterios de Aceptación
- El sistema debe soportar archivos con extensiones `.csv`, `.xlsx` y `.xls`.
- Debe detectar automáticamente y omitir marcas de orden de bytes (BOM `\uFEFF`) y caracteres especiales.
- Debe ubicar dinámicamente la fila de encabezados buscando la columna "Tipo de Documento" o analizando filas con al menos 5 celdas con datos.
- Debe extraer con precisión los metadatos superiores del reporte:
  - Ficha de Caracterización
  - Código y Versión del Programa
  - Denominación del Programa
  - Estado de la Ficha (mapeado a enum: `en ejecucion`, `finalizada`, `cancelada`)
  - Modalidad de Formación (mapeado a enum: `presencial`, `virtual`, `a distancia`)
- Debe mapear los estados de los aprendices a los enums canónicos (`en formacion`, `retiro voluntario`, `traslado`).
- Debe mapear los estados de juicio a los valores permitidos (`aprobado`, `desaprobado`, `por evaluar`).
- Debe parsear correctamente fechas y horas complejas generadas por SofiaPlus en formato de 12 horas (con `a`/`p` o `am`/`pm`) y 24 horas (`DD/MM/YYYY hh.mm a/p`).
- Si ocurre algún error en cualquier fila durante la inserción en base de datos, se debe revertir toda la transacción (`ROLLBACK`) sin dejar datos parciales ni corruptos.
- Debe mostrar una previsualización de las primeras filas y los contadores clave (aprendices, columnas, tamaño) antes de confirmar la carga.
- Tras la importación exitosa, debe actualizar el store global de contexto (`academicContext.store`) fijando la ficha recién cargada y emitiendo el evento de refresco general.

## Información Técnica
- **Prioridad**: Alta
- **Roles involucrados**: Administrador del Sistema, Instructor
- **Reglas de negocio relacionadas**: RN-IMP-001, RN-IMP-002, RN-IMP-003, RN-IMP-004, RN-IMP-005, RN-IMP-009
- **Endpoints relacionados**: `POST /api/import/csv`
- **Componentes frontend relacionados**: `ImportWorkspaceView.vue`, `useFileParser.ts`
- **Controllers/Services relacionados**: `import.controller.ts` (`importCsv`), `csvImport.ts` (`importCsvPayload`, `ensureProgram`, `ensureFormacion`, `ensureAprendiz`, `ensureCompetencia`, `ensureResultado`, `ensureFuncionario`, `ensureJuicio`)

---

# HU-IMP-002: Prevención de Importaciones Duplicadas mediante Fingerprint

## Historia
**Como** Administrador del Sistema  
**Quiero** que el sistema verifique una huella digital criptográfica (*fingerprint*) antes de procesar una importación  
**Para** evitar la sobreescritura accidental o el reenvío redundante de un archivo previamente procesado.

## Descripción
Al momento de presionar el botón "Confirmar e Importar", el cliente calcula una firma criptográfica SHA-256 combinando el nombre del archivo, el tamaño, el número de filas y las columnas del reporte. El almacén local de historial (*Pinia Store con persistencia en localStorage*) verifica si dicha firma ya existe. Si el archivo ya fue importado, se interrumpe la operación y se muestra una notificación de advertencia al usuario.

## Criterios de Aceptación
- La huella digital debe calcularse a partir del nombre del archivo, tamaño en bytes, total de filas y resumen de columnas usando la API nativa `crypto.subtle.digest('SHA-256')`.
- Si el *fingerprint* ya existe en el registro de importaciones locales, el sistema debe arrojar una excepción con el mensaje: *"Este mismo archivo ya fue importado anteriormente en el sistema."*
- El bloqueo debe ocurrir del lado del cliente antes de realizar la petición HTTP al servidor, ahorrando ancho de banda y procesamiento.
- El usuario puede consultar el historial para verificar cuándo fue importado dicho archivo y con qué ficha.

## Información Técnica
- **Prioridad**: Media
- **Roles involucrados**: Administrador del Sistema, Instructor
- **Reglas de negocio relacionadas**: RN-IMP-006
- **Endpoints relacionados**: N/A (Validación local en Frontend)
- **Componentes frontend relacionados**: `ImportWorkspaceView.vue`, `importHistory.store.ts` (`createImportFingerprint`, `wasAlreadyImported`)
- **Controllers/Services relacionados**: `importHistory.store.ts`

---

# HU-IMP-003: Auditoría y Consulta de Historial de Importaciones

## Historia
**Como** Administrador del Sistema / Auditor Académico  
**Quiero** consultar el historial de archivos importados y revisar los logs detallados de cada ingesta  
**Para** auditar la trazabilidad de cargas, verificar la cantidad de registros procesados y depurar discrepancias históricas.

## Descripción
El sistema mantiene dos niveles de auditoría:
1. **Historial Local del Navegador**: Administrado por Pinia/localStorage, mostrando las fichas cargadas, fecha/hora y previsualización de registros.
2. **Archivos de Auditoría en Servidor (`logs/*.json`)**: Cada vez que se ejecuta una importación exitosa en el backend, se genera un archivo de auditoría JSON inmutable con la marca temporal ISO, el payload completo enviado y el resultado detallado de la base de datos.

## Criterios de Aceptación
- El modal `ImportsHistoryModal.vue` debe permitir visualizar el listado de archivos importados, con su ficha, fecha de carga y nombre de archivo.
- Al seleccionar una entrada histórica, debe abrir un modal de detalle con contadores (Ficha, Filas/Aprendices, Columnas) y una tabla con las filas de previsualización.
- El usuario debe contar con la opción de limpiar el historial local si lo requiere, previa confirmación de seguridad.
- El backend debe exponer endpoints para listar los logs de auditoría físicos (`/api/logs`) y leer el contenido de un log específico (`/api/logs/:fileName`).
- La escritura de logs en disco no debe bloquear la respuesta al usuario.

## Información Técnica
- **Prioridad**: Media
- **Roles involucrados**: Administrador del Sistema, Auditor Académico
- **Reglas de negocio relacionadas**: RN-IMP-007
- **Endpoints relacionados**: `GET /api/logs`, `GET /api/logs/:fileName`
- **Componentes frontend relacionados**: `ImportsHistoryModal.vue`, `importHistory.store.ts`
- **Controllers/Services relacionados**: `import.controller.ts` (`getLogs`, `getLogByFileName`), `log-writer.ts` (`writeImportLog`, `listImportLogs`, `readImportLog`)

---

# HU-IMP-004: Eliminación y Depuración en Cascada de Fichas de Formación

## Historia
**Como** Administrador del Sistema  
**Quiero** eliminar completamente una ficha de caracterización y toda su información vinculada  
**Para** depurar datos de prueba, corregir importaciones erróneas o retirar fichas canceladas sin dejar inconsistencias en la base de datos.

## Descripción
Desde el panel desplegable "Administrar Fichas" en el workspace de importación, el usuario selecciona una ficha de la lista desplegable y confirma la eliminación. El backend inicia una transacción SQL que elimina en orden estricto los juicios evaluativos de los aprendices de la ficha, los aprendices de la ficha, la entidad de formación, y si el programa formativo o las fases ya no tienen ninguna otra ficha asociada en el centro, los elimina automáticamente para mantener limpia la base de datos.

## Criterios de Aceptación
- El usuario debe seleccionar obligatoriamente una ficha existente antes de habilitar el botón de eliminación.
- Debe presentarse un cuadro de confirmación nativo advirtiendo: *"¿Estás seguro de eliminar completamente la ficha {ficha}? Esta acción borrará todos sus aprendices, juicios evaluativos y resultados asociados."*
- La eliminación en el backend debe ejecutarse en una transacción ACID:
  1. Eliminar `juicios_evaluativos` vinculados a los aprendices de la ficha.
  2. Eliminar los registros de la tabla `aprendiz` pertenecientes a la ficha (`id_formacion`).
  3. Eliminar la fila correspondiente en la tabla `formacion`.
  4. Eliminar fases del programa si ya no quedan fichas huérfanas asociadas a dicho programa.
  5. Eliminar el programa si no tiene ninguna otra formación registrada.
- Al completarse la eliminación, se debe remover la entrada correspondiente del store de historial local (`importHistory.store`) y notificar el refresco a los demás módulos del sistema.
- Se debe actualizar la lista de fichas disponibles en el selector.

## Información Técnica
- **Prioridad**: Alta
- **Roles involucrados**: Administrador del Sistema
- **Reglas de negocio relacionadas**: RN-IMP-008, RN-IMP-010
- **Endpoints relacionados**: `DELETE /api/formations/:ficha`
- **Componentes frontend relacionados**: `ImportWorkspaceView.vue`, `import.service.ts` (`deleteFicha`, `getAvailableFichas`)
- **Controllers/Services relacionados**: `formation.controller.ts` (`deleteFormation`), `formations.ts` (`deleteFormationByFicha`)

---

# HU-IMP-005: Extracción Automatizada de Estructura Curricular desde Proyectos en PDF

## Historia
**Como** Administrador del Sistema / Diseñador Curricular  
**Quiero** cargar el archivo PDF oficial del Proyecto Formativo  
**Para** extraer de forma automática y precisa las fases pedagógicas, actividades de proyecto numeradas, competencias y resultados de aprendizaje (RAPs).

## Descripción
El usuario sube un archivo `.pdf` en el modal de importación de proyectos. El backend almacena temporalmente el archivo mediante Multer e invoca el motor de extracción `parse_pdf.py` (usando `pdfplumber`). El script localiza la sección "3. PLANEACION DEL PROYECTO" / "3.1 FASES DEL PROYECTO", parsea las tablas multinivel, normaliza el texto, asocia las actividades a sus respectivas fases canónicas (`ANALISIS`, `PLANEACION`, `EJECUCION`, `EVALUACION`) y extrae los códigos de 6 a 9 dígitos de competencias y resultados. Una vez extraído el JSON, el backend o el frontend persisten el proyecto estructurado.

## Criterios de Aceptación
- Solo se deben aceptar archivos con tipo MIME `application/pdf` o extensión `.pdf`.
- El extractor debe capturar los metadatos globales del proyecto: Código de Proyecto SOFIA, Código del Programa SOFIA, Nombre del Proyecto, Tiempo Estimado de Ejecución (meses), Regional y Centro de Formación.
- Debe agrupar las actividades y códigos bajo las 4 fases canónicas del SENA: `ANALISIS`, `PLANEACION`, `EJECUCION`, `EVALUACION`.
- Debe identificar y tolerar variaciones en tablas con columnas fusionadas o columnas adicionales vacías.
- Debe limpiar y deduplicar las actividades numeradas extrayendo el número ordinal (ej. `1. Identificar requerimientos...` ➔ Actividad 1).
- El archivo temporal cargado en `uploads/` debe ser eliminado inmediatamente al finalizar la extracción, tanto en casos de éxito como de fallo.
- Debe reportar errores claros si el script de Python no se encuentra en el sistema o si el PDF no contiene la estructura esperada de la sección 3.

## Información Técnica
- **Prioridad**: Alta
- **Roles involucrados**: Administrador del Sistema, Coordinador Académico
- **Reglas de negocio relacionadas**: RN-IMP-011, RN-IMP-012
- **Endpoints relacionados**: `POST /api/extract/project`
- **Componentes frontend relacionados**: `ProjectPhasesView.vue`, `projectPhases.service.ts` (`extractPdf`)
- **Controllers/Services relacionados**: `import.controller.ts` (`extractProjectPdf`), `parse_pdf.py` (`extract_project_data`), `middlewares/upload.ts`
