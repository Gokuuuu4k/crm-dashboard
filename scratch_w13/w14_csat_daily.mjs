import fs from 'fs';
const text = fs.readFileSync('C:\\Users\\ontime\\Downloads\\2026-10-05_00-00-00__2026-10-11_23-59-59__SmsRateExport.csv', 'utf8');
const lines = text.split(/\r?\n/).filter(Boolean);
const rows = lines.slice(1).map(l => {
  const parts = l.match(/("([^"]*)"|[^,]*)(,|$)/g).map(s => s.replace(/,$/,'').replace(/^"|"$/g,''));
  return parts;
});
const I = { sentDate:0, name:1, phone:2, special:3, ext:4, operator:5, rating:6, respDate:7, callId:8 };
const byDay = {};
for (const r of rows) {
  if (!r[I.sentDate]) continue;
  const day = r[I.sentDate].slice(0,10);
  if (!byDay[day]) byDay[day] = { sent:0, sat:[0,0,0,0,0] };
  byDay[day].sent++;
  const rating = parseInt(r[I.rating]);
  if (rating >= 1 && rating <= 5) byDay[day].sat[rating-1]++;
}
console.log('Per-day sent + sat histogram [1,2,3,4,5]:');
Object.keys(byDay).sort().forEach(d => {
  console.log(` ${d}: sent=${byDay[d].sent} sat=${JSON.stringify(byDay[d].sat)}`);
});
const totSent = Object.values(byDay).reduce((s,b)=>s+b.sent,0);
const totSat = [0,0,0,0,0];
Object.values(byDay).forEach(b => b.sat.forEach((v,i)=>totSat[i]+=v));
console.log('\nTotal sent:', totSent, 'total sat:', totSat, 'sum resp:', totSat.reduce((a,b)=>a+b,0));
