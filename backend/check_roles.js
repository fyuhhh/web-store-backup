import db from './config/database.js';

const checkRoles = async () => {
    try {
        const [roles] = await db.query("SELECT * FROM peran");
        console.log("Current Roles:");
        console.log(JSON.stringify(roles, null, 2));
        process.exit(0);
    } catch (error) {
        console.error("Error fetching roles:", error);
        process.exit(1);
    }
};

checkRoles();
