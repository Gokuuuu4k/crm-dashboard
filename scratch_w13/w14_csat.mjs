import fs from 'fs';
const text = fs.readFileSync('C:\\Users\\ontime\\Downloads\\2026-10-05_00-00-00__2026-10-11_23-59-59__SmsRateExport.csv', 'utf8');
const lines = text.split(/\r?\n/).filter(Boolean);
const header = lines[0];
const rows = lines.slice(1).map(l => {
  // simple CSV split respecting quotes
  const parts = l.match(/("([^"]*)"|[^,]*)(,|$)/g).map(s => s.replace(/,$/,'').replace(/^"|"$/g,''));
  return parts;
});
console.log('total rows:', rows.length);
const I = { sentDate:0, name:1, phone:2, special:3, ext:4, operator:5, rating:6, respDate:7, callId:8 };

let sent=0, resp=0;
const byExt = {};
for (const r of rows) {
  if (!r[I.sentDate]) continue;
  sent++;
  const ext = r[I.ext];
  const rating = r[I.rating];
  if (!byExt[ext]) byExt[ext] = { sent:0, resp:0, sum:0 };
  byExt[ext].sent++;
  if (rating) { byExt[ext].resp++; byExt[ext].sum += parseInt(rating); resp++; }
}
console.log('sent:', sent, 'resp:', resp, 'avg:', (Object.values(byExt).reduce((s,b)=>s+b.sum,0)/resp).toFixed(2));
console.log('\nBy extension:');
Object.entries(byExt).sort((a,b)=>b[1].sent-a[1].sent).forEach(([ext,v]) => {
  console.log(` ${ext}: sent=${v.sent} resp=${v.resp} avg=${v.resp? (v.sum/v.resp).toFixed(2) : '-'}`);
});
