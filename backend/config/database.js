import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: "localhost", // alamat server MySQL
  user: "root", // ganti dengan user MySQL Anda
  password: "", // isi password MySQL Anda
  database: "web_store_db", // nama database Anda
  connectionLimit: 50, // Tambahkan connectionLimit jika perlu
});

export default db;
