import XLSX from 'xlsx';
const wb = XLSX.readFile('C:\\Users\\ontime\\Downloads\\2026-10-05_00-00-00__2026-10-11_23-59-59.xlsx');
const rows = XLSX.utils.sheet_to_json(wb.Sheets['Sheet1'], { header: 1, raw: false, defval: '' });
const H = rows[0];
const idx = (n) => H.indexOf(n);
const I = { date: idx('Date'), queue: idx('Queue'), disp: idx('Disposition'), emp: idx('Employee'),
  name: idx('Name'), calltime: idx('Call Time') };
const data = rows.slice(1).filter(r => r[I.date] && r[I.disp]==='ANSWERED');
console.log('answered rows:', data.length);

const NAME_MAP = {
  '222':'Sumiya.D','210':'Tugssaikhan.G','227':'Nayanjin','220':'Otgonbayar.L','216':'Turmandakh.O',
  '214':'Saranchimeg','218':'CRM-Temuulen','215':'Soyolzul.Ts','223':'Ganchimeg.A','228':'Bymbatogtokh.T',
  '203':'Zolbayr','208':'Bayarmaa.N','207':'Bayarmaa.T','212':'Baasanjargal','206':'Khaliunaa',
  '201':'Khadaan','217':'Unubold.T',
};

const agg = {};
for (const r of data) {
  const ext = String(r[I.emp]).trim();
  const key = NAME_MAP[ext] || `ext${ext}(${r[I.name]})`;
  if (!agg[key]) agg[key] = { c:0, sumSec:0 };
  agg[key].c++;
  const ct = parseFloat(r[I.calltime]) || 0;
  agg[key].sumSec += ct;
}
console.log('\nAgent: calls, avgCallTimeRaw, avgMinutes(if sec), avgMinutes(if already min)');
Object.entries(agg).sort((a,b)=>b[1].c-a[1].c).forEach(([k,v]) => {
  const avgRaw = v.sumSec / v.c;
  console.log(` ${k}: c=${v.c} avgRaw=${avgRaw.toFixed(2)} asSec->min=${(avgRaw/60).toFixed(2)} asMin=${avgRaw.toFixed(2)}`);
});

// sample a few raw Call Time values to gauge units
console.log('\nsample Call Time values:', data.slice(0,15).map(r=>r[I.calltime]));
