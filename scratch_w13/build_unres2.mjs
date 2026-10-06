import XLSX from 'xlsx';
const wb = XLSX.readFile('C:\\Users\\ontime\\Downloads\\Tickets_2026-10-05_1231.xlsx');
const rows = XLSX.utils.sheet_to_json(wb.Sheets['Тикетүүд'], { header: 1, raw: false, defval: '' });
const header = rows[0];
const idx = (n) => header.indexOf(n);
const I = { tnum: idx('Ticket дугаар'), status: idx('ticket - төлөв'), type: idx('Засварын төрөл'),
  creator: idx('Үүсгэсэн'), createdDate: idx('Үүсгэсэн огноо') };
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
const fmtIssue = (full) => {
  const parts = full.split(' - ').map(s=>s.trim()).filter(Boolean);
  const PL = { MBPlus: 'MBusiness Plus', Pro: 'ProPOS', MPos: 'Мбанк пос', Loan: 'Зээл', Lite: 'Lite' };
  const prod = PL[parts[0]] || parts[0];
  const rest = parts.slice(1).join(' - ');
  return rest ? `${rest} - ${prod}` : prod;
};

const combined = [
  ...data.filter(d=>d[I.status]==='Шийдэгдээгүй'),
  ...data.filter(d=>d[I.status]==='Харилцагчийг хүлээж байгаа'),
].sort((a,b) => (a[I.createdDate]||'').localeCompare(b[I.createdDate]||''));

console.log('total:', combined.length);
combined.forEach(d => {
  const date = (d[I.createdDate]||'').slice(5,10).replace('-','/');
  const agent = NAME_MAP[norm(d[I.creator])] || norm(d[I.creator]);
  const issue = fmtIssue((d[I.type]||'').trim());
  console.log(`    { d: '${date}', agent: '${agent}', issue: '${issue.replace(/'/g,"\\'")}' },`);
});
