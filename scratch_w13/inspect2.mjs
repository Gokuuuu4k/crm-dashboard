import XLSX from 'xlsx';
import fs from 'fs';

const wb = XLSX.readFile('C:\\Users\\ontime\\Downloads\\Tickets_2026-10-05_0821.xlsx');
const sheet = wb.Sheets['Тикетүүд'];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
const header = rows[0];
const idx = (name) => header.indexOf(name);
const iCreated = idx('Үүсгэсэн огноо');
const iClosed = idx('Хаасан огноо');
const dates = rows.slice(1).map(r => r[iCreated]).filter(Boolean).sort();
console.log('total data rows:', rows.length - 1);
console.log('min created:', dates[0]);
console.log('max created:', dates[dates.length - 1]);
// distribution of created dates
const dayCounts = {};
for (const r of rows.slice(1)) {
  const d = (r[iCreated] || '').slice(0, 10);
  dayCounts[d] = (dayCounts[d] || 0) + 1;
}
console.log('day counts:', JSON.stringify(dayCounts, null, 1));

// check SmsRateExport existence for this week
const smsFiles = fs.readdirSync('C:\\Users\\ontime\\Downloads\\').filter(f => /SmsRate/i.test(f));
console.log('\nSmsRateExport files in Downloads:', smsFiles);

// check Status/ticket-status column distribution
const iStatus2 = idx('Төлөв');
const iStatus1 = idx('ticket - төлөв');
const statusCounts1 = {}, statusCounts2 = {};
for (const r of rows.slice(1)) {
  const s1 = r[iStatus1] || '(blank)';
  const s2 = r[iStatus2] || '(blank)';
  statusCounts1[s1] = (statusCounts1[s1]||0)+1;
  statusCounts2[s2] = (statusCounts2[s2]||0)+1;
}
console.log('\nticket-төлөв distribution:', statusCounts1);
console.log('Төлөв distribution:', statusCounts2);
