import XLSX from 'xlsx';
const wb = XLSX.readFile('C:\\Users\\ontime\\Downloads\\Tickets_2026-10-05_1231.xlsx');
const rows = XLSX.utils.sheet_to_json(wb.Sheets['Тикетүүд'], { header: 1, raw: false, defval: '' });
const header = rows[0];
const idx = (n) => header.indexOf(n);
const I = { tnum: idx('Ticket дугаар'), type: idx('Засварын төрөл') };
const data = rows.slice(1).filter(r => r[I.tnum]);

const byProdCat = {};
for (const d of data) {
  const full = (d[I.type]||'').trim();
  if (!full) continue;
  const parts = full.split(' - ').map(s=>s.trim());
  const prod = parts[0] || '(none)';
  const topcat = parts[1] || prod;
  const subcat = parts.slice(2).join(' - ') || '(дэд ангилалгүй)';
  const key = prod + '|' + topcat;
  if (!byProdCat[key]) byProdCat[key] = { total: 0, subs: {} };
  byProdCat[key].total++;
  byProdCat[key].subs[subcat] = (byProdCat[key].subs[subcat]||0) + 1;
}

const PROD_LABEL = { MBPlus: 'MPLUS', Pro: 'PROPOS', MPos: 'MPOS', Loan: 'Зээл', Lite: 'Lite' };
const targets = ['Pro|Мэдээлэл','Pro|Засвар','Pro|Сургалт','Pro|Алдаа','Pro|Төлбөрт үйлчилгээ',
  'MBPlus|Мэдээлэл','MBPlus|Сургалт','MBPlus|Засвар','MBPlus|Алдаа',
  'MPos|Мэдээлэл','MPos|Засвар','MPos|Алдаа','MPos|Сургалт'];

for (const key of targets) {
  const v = byProdCat[key];
  if (!v) { console.log(key, '-- none'); continue; }
  const [prod, cat] = key.split('|');
  const sorted = Object.entries(v.subs).sort((a,b)=>b[1]-a[1]);
  console.log(`\n${PROD_LABEL[prod]} / ${cat} (${v.total}):`);
  sorted.slice(0,8).forEach(([s,c]) => console.log(`  ['${s}', ${(c/v.total*100).toFixed(0)}],  // ${c}`));
}
