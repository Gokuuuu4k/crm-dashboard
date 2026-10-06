import XLSX from 'xlsx';
import fs from 'fs';

const READ = (path, sheet) => {
  const wb = XLSX.readFile(path);
  const sn = sheet || wb.SheetNames[0];
  return XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, raw: false, defval: '' });
};

const DL = 'C:\\Users\\ontime\\Downloads\\';

// ---------- CALL LOG ----------
const callRows = READ(DL + '2026-09-28_00-00-00__2026-10-04_23-59-59.xlsx');
const ch = callRows[0];
const ci = (name) => ch.indexOf(name);
const CI = { Date: ci('Date'), Queue: ci('Queue'), CallerID: ci('CallerID'), Disposition: ci('Disposition'), Employee: ci('Employee'), Name: ci('Name'), CallTime: ci('Call Time') };

const REAL_DISP = new Set(['ANSWERED', 'ABANDONED', 'TIMEOUT', 'TRANSFERRED']);
const calls = callRows.slice(1)
  .map(r => ({
    date: (r[CI.Date] || '').slice(0, 10),
    hour: parseInt((r[CI.Date] || '').slice(11, 13), 10),
    queue: r[CI.Queue],
    callerId: r[CI.CallerID],
    disp: r[CI.Disposition],
    emp: r[CI.Employee],
    name: r[CI.Name],
    callTimeSec: parseFloat(r[CI.CallTime]) || 0,
  }))
  .filter(r => REAL_DISP.has(r.disp) && r.date >= '2026-09-28' && r.date <= '2026-10-04');

console.log('Total real calls (filtered):', calls.length);
const answered = calls.filter(c => c.disp === 'ANSWERED');
console.log('Answered:', answered.length);
const uniqueCallers = new Set(calls.map(c => c.callerId).filter(Boolean));
console.log('Unique callers:', uniqueCallers.size);
console.log('Success rate:', (answered.length / calls.length * 100).toFixed(1) + '%');

// by disposition breakdown
const dispCounts = {};
for (const c of calls) dispCounts[c.disp] = (dispCounts[c.disp] || 0) + 1;
console.log('Disposition breakdown:', dispCounts);

// Channel totals
const channels = ['Technical support', 'Mbusiness Plus Cass', 'MBank pos guide', 'Business loan'];
const chanTotals = {};
for (const ch2 of channels) chanTotals[ch2] = calls.filter(c => c.queue === ch2).length;
console.log('\nChannel totals (offered):', chanTotals);
const chanAnswered = {};
for (const ch2 of channels) chanAnswered[ch2] = calls.filter(c => c.queue === ch2 && c.disp === 'ANSWERED').length;
console.log('Channel answered:', chanAnswered);
// other queues not in list?
const otherQueues = new Set(calls.map(c => c.queue).filter(q => !channels.includes(q)));
console.log('Any other queues found:', [...otherQueues]);

// Daily x channel
const days = ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'];
const daily = {};
for (const d of days) {
  daily[d] = { total: 0, answered: 0 };
  for (const ch2 of channels) daily[d][ch2] = 0;
  for (const ch2 of channels) daily[d][ch2 + '_ans'] = 0;
}
for (const c of calls) {
  if (!daily[c.date]) continue;
  daily[c.date].total++;
  if (c.disp === 'ANSWERED') daily[c.date].answered++;
  if (channels.includes(c.queue)) {
    daily[c.date][c.queue]++;
    if (c.disp === 'ANSWERED') daily[c.date][c.queue + '_ans']++;
  }
}
console.log('\nDaily breakdown:');
for (const d of days) console.log(' ', d, JSON.stringify(daily[d]));

// Hourly load (all offered calls by hour 0-23)
const hourly = Array(24).fill(0);
for (const c of calls) if (c.hour >= 0 && c.hour <= 23) hourly[c.hour]++;
console.log('\nHourly load:', hourly.map((v, h) => `${h}:${v}`).join(' '));

// Per-agent stats from call log
const agentStats = {};
for (const c of calls) {
  if (!c.name) continue;
  if (!agentStats[c.name]) agentStats[c.name] = { offered: 0, answered: 0, totalCallSec: 0, ext: c.emp };
  agentStats[c.name].offered++;
  if (c.disp === 'ANSWERED') {
    agentStats[c.name].answered++;
    agentStats[c.name].totalCallSec += c.callTimeSec;
  }
}
console.log('\nPer-agent call stats:');
for (const [name, s] of Object.entries(agentStats).sort((a, b) => b[1].answered - a[1].answered)) {
  const avgMin = s.answered ? (s.totalCallSec / s.answered / 60) : 0;
  const sr = s.offered ? (s.answered / s.offered * 100) : 0;
  console.log(`  ${name} (ext ${s.ext}): offered=${s.offered} answered=${s.answered} successRate=${sr.toFixed(1)}% avgCallMin=${avgMin.toFixed(2)}`);
}

fs.writeFileSync('calldata.json', JSON.stringify({ calls, daily, hourly, chanTotals, chanAnswered, agentStats, totalCalls: calls.length, totalAnswered: answered.length, uniqueCallers: uniqueCallers.size }, null, 1));
console.log('\nWrote calldata.json');
