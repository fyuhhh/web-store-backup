import db from "../config/database.js";

const Peran = {
  getAll: (callback) => {
    db.query("SELECT * FROM peran", callback);
  },

  create: (data, callback) => {
    db.query("INSERT INTO peran (peran) VALUES (?)", [data.peran], callback);
  },

  update: (id, data, callback) => {
    db.query(
      "UPDATE peran SET peran = ? WHERE id_peran = ?",
      [data.peran, id],
      callback
    );
  },

  delete: (id, callback) => {
    db.query("DELETE FROM peran WHERE id_peran = ?", [id], callback);
  },
};

export default Peran;
