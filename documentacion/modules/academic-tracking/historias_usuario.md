# 📖 Historias de Usuario - Módulo de Seguimiento Curricular (Academic Tracking)

---

# HU-TRK-001: Navegación por el Catálogo Formativo de Competencias y Resultados

## Historia
**Como** Instructor / Coordinador Académico  
**Quiero** consultar la estructura completa de competencias y resultados de aprendizaje de una ficha  
**Para** supervisar los niveles de aprobación grupal y verificar cuántos aprendices han alcanzado los logros de cada RAP.

## Descripción
El usuario selecciona una ficha y visualiza el catálogo jerárquico de competencias formativas. Cada tarjeta de competencia funciona como un acordeón desplegable que muestra su código de juicio/proyecto, denominación, número de resultados de aprendizaje, total de aprendices evaluados, aprobados, pendientes y porcentaje de avance. Al expandir la competencia, se desglosan todos los resultados de aprendizaje (RAPs) con su descripción, barras de progreso y la distribución de aprendices.

## Criterios de Aceptación
- Debe consultar las competencias filtradas por la ficha activa invocando `GET /api/formations/competencies?ficha={ficha}`.
- Cada competencia debe mostrar:
  - Nombre oficial y código canónico.
  - Indicadores numéricos: Total Aprendices, Aprobados, Pendientes, Desaprobados y Progreso porcentual.
- Al hacer clic en el encabezado de una competencia, se deben desplegar u ocultar sus resultados asociados.
- El usuario puede filtrar el catálogo mediante un campo de búsqueda en vivo insensible a mayúsculas y tildes (filtrando por código o nombre de competencia y detalle de resultado).
- Se debe poder filtrar por estado de juicio (`aprobado`, `por evaluar`, `desaprobado`), ocultando competencias o resultados que no tengan aprendices en dicho estado.

## Información Técnica
- **Prioridad**: Alta
- **Roles involucrados**: Instructor, Coordinador Académico
- **Reglas de negocio relacionadas**: RN-TRK-001, RN-TRK-002, RN-TRK-003
- **Endpoints relacionados**: `GET /api/formations/competencies`
- **Componentes frontend relacionados**: `AcademicTrackingView.vue`, `useAcademicTracking.ts`
- **Controllers/Services relacionados**: `formation.controller.ts` (`getFormationCompetencies`), `dashboard.ts` (`getFormationCompetencyCatalog`)

---

# HU-TRK-002: Detalle Individual y Auditoría de Juicios por Aprendiz

## Historia
**Como** Instructor Líder / Evaluador  
**Quiero** seleccionar a un aprendiz específico de la ficha  
**Para** inspeccionar su historial completo de juicios evaluativos, competencias pendientes y el funcionario que registró cada calificación.

## Descripción
En la vista de Seguimiento Curricular, el usuario activa el modo *"Por Aprendiz"* y selecciona a un estudiante del listado o buscador. El sistema carga la hoja de vida evaluativa del aprendiz (`GET /api/learners/:learnerId`), presentando:
- Tarjeta de resumen con Nombre Completo, Tipo y Número de Documento, Estado (`en formacion`, etc.), Ficha, Programa y Porcentaje Total de Avance.
- Contadores de resultados: Total, Aprobados, Pendientes y Desaprobados.
- Acordeones de competencias con el desglose de cada resultado de aprendizaje, indicando si está aprobado (100%) o pendiente (0%), la fecha exacta de registro del juicio y la etiqueta del funcionario evaluador.

## Criterios de Aceptación
- La consulta del aprendiz individual debe realizarse mediante `GET /api/learners/:learnerId`.
- Si el identificador no es válido o no existe, debe responder con código HTTP 400 / 404 y un mensaje amigable.
- Debe mostrar el desglose de cada competencia del programa asignado al aprendiz.
- Cada resultado de aprendizaje debe indicar:
  - Código y descripción del RAP.
  - Estado del juicio evaluativo (Badge de color verde para Aprobado, amarillo para Por Evaluar, rojo para Desaprobado).
  - Fecha formateada (`YYYY-MM-DD HH:mm:ss`) con zona horaria de Colombia.
  - Funcionario evaluador (`{tipo_doc} {doc} - {nombre} {apellido}` o *"Sin funcionario"*).
- Al ingresar con un aprendiz preseleccionado desde el Dashboard (`academicContext.store.selectedLearnerId`), la vista debe cargar automáticamente el detalle de dicho aprendiz.

## Información Técnica
- **Prioridad**: Alta
- **Roles involucrados**: Instructor, Comité de Evaluación
- **Reglas de negocio relacionadas**: RN-TRK-004, RN-TRK-005
- **Endpoints relacionados**: `GET /api/learners/:learnerId`
- **Componentes frontend relacionados**: `AcademicTrackingView.vue`, `useAcademicTracking.ts`
- **Controllers/Services relacionados**: `learner.controller.ts` (`getLearner`), `dashboard.ts` (`getLearnerDetail`)

---

# HU-TRK-003: Inspección Modal de Aprendices por Resultado de Aprendizaje

## Historia
**Como** Instructor de Competencia  
**Quiero** hacer clic en un resultado de aprendizaje específico  
**Para** abrir un modal detallado que liste todos los aprendices con sus respectivos juicios emitidos en dicho RAP.

## Descripción
Al hacer clic sobre un resultado de aprendizaje en el catálogo formativo, se abre el modal interactivo `ResultDetailModal.vue`. El modal presenta:
- Cabecera con código y descripción del resultado, ficha y competencia madre.
- Tira de contadores rápidos (Total Aprendices, Aprobados, Pendientes, % Cumplimiento).
- Filtro rápido de aprendices por estado de juicio (`aprobado`, `por evaluar`, `desaprobado`).
- Tabla con Nombre, Documento, Estado del Aprendiz y Badge de Juicio.
- Botones de exportación directa a Excel y PDF.

## Criterios de Aceptación
- El modal debe desplegarse de manera fluida y permitir cerrarse con el botón "Cerrar", la tecla Escape o haciendo clic fuera del diálogo.
- La tabla de aprendices debe reflejar el filtro de juicio seleccionado dinámicamente sin recargar la página.
- Debe mostrar un mensaje de estado vacío si ningún aprendiz coincide con el filtro.
- Debe incluir los botones de exportación a Excel y PDF habilitados con los datos de los aprendices filtrados.

## Información Técnica
- **Prioridad**: Media
- **Roles involucrados**: Instructor
- **Reglas de negocio relacionadas**: RN-TRK-006
- **Endpoints relacionados**: `GET /api/formations/competencies`
- **Componentes frontend relacionados**: `ResultDetailModal.vue`, `AcademicTrackingView.vue`
- **Controllers/Services relacionados**: `dashboard.ts` (`getFormationCompetencyCatalog`)

---

# HU-TRK-004: Exportación de Reportes de Evaluación a Microsoft Excel (.xlsx)

## Historia
**Como** Instructor / Administrador  
**Quiero** exportar a Excel el listado de aprendices y calificaciones de un resultado de aprendizaje o de un aprendiz  
**Para** generar planillas de notas, respaldos locales o análisis en hojas de cálculo externas.

## Descripción
El usuario pulsa el botón **"Excel"** dentro del modal de detalle de resultado o en la vista de seguimiento. La utilidad pura `excelReport.ts` (basada en `SheetJS`) construye en memoria del navegador un libro de trabajo `.xlsx`, configura encabezados de metadatos (Ficha, Competencia, Resultado, Fecha de Exportación), formatea las columnas de datos y desencadena la descarga directa de un archivo con nomenclatura estandarizada (ejemplo: `Reporte_Ficha_2670687_RAP_22050109601.xlsx`).

## Criterios de Aceptación
- La exportación debe realizarse íntegramente del lado del cliente utilizando `xlsx` (`SheetJS`), sin requerir peticiones adicionales al servidor.
- El archivo generado debe incluir:
  - Fila de metadatos: Ficha, Competencia, Código de Resultado y Detalle.
  - Tabla de datos con columnas: `Nombres y Apellidos`, `Tipo Doc`, `Documento`, `Estado del Aprendiz`, `Juicio Evaluativo`.
- Debe sanitizar el nombre del archivo eliminando caracteres especiales.
- La descarga debe activarse automáticamente en el navegador del usuario.

## Información Técnica
- **Prioridad**: Media
- **Roles involucrados**: Instructor, Coordinador
- **Reglas de negocio relacionadas**: RN-TRK-007
- **Endpoints relacionados**: N/A (Generación en cliente)
- **Componentes frontend relacionados**: `ResultDetailModal.vue`, `src/utils/exporters/excelReport.ts`
- **Controllers/Services relacionados**: `excelReport.ts` (`exportResultToExcel`, `exportLearnerToExcel`)

---

# HU-TRK-005: Exportación de Actas y Reportes Oficiales a Formato PDF

## Historia
**Como** Instructor / Coordinador Académico  
**Quiero** descargar un reporte formal en formato PDF con el consolidado de aprendices por resultado  
**Para** adjuntar al acta de comité de evaluación, archivar evidencias de juzgamiento o imprimir para firmas.

## Descripción
El usuario hace clic en el botón **"PDF"** en el modal de resultado. La utilidad `pdfReport.ts` genera en el cliente un documento PDF vectorial mediante `jsPDF` y `jspdf-autotable`. El documento incluye una cabecera con diseño institucional SENA, tarjetas de resumen cuantitativo (Aprobados vs Pendientes), barra visual de progreso y la tabla estructurada de aprendices con formato y paginación automática.

## Criterios de Aceptación
- El reporte debe generarse en formato A4 vertical con márgenes estandarizados.
- La cabecera debe incluir el título *"SISTEMA DE GESTIÓN DE JUICIOS EVALUATIVOS - SENA"*, ficha de caracterización, código y denominación de la competencia y del RAP.
- Debe incluir un recuadro resumen con los contadores: Total Aprendices, Aprobados, Pendientes y Porcentaje de Cumplimiento.
- La tabla de aprendices debe tener formato de celdas alternadas (*striped*), ancho de columnas adaptativo y paginación automática con numeración de páginas en el pie (*Página X de Y*).
- La descarga del archivo `.pdf` debe dispararse de forma inmediata en el navegador.

## Información Técnica
- **Prioridad**: Media
- **Roles involucrados**: Instructor, Coordinador Académico, Comité de Evaluación
- **Reglas de negocio relacionadas**: RN-TRK-008
- **Endpoints relacionados**: N/A (Generación en cliente)
- **Componentes frontend relacionados**: `ResultDetailModal.vue`, `src/utils/exporters/pdfReport.ts`
- **Controllers/Services relacionados**: `pdfReport.ts` (`exportResultToPdf`, `exportLearnerToPdf`)
