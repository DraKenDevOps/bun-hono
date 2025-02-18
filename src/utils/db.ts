import { createPool } from "mysql2/promise";
import env from "../env";

const db = createPool({
    connectionLimit: 10000,
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASS,
    port: env.DB_PORT,
    database: env.DB_SCHEMA
});

export default db;
