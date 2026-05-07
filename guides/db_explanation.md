# Documentación de la Base de Datos - Juicios Evaluativos

Este documento explica el propósito y la función de cada tabla en la base de datos del sistema de Juicios Evaluativos.

## Modelo de Datos

La base de datos está diseñada para gestionar el seguimiento académico de los aprendices, organizando la estructura curricular por programas, proyectos, fases, competencias y resultados de aprendizaje.

---

### 1. `programa`
**Propósito:** Almacena la información de los programas de formación ofrecidos (ej. ADSO - Análisis y Desarrollo de Software).
- **Campos clave:** `nombre`, `codigo`, `version`.
- **Relación:** Es la base de toda la estructura curricular.

### 2. `proyecto_formativo`
**Propósito:** Detalla el proyecto específico que se desarrolla dentro de un programa de formación.
- **Campos clave:** `codigo_proyecto`, `nombre`, `tiempo_ejecucion`, `regional`, `centro_formacion`.
- **Relación:** Cada programa tiene un proyecto formativo asociado.

### 3. `fases`
**Propósito:** Define las etapas cronológicas del proyecto formativo (Análisis, Planeación, Ejecución, Evaluación).
- **Campos clave:** `nombre` (Enum: ANALISIS, PLANEACION, etc.), `actividad`.
- **Relación:** Pertenece a un `programa`.

### 4. `competencia`
**Propósito:** Define las capacidades y habilidades que el aprendiz debe adquirir.
- **Campos clave:** `codigo`, `nombre`.
- **Relación:** Cada competencia está asociada a un `programa`.

### 5. `resultados_aprendizaje`
**Propósito:** Desglosa las competencias en logros específicos y medibles.
- **Campos clave:** `codigo`, `detalle`.
- **Relación:** Un resultado de aprendizaje pertenece a una `competencia` específica.

### 6. `formacion` (Fichas)
**Propósito:** Representa a un grupo o cohorte específica de aprendices (comúnmente llamada "Ficha").
- **Campos clave:** `ficha_caracterizacion`, `estado` (en ejecución, finalizada, etc.), `modalidad`.
- **Relación:** Vincula un grupo de personas a un `programa`.

### 7. `aprendiz`
**Propósito:** Almacena la información personal y el estado académico de los estudiantes.
- **Campos clave:** `documento`, `nombres`, `apellidos`, `estado` (en formación, retiro, etc.).
- **Relación:** Cada aprendiz pertenece a una `formacion` (ficha).

### 8. `funcionario`
**Propósito:** Registra al personal administrativo o instructores encargados de registrar las evaluaciones.
- **Campos clave:** `documento`, `nombre`, `apellido`.
- **Relación:** Se vincula a los juicios evaluativos como el evaluador.

### 9. `juicios_evaluativos`
**Propósito:** Es la tabla central donde se registra el desempeño del aprendiz. Indica si un aprendiz aprobó o no un resultado de aprendizaje específico.
- **Campos clave:** `estado` (aprobado, desaprobado, por evaluar), `fecha`.
- **Relación:** Conecta un `aprendiz` con un `resultado_aprendizaje` y un `funcionario`.

---

## Tablas de Relación (Intermedias)

### `fase_competencia`
**Propósito:** Permite asociar múltiples competencias a una fase específica del proyecto, permitiendo que una competencia sea abordada en diferentes momentos del proceso.

### `fase_resultado`
**Propósito:** Asocia resultados de aprendizaje específicos a las fases del proyecto. Esto permite al sistema saber qué resultados deben evaluarse en cada etapa (Análisis, Planeación, etc.).

---

## Enums (Tipos de Datos Personalizados)
- **`estado_aprendiz_enum`**: Controla el estado del alumno (retiro voluntario, en formación, traslado).
- **`estado_formacion_enum`**: Estado de la ficha (en ejecución, finalizada, cancelada).
- **`fase_nombre_enum`**: Nombres estandarizados de las fases.
- **`juicio_estado_enum`**: Posibles estados de una evaluación (aprobado, desaprobado, por evaluar).
- **`modalidad_enum`**: Tipo de formación (presencial, virtual, a distancia).
