# 📊 Módulo de Panorama Ejecutivo y Métricas (Dashboard)

## 📌 1. Descripción General del Módulo
El módulo **Dashboard** representa el centro de control y analítica visual del sistema **JuiciosEvaluativos**. Proporciona una visión ejecutiva holística e interactiva del rendimiento curricular, niveles de aprobación, detección temprana de riesgo académico y tendencias de deserción formativa.

Este módulo integra:
1. **Indicadores Globales (KPIs)**: Total de programas, fichas de caracterización activas, aprendices matriculados, aprendices en formación, retiros voluntarios, traslados, juicios evaluativos totales, aprobados, desaprobados, pendientes y promedio global de cumplimiento.
2. **Visualizaciones Gráficas con Apache ECharts**:
   - *Gauge Chart*: Tacómetro del porcentaje de avance general de la ficha seleccionada.
   - *Radar Chart*: Desempeño multifactorial de aprobación en las principales competencias.
   - *Donut / Pie Chart*: Distribución de estados de aprendices y proporciones de juicios evaluativos.
   - *Bar Chart*: Rankings comparativos de competencias con mayor rezago de evaluación.
3. **Módulo de Aprendices con Juicios Pendientes**: Tabla dinámica clasificada por cantidad de resultados pendientes, con enlaces directos al seguimiento curricular individual.
4. **Ranking de Competencias**: Indicadores de tasa de aprobación porcentual y distribución de juicios por norma de competencia.
5. **Auditoría de Juicios Recientes**: Feed cronológico de los últimos 20 juicios calificados en la ficha o programa con detalle del funcionario evaluador.
6. **Sistema de Filtrado Multidimensional**: Selectores combinables en cascada por Estado de Aprendiz, Ficha de Caracterización, Juicio Evaluativo, Competencia, Resultado y Aprendiz.

---

## 👥 2. Actores y Roles Involucrados
| Rol | Interacción en el Módulo |
| :--- | :--- |
| **Directivo / Coordinador Académico** | Supervisa el porcentaje de avance de fichas, evalúa métricas de retención vs deserción y detecta competencias críticas con bajo índice de evaluación. |
| **Instructor / Docente Líder** | Filtra por su ficha asignada, consulta el listado de aprendices con juicios pendientes para citaciones a comités de evaluación y verifica juicios recientes. |

---

## 🏛️ 3. Componentes Arquitectónicos del Módulo

### Frontend (`src/features/dashboard/`):
- **Vistas**:
  - `DashboardGeneralView.vue`: Vista principal organizada en pestañas analíticas (*Panorama General*, *Fases del Proyecto*, *Métricas por Aprendiz*, *Competencias*), con gráficos ECharts, filtros reactivos y tabla de aprendices rezagados.
- **Composables**:
  - `useDashboard.ts`: Orquestación del estado de carga, sincronización con `academicContext.store`, cálculo de opciones filtradas en cascada y manejo del buscador predictivo.
- **Servicios**:
  - `dashboard.service.ts`: Cliente HTTP para el endpoint `/api/dashboard` con paso de parámetros `DashboardFilterParams`.
- **Tipos**:
  - `types/dashboard.types.ts`: Contratos para métricas globales (`DashboardOverview`), programas, aprendices, competencias y opciones de filtrado.

### Backend (`Database/src/`):
- **Controladores**:
  - `dashboard.controller.ts`: Endpoint `getDashboard` y extractor de parámetros de consulta `readFilters`.
- **Servicios**:
  - `dashboard.ts`: Construcción de consultas SQL agregadas multi-tabla (`queryJoinedRows`, `getDashboardData`), consolidación de mapas en memoria para cálculo de porcentajes y opciones cruzadas.
- **Rutas**:
  - `routes/dashboard.routes.ts`: `GET /api/dashboard`.

---

## 🔗 4. Matriz de Trazabilidad Rápida
| Historia de Usuario | Reglas de Negocio | Endpoints Relacionados | Componentes / Vistas |
| :--- | :--- | :--- | :--- |
| **HU-DSH-001**: Panorama Ejecutivo y KPIs Globales | RN-DSH-001, RN-DSH-002, RN-DSH-003 | `GET /api/dashboard` | `DashboardGeneralView.vue`, `useDashboard.ts` |
| **HU-DSH-002**: Filtrado Multidimensional en Cascada | RN-DSH-004, RN-DSH-005 | `GET /api/dashboard` | `DashboardGeneralView.vue`, `academicContext.store.ts` |
| **HU-DSH-003**: Detección y Seguimiento de Aprendices Rezagados | RN-DSH-006 | `GET /api/dashboard` | `DashboardGeneralView.vue` (Tabla de pendientes) |
| **HU-DSH-004**: Ranking de Aprobación por Competencias | RN-DSH-007 | `GET /api/dashboard` | `DashboardGeneralView.vue` (Radar + Bar ECharts) |
| **HU-DSH-005**: Feed de Juicios Evaluativos Recientes | RN-DSH-008 | `GET /api/dashboard` | `DashboardGeneralView.vue` (Feed de auditoría) |

---

## 📂 5. Documentos del Módulo
- [Historias de Usuario](file:///c:/Users/alejo/Downloads/juicioss/JuiciosEvaluativos/documentacion/modules/dashboard/historias_usuario.md)
- [Reglas de Negocio](file:///c:/Users/alejo/Downloads/juicioss/JuiciosEvaluativos/documentacion/modules/dashboard/reglas_negocio.md)
- [Casos de Uso](file:///c:/Users/alejo/Downloads/juicioss/JuiciosEvaluativos/documentacion/modules/dashboard/casos_uso.md)
