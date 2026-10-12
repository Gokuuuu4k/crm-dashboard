import XLSX from 'xlsx';
const wb = XLSX.readFile('C:\\Users\\ontime\\Downloads\\2026-10-05_00-00-00__2026-10-11_23-59-59.xlsx');
const rows = XLSX.utils.sheet_to_json(wb.Sheets['Sheet1'], { header: 1, raw: false, defval: '' });
const H = rows[0];
const idx = (n) => H.indexOf(n);
const I = { date: idx('Date'), queue: idx('Queue'), caller: idx('CallerID'), disp: idx('Disposition'),
  emp: idx('Employee'), name: idx('Name') };
const CALL_DISP = new Set(['ANSWERED','ABANDONED','TIMEOUT','TRANSFERRED']);
const data = rows.slice(1).filter(r => r[I.date] && CALL_DISP.has(r[I.disp]));
console.log('total call rows:', data.length);

const hourCounts = {};
data.forEach(r => { const h = r[I.date].slice(11,13); hourCounts[h]=(hourCounts[h]||0)+1; });
console.log('\nhour distribution:');
Object.entries(hourCounts).sort((a,b)=>a[0].localeCompare(b[0])).forEach(([h,c])=>console.log(` ${h}:00  ${c}`));

const in0819 = data.filter(r => { const h = parseInt(r[I.date].slice(11,13)); return h>=8 && h<=19; });
console.log('\nwithin 08-19:', in0819.length, 'of', data.length, `(${(in0819.length/data.length*100).toFixed(1)}%)`);

// per-day x queue breakdown (08-19 only, matching prior week convention)
const QMAP = { 'Technical support':'ts', 'Mbusiness Plus Cass':'mb', 'MBank pos guide':'pos', 'Business loan':'loan' };
const byDay = {};
in0819.forEach(r => {
  const day = r[I.date].slice(0,10);
  const q = QMAP[r[I.queue]] || 'other';
  if (!byDay[day]) byDay[day] = { ts:0, mb:0, pos:0, loan:0, other:0, a:0, uniqSet:new Set() };
  byDay[day][q]++;
  if (r[I.disp]==='ANSWERED') byDay[day].a++;
  byDay[day].uniqSet.add(r[I.caller]);
});
console.log('\nPer-day queue breakdown (08-19):');
Object.keys(byDay).sort().forEach(d => {
  const b = byDay[d];
  console.log(` ${d}: ts=${b.ts} mb=${b.mb} pos=${b.pos} loan=${b.loan} other=${b.other} total=${b.ts+b.mb+b.pos+b.loan+b.other} answered=${b.a} uniq=${b.uniqSet.size}`);
});

const grandA = Object.values(byDay).reduce((s,b)=>s+b.a,0);
const grandTot = Object.values(byDay).reduce((s,b)=>s+b.ts+b.mb+b.pos+b.loan+b.other,0);
console.log('\nGRAND total (08-19):', grandTot, 'answered:', grandA, 'rate:', (grandA/grandTot*100).toFixed(1)+'%');

// hourly stacked answered/abandoned/timeout for 08-19
const byHour = {};
in0819.forEach(r => {
  const h = r[I.date].slice(11,13);
  if (!byHour[h]) byHour[h] = { ans:0, aband:0, timeout:0, transferred:0 };
  if (r[I.disp]==='ANSWERED') byHour[h].ans++;
  else if (r[I.disp]==='ABANDONED') byHour[h].aband++;
  else if (r[I.disp]==='TIMEOUT') byHour[h].timeout++;
  else if (r[I.disp]==='TRANSFERRED') byHour[h].transferred++;
});
console.log('\nHourly (08-19) ans/aband/timeout/transferred:');
Object.keys(byHour).sort().forEach(h => {
  const b = byHour[h];
  console.log(` ${h}: ${b.ans}/${b.aband}/${b.timeout}/${b.transferred}`);
});
