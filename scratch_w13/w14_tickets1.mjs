import XLSX from 'xlsx';
const wb = XLSX.readFile('C:\\Users\\ontime\\Downloads\\Tickets_2026-10-12_1130.xlsx');
console.log('Sheets:', wb.SheetNames);
for (const name of wb.SheetNames) {
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: false, defval: '' });
  console.log(`\n=== ${name} === rows: ${rows.length}`);
  console.log('header:', JSON.stringify(rows[0]));
  console.log('row1:', JSON.stringify(rows[1]));
  console.log('row2:', JSON.stringify(rows[2]));
}
