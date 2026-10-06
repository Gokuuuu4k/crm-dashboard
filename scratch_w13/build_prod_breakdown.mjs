import XLSX from 'xlsx';
const wb = XLSX.readFile('C:\\Users\\ontime\\Downloads\\Tickets_2026-10-05_1231.xlsx');
const rows = XLSX.utils.sheet_to_json(wb.Sheets['Тикетүүд'], { header: 1, raw: false, defval: '' });
const header = rows[0];
const idx = (n) => header.indexOf(n);
const I = { tnum: idx('Ticket дугаар'), type: idx('Засварын төрөл') };
const data = rows.slice(1).filter(r => r[I.tnum]);

const PROD_LABEL = { MBPlus: 'MBusiness Plus', Pro: 'ProPOS', MPos: 'Мбанк пос', Loan: 'Зээл', Lite: 'Lite' };

const byProd = {};
for (const d of data) {
  const full = (d[I.type]||'').trim();
  if (!full) continue;
  const parts = full.split(' - ').map(s=>s.trim());
  const prod = parts[0] || '(none)';
  const topcat = parts[1] || prod;
  if (!byProd[prod]) byProd[prod] = { total: 0, cats: {} };
  byProd[prod].total++;
  byProd[prod].cats[topcat] = (byProd[prod].cats[topcat]||0) + 1;
}

const prodOrder = Object.entries(byProd).sort((a,b)=>b[1].total-a[1].total).map(([k])=>k);
console.log('Product totals (desc):', prodOrder.map(p => `${PROD_LABEL[p]||p}=${byProd[p].total}`).join(', '));
console.log('\nPer-product topcat breakdown:');
for (const p of prodOrder) {
  const { total, cats } = byProd[p];
  const sorted = Object.entries(cats).sort((a,b)=>b[1]-a[1]);
  console.log(`\n${PROD_LABEL[p]||p} (${total}):`);
  sorted.forEach(([cat,v]) => console.log(`  ['${cat}', ${(v/total*100).toFixed(1)}],  // ${v}`));
}
