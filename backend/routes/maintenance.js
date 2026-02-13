import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "../data/maintenance.json");

// Helper to read data
const readData = () => {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            return { isActive: false, endTime: "", description: "", exemptedUsers: [] };
        }
        const data = fs.readFileSync(DATA_FILE, "utf8");
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading maintenance data:", error);
        return { isActive: false, endTime: "", description: "", exemptedUsers: [] };
    }
};

// Helper to write data
const writeData = (data) => {
    try {
        const dir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error("Error writing maintenance data:", error);
        return false;
    }
};

// GET status
router.get("/", (req, res) => {
    let data = readData();

    // Check for auto-disable
    if (data.isActive && data.endTime) {
        const end = new Date(data.endTime);
        const now = new Date();
        if (now >= end) {
            // Maintenance expired, auto-disable
            data.isActive = false;
            // Optionally clear description or keep it
            // data.description = ""; 
            // Save the updated status to file so it persists
            writeData(data);
        }
    }

    res.json(data);
});

// POST status (update)
router.post("/", (req, res) => {
    const { isActive, endTime, description, startTime, exemptedUsers } = req.body;

    const newData = {
        isActive: Boolean(isActive),
        endTime: endTime || "",
        startTime: startTime || "", // Add startTime field
        description: description || "",
        exemptedUsers: Array.isArray(exemptedUsers) ? exemptedUsers : []
    };

    if (writeData(newData)) {
        res.json({ message: "Maintenance status updated", data: newData });
    } else {
        res.status(500).json({ message: "Failed to update maintenance status" });
    }
});

export default router;
