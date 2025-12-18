// db.js
import mysql from "mysql2/promise";

export const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "eduverso_bd",   // MUST match phpMyAdmin
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
