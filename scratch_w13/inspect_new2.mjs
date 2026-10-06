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
console.log('Total tickets:', data.length);
const dates = data.map(d => (d[I.createdDate]||'').slice(0,10)).filter(Boolean).sort();
console.log('Date range:', dates[0], '..', dates[dates.length-1]);

const days = ['2026-09-28','2026-09-29','2026-09-30','2026-10-01','2026-10-02','2026-10-03','2026-10-04'];
console.log('\nPer-day count (created):');
for (const d of days) console.log(' ', d, data.filter(x => (x[I.createdDate]||'').slice(0,10)===d).length);

const statusCounts = {};
for (const d of data) statusCounts[d[I.status]] = (statusCounts[d[I.status]]||0)+1;
console.log('\nStatus (ticket-төлөв) counts:', statusCounts);

const levelCounts = {};
for (const d of data) levelCounts[d[I.level]] = (levelCounts[d[I.level]]||0)+1;
console.log('\nLevel counts:', levelCounts);

const channelCounts = {};
for (const d of data) channelCounts[d[I.channel]] = (channelCounts[d[I.channel]]||0)+1;
console.log('\nChannel counts:', channelCounts);

const typeCounts = {};
for (const d of data) { const t = (d[I.type]||'').split(' - ')[0]; typeCounts[t]=(typeCounts[t]||0)+1; }
console.log('\nType (top-level) counts:', typeCounts);

const fixNonBlank = data.filter(d => (d[I.fix]||'').trim()).length;
console.log('\nFix desc non-blank:', fixNonBlank, '/', data.length);

// filter to W13 week only
const w13 = data.filter(d => {
  const dt = (d[I.createdDate]||'').slice(0,10);
  return dt >= '2026-09-28' && dt <= '2026-10-04';
});
console.log('\nW13-week tickets (created 09-28..10-04):', w13.length);
const w13status = {};
for (const d of w13) w13status[d[I.status]] = (w13status[d[I.status]]||0)+1;
console.log('W13 status counts:', w13status);
