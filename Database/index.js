import express from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
app.use(express.json());
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
});
app.get('/', async (req, res) => {
    const result = await pool.query('SELECT NOW()');
    res.json(result.rows);
});
app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});
//# sourceMappingURL=index.js.map