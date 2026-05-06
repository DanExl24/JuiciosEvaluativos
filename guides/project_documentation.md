# Documentación del Proyecto: Juicios Evaluativos

Este documento proporciona una visión general y detallada de la estructura, propósito y funcionalidades del proyecto **Juicios Evaluativos**.

## 1. Ideas Generales
El proyecto es una aplicación web diseñada para la gestión, visualización y análisis de datos educativos relacionados con "Juicios Evaluativos". Permite a los instructores o administradores cargar datos mediante archivos CSV, visualizar el progreso de los aprendices a través de un dashboard interactivo y realizar seguimientos detallados por fichas, competencias y resultados de aprendizaje.

### Objetivo Principal
Centralizar la información de los juicios evaluativos para facilitar la toma de decisiones basada en datos, identificando cuellos de botella en las competencias y el estado de avance de los aprendices.

---

## 2. Estructura del Proyecto

La solución está dividida en dos partes principales: el **Frontend** (interfaz de usuario) y el **Backend/Database** (lógica de servidor y acceso a datos).

### Raíz del Proyecto
- `src/`: Contiene el código fuente del frontend (Vue 3 + TypeScript).
- `Database/`: Contiene el código fuente del backend (Express + TypeScript).
- `public/`: Activos estáticos para el frontend.
- `guides/`: Documentación técnica, esquemas SQL y archivos de ejemplo.
- `package.json`: Dependencias y scripts del proyecto principal.
- `tailwind.config.js`: Configuración de estilos CSS.

---

## 3. Especificaciones Técnicas

### Frontend (Vue 3 + Vite + TypeScript)
Utiliza una arquitectura basada en componentes SFC (Single File Components).
- **Tecnologías Clave**:
    - **Vue 3 (Composition API)**: Framework principal.
    - **Chart.js & vue-chartjs**: Generación de gráficos dinámicos.
    - **Tailwind CSS**: Framework de estilos para un diseño moderno y responsivo.
    - **Lucide Vue**: Iconografía.

- **Componentes Principales (`src/components/`)**:
    - `DashboardGeneralView.vue`: El núcleo de la visualización, integra filtros complejos y múltiples gráficos.
    - `CompetenciesResultsView.vue`: Vista detallada de los resultados por aprendiz.
    - `CsvUploadView.vue`: Interfaz para la carga y validación de archivos CSV.
    - `ImportWorkspaceView.vue`: Gestión de la importación de datos al espacio de trabajo.
    - `AppHeader.vue`: Navegación y branding.

### Backend (Express + PostgreSQL)
Ubicado en la carpeta `Database/`, actúa como una API REST.
- **Tecnologías Clave**:
    - **Node.js & Express**: Servidor web.
    - **PostgreSQL**: Base de datos relacional para persistencia de datos complejos.
    - **pg (node-postgres)**: Cliente para interactuar con la base de datos.
    - **dotenv**: Gestión de variables de entorno.

- **Funcionalidades del Servidor**:
    - **Importación de CSV**: Procesa y valida los datos antes de insertarlos en la BD.
    - **API de Dashboard**: Entrega datos agregados para los gráficos (conteos, porcentajes de aprobación).
    - **Gestión de Fichas**: Permite eliminar o consultar datos específicos de una ficha de formación.

---

## 4. Ideas Específicas de Funcionalidad

### Dashboard Interactivo
- **Filtros Dinámicos**: Permite filtrar por Estado del Aprendiz, Ficha, Competencia, Resultado de Aprendizaje y búsqueda exacta de Aprendiz por nombre o documento.
- **Métricas Clave**:
    - **Avance Promedio**: Porcentaje total de aprobación.
    - **Distribución de Estados**: Visualización de aprendices en formación, retirados o trasladados.
    - **Cuellos de Botella**: Identificación de competencias con más juicios pendientes.
    - **Ranking de Aprendices**: Lista de los mejores desempeños y alertas para aquellos con más pendientes.

### Gestión de Datos
- **Importación Masiva**: El sistema procesa archivos CSV estructurados, transformando filas de texto en entidades relacionales (Programas, Competencias, Aprendices, Resultados).
- **Integridad y Deduplicación**: 
    - **Fingerprinting**: Utiliza algoritmos de hashing (SHA-256) para generar una huella única de cada archivo importado.
    - **Historial Local**: Mantiene un registro en el navegador (`localStorage`) para evitar que el mismo archivo sea procesado múltiples veces accidentalmente.
- **Esquema Robusto**: El backend incluye scripts de compatibilidad para asegurar que la base de datos soporte las restricciones necesarias (claves únicas, tipos de datos).

---

## 5. Guías de Referencia (`guides/`)
- `bd.dbml`: Diseño lógico de la base de datos en formato DBML.
- `schema.sql`: Script de creación de tablas y relaciones para PostgreSQL.
- `consultas_sql_metricas.txt`: Consultas predefinidas para extraer métricas directamente de la base de datos.

---

## 6. Stack Tecnológico Resumido
| Capa | Tecnología |
| :--- | :--- |
| **Frontend** | Vue 3, Vite, TypeScript, Tailwind CSS |
| **Backend** | Node.js, Express, TypeScript |
| **Base de Datos** | PostgreSQL |
| **Gráficos** | Chart.js |
| **Estilos** | CSS Moderno, Glassmorphism |
