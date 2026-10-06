import XLSX from 'xlsx';
const wb = XLSX.readFile('C:\\Users\\ontime\\Downloads\\Tickets_2026-10-05_1231.xlsx');
const rows = XLSX.utils.sheet_to_json(wb.Sheets['Тикетүүд'], { header: 1, raw: false, defval: '' });
const header = rows[0];
const idx = (n) => header.indexOf(n);
const I = { tnum: idx('Ticket дугаар'), status: idx('ticket - төлөв'), creator: idx('Үүсгэсэн'), participants: idx('Оролцогчид') };
const data = rows.slice(1).filter(r => r[I.tnum]);

const NAME_MAP = {
  'Лхамсүрэн Отгонбаяр':'Otgonbayar.L','Даваадорж Сумъяа':'Sumiya.D','Цогбадрах Соёлзул':'Soyolzul.Ts',
  'Батгэрэл Наянжин':'Nayanjin','Өлзийбат Золбаяр':'Zolbayr','Ариунболд Ганчимэг':'Ganchimeg.A',
  'Adiyatsogt Saranchimeg':'Saranchimeg','Одгэрэл Төрмандах':'Turmandakh.O','Түвшинжаргал Бямбатогтох':'Bymbatogtokh.T',
  'Нэргүй Тэмүүлэн':'CRM-Temuulen','Уранчимэг Баасанжаргал':'Baasanjargal','Мөнхбат Цогбаяр':'Tsogbayar',
  'Энхтөр Хадаан':'Khadaan','Пүрэвдорж Халиунаа':'Khaliunaa','Галтсайхан Төгссайхан':'Galtsaikhan.T',
  'Эрдэнэ-Очир Баярсайхан':'Bayarsaikhan.E','Өлзийбат Золжаргал':'Zolbayr',
};
const norm = (s) => (s||'').replace(/\s+/g,' ').trim();
const mapName = (s) => NAME_MAP[norm(s)] || norm(s);

const ok = {};
let okTotal = 0;
for (const d of data) {
  if (d[I.status] === 'Шийдэгдсэн' && (d[I.participants]||'').trim()) {
    const k = mapName(d[I.creator]);
    ok[k] = (ok[k]||0)+1;
    okTotal++;
  }
}
console.log('resolved-with-participant (ok) total:', okTotal);
Object.entries(ok).sort((a,b)=>b[1]-a[1]).forEach(([n,c])=>console.log(` ${c}  ${n}`));
