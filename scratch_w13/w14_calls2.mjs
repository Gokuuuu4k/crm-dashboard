import XLSX from 'xlsx';
const wb = XLSX.readFile('C:\\Users\\ontime\\Downloads\\2026-10-05_00-00-00__2026-10-11_23-59-59.xlsx');
const rows = XLSX.utils.sheet_to_json(wb.Sheets['Sheet1'], { header: 1, raw: false, defval: '' });
const H = rows[0];
const idx = (n) => H.indexOf(n);
const I = { date: idx('Date'), queue: idx('Queue'), caller: idx('CallerID'), disp: idx('Disposition'),
  who: idx('Who Hangup'), emp: idx('Employee'), name: idx('Name'), transferred: idx('Transferred'),
  hold: idx('Hold Time'), calltime: idx('Call Time'), pos: idx('Original Position') };
const data = rows.slice(1).filter(r => r[I.date]);
console.log('total rows:', data.length);

const dates = data.map(r => r[I.date].slice(0,10));
console.log('date range:', Math.min(...dates.map(d=>d)), Math.max(...dates.map(d=>d)));
const dateCounts = {};
dates.forEach(d => dateCounts[d] = (dateCounts[d]||0)+1);
console.log('per-date counts:', dateCounts);

const queues = {};
data.forEach(r => queues[r[I.queue]] = (queues[r[I.queue]]||0)+1);
console.log('\nQueues:', queues);

const disp = {};
data.forEach(r => disp[r[I.disp]] = (disp[r[I.disp]]||0)+1);
console.log('\nDispositions:', disp);

// employee list
const emps = {};
data.forEach(r => { const k = r[I.emp]+'|'+r[I.name]; emps[k]=(emps[k]||0)+1; });
console.log('\nEmployees (ext|name): count');
Object.entries(emps).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log(` ${v}  ${k}`));
