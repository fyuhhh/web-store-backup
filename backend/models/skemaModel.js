import db from "../config/database.js";

const Skema = {
  getAll: (callback) => {
    db.query("SELECT * FROM skema", callback);
  },

  create: (data, callback) => {
    db.query("INSERT INTO skema (skema) VALUES (?)", [data.skema], callback);
  },

  update: (id, data, callback) => {
    db.query(
      "UPDATE skema SET skema = ? WHERE id_skema = ?",
      [data.skema, id],
      callback
    );
  },

  delete: (id, callback) => {
    db.query("DELETE FROM skema WHERE id_skema = ?", [id], callback);
  },
};

export default Skema;
