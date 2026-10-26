
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const { DB_USER, DB_PORT, DB_HOST, DB_PASSWORD, DB_NAME } = process.env;

export const pool = mysql.createPool({
    user: DB_USER || "root",
    password: DB_PASSWORD || "",
    database: DB_NAME || "CarWeb",
    host: DB_HOST || "localhost",
    port: Number(DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

export const dbConnection = pool;
