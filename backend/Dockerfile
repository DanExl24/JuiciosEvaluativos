FROM node:20-bookworm-slim

# Instalar Python 3, pip y utilidades del sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instalar dependencias de Python (pdfplumber)
COPY requirements.txt ./
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt

# Copiar manifiestos e instalar dependencias Node.js
COPY package*.json ./
RUN npm ci

# Copiar código fuente y scripts
COPY . .

# Compilar TypeScript a dist/
RUN npm run build

# Configurar variables de entorno y puerto
EXPOSE 4000
ENV NODE_ENV=production
ENV PORT=4000

# Iniciar servidor backend
CMD ["node", "dist/index.js"]
