import fs from 'fs';

const raw = fs.readFileSync('C:\\Users\\ontime\\Downloads\\2026-09-28_00-00-00__2026-10-04_23-59-59__SmsRateExport.csv', 'utf8');
// strip BOM, parse simple CSV (quoted fields, no embedded commas in data here)
const lines = raw.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
const parseLine = (l) => l.match(/("([^"]*)"|[^,]*)(,|$)/g).filter(x => x !== '').map(x => x.replace(/,$/, '').replace(/^"|"$/g, ''));
const header = parseLine(lines[0]);
console.log('header:', header);
const iDate = header.indexOf('Мессеж илгээсэн огноо');
const iExt = header.indexOf('Дуудлагын оператор');
const iRate = header.indexOf('Үнэлгээ');

const EXT_NAME = {
  '201': 'Khadaan', '203': 'Zolbayr', '204': 'Tsogbayar', '206': 'Khaliunaa', '207': 'Bayarmaa.T',
  '208': 'Bayarmaa.N', '210': 'Tugssaikhan.G', '212': 'Baasanjargal', '214': 'Saranchimeg',
  '215': 'Soyolzul.Ts', '216': 'Turmandakh.O', '218': 'CRM-Temuulen', '220': 'Otgonbayar.L',
  '222': 'Sumiya.D', '223': 'Ganchimeg.A', '227': 'Nayanjin', '228': 'Bymbatogtokh.T',
};

const rows = lines.slice(1).map(l => {
  const f = parseLine(l);
  return { date: (f[iDate] || '').slice(0, 10), ext: f[iExt], rate: parseInt(f[iRate], 10) || 0 };
}).filter(r => r.date >= '2026-09-28' && r.date <= '2026-10-04');

console.log('Total SMS sent (rows):', rows.length);
const responded = rows.filter(r => r.rate >= 1 && r.rate <= 5);
console.log('Responded:', responded.length);
const avg = responded.length ? (responded.reduce((s, r) => s + r.rate, 0) / responded.length) : 0;
console.log('Average rating:', avg.toFixed(2));

const dist = [0, 0, 0, 0, 0];
for (const r of responded) dist[r.rate - 1]++;
console.log('Distribution [1,2,3,4,5]:', dist);

const days = ['2026-09-28','2026-09-29','2026-09-30','2026-10-01','2026-10-02','2026-10-03','2026-10-04'];
console.log('\nPer-day sat [1,2,3,4,5]:');
for (const d of days) {
  const dayDist = [0,0,0,0,0];
  for (const r of responded.filter(x => x.date === d)) dayDist[r.rate-1]++;
  console.log(` ${d}:`, dayDist, ' sent=', rows.filter(x=>x.date===d).length);
}

console.log('\nPer-agent (by ext) sat:');
const byAgent = {};
for (const r of responded) {
  const name = EXT_NAME[r.ext] || `ext${r.ext}`;
  if (!byAgent[name]) byAgent[name] = { sum: 0, n: 0 };
  byAgent[name].sum += r.rate; byAgent[name].n++;
}
for (const [name, v] of Object.entries(byAgent).sort((a,b)=>b[1].n-a[1].n)) {
  console.log(` ${name}: n=${v.n} avg=${(v.sum/v.n).toFixed(2)}`);
}
