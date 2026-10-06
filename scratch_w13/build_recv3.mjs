import XLSX from 'xlsx';
const wb = XLSX.readFile('C:\\Users\\ontime\\Downloads\\Tickets_2026-10-05_1231.xlsx');
const rows = XLSX.utils.sheet_to_json(wb.Sheets['Тикетүүд'], { header: 1, raw: false, defval: '' });
const header = rows[0];
const idx = (n) => header.indexOf(n);
const I = { tnum: idx('Ticket дугаар'), status: idx('ticket - төлөв'), creator: idx('Үүсгэсэн') };
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

const unres = {}, wait = {};
for (const d of data) {
  if (d[I.status] === 'Шийдэгдээгүй') {
    const k = mapName(d[I.creator]);
    unres[k] = (unres[k]||0)+1;
  } else if (d[I.status] === 'Шилжүүлсэн') {
    const k = mapName(d[I.creator]);
    wait[k] = (wait[k]||0)+1;
  }
}
console.log('unres (14 total):', Object.values(unres).reduce((a,b)=>a+b,0));
Object.entries(unres).sort((a,b)=>b[1]-a[1]).forEach(([n,c])=>console.log(` ${c}  ${n}`));
console.log('\nwait (56 total):', Object.values(wait).reduce((a,b)=>a+b,0));
Object.entries(wait).sort((a,b)=>b[1]-a[1]).forEach(([n,c])=>console.log(` ${c}  ${n}`));
