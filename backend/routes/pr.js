
import express from "express";
import db from "../config/database.js";

const router = express.Router();

// Helper: Format date YYYY-MM-DD
function formatDate(tgl) {
  if (!tgl) return null;
  if (typeof tgl === "string" && /^\d{4}-\d{2}-\d{2}$/.test(tgl)) return tgl;
  if (tgl instanceof Date) {
    const yyyy = tgl.getFullYear();
    const mm = String(tgl.getMonth() + 1).padStart(2, "0");
    const dd = String(tgl.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  return tgl;
}

// Helper: Format date DD-MM-YYYY (for Display)
function formatDateDDMMYYYY(tgl) {
  if (!tgl) return null;
  // If already DD-MM-YYYY, return as is
  if (typeof tgl === "string" && /^\d{2}-\d{2}-\d{4}$/.test(tgl)) return tgl;

  let d = tgl;
  if (typeof tgl === "string") {
    d = new Date(tgl);
  }

  if (d instanceof Date && !isNaN(d)) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }
  return tgl;
}

// Helper: Determine Plan/No Plan
function determinePlan(tgl) {
  if (!tgl) return "No Plan";

  let day = 0;
  if (tgl instanceof Date) {
    day = tgl.getDate();
  } else if (typeof tgl === "string") {
    // Expect YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(tgl)) {
      day = parseInt(tgl.split("-")[2], 10);
    } else {
      // Fallback for other string formats or relying on Date parsing (risky for TZ)
      const d = new Date(tgl);
      day = d.getDate();
    }
  }

  // Logic:
  // 6 - 24 -> No Plan
  // 25 - 5 (25..31 & 1..5) -> Plan
  let result = "Plan";
  if (day >= 6 && day <= 24) {
    result = "No Plan";
  }

  return result;
}

// Helper: Calculate Target PO Date (3 working days, skip weekends & holidays)
async function calculateTargetPODate(startDateStr) {
  if (!startDateStr) return null;

  let currentDate = new Date(startDateStr);
  if (isNaN(currentDate.getTime())) {
    return null;
  }

  // Fetch holidays from DB
  let holidays = [];
  try {
    const [rows] = await db.query("SELECT tanggal FROM holidays");
    holidays = rows.map((row) => {
      // Ensure specific string format YYYY-MM-DD
      const d = new Date(row.tanggal);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    });
  } catch (err) {
    console.error("Error fetching holidays:", err);
    // Proceed without holidays if DB fails, to avoid blocking PR creation
  }

  let workingDaysAdded = 0;
  // Target is +3 working days
  // Example:
  // Mon (Start) -> +1 (Tue), +2 (Wed), +3 (Thu) -> Result Thu
  // Fri (Start) -> +1 (Mon), +2 (Tue), +3 (Wed) -> Result Wed (skip Sat/Sun)

  while (workingDaysAdded < 4) {
    // Add 1 day
    currentDate.setDate(currentDate.getDate() + 1);

    const day = currentDate.getDay(); // 0=Sun, 6=Sat
    const yyyy = currentDate.getFullYear();
    const mm = String(currentDate.getMonth() + 1).padStart(2, "0");
    const dd = String(currentDate.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const isWeekend = day === 0 || day === 6;
    const isHoliday = holidays.includes(dateStr);

    if (!isWeekend && !isHoliday) {
      workingDaysAdded++;
    }
  }

  // Format result
  const yyyy = currentDate.getFullYear();
  const mm = String(currentDate.getMonth() + 1).padStart(2, "0");
  const dd = String(currentDate.getDate()).padStart(2, "0");
  const result = `${yyyy}-${mm}-${dd}`;
  return result;
}

// GET all PRs
router.get("/", async (req, res, next) => {
  try {
    const [rows] = await db.query("SELECT * FROM pr ORDER BY createdAt DESC");
    const formatted = rows.map((r) => ({
      ...r,
      tanggalPR: formatDate(r.tanggalPR),
      estimasipo: formatDateDDMMYYYY(r.estimasipo), // Format DD-MM-YYYY
      createdAt: r.createdAt ? formatDate(r.createdAt) : null,
    }));
    res.json(formatted);
  } catch (err) {
    next(err);
  }
});

// GET PR by ID
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const [[row]] = await db.query("SELECT * FROM pr WHERE id_PR = ?", [id]);
    if (!row) return res.status(404).json({ message: "PR tidak ditemukan" });

    row.tanggalPR = formatDate(row.tanggalPR);
    row.estimasipo = formatDateDDMMYYYY(row.estimasipo); // Format DD-MM-YYYY
    row.createdAt = row.createdAt ? formatDate(row.createdAt) : null;
    res.json(row);
  } catch (err) {
    next(err);
  }
});

// CREATE PR
router.post("/", async (req, res, next) => {
  try {
    const {
      noPR,
      tanggalPR,
      id_divisi,
      id_urgensi,
      id_skema,
      estimasipo, // User might send it, but we overwrite/recalc
      dibuatOleh,
      status,
      plan,
    } = req.body;

    // Basic Validation
    if (!noPR) return res.status(400).json({ message: "No PR is required" });
    if (!tanggalPR) return res.status(400).json({ message: "Tanggal PR is required" });

    // Auto-determine Plan if not provided (fallback)
    let finalPlan = plan;
    if (!finalPlan) {
      finalPlan = determinePlan(tanggalPR);
    }

    // Auto-calculate Target PO (3 working days)
    const calculatedEstimasipo = await calculateTargetPODate(tanggalPR);

    const [result] = await db.query(
      `INSERT INTO pr (noPR, tanggalPR, id_divisi, id_urgensi, id_skema, plan, estimasipo, dibuatOleh, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        noPR,
        tanggalPR,
        id_divisi || null,
        id_urgensi || null,
        id_skema || null,
        finalPlan,
        calculatedEstimasipo || estimasipo || null, // Use calculated, fallback to user input
        dibuatOleh || null,
        status || "Draft",
      ]
    );

    const insertId = result.insertId;
    const [[newRow]] = await db.query("SELECT * FROM pr WHERE id_PR = ?", [insertId]);
    if (newRow) {
      newRow.tanggalPR = formatDate(newRow.tanggalPR);
      newRow.estimasipo = formatDateDDMMYYYY(newRow.estimasipo);
      newRow.createdAt = formatDate(newRow.createdAt);
    }
    res.status(201).json(newRow);
  } catch (err) {
    next(err);
  }
});

// UPDATE PR
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      noPR,
      tanggalPR,
      id_divisi,
      id_urgensi,
      id_skema,
      estimasipo,
      dibuatOleh,
      status,
      plan,
    } = req.body;

    // Validate minimal requirements
    if (!noPR) return res.status(400).json({ message: "No PR is required" });
    if (!tanggalPR) return res.status(400).json({ message: "Tanggal PR is required" });

    // Auto-determine Plan if not provided (fallback)
    let finalPlan = plan;
    if (!finalPlan) {
      finalPlan = determinePlan(tanggalPR);
    }

    // Recalculate Target PO if tanggalPR changes or is present
    // We always recalculate to ensure consistency unless explicitly disabled, 
    // but here we assume automation is always desired.
    const calculatedEstimasipo = await calculateTargetPODate(tanggalPR);

    await db.query(
      `UPDATE pr SET 
        noPR = ?, 
        tanggalPR = ?, 
        id_divisi = ?, 
        id_urgensi = ?, 
        id_skema = ?, 
        plan = ?, 
        estimasipo = ?, 
        dibuatOleh = ?, 
        status = ?
       WHERE id_PR = ?`,
      [
        noPR,
        tanggalPR,
        id_divisi || null,
        id_urgensi || null,
        id_skema || null,
        finalPlan,
        calculatedEstimasipo || estimasipo || null,
        dibuatOleh || null,
        status || "Draft",
        id,
      ]
    );

    const [[updatedRow]] = await db.query("SELECT * FROM pr WHERE id_PR = ?", [id]);
    if (updatedRow) {
      updatedRow.tanggalPR = formatDate(updatedRow.tanggalPR);
      updatedRow.estimasipo = formatDate(updatedRow.estimasipo);
      updatedRow.createdAt = formatDate(updatedRow.createdAt);
    }
    res.json(updatedRow);
  } catch (err) {
    next(err);
  }
});



// DELETE PR
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const [[row]] = await db.query("SELECT * FROM pr WHERE id_PR = ?", [id]);
    if (!row) return res.status(404).json({ message: "PR tidak ditemukan" });

    // Delete items first
    await db.query("DELETE FROM pr_item WHERE id_PR = ?", [id]);
    // Delete PR
    await db.query("DELETE FROM pr WHERE id_PR = ?", [id]);

    res.json({ message: "PR berhasil dihapus" });
  } catch (err) {
    next(err);
  }
});

export default router;
