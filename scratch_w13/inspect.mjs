import XLSX from 'xlsx';

const files = {
  calllog: 'C:\\Users\\ontime\\Downloads\\2026-09-28_00-00-00__2026-10-04_23-59-59.xlsx',
  repairs: 'C:\\Users\\ontime\\Downloads\\Repairs_2026-10-05_ALL.xlsx',
  tickets: 'C:\\Users\\ontime\\Downloads\\Tickets_2026-10-05_0821.xlsx',
};

for (const [name, path] of Object.entries(files)) {
  console.log(`\n===== ${name} (${path}) =====`);
  const wb = XLSX.readFile(path);
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
    console.log(`  sheet "${sheetName}": ${rows.length} rows`);
    console.log('  header:', JSON.stringify(rows[0]));
    console.log('  row1:', JSON.stringify(rows[1]));
    console.log('  row2:', JSON.stringify(rows[2]));
  }
}
