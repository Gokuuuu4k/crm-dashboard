import XLSX from 'xlsx';
const wb = XLSX.readFile('C:\\Users\\ontime\\Downloads\\Tickets_2026-10-05_1231.xlsx');
const rows = XLSX.utils.sheet_to_json(wb.Sheets['Тикетүүд'], { header: 1, raw: false, defval: '' });
const header = rows[0];
const idx = (n) => header.indexOf(n);
const I = { tnum: idx('Ticket дугаар'), type: idx('Засварын төрөл'), creator: idx('Үүсгэсэн') };
const data = rows.slice(1).filter(r => r[I.tnum]);

const PROD_LABEL = { MBPlus: 'MBusiness Plus', Pro: 'Про', MPos: 'Мбанк пос', Loan: 'Зээл', Lite: 'Lite' };
const TOPCAT_LABEL = {
  'Мэдээлэл': 'мэдээлэл', 'Сургалт': 'сургалт', 'Засвар': 'засвар', 'Алдаа': 'алдаа',
  'Тохиргоо': 'тохиргоо', 'Бүтээгдэхүүн': 'бүтээгдэхүүн', 'Санхүү': 'санхүү',
  'Гомдол': 'гомдол', 'Санал хүсэлт': 'санал хүсэлт', 'Гэнэтийн доголдол': 'гэнэтийн доголдол',
  'Төлбөрт үйлчилгээ': 'төлбөрт үйлчилгээ',
};

// Group by [product, topcat, subcat]
const groups = {};
for (const d of data) {
  const full = (d[I.type]||'').trim();
  if (!full) continue;
  const parts = full.split(' - ').map(s=>s.trim());
  const prod = parts[0] || '(none)';
  const topcat = parts[1] || prod;
  const subcat = parts[2] || '';
  const key = prod + '|' + topcat + '|' + subcat;
  groups[key] = (groups[key]||0) + 1;
}
const entries = Object.entries(groups).map(([k,v]) => {
  const [prod, topcat, subcat] = k.split('|');
  const prodL = PROD_LABEL[prod] || prod;
  const topL = TOPCAT_LABEL[topcat] || topcat.toLowerCase();
  let label;
  if (subcat) label = `${prodL} ${topL} - ${subcat}`;
  else label = `${prodL} ${topL}`;
  return { label, count: v, topcat };
}).sort((a,b)=>b.count-a.count);

console.log('Top 16 issue entries:');
entries.slice(0,16).forEach(e => console.log(`  ['${e.label}',${e.count},'${e.topcat}'],`));

console.log('\nTotal distinct groups:', entries.length, 'sum top16:', entries.slice(0,16).reduce((s,e)=>s+e.count,0), 'of total', data.length);

// per-agent ticket count by creator (Үүсгэсэн)
const EXT_NAME_ORDER = ['Otgonbayar.L','Sumiya.D','Nayanjin','Ganchimeg.A','Tugssaikhan.G','Zolbayr','Soyolzul.Ts','Saranchimeg','Turmandakh.O','CRM-Temuulen','Bymbatogtokh.T','Bayarmaa.T','Bayarmaa.N','Baasanjargal','Khaliunaa','Tsogbayar','Khadaan'];
// map full mongolian creator names (from ticket export) to short agent codes used in dashboard
const CREATOR_MAP = {
  'Лхамсүрэн  Отгонбаяр': 'Otgonbayar.L', 'Лхамсүрэн Отгонбаяр': 'Otgonbayar.L',
  'Adiyatsogt Saranchimeg': 'Saranchimeg',
  'Эрдэнэ-Очир Баярсайхан': 'Bayarsaikhan.E',
  'Түвшинжаргал  Бямбатогтох': 'Bymbatogtokh.T', 'Түвшинжаргал Бямбатогтох': 'Bymbatogtokh.T',
  'Галтсайхан Төгссайхан': 'Nayanjin', // placeholder guess, verify separately
  'Даваадорж  Сумъяа': 'Sumiya.D', 'Даваадорж Сумъяа': 'Sumiya.D',
  'Өлзийбат  Золбаяр': 'Zolbayr', 'Өлзийбат Золбаяр': 'Zolbayr',
  'Цогбадрах Соёлзул': 'Soyolzul.Ts',
  'Батгэрэл Наянжин': 'Nayanjin',
  'Нэргүй Тэмүүлэн': 'CRM-Temuulen',
  'Ариунболд Ганчимэг': 'Ganchimeg.A',
  'Одгэрэл Төрмандах': 'Turmandakh.O',
  'Handaa Tsenguun': 'Khaliunaa', // unclear, placeholder
  'Пүрэвдорж  Халиунаа': 'Khaliunaa', 'Пүрэвдорж Халиунаа': 'Khaliunaa',
};
const creatorRaw = {};
for (const d of data) {
  const c = (d[I.creator]||'').replace(/\s+/g,' ').trim();
  if (!c) continue;
  creatorRaw[c] = (creatorRaw[c]||0)+1;
}
console.log('\nRaw creator counts (all names found in file):');
Object.entries(creatorRaw).sort((a,b)=>b[1]-a[1]).forEach(([n,v])=>console.log(` ${v}  ${n}`));
