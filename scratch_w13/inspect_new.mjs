import XLSX from 'xlsx';
const wb = XLSX.readFile('C:\\Users\\ontime\\Downloads\\Tickets_2026-10-05_1231.xlsx');
console.log('Sheets:', wb.SheetNames);
for (const sn of wb.SheetNames) {
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, raw: false, defval: '' });
  console.log(`\n=== ${sn} === rows: ${rows.length}`);
  console.log('header:', rows[0]);
  console.log('row1:', rows[1]);
  console.log('row2:', rows[2]);
}
