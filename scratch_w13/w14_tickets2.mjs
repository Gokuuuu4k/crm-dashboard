import XLSX from 'xlsx';
const wb = XLSX.readFile('C:\\Users\\ontime\\Downloads\\Tickets_2026-10-12_1130.xlsx');
const rows = XLSX.utils.sheet_to_json(wb.Sheets['Тикетүүд'], { header: 1, raw: false, defval: '' });
const H = rows[0];
const idx = (n) => H.indexOf(n);
const I = {
  status: idx('ticket - төлөв'), tlv: idx('Төлөв'), level: idx('Ач холбогдол'),
  chan: idx('Харилцсан суваг'), part: idx('Оролцогчид'),
  t1: idx('Засварын төрөл 1'), t2: idx('Засварын төрөл 2'), t3: idx('Засварын төрөл 3'), t4: idx('Засварын төрөл 4'),
  created: idx('Үүсгэсэн'), createdDate: idx('Үүсгэсэн огноо'), closed: idx('Хаасан хэрэглэгч'),
};
const all = rows.slice(1).filter(r => r[I.createdDate]);
console.log('total rows with date:', all.length);
const inWeek = all.filter(r => {
  const d = r[I.createdDate].slice(0,10);
  return d >= '2026-10-05' && d <= '2026-10-11';
});
console.log('in W14 (10/05-10/11):', inWeek.length);

const minD = Math.min(...all.map(r=>r[I.createdDate].slice(0,10)));
const maxD = Math.max(...all.map(r=>r[I.createdDate].slice(0,10)));
console.log('date range in file:', minD, maxD);

const statusCounts = {};
inWeek.forEach(r => statusCounts[r[I.status]] = (statusCounts[r[I.status]]||0)+1);
console.log('\nStatus (ticket-төлөв):', statusCounts);

const chanCounts = {};
inWeek.forEach(r => chanCounts[r[I.chan]] = (chanCounts[r[I.chan]]||0)+1);
console.log('\nChannel (Харилцсан суваг):', chanCounts);

const levelCounts = {};
inWeek.forEach(r => levelCounts[r[I.level]] = (levelCounts[r[I.level]]||0)+1);
console.log('\nLevel (Ач холбогдол):', levelCounts);

const prodCounts = {};
inWeek.forEach(r => prodCounts[r[I.t1]] = (prodCounts[r[I.t1]]||0)+1);
console.log('\nProduct (Засварын төрөл 1):', prodCounts);

// top issue combos (t1 - t2 - t3 - t4), skipping empty
const issueCounts = {};
inWeek.forEach(r => {
  const parts = [r[I.t2], r[I.t3], r[I.t4]].filter(Boolean);
  const key = parts.join(' - ') + (parts.length ? ' - ' + r[I.t1] : r[I.t1]);
  issueCounts[key] = (issueCounts[key]||0)+1;
});
console.log('\nTop issues:');
Object.entries(issueCounts).sort((a,b)=>b[1]-a[1]).slice(0,20).forEach(([k,v])=>console.log(` ${v}  ${k}`));

// per-agent ticket creation count
const agentCounts = {};
inWeek.forEach(r => agentCounts[r[I.created]] = (agentCounts[r[I.created]]||0)+1);
console.log('\nPer-agent ticket count (Үүсгэсэн):');
Object.entries(agentCounts).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log(` ${v}  ${k}`));

// transferred recipients - look at "Оролцогчид" field for transferred tickets
const transferred = inWeek.filter(r => r[I.status] === 'Шилжүүлсэн' || r[I.tlv]?.includes('Шилжүүлсэн'));
console.log('\nTransferred count:', transferred.length);
const tlvCounts = {};
inWeek.forEach(r => tlvCounts[r[I.tlv]] = (tlvCounts[r[I.tlv]]||0)+1);
console.log('Tlv (Төлөв) full breakdown:', tlvCounts);

const partCounts = {};
transferred.forEach(r => { if(r[I.part]) partCounts[r[I.part]] = (partCounts[r[I.part]]||0)+1; });
console.log('\nTransfer recipients (Оролцогчид) on transferred tickets:', partCounts);

// unresolved list
const unresolved = inWeek.filter(r => r[I.status] !== 'Шийдэгдсэн');
console.log('\nUnresolved (status != Шийдэгдсэн) count:', unresolved.length);
unresolved.slice(0,60).forEach(r => {
  console.log(` ${r[I.createdDate].slice(0,10)} | ${r[I.created]} | status=${r[I.status]} tlv=${r[I.tlv]} | ${[r[I.t1],r[I.t2],r[I.t3],r[I.t4]].filter(Boolean).join(' - ')}`);
});
