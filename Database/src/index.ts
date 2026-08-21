import dotenv from 'dotenv';
import { createApp } from './app.ts';
import { pool } from './config/db.ts';
import { ensureSchemaCompatibility } from './services/schema.ts';

dotenv.config();

const apiPort = Number(process.env.PORT) || 4000;

async function bootstrap() {
  try {
    // Ensure database schema and migrations are compatible
    await ensureSchemaCompatibility(pool);

    const app = createApp();

    app.listen(apiPort, () => {
      console.log(`Servidor corriendo en http://localhost:${apiPort}`);
    });
  } catch (error) {
    console.error('Error al inicializar el servidor:', error);
    process.exit(1);
  }
}

bootstrap();
