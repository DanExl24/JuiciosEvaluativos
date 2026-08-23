import type { Pool } from 'pg';
import { pool as defaultPool } from '../config/db.ts';

export async function ensureSchemaCompatibility(poolParam?: Pool) {
  const pool = poolParam || defaultPool;

  // 1. Crear tablas base si la base de datos es nueva
  await pool.query(`
    CREATE TABLE IF NOT EXISTS programa (
      id_programa SERIAL PRIMARY KEY,
      codigo VARCHAR(50) NOT NULL UNIQUE,
      nombre TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS formacion (
      id_formacion SERIAL PRIMARY KEY,
      ficha VARCHAR(50) NOT NULL UNIQUE,
      id_programa INTEGER NOT NULL REFERENCES programa(id_programa) ON DELETE CASCADE,
      fecha_inicio DATE,
      fecha_fin DATE,
      estado VARCHAR(50)
    );

    CREATE TABLE IF NOT EXISTS fases (
      id_fase SERIAL PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      id_programa INTEGER NOT NULL REFERENCES programa(id_programa) ON DELETE CASCADE,
      actividad TEXT,
      CONSTRAINT unique_fases_nombre_programa UNIQUE (nombre, id_programa)
    );

    CREATE TABLE IF NOT EXISTS competencia (
      id_competencia SERIAL PRIMARY KEY,
      codigo VARCHAR(50) NOT NULL,
      codigo_juicio VARCHAR(50),
      codigo_proyecto VARCHAR(50),
      nombre TEXT NOT NULL,
      id_programa INTEGER NOT NULL REFERENCES programa(id_programa) ON DELETE CASCADE,
      CONSTRAINT unique_competencia_codigo_programa UNIQUE (codigo, id_programa)
    );

    CREATE TABLE IF NOT EXISTS resultados_aprendizaje (
      id_resultado SERIAL PRIMARY KEY,
      codigo VARCHAR(50) NOT NULL,
      codigo_juicio VARCHAR(50),
      codigo_proyecto VARCHAR(50),
      detalle TEXT NOT NULL,
      id_competencia INTEGER NOT NULL REFERENCES competencia(id_competencia) ON DELETE CASCADE,
      CONSTRAINT unique_resultado_codigo_competencia UNIQUE (codigo, id_competencia)
    );

    CREATE TABLE IF NOT EXISTS aprendiz (
      id_aprendiz SERIAL PRIMARY KEY,
      documento VARCHAR(50) NOT NULL,
      tipo_documento VARCHAR(20),
      nombres VARCHAR(100) NOT NULL,
      apellidos VARCHAR(100) NOT NULL,
      estado VARCHAR(50),
      id_formacion INTEGER NOT NULL REFERENCES formacion(id_formacion) ON DELETE CASCADE,
      CONSTRAINT unique_aprendiz_documento_formacion UNIQUE (documento, id_formacion)
    );

    CREATE TABLE IF NOT EXISTS funcionario (
      id_funcionario SERIAL PRIMARY KEY,
      documento VARCHAR(50) UNIQUE,
      nombres VARCHAR(100),
      apellidos VARCHAR(100)
    );

    CREATE TABLE IF NOT EXISTS juicios_evaluativos (
      id_juicio SERIAL PRIMARY KEY,
      id_aprendiz INTEGER NOT NULL REFERENCES aprendiz(id_aprendiz) ON DELETE CASCADE,
      id_resultado INTEGER NOT NULL REFERENCES resultados_aprendizaje(id_resultado) ON DELETE CASCADE,
      id_funcionario INTEGER REFERENCES funcionario(id_funcionario) ON DELETE SET NULL,
      estado VARCHAR(50) NOT NULL,
      fecha TIMESTAMP WITH TIME ZONE,
      CONSTRAINT uq_juicio_aprendiz_resultado UNIQUE (id_aprendiz, id_resultado)
    );
  `);

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

  // Backfill fase_actividad from fases.actividad if any phases have actividad text but no rows in fase_actividad
  const existingFases = await pool.query(`
    SELECT f.id_fase, f.actividad, f.nombre
    FROM fases f
    WHERE f.actividad IS NOT NULL AND f.actividad <> ''
      AND NOT EXISTS (
        SELECT 1 FROM fase_actividad fa WHERE fa.id_fase = f.id_fase
      )
  `);

  for (const f of existingFases.rows) {
    const rawAct = f.actividad as string;
    // Split by newline or ' / ' or number pattern
    const lines = rawAct.split(/\r?\n|\s*\/\s*/).map((s: string) => s.trim()).filter(Boolean);
    const actTexts: string[] = [];

    for (const line of lines) {
      if (line) actTexts.push(line);
    }

    for (const actText of actTexts) {
      const numMatch = actText.match(/^(\d+)/);
      const numero = numMatch && numMatch[1] ? parseInt(numMatch[1], 10) : null;
      await pool.query(`
        INSERT INTO fase_actividad (id_fase, numero, descripcion)
        VALUES ($1, $2, $3)
        ON CONFLICT (id_fase, descripcion) DO UPDATE SET numero = EXCLUDED.numero
      `, [f.id_fase, numero, actText]);
    }
  }

  // Backfill fase_resultado.id_actividad smartly
  await pool.query(`
    -- First, default single-activity phases to their only activity
    UPDATE fase_resultado fr
    SET id_actividad = sub.only_act_id
    FROM (
      SELECT fa.id_fase, MIN(fa.id_actividad) as only_act_id
      FROM fase_actividad fa
      GROUP BY fa.id_fase
      HAVING COUNT(fa.id_actividad) = 1
    ) sub
    WHERE fr.id_fase = sub.id_fase;

    -- Second, for multi-activity phases (like ANALISIS):
    -- Assign Induccion to Actividad 1
    UPDATE fase_resultado fr
    SET id_actividad = act1.id_actividad
    FROM fase_actividad act1, resultados_aprendizaje r, competencia c
    WHERE fr.id_resultado = r.id_resultado
      AND r.id_competencia = c.id_competencia
      AND fr.id_fase = act1.id_fase 
      AND (act1.numero = 1 OR act1.descripcion ILIKE '%INDUCCI%')
      AND (c.nombre ILIKE '%INDUCCI%' OR c.codigo_juicio = '36182' OR c.codigo_proyecto = '240201530' OR c.codigo = '36182');

    -- Assign non-induccion in multi-activity phases to Actividad 2
    UPDATE fase_resultado fr
    SET id_actividad = act2.id_actividad
    FROM fase_actividad act2, resultados_aprendizaje r, competencia c
    WHERE fr.id_resultado = r.id_resultado
      AND r.id_competencia = c.id_competencia
      AND fr.id_fase = act2.id_fase 
      AND (act2.numero = 2 OR NOT (act2.numero = 1 OR act2.descripcion ILIKE '%INDUCCI%'))
      AND NOT (c.nombre ILIKE '%INDUCCI%' OR c.codigo_juicio = '36182' OR c.codigo_proyecto = '240201530' OR c.codigo = '36182');
  `);
}
