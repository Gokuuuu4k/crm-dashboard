import XLSX from 'xlsx';
import fs from 'fs';
const READ = (path, sheet) => {
  const wb = XLSX.readFile(path);
  const sn = sheet || wb.SheetNames[0];
  return XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, raw: false, defval: '' });
};
const DL = 'C:\\Users\\ontime\\Downloads\\';
const rows = READ(DL + 'Repairs_2026-10-05_ALL.xlsx');
const h = rows[0];
const idx = (n) => h.indexOf(n);
const I = {
  id: idx('№ (Id)'), reg: idx('Регистер'), issue: idx('Асуудлын төрөл'), phone: idx('Утасны дугаар'),
  regDate: idx('Бүртгэгдсэн огноо'), closeDate: idx('Хаагдсан огноо'), regAgent: idx('Бүртгэсэн ажилтан'),
  status: idx('Төлөв'), anydesk: idx('AnyDesk'), csat: idx('Хэрэглэгчийн хандлага'), sec: idx('Зарцуулсан хугацаа'),
  solvedAgent: idx('Шийдсэн ажилтан'), product: idx('Бүтээгдэхүүний төрөл'), channel: idx('Харилцсан суваг'),
};
const data = rows.slice(1).map(r => ({
  id: r[I.id], issue: r[I.issue], regDate: r[I.regDate], status: r[I.status],
  regAgent: r[I.regAgent], solvedAgent: r[I.solvedAgent], product: r[I.product], channel: r[I.channel],
  sec: parseFloat(r[I.sec]) || 0, csat: parseFloat(r[I.csat]) || 0,
})).filter(d => d.id);

console.log('Total repair tickets:', data.length);
console.log('Date range:', data.map(d=>d.regDate).sort()[0], '..', data.map(d=>d.regDate).sort().slice(-1)[0]);

const statusCounts = {};
for (const d of data) statusCounts[d.status] = (statusCounts[d.status] || 0) + 1;
console.log('\nStatus counts:', statusCounts);

const resolved = statusCounts['Шийдэгдсэн'] || 0;
const unresolved = statusCounts['Шийдэгдээгүй'] || 0;
const transferred = (statusCounts['Шилжүүлсэн'] || 0) + (statusCounts['Шилжүүлсэн-Шийдсэн'] || 0);
console.log(`\nresolved=${resolved} unresolved=${unresolved} transferred=${transferred} (of which transferred-resolved=${statusCounts['Шилжүүлсэн-Шийдсэн']||0})`);

// top issue types (top-level category before " - ")
const issueCat = {};
for (const d of data) {
  const cat = (d.issue || '').split(' - ')[0].trim() || '(none)';
  issueCat[cat] = (issueCat[cat] || 0) + 1;
}
console.log('\nTop issue categories:', Object.entries(issueCat).sort((a,b)=>b[1]-a[1]));

// transfer receivers = Бүртгэсэн ажилтан on Шилжүүлсэн* rows
const transferRows = data.filter(d => d.status === 'Шилжүүлсэн' || d.status === 'Шилжүүлсэн-Шийдсэн');
const receivers = {};
for (const d of transferRows) receivers[d.regAgent] = (receivers[d.regAgent] || 0) + 1;
console.log('\nTransfer receivers (Бүртгэсэн ажилтан on transferred tickets):', receivers);

// tickets resolved per agent (Шийдсэн ажилтан, count of Шийдэгдсэн + Шилжүүлсэн-Шийдсэн rows)
const solvedCount = {};
for (const d of data) {
  if (d.status === 'Шийдэгдсэн' || d.status === 'Шилжүүлсэн-Шийдсэн') {
    solvedCount[d.solvedAgent] = (solvedCount[d.solvedAgent] || 0) + 1;
  }
}
console.log('\nTickets solved per agent:', solvedCount);

// CSAT availability check
const csatVals = data.map(d => d.csat).filter(v => v > 0);
console.log('\nRepairs CSAT (Хэрэглэгчийн хандлага) non-zero count:', csatVals.length, 'avg:', csatVals.length ? (csatVals.reduce((a,b)=>a+b,0)/csatVals.length).toFixed(2) : 'n/a');

fs.writeFileSync('repairsdata.json', JSON.stringify({ data, statusCounts, resolved, unresolved, transferred, issueCat, receivers, solvedCount }, null, 1));
console.log('\nWrote repairsdata.json');
