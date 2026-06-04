import mysql from 'mysql2/promise';
import fs from 'fs';

async function main() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'web_store_db'
    });

    try {
        const results = {};
        
        const [pr] = await connection.execute('SELECT * FROM pr WHERE noPR = ?', ['PR/PRQ/26/III/00057']);
        results.pr = pr;

        if (pr.length > 0) {
            const id_PR = pr[0].id_PR;
            const [items] = await connection.execute('SELECT * FROM pr_item WHERE id_PR = ?', [id_PR]);
            results.items = items;

            for (const item of items) {
                const [poItems] = await connection.execute('SELECT * FROM po_item WHERE id_PRItem = ?', [item.id_PRItem]);
                item.poItems = poItems;

                for (const poItem of poItems) {
                    const [btbItems] = await connection.execute('SELECT * FROM btb_item WHERE id_POItem = ?', [poItem.id_POItem]);
                    poItem.btbItems = btbItems;
                }
            }
        }
        
        fs.writeFileSync('check_pr_57_result.json', JSON.stringify(results, null, 2));
        console.log("Success: Results saved to check_pr_57_result.json");
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

main();
