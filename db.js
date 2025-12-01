// db.js
require('dotenv').config();
const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: process.env.DB_PASSWORD,
  database: "testdb",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = db;
