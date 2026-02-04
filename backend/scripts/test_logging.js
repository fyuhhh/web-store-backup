
import db from '../config/database.js';
import { logActivity } from '../utils/activityLogger.js';

// Mock io
const mockIo = {
    emit: (event, data) => console.log(`[MockIo] Emit ${event}:`, data),
    to: (room) => ({
        emit: (event, data) => console.log(`[MockIo] Room ${room} Emit ${event}:`, data)
    })
};

// Initialize logger with mock
import { initLogger } from '../utils/activityLogger.js';
initLogger(mockIo);

async function test() {
    console.log("Testing logging...");
    try {
        const req = {
            ip: '127.0.0.1',
            get: (header) => 'TestScript',
            body: { id_user: 999, nama_pengguna: 'TestUser' }
        };

        await logActivity(req, {
            action_type: 'TEST',
            entity_id: 'TEST_ID',
            details: 'Testing logging script',
            status: 'INFO'
        });

        console.log("Log inserted.");

        const [rows] = await db.query("SELECT * FROM activity_logs WHERE action_type = 'TEST' ORDER BY id DESC LIMIT 1");
        console.log("Fetched log:", rows[0]);

        if (rows.length > 0 && rows[0].details.includes('Testing logging script')) {
            console.log("SUCCESS: Log found in DB.");
        } else {
            console.log("FAILURE: Log not found.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

test();
