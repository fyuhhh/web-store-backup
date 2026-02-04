import express from "express";
import db from "../config/database.js";

import { updatePRStatus } from '../utils/statusHelper.js';
import { logActivity } from '../utils/activityLogger.js';


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

// GET Next PR Number
router.get("/next-number", async (req, res, next) => {
  try {
    const { id_skema, tanggalPR } = req.query;

    if (!id_skema || !tanggalPR) {
      return res.status(400).json({ message: "id_skema and tanggalPR required" });
    }

    // Determine Schema Code
    let skemaCode = "PRQ"; // Default fallback (Pentacity)
    // Mapping based on DB check: 2 -> E-WALK, 1 -> PRQ (Pentacity)
    if (String(id_skema) === "2" || String(id_skema).toLowerCase() === "ewalk") {
      skemaCode = "E-WALK";
    } else {
      skemaCode = "PRQ";
    }

    // Parse Date
    const d = new Date(tanggalPR);
    if (isNaN(d.getTime())) {
      return res.status(400).json({ message: "Invalid date" });
    }

    const yearFull = d.getFullYear();
    const yearShort = String(yearFull).substring(2); // 26
    const monthIndex = d.getMonth(); // 0-11

    // Roman Month Map
    const romanMonths = [
      "I", "II", "III", "IV", "V", "VI",
      "VII", "VIII", "IX", "X", "XI", "XII"
    ];
    const monthRoman = romanMonths[monthIndex];

    // Pattern: PR/[CODE]/[YY]/[ROMAN]/%
    // e.g., PR/E-WALK/26/I/%
    const pattern = `PR/${skemaCode}/${yearShort}/${monthRoman}/%`;

    // Query matching PRs
    const [rows] = await db.query(
      "SELECT noPR FROM pr WHERE noPR LIKE ? ORDER BY LENGTH(noPR) DESC, noPR DESC LIMIT 1",
      [pattern]
    );

    let nextSeq = 1;
    if (rows.length > 0) {
      const lastNoPR = rows[0].noPR;
      // Extract last part
      const parts = lastNoPR.split("/");
      const lastSeqStr = parts[parts.length - 1];
      const lastSeq = parseInt(lastSeqStr, 10);
      if (!isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    }

    const padLength = skemaCode === "PRQ" ? 5 : 3;
    const nextSeqStr = String(nextSeq).padStart(padLength, "0");
    const nextNoPR = `PR/${skemaCode}/${yearShort}/${monthRoman}/${nextSeqStr}`;

    res.json({ nextNoPR });
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

    // Log Activity (View PR) - Only if it's a real user request (req.user logic might need enhancement or client passes headers)
    // For now we assume req might have user info if middleware was better, but let's try to capture ip
    // actually, logActivity handles missing user gracefully
    logActivity(req, {
      action_type: 'VIEW_PR',
      entity_id: row.noPR,
      details: { id_PR: row.id_PR },
      status: 'INFO'
    });

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
      estimasipo,
      dibuatOleh,
      status,
      plan,
      noMR,
    } = req.body;

    // Basic Validation
    if (!noPR) return res.status(400).json({ message: "No PR is required" });
    if (!tanggalPR) return res.status(400).json({ message: "Tanggal PR is required" });

    // --- Check Duplicate No PR ---
    const [[existingPR]] = await db.query("SELECT id_PR FROM pr WHERE noPR = ?", [noPR]);
    if (existingPR) {
      return res.status(400).json({ message: "Nomor PR telah digunakan" });
    }

    // Auto-determine Plan if not provided (fallback)
    let finalPlan = plan;
    if (!finalPlan) {
      finalPlan = determinePlan(tanggalPR);
    }

    // Auto-calculate Target PO (3 working days)
    const calculatedEstimasipo = await calculateTargetPODate(tanggalPR);

    const [result] = await db.query(
      `INSERT INTO pr(noPR, tanggalPR, id_divisi, id_urgensi, id_skema, plan, estimasipo, dibuatOleh, status, noMR)
VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        noMR || null,
      ]
    );

    const insertId = result.insertId;
    const [[newRow]] = await db.query("SELECT * FROM pr WHERE id_PR = ?", [insertId]);
    if (newRow) {
      newRow.tanggalPR = formatDate(newRow.tanggalPR);
      newRow.estimasipo = formatDateDDMMYYYY(newRow.estimasipo);
      newRow.createdAt = formatDate(newRow.createdAt);
      newRow.createdAt = formatDate(newRow.createdAt);
    }

    // Log Activity
    logActivity(req, {
      action_type: 'CREATE_PR',
      entity_id: noPR,
      details: { id_PR: insertId, amount: newRow?.total || 0, dibuatOleh },
      status: 'SUCCESS'
    });

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
      noMR,
    } = req.body;

    // Validate minimal requirements
    if (!noPR) return res.status(400).json({ message: "No PR is required" });
    if (!tanggalPR) return res.status(400).json({ message: "Tanggal PR is required" });

    // --- Check Duplicate No PR (exclude current ID) ---
    const [[existingPR]] = await db.query("SELECT id_PR FROM pr WHERE noPR = ? AND id_PR != ?", [noPR, id]);
    if (existingPR) {
      return res.status(400).json({ message: "Nomor PR telah digunakan" });
    }

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
  status = ?,
  noMR = ?
    WHERE id_PR = ? `,
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
        noMR || null,
        id,
      ]
    );

    const [[updatedRow]] = await db.query("SELECT * FROM pr WHERE id_PR = ?", [id]);
    if (updatedRow) {
      updatedRow.tanggalPR = formatDate(updatedRow.tanggalPR);
      updatedRow.estimasipo = formatDateDDMMYYYY(updatedRow.estimasipo); // Format DD-MM-YYYY
      updatedRow.createdAt = formatDate(updatedRow.createdAt);
      updatedRow.createdAt = formatDate(updatedRow.createdAt);
    }

    // Log Activity
    logActivity(req, {
      action_type: 'UPDATE_PR',
      entity_id: noPR,
      details: { id_PR: id, changes: req.body },
      status: 'SUCCESS'
    });

    res.json(updatedRow);
  } catch (err) {
    next(err);
  }
});

// DELETE PR
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if any item has been processed (jumlah < originalJumlah)
    const [items] = await db.query("SELECT * FROM pr_item WHERE id_PR = ?", [id]);
    const processedItem = items.find(
      (item) => parseFloat(item.jumlah) < parseFloat(item.originalJumlah)
    );

    if (processedItem) {
      return res.status(400).json({
        message: "Tidak dapat menghapus PR yang sudah diproses (sebagian/penuh).",
      });
    }

    await db.query("DELETE FROM pr_item WHERE id_PR = ?", [id]);
    await db.query("DELETE FROM pr WHERE id_PR = ?", [id]);

    // Log Activity
    logActivity(req, {
      action_type: 'DELETE_PR',
      entity_id: id,
      details: {},
      status: 'SUCCESS'
    });

    res.json({ message: "PR deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;

