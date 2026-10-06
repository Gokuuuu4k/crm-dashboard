import XLSX from 'xlsx';
const files = [
  'Tickets_2026-10-05_0814.xlsx',
  'Tickets_2026-10-05_0817.xlsx',
  'Tickets_2026-10-05_0817 (1).xlsx',
  'Tickets_2026-10-05_0818.xlsx',
  'Tickets_2026-10-05_0821.xlsx',
];
for (const f of files) {
  const path = 'C:\\Users\\ontime\\Downloads\\' + f;
  const wb = XLSX.readFile(path);
  console.log(`\n=== ${f} ===`);
  for (const sn of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, raw: false, defval: '' });
    console.log(` sheet "${sn}": ${rows.length} rows, header: ${JSON.stringify(rows[0])}`);
    if (rows.length > 1) console.log('  row1:', JSON.stringify(rows[1]));
  }
}
