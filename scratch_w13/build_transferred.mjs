import XLSX from 'xlsx';
const wb = XLSX.readFile('C:\\Users\\ontime\\Downloads\\Tickets_2026-10-05_1231.xlsx');
const rows = XLSX.utils.sheet_to_json(wb.Sheets['Тикетүүд'], { header: 1, raw: false, defval: '' });
const header = rows[0];
const idx = (n) => header.indexOf(n);
const I = { tnum: idx('Ticket дугаар'), status: idx('ticket - төлөв'), creator: idx('Үүсгэсэн'),
  participants: idx('Оролцогчид'), closer: idx('Хаасан хэрэглэгч'), type: idx('Засварын төрөл') };
const data = rows.slice(1).filter(r => r[I.tnum]);

const trans = data.filter(d => d[I.status] === 'Шилжүүлсэн');
console.log('total transferred:', trans.length);
trans.forEach(d => {
  console.log(JSON.stringify({
    creator: d[I.creator], participants: d[I.participants], closer: d[I.closer], type: (d[I.type]||'').slice(0,40)
  }));
});
