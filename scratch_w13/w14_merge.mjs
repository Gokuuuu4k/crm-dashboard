import XLSX from 'xlsx';
const CALL_DISP = new Set(['ANSWERED','ABANDONED','TIMEOUT','TRANSFERRED']);

function loadMain() {
  const wb = XLSX.readFile('C:\\Users\\ontime\\Downloads\\2026-10-05_00-00-00__2026-10-11_23-59-59.xlsx');
  const rows = XLSX.utils.sheet_to_json(wb.Sheets['Sheet1'], { header: 1, raw: false, defval: '' });
  const H = rows[0]; const idx = (n) => H.indexOf(n);
  const I = { date: idx('Date'), queue: idx('Queue'), caller: idx('CallerID'), disp: idx('Disposition') };
  return rows.slice(1).filter(r => r[I.date] && CALL_DISP.has(r[I.disp])).map(r => ({
    date: r[I.date], queue: r[I.queue], caller: r[I.caller], disp: r[I.disp]
  }));
}
function loadMbank1() {
  const wb = XLSX.readFile('C:\\Users\\ontime\\Downloads\\mbank 1.xlsx');
  const rows = XLSX.utils.sheet_to_json(wb.Sheets['Sheet1'], { header: 1, raw: false, defval: '' });
  const H = rows[0]; const idx = (n) => H.indexOf(n);
  const I = { date: idx('Date'), queue: idx('Queue'), caller: idx('CallerID'), disp: idx('Disposition') };
  return rows.slice(1).filter(r => r[I.date] && CALL_DISP.has(r[I.disp])).map(r => ({
    date: r[I.date], queue: 'POS Operator', caller: r[I.caller], disp: r[I.disp]
  }));
}
const QMAP = { 'Technical support':'ts', 'Mbusiness Plus Cass':'mb', 'MBank pos guide':'pos', 'Business loan':'loan', 'POS Operator':'pos' };

const main = loadMain();
const pos2 = loadMbank1();
const all = main.concat(pos2);
console.log('main rows:', main.length, 'mbank1 rows:', pos2.length, 'combined:', all.length);

const in0819 = all.filter(r => { const h = parseInt(r.date.slice(11,13)); return h>=8 && h<=19; });
console.log('within 08-19:', in0819.length, 'of', all.length);

const byDay = {};
in0819.forEach(r => {
  const day = r.date.slice(0,10);
  const q = QMAP[r.queue] || 'other';
  if (!byDay[day]) byDay[day] = { ts:0, mb:0, pos:0, loan:0, other:0, a:0, uniq:new Set() };
  byDay[day][q]++;
  if (r.disp === 'ANSWERED') byDay[day].a++;
  byDay[day].uniq.add(r.caller);
});
console.log('\nMerged per-day (channels merged, pos = MBank pos guide + POS Operator):');
let gt=0, ga=0;
Object.keys(byDay).sort().forEach(d => {
  const b = byDay[d];
  const tot = b.ts+b.mb+b.pos+b.loan+b.other;
  gt+=tot; ga+=b.a;
  console.log(` ${d}: ts=${b.ts} mb=${b.mb} pos=${b.pos} loan=${b.loan} total=${tot} answered=${b.a} uniq=${b.uniq.size}`);
});
console.log('GRAND total:', gt, 'answered:', ga, 'rate:', (ga/gt*100).toFixed(1)+'%');

// week-wide unique caller union
const weekUniq = new Set();
in0819.forEach(r => weekUniq.add(r.caller));
console.log('\nWeek-wide unique callers (union):', weekUniq.size);

// per-channel success rate for the week
const chanTot = {}, chanAns = {};
in0819.forEach(r => {
  const q = QMAP[r.queue] || 'other';
  chanTot[q] = (chanTot[q]||0)+1;
  if (r.disp === 'ANSWERED') chanAns[q] = (chanAns[q]||0)+1;
});
console.log('\nPer-channel success rate:');
Object.keys(chanTot).forEach(q => console.log(` ${q}: ${chanAns[q]||0}/${chanTot[q]} = ${((chanAns[q]||0)/chanTot[q]*100).toFixed(1)}%`));

// merged hourly
const byHour = {};
in0819.forEach(r => {
  const h = r.date.slice(11,13);
  if (!byHour[h]) byHour[h] = {ans:0,aband:0,timeout:0,transferred:0};
  if (r.disp==='ANSWERED') byHour[h].ans++;
  else if (r.disp==='ABANDONED') byHour[h].aband++;
  else if (r.disp==='TIMEOUT') byHour[h].timeout++;
  else if (r.disp==='TRANSFERRED') byHour[h].transferred++;
});
console.log('\nMerged hourly ans/aband/timeout/transferred:');
Object.keys(byHour).sort().forEach(h=>{const b=byHour[h]; console.log(` ${h}: ${b.ans}/${b.aband}/${b.timeout}/${b.transferred}`);});

// transferred disposition count (callTransferred)
const transferredCalls = in0819.filter(r=>r.disp==='TRANSFERRED').length;
console.log('\nTRANSFERRED disposition count (callTransferred):', transferredCalls);

// missed unique (abandoned/timeout callers)
const missedCallers = new Set();
in0819.forEach(r => { if (r.disp==='ABANDONED' || r.disp==='TIMEOUT') missedCallers.add(r.caller); });
console.log('missedUniq (ABANDONED/TIMEOUT unique callers):', missedCallers.size);
