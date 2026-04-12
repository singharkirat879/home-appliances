const mysql = require("mysql2");

// create connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",        // your mysql username
  password: "",
  database: "homeease"
});

// connect
db.connect((err) => {
  if (err) {
    console.log("DB connection failed:", err);
  } else {
    console.log("Connected to MySQL");
  }
});

module.exports = db;