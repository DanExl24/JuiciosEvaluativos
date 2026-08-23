# Documentación Técnica del Sistema de Juicios Evaluativos

Este documento detalla el funcionamiento interno, las reglas de negocio y la arquitectura del sistema de gestión de proyectos formativos y juicios evaluativos.

## 1. Arquitectura de Vistas

El sistema está organizado en tres niveles principales de visualización:

### A. Dashboard Global
- Muestra un resumen de todos los proyectos formativos cargados.
- Proporciona estadísticas rápidas sobre el número de fichas, competencias totales y estado general del sistema.

### B. Vista de Detalle de Proyecto (Fases)
- **Modo Visualización**: Permite navegar por las fases (Análisis, Planeación, Ejecución, Evaluación) para ver el avance real.
- **Modo Editor**: Permite gestionar la estructura del proyecto, asignando o trasladando competencias entre fases.
- **Competencias Sueltas (Sueltas)**: Un repositorio de competencias que pertenecen al programa pero aún no han sido vinculadas a ninguna fase específica.

### C. Dashboard de Estado de Aprendices
- **Analítica Visual**: Gráfica de líneas (Chart.js) que muestra la tendencia de deserción a través de las fases.
- **Desglose de Deserción**: Clasificación de bajas en "Traslados" y "Retiros Voluntarios".
- **Listado de Desertores**: Detalle de quién se fue, en qué fecha y cuál fue su último logro académico antes de la baja.

---

## 2. Motor de Estadísticas y Cálculos

El sistema ha migrado de un modelo basado en aprendices a un modelo **granular basado en Resultados de Aprendizaje (RAP)**.

### Cálculo de Avance (Porcentaje)
El progreso no se mide por competencias aprobadas, sino por resultados individuales logrados.
- **Fórmula**: `(Resultados Aprobados) / (Resultados Totales Esperados) * 100`
- **Criterio de Competencia Aprobada**: Una competencia solo se marca como "Aprobada" si el 100% de sus Resultados de Aprendizaje asociados han sido aprobados por todos los aprendices esperados.

### Lógica de "Deserción Inteligente" (Smart Desertion)
Para evitar que los aprendices que se retiran sesguen los datos de fases futuras:
- **Aprendices Activos**: Se cuentan siempre en todas las fases de su programa.
- **Aprendices Inactivos (Retirados/Trasladados)**: Solo se incluyen en los cálculos de una fase si **ya tienen registros previos** de juicios evaluativos en resultados de esa fase.
- **Impacto**: Esto permite que una fase futura (ej: Evaluación) muestre un progreso limpio, sin los "pendientes" de alumnos que se fueron meses atrás.

### Rastreo de Último Logro Académico
Para cada aprendiz en estado de deserción, el sistema realiza una auditoría profunda para determinar su último punto de contacto académico:
1.  **Búsqueda Exhaustiva**: Se utiliza una consulta `DISTINCT ON` en la base de datos para filtrar por el `id_aprendiz`.
2.  **Criterio de Recencia**: Se ordena por `fecha DESC` e `id_juicio DESC`, garantizando que obtenemos el registro cronológicamente más reciente.
3.  **Vinculación Estructural**: El sistema extrae automáticamente a qué **Competencia** y a qué **Resultado de Aprendizaje (RAP)** pertenecía ese último juicio, además de su estado (Aprobado/No Aprobado).
4.  **Propósito**: Esta métrica permite a la coordinación saber exactamente hasta dónde llegó un aprendiz antes de retirarse, facilitando procesos de reingreso o análisis de deserción por dificultad académica.

---

## 3. Sistema de Filtros

El sistema utiliza un filtrado jerárquico para facilitar la auditoría:

- **Filtro Global de Competencias**: 
    - **Todas**: Muestra la estructura completa.
    - **Aprobadas**: Solo competencias donde todos los aprendices cumplieron el 100% de los RAP.
    - **Por Evaluar**: Competencias que tienen al menos un RAP pendiente en al menos un aprendiz activo.

---

## 4. Flujo de Importación y Datos

### Importación de PDF (Reportes de Juicios)
1. El archivo PDF se procesa mediante un script de **Python (`parse_pdf.py`)**.
2. Se extrae la estructura: Programa -> Competencias -> Resultados -> Aprendices -> Estados.
3. El backend sincroniza estos datos usando cláusulas `ON CONFLICT` para evitar duplicidad de competencias y resultados, actualizando únicamente los juicios nuevos.

### Importación de CSV
- Se utiliza para cargar o actualizar listados masivos de aprendices y sus estados iniciales.

---

## 5. Gestión de Estructura (Modo Editor)

- **Asignación**: Vincula una competencia suelta a una fase, creando también los vínculos para todos sus resultados de aprendizaje asociados.
- **Traslado (Move)**: Al mover una competencia de la Fase A a la Fase B, el sistema automáticamente:
    1. La desasigna de la Fase A (limpiando los registros de `fase_competencia`).
    2. La asigna a la Fase B.
- **Eliminación**: Al quitar una competencia de una fase, esta vuelve automáticamente a la lista de **Competencias Sueltas**, permitiendo su reasignación posterior.

---

## 6. Analítica de Deserción

La gráfica de líneas utiliza **Chart.js** y se alimenta de dos categorías principales:
- **Traslados**: Detectados mediante la búsqueda de la palabra clave "traslado" en el estado del aprendiz (insensible a mayúsculas).
- **Retiros Voluntarios**: Detectados mediante la palabra clave "retiro".

Esto permite a los coordinadores identificar no solo cuánta gente se va, sino la naturaleza de la deserción en cada etapa del ciclo de vida del proyecto.
