# 🚀 JuiciosEvaluativos (SENA)

Sistema integral para la ingesta, análisis, trazabilidad curricular y visualización ejecutiva de juicios evaluativos y proyectos formativos del SENA (Servicio Nacional de Aprendizaje).

---

## 🏛️ Arquitectura del Proyecto

El repositorio está estructurado como un monorepo modular desacoplado:

```text
JuiciosEvaluativos/
├── backend/                       # API REST Express + TypeScript + PostgreSQL + Python
│   ├── src/                       # Controladores, servicios, rutas y esquemas
│   ├── tests/                     # Tests de integración y unitarios
│   ├── parse_pdf.py               # Extractor de proyectos formativos PDF (pdfplumber)
│   ├── requirements.txt           # Dependencias Python
│   ├── Dockerfile                 # Contenedor Backend Node.js + Python
│   └── package.json
│
├── frontend/                      # Aplicación SPA Vue 3 + Vite + TailwindCSS + ECharts
│   ├── src/                       # Componentes, vistas, composables, stores de Pinia
│   ├── public/                    # Assets estáticos
│   ├── nginx.conf                 # Servidor Nginx SPA + Proxy inverso /api/
│   ├── Dockerfile                 # Multi-stage build (Node -> Nginx Alpine)
│   └── package.json
│
├── documentacion/                 # Documentación técnica, funcional y de gráficas
│   ├── architecture/              # Arquitectura técnica Backend y Frontend
│   ├── modules/                   # Historias de usuario, reglas de negocio y casos de uso
│   └── graficas_interactivas.md   # Catálogo completo de gráficas interactivas
│
├── docker-compose.yml             # Orquestación de servicios (PostgreSQL + Backend + Frontend Nginx)
└── README.md
```

---

## 🐳 Despliegue con Docker y Docker Compose

La forma recomendada de desplegar el sistema en producción o entornos de prueba es mediante Docker Compose:

### 1. Requisitos Previos
- [Docker](https://docs.docker.com/get-docker/) (versión 24+)
- [Docker Compose](https://docs.docker.com/compose/) (versión v2+)

### 2. Levantar todos los servicios
```bash
# Construir y levantar PostgreSQL, Backend y Frontend (Nginx)
docker compose up --build -d
```

### 3. Accesos del Sistema
- **Frontend SPA (Nginx)**: `http://localhost` (Puerto 80)
- **Backend API REST**: `http://localhost:4000/api`
- **PostgreSQL Database**: `localhost:5432` (`db: juicios`, `user: postgres`)

### 4. Ver logs y detener servicios
```bash
# Ver logs en tiempo real
docker compose logs -f

# Detener los contenedores
docker compose down
```

---

## 💻 Desarrollo Local (Sin Docker)

### 1. Iniciar el Backend
```bash
cd backend
npm install
npm run dev
# Servidor escuchando en http://localhost:4000
```

### 2. Iniciar el Frontend
```bash
cd frontend
npm install
npm run dev
# Cliente Vite disponible en http://localhost:5173
```

---

## 📚 Documentación Adicional
- [Documentación Funcional por Módulos](file:///c:/Users/alejo/Downloads/juicioss/JuiciosEvaluativos/documentacion/modules/README.md)
- [Catálogo de Gráficas Interactivas](file:///c:/Users/alejo/Downloads/juicioss/JuiciosEvaluativos/documentacion/graficas_interactivas.md)
