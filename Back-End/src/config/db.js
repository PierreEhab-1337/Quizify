import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config({
    path: ".env"
});

const pool = new Pool({
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    database: process.env.PG_DATABASE,
    ssl: {
        rejectUnauthorized: false
    }
});

async function withTransaction(callback) {
    const client = await pool.connect();
    try{
        await client.query("BEGIN");
        const result = await callback(client);
        await client.query("COMMIT");
        return result;
    }
    catch(e){
        await client.query("ROLLBACK");
        throw e;
    }
    finally{
        client.release();
    }
}

export default {
    query: (text, params) => pool.query(text, params),
    withTransaction
};