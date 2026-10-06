import XLSX from 'xlsx';
const wb = XLSX.readFile('C:\\Users\\ontime\\Downloads\\Tickets_2026-10-05_1231.xlsx');
const rows = XLSX.utils.sheet_to_json(wb.Sheets['Тикетүүд'], { header: 1, raw: false, defval: '' });
const header = rows[0];
const idx = (n) => header.indexOf(n);
const I = { tnum: idx('Ticket дугаар'), desc: idx('Анх үүссэн ticket Тайлбар'), status: idx('ticket - төлөв'),
  type: idx('Засварын төрөл'), creator: idx('Үүсгэсэн'), createdDate: idx('Үүсгэсэн огноо') };
const data = rows.slice(1).filter(r => r[I.tnum]);

const NAME_MAP = {
  'Лхамсүрэн Отгонбаяр':'Otgonbayar.L','Даваадорж Сумъяа':'Sumiya.D','Цогбадрах Соёлзул':'Soyolzul.Ts',
  'Батгэрэл Наянжин':'Nayanjin','Өлзийбат Золбаяр':'Zolbayr','Ариунболд Ганчимэг':'Ganchimeg.A',
  'Adiyatsogt Saranchimeg':'Saranchimeg','Одгэрэл Төрмандах':'Turmandakh.O','Түвшинжаргал Бямбатогтох':'Bymbatogtokh.T',
  'Нэргүй Тэмүүлэн':'CRM-Temuulen','Уранчимэг Баасанжаргал':'Baasanjargal','Мөнхбат Цогбаяр':'Tsogbayar',
  'Энхтөр Хадаан':'Khadaan','Пүрэвдорж Халиунаа':'Khaliunaa','Галтсайхан Төгссайхан':'Galtsaikhan.T',
  'Эрдэнэ-Очир Баярсайхан':'Bayarsaikhan.E',
};
const norm = (s) => (s||'').replace(/\s+/g,' ').trim();

console.log('=== Шийдэгдээгүй (unresolved, 14) ===');
data.filter(d=>d[I.status]==='Шийдэгдээгүй').forEach(d => {
  const date = (d[I.createdDate]||'').slice(5,10).replace('-','/');
  const agent = NAME_MAP[norm(d[I.creator])] || norm(d[I.creator]);
  const issue = (d[I.type]||'').trim();
  console.log(`    { d: '${date}', agent: '${agent}', issue: '${issue}' }, // ${(d[I.desc]||'').slice(0,60)}`);
});

console.log('\n=== Харилцагчийг хүлээж байгаа (waiting, 36) sample ===');
data.filter(d=>d[I.status]==='Харилцагчийг хүлээж байгаа').forEach(d => {
  const date = (d[I.createdDate]||'').slice(5,10).replace('-','/');
  const agent = NAME_MAP[norm(d[I.creator])] || norm(d[I.creator]);
  const issue = (d[I.type]||'').trim();
  console.log(`    { d: '${date}', agent: '${agent}', issue: '${issue}' },`);
});
