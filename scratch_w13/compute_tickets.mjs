import XLSX from 'xlsx';
const wb = XLSX.readFile('C:\\Users\\ontime\\Downloads\\Tickets_2026-10-05_1231.xlsx');
const rows = XLSX.utils.sheet_to_json(wb.Sheets['Тикетүүд'], { header: 1, raw: false, defval: '' });
const header = rows[0];
const idx = (n) => header.indexOf(n);
const I = {
  tnum: idx('Ticket дугаар'), contract: idx('Гэрээ'), desc: idx('Анх үүссэн ticket Тайлбар'),
  fix: idx('Юу хийсэн засвар- Тайлбар'), status: idx('ticket - төлөв'), state: idx('Төлөв'),
  level: idx('Ач холбогдол'), channel: idx('Харилцсан суваг'), participants: idx('Оролцогчид'),
  type: idx('Засварын төрөл'), creator: idx('Үүсгэсэн'), createdDate: idx('Үүсгэсэн огноо'),
  closer: idx('Хаасан хэрэглэгч'), closedDate: idx('Хаасан огноо'),
};
const data = rows.slice(1).filter(r => r[I.tnum]);

// cross: status x state
const cross = {};
for (const d of data) { const k = d[I.status]+'|'+d[I.state]; cross[k]=(cross[k]||0)+1; }
console.log('status x state:', cross);

// channel breakdown
const chanCount = {};
for (const d of data) chanCount[d[I.channel]] = (chanCount[d[I.channel]]||0)+1;
console.log('\nChannel:', chanCount);

// product/type breakdown (top-level)
const prodCount = {};
for (const d of data) { const t = (d[I.type]||'').split(' - ')[0].trim(); prodCount[t]=(prodCount[t]||0)+1; }
console.log('\nProduct (top-level type):', prodCount);

// issue subcategory breakdown (full type string minus top-level, or full string)
const issueCount = {};
for (const d of data) {
  const full = (d[I.type]||'').trim();
  if (!full) continue;
  issueCount[full] = (issueCount[full]||0)+1;
}
console.log('\nTop issue types (full, sorted):');
Object.entries(issueCount).sort((a,b)=>b[1]-a[1]).slice(0,15).forEach(([k,v])=>console.log(` ${v}  ${k}`));

// recv pivot: tickets with non-blank participants, split by status
const recv = {};
for (const d of data) {
  const participants = (d[I.participants]||'').trim();
  if (!participants) continue;
  // participants may be multiple names separated by comma; split on tab within name then comma between people
  const names = participants.split(',').map(s => s.trim()).filter(Boolean);
  for (const nameRaw of names) {
    const name = nameRaw.replace(/\t+/g, ' ').replace(/\s+/g,' ').trim();
    if (!recv[name]) recv[name] = { unres: 0, wait: 0, ok: 0 };
    if (d[I.status] === 'Шийдэгдээгүй') recv[name].unres++;
    else if (d[I.status] === 'Шилжүүлсэн') recv[name].wait++;
    else if (d[I.status] === 'Шийдэгдсэн') recv[name].ok++;
    // 'Харилцагчийг хүлээж байгаа' not counted in pivot (ambiguous bucket)
  }
}
console.log('\nRecv pivot (name: unres/wait/ok):');
Object.entries(recv).sort((a,b)=>(b[1].unres+b[1].wait+b[1].ok)-(a[1].unres+a[1].wait+a[1].ok)).forEach(([n,v])=>console.log(` ${n}: unres=${v.unres} wait=${v.wait} ok=${v.ok}`));

// totals
console.log('\n=== TOTALS ===');
console.log('resolved (Шийдэгдсэн):', data.filter(d=>d[I.status]==='Шийдэгдсэн').length);
console.log('unresolved (Шийдэгдээгүй):', data.filter(d=>d[I.status]==='Шийдэгдээгүй').length);
console.log('waiting (Харилцагчийг хүлээж байгаа):', data.filter(d=>d[I.status]==='Харилцагчийг хүлээж байгаа').length);
console.log('tkTransferred (Шилжүүлсэн):', data.filter(d=>d[I.status]==='Шилжүүлсэн').length);
console.log('TOTAL:', data.length);
