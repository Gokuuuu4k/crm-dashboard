import XLSX from 'xlsx';
const wb = XLSX.readFile('C:\\Users\\ontime\\Downloads\\Tickets_2026-10-05_0821.xlsx');
const rows = XLSX.utils.sheet_to_json(wb.Sheets['Тикетүүд'], { header: 1, raw: false, defval: '' });
const header = rows[0];
const cols = ['Анх үүссэн ticket Тайлбар','Юу хийсэн засвар- Тайлбар','ticket - төлөв','Засварын төрөл','Оролцогчид','Гэрээ'];
for (const c of cols) {
  const idx = header.indexOf(c);
  const nonBlank = rows.slice(1).filter(r => (r[idx]||'').trim() !== '').length;
  console.log(`${c}: ${nonBlank} / ${rows.length-1} non-blank`);
}
// Ач холбогдол distribution (Level 1/2/3)
const iLevel = header.indexOf('Ач холбогдол');
const levelCounts = {};
for (const r of rows.slice(1)) { const v = r[iLevel]||'(blank)'; levelCounts[v]=(levelCounts[v]||0)+1; }
console.log('\nLevel distribution:', levelCounts);
// cross: Törölöv x Level
const iStatus = header.indexOf('Төлөв');
const cross = {};
for (const r of rows.slice(1)) {
  const key = r[iStatus]+'|'+r[iLevel];
  cross[key]=(cross[key]||0)+1;
}
console.log('\nТөлөв x Level:', cross);
