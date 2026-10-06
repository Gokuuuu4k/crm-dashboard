import XLSX from 'xlsx';
const wb = XLSX.readFile('C:\\Users\\ontime\\Downloads\\Tickets_2026-10-05_1231.xlsx');
const rows = XLSX.utils.sheet_to_json(wb.Sheets['Тикетүүд'], { header: 1, raw: false, defval: '' });
const header = rows[0];
const idx = (n) => header.indexOf(n);
const I = { tnum: idx('Ticket дугаар'), status: idx('ticket - төлөв'), participants: idx('Оролцогчид') };
const data = rows.slice(1).filter(r => r[I.tnum]);
const trans = data.filter(d => d[I.status] === 'Шилжүүлсэн');

const NAME_MAP = {
  'Лхамсүрэн Отгонбаяр':'Otgonbayar.L','Даваадорж Сумъяа':'Sumiya.D','Цогбадрах Соёлзул':'Soyolzul.Ts',
  'Батгэрэл Наянжин':'Nayanjin','Өлзийбат Золбаяр':'Zolbayr','Ариунболд Ганчимэг':'Ganchimeg.A',
  'Adiyatsogt Saranchimeg':'Saranchimeg','Одгэрэл Төрмандах':'Turmandakh.O','Түвшинжаргал Бямбатогтох':'Bymbatogtokh.T',
  'Нэргүй Тэмүүлэн':'CRM-Temuulen','Уранчимэг Баасанжаргал':'Baasanjargal','Мөнхбат Цогбаяр':'Tsogbayar',
  'Энхтөр Хадаан':'Khadaan','Пүрэвдорж Халиунаа':'Khaliunaa','Галтсайхан Төгссайхан':'Galtsaikhan.T',
  'Эрдэнэ-Очир Баярсайхан':'Bayarsaikhan.E',
};
const norm = (s) => (s||'').replace(/\s+/g,' ').trim();

const counts = {};
let withParticipant = 0, blank = 0;
for (const d of trans) {
  const raw = (d[I.participants]||'').trim();
  if (!raw) { blank++; continue; }
  withParticipant++;
  const names = raw.split(',').map(s => norm(s)).filter(Boolean);
  for (const n of names) {
    const key = NAME_MAP[n] || n;
    counts[key] = (counts[key]||0) + 1;
  }
}
console.log('transferred total:', trans.length, 'with participant:', withParticipant, 'blank:', blank);
console.log('recipient counts:');
Object.entries(counts).sort((a,b)=>b[1]-a[1]).forEach(([n,c]) => console.log(` ${c}  ${n}`));
