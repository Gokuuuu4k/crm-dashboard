import XLSX from 'xlsx';
const wb = XLSX.readFile('C:\\Users\\ontime\\Downloads\\mbank 1.xlsx');
const rows = XLSX.utils.sheet_to_json(wb.Sheets['Sheet1'], { header: 1, raw: false, defval: '' });
const H = rows[0];
const idx = (n) => H.indexOf(n);
const I = { date: idx('Date'), queue: idx('Queue'), caller: idx('CallerID'), disp: idx('Disposition'),
  emp: idx('Employee'), name: idx('Name'), calltime: idx('Call Time') };
const CALL_DISP = new Set(['ANSWERED','ABANDONED','TIMEOUT','TRANSFERRED']);
const data = rows.slice(1).filter(r => r[I.date] && CALL_DISP.has(r[I.disp]));
console.log('total call rows:', data.length);
const dates = data.map(r => r[I.date].slice(0,10));
console.log('date range:', Math.min(...dates), Math.max(...dates));
const byDay = {};
data.forEach(r => {
  const day = r[I.date].slice(0,10);
  if (!byDay[day]) byDay[day] = { tot:0, a:0, uniq: new Set() };
  byDay[day].tot++;
  if (r[I.disp]==='ANSWERED') byDay[day].a++;
  byDay[day].uniq.add(r[I.caller]);
});
console.log('\nPer-day:');
Object.keys(byDay).sort().forEach(d => { const b=byDay[d]; console.log(` ${d}: tot=${b.tot} a=${b.a} uniq=${b.uniq.size}`); });

const disp = {};
data.forEach(r => disp[r[I.disp]] = (disp[r[I.disp]]||0)+1);
console.log('\nDispositions:', disp);

const hourCounts = {};
data.forEach(r => { const h = r[I.date].slice(11,13); hourCounts[h]=(hourCounts[h]||0)+1; });
console.log('\nhour distribution:', hourCounts);

const emps = {};
data.forEach(r => { const k = r[I.emp]+'|'+r[I.name]; emps[k]=(emps[k]||0)+1; });
console.log('\nEmployees (ext|name): count');
Object.entries(emps).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log(` ${v}  ${k}`));

const answered = data.filter(r => r[I.disp]==='ANSWERED');
const agg = {};
answered.forEach(r => {
  const ext = String(r[I.emp]).trim();
  if (!agg[ext]) agg[ext] = { c:0, sumSec:0, name: r[I.name] };
  agg[ext].c++;
  agg[ext].sumSec += parseFloat(r[I.calltime])||0;
});
console.log('\nPer-agent answered (ext): c, avgMin, name');
Object.entries(agg).sort((a,b)=>b[1].c-a[1].c).forEach(([k,v])=>console.log(` ${k}: c=${v.c} avgMin=${(v.sumSec/v.c/60).toFixed(2)} name=${v.name}`));

const hourByDisp = {};
data.forEach(r => {
  const h = r[I.date].slice(11,13);
  if (!hourByDisp[h]) hourByDisp[h] = {ans:0,aband:0,timeout:0,transferred:0};
  if (r[I.disp]==='ANSWERED') hourByDisp[h].ans++;
  else if (r[I.disp]==='ABANDONED') hourByDisp[h].aband++;
  else if (r[I.disp]==='TIMEOUT') hourByDisp[h].timeout++;
  else if (r[I.disp]==='TRANSFERRED') hourByDisp[h].transferred++;
});
console.log('\nHourly ans/aband/timeout/transferred:');
Object.keys(hourByDisp).sort().forEach(h=>{const b=hourByDisp[h]; console.log(` ${h}: ${b.ans}/${b.aband}/${b.timeout}/${b.transferred}`);});
