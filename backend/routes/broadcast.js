import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "../data/broadcast.json");

// Helper to read data
const readData = () => {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            // Default state
            return { isActive: false, endTime: "", message: "" };
        }
        const data = fs.readFileSync(DATA_FILE, "utf8");
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading broadcast data:", error);
        return { isActive: false, endTime: "", message: "" };
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
        console.error("Error writing broadcast data:", error);
        return false;
    }
};

// GET status
router.get("/", (req, res) => {
    let data = readData();

    // Check for auto-disable if active
    if (data.isActive && data.endTime) {
        const end = new Date(data.endTime);
        const now = new Date();
        if (now >= end) {
            // Expired
            data.isActive = false;
            writeData(data);
        }
    }

    res.json(data);
});

// POST status (update)
router.post("/", (req, res) => {
    const { isActive, endTime, message } = req.body;

    const newData = {
        isActive: Boolean(isActive),
        endTime: endTime || "",
        message: message || ""
    };

    if (writeData(newData)) {
        res.json({ message: "Broadcast status updated", data: newData });
    } else {
        res.status(500).json({ message: "Failed to update broadcast status" });
    }
});

export default router;
