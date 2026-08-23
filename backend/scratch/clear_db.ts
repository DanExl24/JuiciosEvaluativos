import { pool } from '../src/config/db.ts';

async function clearDatabase() {
  console.log('Iniciando limpieza de base de datos...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Truncar todas las tablas principales con CASCADE para limpiar llaves foráneas
    await client.query(`
      TRUNCATE TABLE 
        juicios_evaluativos, 
        resultados_aprendizaje, 
        fase_competencia,
        competencia, 
        fases, 
        proyecto_formativo, 
        aprendiz, 
        formacion, 
        programa, 
        funcionario 
      CASCADE
    `);
    
    // Reiniciar secuencias
    await client.query(`
      ALTER SEQUENCE aprendiz_id_aprendiz_seq RESTART WITH 1;
      ALTER SEQUENCE competencia_id_competencia_seq RESTART WITH 1;
      ALTER SEQUENCE formacion_id_formacion_seq RESTART WITH 1;
      ALTER SEQUENCE funcionario_id_funcionario_seq RESTART WITH 1;
      ALTER SEQUENCE juicios_evaluativos_id_juicio_seq RESTART WITH 1;
      ALTER SEQUENCE programa_id_programa_seq RESTART WITH 1;
      ALTER SEQUENCE resultados_aprendizaje_id_resultado_seq RESTART WITH 1;
      ALTER SEQUENCE proyecto_formativo_id_proyecto_seq RESTART WITH 1;
    `);

    await client.query('COMMIT');
    console.log('✅ Base de datos vaciada exitosamente.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error al vaciar la base de datos:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

clearDatabase();
