import XLSX from 'xlsx';
import fs from 'fs';
const READ = (path, sheet) => {
  const wb = XLSX.readFile(path);
  const sn = sheet || wb.SheetNames[0];
  return XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, raw: false, defval: '' });
};
const DL = 'C:\\Users\\ontime\\Downloads\\';

// ===== Call log: hourly disposition split + per-day unique callers =====
const callRows = READ(DL + '2026-09-28_00-00-00__2026-10-04_23-59-59.xlsx');
const ch = callRows[0];
const ci = (n) => ch.indexOf(n);
const CI = { Date: ci('Date'), Queue: ci('Queue'), CallerID: ci('CallerID'), Disposition: ci('Disposition') };
const REAL = new Set(['ANSWERED', 'ABANDONED', 'TIMEOUT', 'TRANSFERRED']);
const calls = callRows.slice(1).map(r => ({
  date: (r[CI.Date] || '').slice(0, 10), hour: parseInt((r[CI.Date] || '').slice(11, 13), 10),
  queue: r[CI.Queue], callerId: r[CI.CallerID], disp: r[CI.Disposition],
})).filter(r => REAL.has(r.disp) && r.date >= '2026-09-28' && r.date <= '2026-10-04');

const hourly = {};
for (let h = 0; h <= 23; h++) hourly[h] = { answered: 0, missed: 0, timeout: 0 };
for (const c of calls) {
  if (c.disp === 'ANSWERED') hourly[c.hour].answered++;
  else if (c.disp === 'ABANDONED' || c.disp === 'TRANSFERRED') hourly[c.hour].missed++;
  else if (c.disp === 'TIMEOUT') hourly[c.hour].timeout++;
}
console.log('HOURLY (answered,missed,timeout):');
for (let h = 8; h <= 19; h++) console.log(`  ${String(h).padStart(2,'0')}: ${JSON.stringify(hourly[h])}`);

const days = ['2026-09-28','2026-09-29','2026-09-30','2026-10-01','2026-10-02','2026-10-03','2026-10-04'];
console.log('\nPer-day unique callers:');
for (const d of days) {
  const u = new Set(calls.filter(c => c.date === d && c.callerId).map(c => c.callerId));
  console.log(` ${d}: ${u.size}`);
}

// ===== Repairs: per-day sent, channels, products, issues (full subcat), receivers by exact status =====
const rrows = READ(DL + 'Repairs_2026-10-05_ALL.xlsx');
const rh = rrows[0]; const ridx = (n) => rh.indexOf(n);
const RI = { id: ridx('№ (Id)'), issue: ridx('Асуудлын төрөл'), regDate: ridx('Бүртгэгдсэн огноо'), regAgent: ridx('Бүртгэсэн ажилтан'), status: ridx('Төлөв'), solvedAgent: ridx('Шийдсэн ажилтан'), product: ridx('Бүтээгдэхүүний төрөл'), channel: ridx('Харилцсан суваг') };
const rdata = rrows.slice(1).map(r => ({ id: r[RI.id], issue: r[RI.issue], regDate: r[RI.regDate], regAgent: r[RI.regAgent], status: r[RI.status], solvedAgent: r[RI.solvedAgent], product: r[RI.product], channel: r[RI.channel] })).filter(d => d.id);

console.log('\nPer-day repair ticket counts (sent):');
for (const d of days) console.log(` ${d}: ${rdata.filter(x => (x.regDate||'').slice(0,10) === d).length}`);

const chanCount = {}; for (const d of rdata) chanCount[d.channel] = (chanCount[d.channel]||0)+1;
console.log('\nRepairs channel (Харилцсан суваг):', chanCount);
const prodCount = {}; for (const d of rdata) prodCount[d.product] = (prodCount[d.product]||0)+1;
console.log('Repairs product (Бүтээгдэхүүний төрөл):', prodCount);

const issueSub = {};
for (const d of rdata) {
  const parts = (d.issue||'').split(' - ');
  const top = parts[0]?.trim() || '(none)';
  const sub = parts.slice(1).join(' - ').trim() || top;
  const key = sub + '|' + top;
  issueSub[key] = (issueSub[key]||0)+1;
}
console.log('\nIssue subcategories (sub|top : count), sorted:');
Object.entries(issueSub).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log(` ${v}  ${k}`));

// receivers by exact status
const recv = {};
for (const d of rdata) {
  if (d.status === 'Шилжүүлсэн' || d.status === 'Шилжүүлсэн-Шийдсэн') {
    const n = d.regAgent;
    if (!recv[n]) recv[n] = { ok: 0, wait: 0, unres: 0 };
    if (d.status === 'Шилжүүлсэн-Шийдсэн') recv[n].ok++; else recv[n].wait++;
  }
}
// unresolved tickets' agent also counts in unres bucket (per established K_RECV pattern, regAgent)
for (const d of rdata) {
  if (d.status === 'Шийдэгдээгүй') {
    const n = d.regAgent;
    if (!recv[n]) recv[n] = { ok: 0, wait: 0, unres: 0 };
    recv[n].unres++;
  }
}
console.log('\nReceivers pivot (ok=Шилжүүлсэн-Шийдсэн, wait=Шилжүүлсэн, unres=Шийдэгдээгүй):', JSON.stringify(recv, null, 1));

// unresolved list detail
console.log('\nUnresolved tickets detail:');
rdata.filter(d => d.status === 'Шийдэгдээгүй').forEach(d => console.log(` ${d.regDate} ${d.regAgent} ${d.issue}`));
