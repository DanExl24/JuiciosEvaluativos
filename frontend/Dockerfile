# Stage 1: Compilación de la aplicación Vue 3 + Vite
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm ci

# Copiar archivos fuente del frontend
COPY . .

# Compilar assets para producción
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2: Servidor Nginx de Alto Rendimiento
FROM nginx:1.27-alpine

# Limpiar configuración por defecto
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/*

# Copiar archivos compilados y configuración de Nginx
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto HTTP estándar
EXPOSE 80

# Iniciar Nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]
