# 📦 Módulo de Ingesta y Procesamiento de Datos (Imports)

## 📌 1. Descripción General del Módulo
El módulo **Imports** es el punto de entrada de información oficial al sistema **JuiciosEvaluativos**. Su propósito fundamental es permitir la carga, extracción, validación, transformación, persistencia transaccional y auditoría de dos fuentes de datos críticas del SENA:
1. **Reportes de Juicios Evaluativos de SofiaPlus** (`.csv`, `.xlsx`, `.xls`): Contienen la caracterización del programa, la ficha, aprendices, competencias, resultados de aprendizaje (RAPs), juicios emitidos (`aprobado`, `desaprobado`, `por evaluar`), marcas temporales y funcionarios evaluadores.
2. **Proyectos Formativos en PDF** (`.pdf`): Documentos oficiales de planeación pedagógica de los cuales se extraen automáticamente mediante un motor en Python las 4 fases formativas (`ANALISIS`, `PLANEACION`, `EJECUCION`, `EVALUACION`), actividades de proyecto numeradas y códigos curriculares asociados.

Adicionalmente, el módulo provee capacidades de **administración y depuración de fichas** con borrado seguro en cascada y un **historial local y de auditoría en disco** con cálculo de huella digital (*fingerprint* SHA-256) para evitar cargas duplicadas accidentales.

---

## 👥 2. Actores y Roles Involucrados
| Rol | Descripción de Interacción en el Módulo |
| :--- | :--- |
| **Administrador del Sistema / Coordinador Académico** | Realiza la ingesta masiva de reportes de SofiaPlus, importa proyectos pedagógicos en PDF, inspecciona logs de auditoría y depura fichas obsoletas o corruptas. |
| **Instructor / Docente Líder** | Carga archivos de seguimiento de su ficha asignada y verifica la integridad del previo tabular antes de confirmar la persistencia. |

---

## 🏛️ 3. Componentes Arquitectónicos del Módulo

### Frontend (`src/features/imports/`):
- **Vistas**:
  - `ImportWorkspaceView.vue`: Dropzone interactivo, previsualización tabular de las primeras filas, indicadores de progreso, drawer colapsable de administración y depuración de fichas.
  - `ImportsHistoryModal.vue`: Modal con el listado histórico de ingestas almacenadas en el cliente, selector de detalle y visualizador de filas previas.
- **Composables**:
  - `useFileParser.ts`: Lógica reactiva de detección de formato, decodificación UTF-8 / ANSI, eliminación de BOM (`\uFEFF`), extracción de metadatos de cabecera y normalización de columnas con PapaParse y SheetJS (XLSX).
- **Servicios**:
  - `import.service.ts`: Abstracción HTTP hacia `/api/import/csv`, `/api/formations/:ficha` y `/api/dashboard`.
- **Stores**:
  - `importHistory.store.ts`: Store Pinia persistido en `localStorage` con cálculo de fingerprints criptográficos y filtrado por ficha.

### Backend (`Database/src/` & Root):
- **Controladores**:
  - `import.controller.ts`: Endpoints `importCsv`, `extractProjectPdf`, `getLogs`, `getLogByFileName`.
  - `formation.controller.ts`: Endpoint `deleteFormation`.
- **Servicios**:
  - `csvImport.ts`: Transacción SQL ACID (`BEGIN`, `COMMIT`, `ROLLBACK`), resolución de catálogos (`ensureProgram`, `ensureFormacion`, `ensureAprendiz`, `ensureCompetencia`, `ensureResultado`, `ensureFuncionario`, `ensureJuicio`).
  - `formations.ts`: Borrado relacional en cascada (`deleteFormationByFicha`).
  - `schema.ts`: Verificación de compatibilidad y restricciones únicas compuestas.
- **Utilidades**:
  - `date-parser.ts` / `csvImport.ts`: Parseo de formatos de fecha SofiaPlus (`DD/MM/YYYY hh.mm a/p`).
  - `log-writer.ts`: Escritura y lectura de archivos `.json` de auditoría en la carpeta `logs/`.
  - `upload.ts`: Middleware de Multer para recepción temporal de archivos multipart.
- **Motor Extractor**:
  - `parse_pdf.py`: Script en Python con `pdfplumber` y expresiones regulares para parseo de tablas y metadatos de proyectos formativos.

---

## 🔗 4. Matriz de Trazabilidad Rápida
| Historia de Usuario | Reglas de Negocio | Endpoints Relacionados | Componentes / Vistas |
| :--- | :--- | :--- | :--- |
| **HU-IMP-001**: Carga e Ingesta de Reportes SofiaPlus | RN-IMP-001, RN-IMP-002, RN-IMP-003, RN-IMP-004, RN-IMP-005, RN-IMP-009 | `POST /api/import/csv` | `ImportWorkspaceView.vue`, `useFileParser.ts` |
| **HU-IMP-002**: Prevención de Importaciones Duplicadas | RN-IMP-006 | N/A (Client Store / Local Fingerprint) | `importHistory.store.ts`, `ImportWorkspaceView.vue` |
| **HU-IMP-003**: Consulta y Auditoría de Ingestas | RN-IMP-007 | `GET /api/logs`, `GET /api/logs/:fileName` | `ImportsHistoryModal.vue` |
| **HU-IMP-004**: Eliminación y Depuración en Cascada de Fichas | RN-IMP-008, RN-IMP-010 | `DELETE /api/formations/:ficha` | `ImportWorkspaceView.vue`, `formations.ts` |
| **HU-IMP-005**: Extracción Automatizada de Proyectos PDF | RN-IMP-011, RN-IMP-012 | `POST /api/extract/project` | `ProjectPhasesView.vue`, `parse_pdf.py` |

---

## 📂 5. Documentos del Módulo
- [Historias de Usuario](file:///c:/Users/alejo/Downloads/juicioss/JuiciosEvaluativos/documentacion/modules/imports/historias_usuario.md)
- [Reglas de Negocio](file:///c:/Users/alejo/Downloads/juicioss/JuiciosEvaluativos/documentacion/modules/imports/reglas_negocio.md)
- [Casos de Uso](file:///c:/Users/alejo/Downloads/juicioss/JuiciosEvaluativos/documentacion/modules/imports/casos_uso.md)
