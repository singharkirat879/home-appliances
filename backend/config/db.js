// Load environment variables
require("dotenv").config();

const mysql = require("mysql2");

// Create a connection pool using environment variables
// A pool is better for production as it handles multiple concurrent users efficiently.
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "homeease",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Verify connection on startup
db.getConnection((err, connection) => {
  if (err) {
    console.log("DB connection failed:", err.message);
  } else {
    console.log(`Connected to MySQL Database (Pool): ${process.env.DB_NAME || "homeease"}`);
    connection.release(); // release back to pool
  }
});

module.exports = db;