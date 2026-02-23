const fs = require('fs');

const path = 'c:/web-store/web-store-backup/frontend/app/mr/input/page.tsx';
let text = fs.readFileSync(path, 'utf8');

const part1 = text.split('                                {/* Supplier */}')[0];
const rest1 = text.split('                                {/* Supplier */}')[1];

const supplier_block = '                                {/* Supplier */}' + rest1.split('                                {/* Divisi */}')[0];
const rest2 = rest1.split('                                {/* Divisi */}')[1];

const divisi_block = '                                {/* Divisi */}' + rest2.split('                                {/* Tanggal Pembelian */}')[0];
const rest3 = rest2.split('                                {/* Tanggal Pembelian */}')[1];

let new_text = part1 + divisi_block + supplier_block + '                                {/* Tanggal Pembelian */}' + rest3;
new_text = new_text.replace('className="pt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"', 'className="pt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"');

fs.writeFileSync(path, new_text, 'utf8');
console.log('Done');
