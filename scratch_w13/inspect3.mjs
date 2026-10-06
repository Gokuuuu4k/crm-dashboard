import XLSX from 'xlsx';
const wb = XLSX.readFile('C:\\Users\\ontime\\Downloads\\Tickets_2026-10-05_0821.xlsx');
const sheet = wb.Sheets['Тикетүүд'];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
const header = rows[0];
console.log(JSON.stringify(header, null, 1));
for (let i = 1; i <= 5; i++) {
  console.log(`\nrow ${i}:`);
  header.forEach((h, j) => console.log(`  ${h}: ${JSON.stringify(rows[i][j])}`));
}
// check for any text containing "Шийдэгдсэн" or "Шилжүүлсэн" anywhere in columns
const repairCol = header.indexOf('Юу хийсэн засвар- Тайлбар');
const vals = new Set();
for (const r of rows.slice(1)) {
  const v = (r[repairCol] || '').trim();
  if (v && v.length < 40) vals.add(v);
}
console.log('\nshort distinct values in "Юу хийсэн засвар- Тайлбар" col:', [...vals].slice(0, 20));
