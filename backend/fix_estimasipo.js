import db from "./config/database.js";

async function calculateTargetPODate(startDateStr, holidays) {
  if (!startDateStr) return null;

  let currentDate = new Date(startDateStr);
  if (isNaN(currentDate.getTime())) {
    return null;
  }

  let workingDaysAdded = 0;
  // Target is +3 working days
  while (workingDaysAdded < 3) {
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
  return `${yyyy}-${mm}-${dd}`;
}

async function fixEstimasipo() {
  try {
    let holidays = [];
    try {
      const [rows] = await db.query("SELECT tanggal FROM holidays");
      holidays = rows.map((row) => {
        const d = new Date(row.tanggal);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      });
    } catch (err) {
      console.error("Error fetching holidays:", err);
    }

    const [prs] = await db.query("SELECT id_PR, noPR, tanggalPR, estimasipo FROM pr");
    console.log(`Found ${prs.length} PRs. Starting migration...`);

    let updatedCount = 0;
    for (const pr of prs) {
      if (!pr.tanggalPR) continue;
      
      const newEstimasipo = await calculateTargetPODate(pr.tanggalPR, holidays);
      
      await db.query("UPDATE pr SET estimasipo = ? WHERE id_PR = ?", [newEstimasipo, pr.id_PR]);
      updatedCount++;
    }
    
    console.log(`Successfully updated ${updatedCount} PRs with 3 days target.`);
    process.exit(0);

  } catch (err) {
    console.error("Error migrating estimasipo:", err);
    process.exit(1);
  }
}

fixEstimasipo();
