import type { PoolClient } from 'pg';

export async function deleteFormationByFicha(client: PoolClient, ficha: string) {
  const formationResult = await client.query<{ id_formacion: number }>(
    `
      SELECT id_formacion
      FROM formacion
      WHERE ficha_caracterizacion = $1
      LIMIT 1
    `,
    [ficha],
  );

  const formation = formationResult.rows[0];
  if (!formation) {
    return { deleted: false };
  }

  const { id_formacion } = formation;

  await client.query(
    `
      DELETE FROM juicios_evaluativos
      WHERE id_aprendiz IN (
        SELECT id_aprendiz
        FROM aprendiz
        WHERE id_formacion = $1
      )
    `,
    [id_formacion],
  );

  await client.query('DELETE FROM aprendiz WHERE id_formacion = $1', [id_formacion]);
  await client.query('DELETE FROM formacion WHERE id_formacion = $1', [id_formacion]);

  await client.query(
    `
      DELETE FROM fases
      WHERE id_programa IN (
        SELECT p.id_programa
        FROM programa p
        WHERE NOT EXISTS (
          SELECT 1
          FROM formacion f
          WHERE f.id_programa = p.id_programa
        )
      )
    `,
  );

  await client.query(
    `
      DELETE FROM programa p
      WHERE NOT EXISTS (
        SELECT 1
        FROM formacion f
        WHERE f.id_programa = p.id_programa
      )
    `,
  );

  return { deleted: true };
}
