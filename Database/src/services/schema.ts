import type { Pool } from 'pg';

export async function ensureSchemaCompatibility(pool: Pool) {
  await pool.query(`
    DROP TABLE IF EXISTS importacion_archivo
  `);

  await pool.query(`
    ALTER TABLE programa
    ALTER COLUMN nombre TYPE TEXT
  `);

  await pool.query(`
    ALTER TABLE competencia
    ALTER COLUMN nombre TYPE TEXT
  `);

  await pool.query(`
    ALTER TABLE aprendiz
    DROP CONSTRAINT IF EXISTS aprendiz_documento_key
  `);

  await pool.query(`
    ALTER TABLE competencia
    DROP CONSTRAINT IF EXISTS competencia_codigo_key
  `);

  await pool.query(`
    ALTER TABLE resultados_aprendizaje
    DROP CONSTRAINT IF EXISTS resultados_aprendizaje_codigo_key
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'aprendiz_documento_formacion_key'
      ) THEN
        ALTER TABLE aprendiz
        ADD CONSTRAINT aprendiz_documento_formacion_key UNIQUE (documento, id_formacion);
      END IF;
    END
    $$;
  `);

  await pool.query(`
    ALTER TABLE fases DROP CONSTRAINT IF EXISTS unique_nombre_fase;
    
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fases_nombre_programa_key'
      ) THEN
        ALTER TABLE fases
        ADD CONSTRAINT fases_nombre_programa_key UNIQUE (nombre, id_programa);
      END IF;
    END
    $$;
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'competencia' AND column_name = 'id_programa'
      ) THEN
        -- Add id_programa column
        ALTER TABLE competencia ADD COLUMN id_programa INTEGER REFERENCES programa(id_programa) ON DELETE CASCADE;
        
        -- Migrate data
        UPDATE competencia c
        SET id_programa = f.id_programa
        FROM formacion f
        WHERE c.id_formacion = f.id_formacion;
        
        -- Make it NOT NULL after migration
        ALTER TABLE competencia ALTER COLUMN id_programa SET NOT NULL;
        
        -- Drop old constraints and column
        ALTER TABLE competencia DROP CONSTRAINT IF EXISTS competencia_codigo_formacion_key;
        ALTER TABLE competencia DROP COLUMN IF EXISTS id_formacion;
        
        -- Add new unique constraint
        ALTER TABLE competencia ADD CONSTRAINT competencia_codigo_programa_key UNIQUE (codigo, id_programa);
      END IF;
    END
    $$;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS proyecto_formativo (
        id_proyecto SERIAL PRIMARY KEY,
        codigo_proyecto VARCHAR(50) NOT NULL UNIQUE,
        nombre TEXT NOT NULL,
        tiempo_ejecucion VARCHAR(100),
        regional VARCHAR(100),
        centro_formacion VARCHAR(200),
        id_programa INTEGER NOT NULL REFERENCES programa(id_programa) ON DELETE CASCADE
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS fase_competencia (
      id_fase INTEGER NOT NULL REFERENCES fases(id_fase) ON DELETE CASCADE,
      id_competencia INTEGER NOT NULL REFERENCES competencia(id_competencia) ON DELETE CASCADE,
      PRIMARY KEY (id_fase, id_competencia)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS fase_resultado (
      id_fase INTEGER NOT NULL REFERENCES fases(id_fase) ON DELETE CASCADE,
      id_resultado INTEGER NOT NULL REFERENCES resultados_aprendizaje(id_resultado) ON DELETE CASCADE,
      PRIMARY KEY (id_fase, id_resultado)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS fase_actividad (
      id_actividad SERIAL PRIMARY KEY,
      id_fase INTEGER NOT NULL REFERENCES fases(id_fase) ON DELETE CASCADE,
      numero INTEGER,
      descripcion TEXT NOT NULL,
      CONSTRAINT uq_fase_actividad UNIQUE (id_fase, descripcion)
    );
  `);

  // Add double-code columns to competencia
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'competencia' AND column_name = 'codigo_juicio'
      ) THEN
        ALTER TABLE competencia ADD COLUMN codigo_juicio VARCHAR(50);
        UPDATE competencia SET codigo_juicio = codigo WHERE codigo_juicio IS NULL;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'competencia' AND column_name = 'codigo_proyecto'
      ) THEN
        ALTER TABLE competencia ADD COLUMN codigo_proyecto VARCHAR(50);
      END IF;
    END
    $$;
  `);

  // Add double-code columns to resultados_aprendizaje
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'resultados_aprendizaje' AND column_name = 'codigo_juicio'
      ) THEN
        ALTER TABLE resultados_aprendizaje ADD COLUMN codigo_juicio VARCHAR(50);
        UPDATE resultados_aprendizaje SET codigo_juicio = codigo WHERE codigo_juicio IS NULL;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'resultados_aprendizaje' AND column_name = 'codigo_proyecto'
      ) THEN
        ALTER TABLE resultados_aprendizaje ADD COLUMN codigo_proyecto VARCHAR(50);
      END IF;
    END
    $$;
  `);

  // Add id_actividad to fase_resultado if missing
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fase_resultado' AND column_name = 'id_actividad'
      ) THEN
        ALTER TABLE fase_resultado ADD COLUMN id_actividad INTEGER REFERENCES fase_actividad(id_actividad) ON DELETE SET NULL;
      END IF;
    END
    $$;
  `);

  // Migrate legacy id_fase if column exists
  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'competencia' AND column_name = 'id_fase'
      ) THEN
        INSERT INTO fase_competencia (id_fase, id_competencia)
        SELECT c.id_fase, c.id_competencia
        FROM competencia c
        WHERE c.id_fase IS NOT NULL
        ON CONFLICT DO NOTHING;
        
        ALTER TABLE competencia DROP COLUMN id_fase;
      END IF;
    END
    $$;
  `);
}
