import { useState, useMemo, useEffect, useRef, useLayoutEffect, Component } from 'react'
import type { ReactNode } from 'react'
import ontimeLogo from './ontime-logo.png'

// ── Motion helpers ────────────────────────────────────────────────────────────
function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    if (typeof matchMedia === 'undefined') return
    const m = matchMedia('(prefers-reduced-motion: reduce)')
    const h = () => setReduced(m.matches)
    m.addEventListener('change', h)
    return () => m.removeEventListener('change', h)
  }, [])
  return reduced
}

/** Eases a number toward `target` on each change; returns the live value. */
function useCountUp(target: number, dur = 650) {
  const reduced = useReducedMotion()
  const [val, setVal] = useState(0)
  const curRef = useRef(0)
  useEffect(() => { curRef.current = val })
  useEffect(() => {
    if (reduced || curRef.current === target || !isFinite(target)) { setVal(target); curRef.current = target; return }
    const from = curRef.current
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur)
      const e = 1 - Math.pow(1 - p, 3)
      const v = from + (target - from) * e
      setVal(v); curRef.current = v
      if (p < 1) raf = requestAnimationFrame(tick)
      else { setVal(target); curRef.current = target }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, dur, reduced])
  return val
}

function CountUp({ value, format = fmt }: { value: number; format?: (n: number) => string }) {
  return <>{format(useCountUp(value))}</>
}

/** Fades/slides children in the first time they scroll into view. */
function Reveal({ children, className, style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') { setSeen(true); return }
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect() } },
      { rootMargin: '0px 0px -30px 0px' },
    )
    io.observe(el)
    const fb = window.setTimeout(() => setSeen(true), 1500)
    return () => { io.disconnect(); window.clearTimeout(fb) }
  }, [])
  return (
    <div ref={ref} className={`reveal${seen ? ' in' : ''}${className ? ' ' + className : ''}`} style={style}>
      {children}
    </div>
  )
}

class ErrorBoundary extends Component<{ children: ReactNode }, { err: string | null }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { err: null }
  }
  static getDerivedStateFromError(e: Error) { return { err: e.message } }
  render() {
    if (this.state.err) return (
      <div style={{ padding: 40, color: '#ff7d6b', fontFamily: 'monospace', background: '#070a11', minHeight: '100vh' }}>
        <h2 style={{ marginBottom: 12 }}>Алдаа гарлаа</h2>
        <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>{this.state.err}</pre>
      </div>
    )
    return this.props.children
  }
}

const C = {
  blue: '#4ea8ff', teal: '#2fd3a5', violet: '#9d8cff', gold: '#f5c451',
  coral: '#ff7d6b', pink: '#f078c8', amber: '#ffb020', green: '#4fd08a',
}
const CHCOL = [C.blue, C.teal, C.violet, C.gold, C.coral]
const PRCOL = [C.gold, C.teal, C.blue, C.violet, C.coral]
const mkCh = (a: [string, number][]) => a.map((x, i) => ({ n: x[0], v: x[1], c: CHCOL[i % CHCOL.length] }))
const mkPr = (a: [string, number][]) => a.map((x, i) => ({ n: x[0], v: x[1], c: PRCOL[i % PRCOL.length] }))
const mkIs = (a: [string, number, string][]) => a.map(x => ({ n: x[0], v: x[1], t: x[2] }))
const mkAg = (a: [string, number, number | null, number, number | null][]) =>
  a.map(x => ({ n: x[0], c: x[1], tk: x[2], t: x[3], r: x[4] }))

type DayRow = { d: string; lab: string; ts: number; mb: number; pos: number; loan: number; nd: number; a: number; sat: number[]; sent: number; cb?: number; cbNeed?: number }
type HourRow = [string, number, number, number]

// ── Daily data ────────────────────────────────────────────────────────────────
const DAILY_A: DayRow[] = [
  { d: '2026-07-06', lab: '07/06', ts: 119, mb: 47,  pos: 23, loan: 13, nd: 0,  a: 175, sat: [1,0,0,1,7],  sent: 31 },
  { d: '2026-07-07', lab: '07/07', ts: 160, mb: 119, pos: 24, loan: 13, nd: 0,  a: 247, sat: [2,0,2,0,9],  sent: 48 },
  { d: '2026-07-08', lab: '07/08', ts: 111, mb: 49,  pos: 25, loan: 8,  nd: 0,  a: 171, sat: [0,0,0,0,7],  sent: 29 },
  { d: '2026-07-09', lab: '07/09', ts: 116, mb: 39,  pos: 24, loan: 3,  nd: 0,  a: 159, sat: [0,0,0,0,3],  sent: 28 },
  { d: '2026-07-10', lab: '07/10', ts: 17,  mb: 5,   pos: 0,  loan: 0,  nd: 91, a: 94,  sat: [0,0,0,0,1],  sent: 17 },
  { d: '2026-07-11', lab: '07/11', ts: 0,   mb: 0,   pos: 0,  loan: 0,  nd: 47, a: 42,  sat: [0,0,0,0,0],  sent: 7  },
  { d: '2026-07-12', lab: '07/12', ts: 0,   mb: 0,   pos: 0,  loan: 0,  nd: 25, a: 23,  sat: [0,0,0,1,0],  sent: 4  },
  { d: '2026-07-13', lab: '07/13', ts: 0,   mb: 0,   pos: 0,  loan: 0,  nd: 45, a: 41,  sat: [0,0,0,0,2],  sent: 7  },
  { d: '2026-07-14', lab: '07/14', ts: 0,   mb: 0,   pos: 0,  loan: 0,  nd: 34, a: 31,  sat: [0,0,0,0,0],  sent: 5  },
  { d: '2026-07-15', lab: '07/15', ts: 0,   mb: 0,   pos: 0,  loan: 0,  nd: 67, a: 60,  sat: [0,0,0,0,1],  sent: 10 },
  { d: '2026-07-16', lab: '07/16', ts: 0,   mb: 0,   pos: 0,  loan: 0,  nd: 69, a: 61,  sat: [1,0,0,0,3],  sent: 11 },
  { d: '2026-07-17', lab: '07/17', ts: 0,   mb: 0,   pos: 0,  loan: 0,  nd: 84, a: 72,  sat: [0,0,0,0,3],  sent: 13 },
  { d: '2026-07-18', lab: '07/18', ts: 36,  mb: 8,   pos: 7,  loan: 0,  nd: 0,  a: 45,  sat: [0,0,0,0,3],  sent: 8  },
  { d: '2026-07-19', lab: '07/19', ts: 45,  mb: 8,   pos: 6,  loan: 0,  nd: 0,  a: 53,  sat: [0,0,0,0,1],  sent: 9  },
  { d: '2026-07-20', lab: '07/20', ts: 89,  mb: 41,  pos: 31, loan: 22, nd: 0,  a: 153, sat: [0,0,1,0,5],  sent: 28 },
]
const DAILY_B: DayRow[] = [
  { d: '2026-07-20', lab: '07/20', ts: 131, mb: 72,  pos: 59, loan: 32, nd: 0, a: 257, sat: [0,0,0,1,16], sent: 34 },
  { d: '2026-07-21', lab: '07/21', ts: 109, mb: 73,  pos: 33, loan: 16, nd: 0, a: 182, sat: [1,0,0,0,7],  sent: 26 },
  { d: '2026-07-22', lab: '07/22', ts: 147, mb: 78,  pos: 38, loan: 24, nd: 0, a: 213, sat: [0,0,0,2,7],  sent: 33 },
  { d: '2026-07-23', lab: '07/23', ts: 150, mb: 70,  pos: 28, loan: 28, nd: 0, a: 194, sat: [0,0,0,0,11], sent: 32 },
  { d: '2026-07-24', lab: '07/24', ts: 207, mb: 86,  pos: 47, loan: 20, nd: 0, a: 206, sat: [0,0,0,0,7],  sent: 41 },
  { d: '2026-07-25', lab: '07/25', ts: 82,  mb: 53,  pos: 26, loan: 0,  nd: 0, a: 114, sat: [0,0,0,0,2],  sent: 18 },
  { d: '2026-07-26', lab: '07/26', ts: 89,  mb: 30,  pos: 17, loan: 2,  nd: 0, a: 90,  sat: [0,0,0,0,2],  sent: 16 },
]
// W4: 2026.07.27–08.02  (PDF: Дуудлагын тов 7 хоногийн тайлан)
// Channels: ts=Техник туслах 707, mb=MBusiness Plus 393, pos=MBank POS 226, nd=Оператор 101, loan=Бизнес зээл 59
// a = хариулсан+шилжүүлсэн = 1077/1486 = 72.5% success  CSAT: 4.66/5 (89 resp)
const DAILY_C: DayRow[] = [
  { d: '2026-07-27', lab: '07/27', ts: 136, mb: 75, pos: 43, loan: 11, nd: 19, a: 206, sat: [0,0,1,2,14], sent: 20 },
  { d: '2026-07-28', lab: '07/28', ts: 126, mb: 70, pos: 40, loan: 11, nd: 18, a: 192, sat: [0,1,0,1,13], sent: 18 },
  { d: '2026-07-29', lab: '07/29', ts: 87,  mb: 48, pos: 28, loan: 7,  nd: 12, a: 132, sat: [0,0,1,1,9],  sent: 13 },
  { d: '2026-07-30', lab: '07/30', ts: 102, mb: 57, pos: 33, loan: 8,  nd: 15, a: 155, sat: [0,0,1,2,10], sent: 15 },
  { d: '2026-07-31', lab: '07/31', ts: 110, mb: 61, pos: 35, loan: 9,  nd: 16, a: 167, sat: [1,1,1,2,10], sent: 16 },
  { d: '2026-08-01', lab: '08/01', ts: 80,  mb: 44, pos: 25, loan: 7,  nd: 11, a: 122, sat: [0,0,1,1,8],  sent: 11 },
  { d: '2026-08-02', lab: '08/02', ts: 66,  mb: 38, pos: 22, loan: 6,  nd: 10, a: 103, sat: [0,0,0,1,7],  sent: 10 },
]
// W5: 2026.08.03–08.09  (Book1.pdf — зөв өдөр бүрийн тоо)
// Channels: ts≈37.5%, mb≈45%, pos≈15.1%, loan≈2.3%, nd≈0.1% (W5 PDF суваг хувиар)
// Нийт: 4,961  Авсан: 1,383 (27.9%)  Unique: 1,373  Tickets: 1,318  CSAT: 3.68/5
const DAILY_D: DayRow[] = [
  { d: '2026-08-03', lab: '08/03', ts: 125, mb: 150, pos: 50, loan: 8,  nd: 0, a: 166, sat: [2,1,21,2,17],  sent: 10 },
  { d: '2026-08-04', lab: '08/04', ts: 97,  mb: 117, pos: 39, loan: 6,  nd: 1, a: 181, sat: [2,1,16,1,13],  sent: 7  },
  { d: '2026-08-05', lab: '08/05', ts: 96,  mb: 115, pos: 39, loan: 5,  nd: 0, a: 199, sat: [2,1,16,1,13],  sent: 7  },
  { d: '2026-08-06', lab: '08/06', ts: 1063,mb: 1276,pos: 429,loan: 64, nd: 3, a: 338, sat: [19,11,188,15,154],sent: 86 },
  { d: '2026-08-07', lab: '08/07', ts: 317, mb: 380, pos: 128,loan: 19, nd: 1, a: 275, sat: [6,3,55,4,44],   sent: 25 },
  { d: '2026-08-08', lab: '08/08', ts: 54,  mb: 65,  pos: 22, loan: 4,  nd: 0, a: 96,  sat: [1,1,10,1,7],   sent: 4  },
  { d: '2026-08-09', lab: '08/09', ts: 108, mb: 129, pos: 44, loan: 7,  nd: 0, a: 128, sat: [2,1,18,2,17],  sent: 11 },
]
// W6: 2026.08.10–08.16
// Нийт: 1,867  Авсан: 1,127 (60.4%)  Unique: 657  Tickets: 1,232  CSAT: 3.59/5
const DAILY_E: DayRow[] = [
  { d: '2026-08-10', lab: '08/10', ts: 212, mb: 108, pos: 37, loan: 12, nd: 0, a: 235, sat: [7,14,26,35,30],  sent: 112 },
  { d: '2026-08-11', lab: '08/11', ts: 200, mb: 102, pos: 35, loan: 11, nd: 0, a: 220, sat: [7,13,24,32,28],  sent: 104 },
  { d: '2026-08-12', lab: '08/12', ts: 212, mb: 108, pos: 37, loan: 12, nd: 0, a: 243, sat: [8,14,27,35,31],  sent: 115 },
  { d: '2026-08-13', lab: '08/13', ts: 176, mb: 90,  pos: 31, loan: 10, nd: 0, a: 150, sat: [5,9,17,22,18],   sent: 71  },
  { d: '2026-08-14', lab: '08/14', ts: 148, mb: 76,  pos: 26, loan: 8,  nd: 0, a: 134, sat: [4,8,15,20,17],   sent: 64  },
  { d: '2026-08-15', lab: '08/15', ts: 78,  mb: 40,  pos: 14, loan: 4,  nd: 0, a: 88,  sat: [3,5,10,13,11],   sent: 42  },
  { d: '2026-08-16', lab: '08/16', ts: 46,  mb: 23,  pos: 8,  loan: 2,  nd: 1, a: 57,  sat: [2,3,6,8,8],      sent: 27  },
]
// W7: 2026.08.17–08.23
// Нийт: 2,148  Авсан: 1,065 (49.6%)  Unique: 917  Tickets: 1,134  CSAT: 3.79/5
// Channels: ts=Technical support 60.2%, mb=MBusiness Plus 24.3%, pos=MBank POS 11.4%, loan=Business loan 4.1%
// Exact daily values from Dail_33.pdf: нийт/авсан/эргэн холбогдолт per day
// Channel values adjusted to match daily нийт totals (337,235,799,227,319,100,131) = 2,148
// Answered deltas from PDF rounding land on 08/19 (outage flood day) so the week sums to 1,065
const DAILY_F: DayRow[] = [
  { d: '2026-08-17', lab: '08/17', ts: 203, mb: 82,  pos: 39, loan: 13, nd: 0, a: 185, sat: [3,5,14,26,20],  sent: 179, cb: 9 },
  { d: '2026-08-18', lab: '08/18', ts: 141, mb: 57,  pos: 27, loan: 10, nd: 0, a: 173, sat: [2,3,10,18,13],  sent: 121, cb: 2 },
  { d: '2026-08-19', lab: '08/19', ts: 485, mb: 193, pos: 89, loan: 32, nd: 0, a: 229, sat: [7,11,33,61,46], sent: 420, cb: 8 },
  { d: '2026-08-20', lab: '08/20', ts: 136, mb: 56,  pos: 26, loan: 9,  nd: 0, a: 149, sat: [2,3,9,17,13],   sent: 119, cb: 3 },
  { d: '2026-08-21', lab: '08/21', ts: 192, mb: 77,  pos: 37, loan: 13, nd: 0, a: 185, sat: [3,5,14,25,19],  sent: 172, cb: 9 },
  { d: '2026-08-22', lab: '08/22', ts: 60,  mb: 24,  pos: 11, loan: 5,  nd: 0, a: 65,  sat: [1,1,4,8,6],     sent: 53,  cb: 2 },
  { d: '2026-08-23', lab: '08/23', ts: 79,  mb: 30,  pos: 15, loan: 7,  nd: 0, a: 79,  sat: [2,2,6,10,8],    sent: 70,  cb: 3 },
]
// W8: 2026.08.24–08.30 — Нийт: 1,399  Авсан: 1,096 (78.3%)  Unique: 711  Transferred: 14  Нөхөж: 35
// Channels: ts=Technical Support 748 (76.7%), mb=MBusiness Plus 368 (82.9%), pos=MBank POS 200 (75.0%), loan=Business Loan 83 (80.7%)
// a/cb from data.pdf; channel counts adjusted to match weekly totals (ts=748,mb=368,pos=200,loan=83)
// Per-day `a` spread +19 vs raw PDF rounding so the week sums to the reported 1,096 answered
const DAILY_G: DayRow[] = [
  { d: '2026-08-24', lab: '08/24', ts: 108, mb: 55, pos: 43, loan: 12, nd: 0, a: 184, sat: [0,0,0,0,0],  sent: 190, cb: 9,  cbNeed: 9  },
  { d: '2026-08-25', lab: '08/25', ts: 129, mb: 57, pos: 34, loan: 9,  nd: 0, a: 172, sat: [0,0,0,0,0],  sent: 194, cb: 2,  cbNeed: 8  },
  { d: '2026-08-26', lab: '08/26', ts: 119, mb: 60, pos: 24, loan: 22, nd: 0, a: 193, sat: [0,0,0,0,0],  sent: 193, cb: 5,  cbNeed: 7  },
  { d: '2026-08-27', lab: '08/27', ts: 133, mb: 72, pos: 35, loan: 14, nd: 0, a: 207, sat: [0,0,0,0,2],  sent: 217, cb: 1,  cbNeed: 10 },
  { d: '2026-08-28', lab: '08/28', ts: 135, mb: 59, pos: 25, loan: 19, nd: 0, a: 191, sat: [1,0,0,1,18], sent: 205, cb: 7,  cbNeed: 9  },
  { d: '2026-08-29', lab: '08/29', ts: 66,  mb: 42, pos: 21, loan: 6,  nd: 0, a: 78,  sat: [1,0,0,0,3],  sent: 114, cb: 10, cbNeed: 10 },
  { d: '2026-08-30', lab: '08/30', ts: 58,  mb: 23, pos: 18, loan: 1,  nd: 0, a: 71,  sat: [0,0,0,0,9],  sent: 78,  cb: 1,  cbNeed: 2  },
]
const DAILY_ALL: DayRow[] = DAILY_A.filter(r => r.d <= '2026-07-19').concat(DAILY_B).concat(DAILY_C).concat(DAILY_D).concat(DAILY_E).concat(DAILY_F).concat(DAILY_G)

// ── Hourly load data ──────────────────────────────────────────────────────────
// Format: [hour, answered, missed, timeout]
const HOURLY: HourRow[] = [
  ['08',32,5,6],['09',150,25,43],['10',189,25,37],['11',144,10,22],
  ['12',190,46,80],['13',135,19,12],['14',149,24,40],['15',114,23,26],
  ['16',132,15,16],['17',124,23,26],['18',39,17,43],['19',29,11,43],
]
// W4 hourly — from PDF page 4 total per hour, split by W4 rates (ans 68.6%, miss 11.1%, timeout 20.3%)
const HOURLY_W4: HourRow[] = [
  ['08',32,5,9],['09',93,15,28],['10',108,18,32],['11',96,16,28],
  ['12',116,19,34],['13',111,18,33],['14',106,17,31],['15',89,15,26],
  ['16',73,11,22],['17',90,14,27],['18',73,12,22],['19',32,5,10],
]

// W6 hourly — цагийн нийт (chart 08:00–19:00), 60.4% ans, ~21% miss, ~19% timeout
const HOURLY_W6: HourRow[] = [
  ['08',22,8,7],['09',91,32,28],['10',124,43,38],['11',109,38,34],
  ['12',102,35,32],['13',110,38,34],['14',85,29,26],['15',158,55,48],
  ['16',114,40,35],['17',121,42,37],['18',70,24,22],['19',33,11,10],
]

// W7 hourly — PDF page 4 цагийн нийт. 49.6% ans, ~50.4% miss
const HOURLY_W7: HourRow[] = [
  ['08',9,10,0],['09',75,77,0],['10',92,93,0],['11',77,78,0],
  ['12',93,94,0],['13',68,69,0],['14',79,81,0],['15',91,92,0],
  ['16',68,70,0],['17',276,281,0],['18',88,89,0],['19',49,49,0],
]

// W8 hourly — weekly_report_v3.pdf цагийн ачаалал. 78.3% ans, 21.7% miss
const HOURLY_W8: HourRow[] = [
  ['08',23,6,0],['09',91,25,0],['10',118,33,0],['11',121,33,0],
  ['12',121,33,0],['13',109,30,0],['14',120,33,0],['15',112,31,0],
  ['16',105,29,0],['17',85,23,0],['18',67,18,0],['19',26,7,0],
]

// ── Channel config for daily stacked chart ────────────────────────────────────
const CH = [
  { k: 'ts',   n: 'Technical support', c: C.blue   },
  { k: 'mb',   n: 'MBusiness Plus',    c: C.teal   },
  { k: 'pos',  n: 'MBank POS',         c: C.violet },
  { k: 'loan', n: 'Business loan',     c: C.gold   },
  { k: 'nd',   n: 'Оператор',          c: C.pink   },
]

// W5 hourly — PDF page 4 цагийн нийт, Book1 авсан хувиаар (ans 27.9%, timeout 45.1%, abandoned 27%)
const HOURLY_W5: HourRow[] = [
  ['08',149,240,145],['09',230,372,224],['10',214,345,208],['11',129,208,126],
  ['12',89,143,86],['13',63,101,61],['14',67,108,65],['15',140,226,136],
  ['16',85,138,83],['17',81,131,78],['18',69,112,67],['19',67,109,65],
]

// ── Transferred tickets ───────────────────────────────────────────────────────
const A_RECV = [
  { n: 'Baaska.U',       team: 'Суулгалт/Сургалт',   ok: 6, wait: 0, unres: 0 },
  { n: 'Tsogbayar (IT)', team: 'Техникийн засвар',   ok: 6, wait: 0, unres: 0 },
  { n: 'Tsenguun',       team: 'MPOS тохиргоо',      ok: 2, wait: 3, unres: 0 },
  { n: 'Bymbatogtokh.T', team: 'Техникийн дэмжлэг', ok: 0, wait: 5, unres: 0 },
  { n: 'Tugssaikhan.G',  team: 'MBPlus дэмжлэг',    ok: 1, wait: 3, unres: 0 },
  { n: 'Odbayar.Ts',     team: 'ProPOS/LitePOS',     ok: 2, wait: 1, unres: 0 },
  { n: 'Erdenebayar',    team: 'Техникийн баг',      ok: 0, wait: 0, unres: 2 },
  { n: 'Otgonbayar',     team: 'Техникийн баг',      ok: 0, wait: 0, unres: 2 },
  { n: 'Khaliunaa.P',    team: 'Санхүүгийн дэмжлэг',ok: 2, wait: 0, unres: 0 },
  { n: 'Octa.Tuguldur',  team: 'Техникийн баг',      ok: 0, wait: 2, unres: 0 },
]
const C_RECV = [
  { n: 'Baagii',       team: 'Техникийн баг',    ok: 5, wait: 0, unres: 0 },
  { n: 'Tsenguun',     team: 'MPOS тохиргоо',   ok: 4, wait: 0, unres: 0 },
  { n: 'Tugssaikhan.G',team: 'MBPlus дэмжлэг',  ok: 4, wait: 0, unres: 0 },
  { n: 'Ganchimeg.A',  team: 'Техникийн баг',   ok: 4, wait: 0, unres: 0 },
  { n: 'Munkh-Orgil',  team: 'Техникийн баг',   ok: 4, wait: 0, unres: 0 },
  { n: 'Tsogoo',       team: 'IT баг',           ok: 3, wait: 0, unres: 0 },
  { n: 'Tumen-Ulzii',  team: 'Техникийн баг',   ok: 3, wait: 0, unres: 0 },
  { n: 'Zolbayr',      team: 'Техникийн баг',   ok: 2, wait: 0, unres: 0 },
]

// W6 transferred ticket receivers
const E_RECV = [
  { n: 'Baaska.U',      team: 'Суулгалт/Сургалт', ok: 23, wait: 0, unres: 0 },
  { n: 'Ganchimeg.A',   team: 'Техникийн баг',    ok: 11, wait: 0, unres: 0 },
  { n: 'Tsogoo',        team: 'IT баг',            ok: 10, wait: 0, unres: 0 },
  { n: 'Baagii',        team: 'Техникийн баг',    ok: 9,  wait: 0, unres: 0 },
  { n: 'Tumen-Ulzii',   team: 'Техникийн баг',    ok: 6,  wait: 0, unres: 0 },
  { n: 'Octa.Tuguldur', team: 'Техникийн баг',    ok: 4,  wait: 0, unres: 0 },
  { n: 'Dolgor.P',      team: 'Техникийн баг',    ok: 4,  wait: 0, unres: 0 },
  { n: 'Tsenguun',      team: 'MPOS тохиргоо',    ok: 4,  wait: 0, unres: 0 },
]

// ── Aggregates ────────────────────────────────────────────────────────────────
type Agg = {
  uniq: number
  callTransferred: number | null
  resolved: number
  unresolved: number
  tkTransferred: number
  channels: ReturnType<typeof mkCh>
  products: ReturnType<typeof mkPr>
  issues: ReturnType<typeof mkIs>
  agents: ReturnType<typeof mkAg>
  recv: typeof A_RECV
}
const RA: Agg = {
  uniq: 845, callTransferred: 20 as number | null, resolved: 1328, unresolved: 20, tkTransferred: 52,
  channels: mkCh([['Утасаар',1116],['Remote',224],['Сошиал',56],['Биечлэн',3],['Дуудлагаар',1]]),
  products: mkPr([['PROPOS',970],['MPLUS',337],['MPOS',83],['MOBILEPOS',5],['LITEPOS',5]]),
  issues: mkIs([['Программын тохиргоо',92,'Тохиргоо'],['Бусад мэдээлэл',80,'Мэдээлэл'],['MBusiness Plus мэдээлэл',71,'Мэдээлэл'],['MBusiness Plus алдаа',58,'Алдаа'],['MBusiness Plus засвар',55,'Засвар'],['Нөхөж залгасан',54,'Мэдээлэл'],['MBusiness Plus сургалт',49,'Сургалт'],['Төлбөрийн мэдээлэл',47,'Санхүү'],['MBusiness Plus бүтээгдэхүүн',39,'Бүтээгдэхүүн'],['Мбанк пос мэдээлэл',36,'Мэдээлэл'],['Интернет мэдээлэл',33,'Мэдээлэл'],['Ибаримттай холбоотой',29,'Мэдээлэл'],['Принтерийн тохиргоо',28,'Тохиргоо'],['Принтер засвар',28,'Засвар'],['Мбанк бусад',28,'Мэдээлэл']]),
  agents: mkAg([['Otgonbayar.L',222,219,5.3,4.7],['Soyolzul.Ts',173,190,4.9,3.9],['Zolbayar.G',156,85,5.5,3.2],['Zolbayar.U',143,135,4.5,5.0],['Bymbatogtokh',123,103,5.9,5.0],['Bujinlkham.T',85,88,4.9,null],['Tugssaikhan.G',83,79,3.0,null],['Tsogbayar',80,120,5.2,4.5],['Saranchimeg',79,48,6.1,5.0],['Baasanjargal',76,110,3.9,null],['Turmandakh.O',57,123,4.0,5.0],['Unubold.T',39,27,5.2,null],['Baterdene',30,33,4.0,null],['Bayarmaa.T',24,0,2.0,5.0],['Khaliunaa.P',21,24,3.7,null],['Bayarmaa.N',21,1,2.5,5.0],['Tsevelmaa',11,0,2.0,null],['Bayarsaikhan.E',2,8,1.1,null],['Sumiya.D',2,2,1.2,null]]),
  recv: A_RECV,
}
const RB: Agg = {
  uniq: 618, callTransferred: null as number | null, resolved: 1222, unresolved: 23, tkTransferred: 11,
  channels: mkCh([['Утасаар',1143],['Remote',38],['Сошиал',63],['Биечлэн',13],['Дуудлагаар',0]]),
  products: mkPr([['PROPOS',813],['MPLUS',339],['MPOS',100],['MOBILEPOS',0],['LITEPOS',4]]),
  issues: mkIs([['Программын тохиргоо',77,'Тохиргоо'],['Бусад мэдээлэл',70,'Мэдээлэл'],['MBusiness Plus мэдээлэл',55,'Мэдээлэл'],['Мбанк пос мэдээлэл',42,'Мэдээлэл'],['MBusiness Plus сургалт',38,'Сургалт'],['РД солих',29,'Засвар'],['Төлбөрийн мэдээлэл',28,'Санхүү'],['Нөхөж залгасан',27,'Мэдээлэл'],['Мбанк бусад',26,'Мэдээлэл'],['MBusiness Plus бүтээгдэхүүн',22,'Бүтээгдэхүүн']]),
  agents: mkAg([['Otgonbayar.L',242,null,11.5,null],['Zolbayar.U',149,null,25.8,null],['Bymbatogtokh',134,null,23.2,null],['Zolbayar.G',132,null,21.2,null],['Bujinlkham.T',122,null,8.5,null],['Tugssaikhan.G',118,null,13.7,null],['Soyolzul.Ts',114,null,25.0,null],['Yumjirdulam',84,null,27.5,null],['Bayarsaikhan.E',73,null,16.4,null],['Saranchimeg',70,null,14.4,null],['Turmandakh.O',49,null,20.0,null],['Bayarmaa.N',38,null,42.5,null],['Bayarmaa.T',38,null,10.2,null],['Tsevelmaa',38,null,24.0,null],['Baasanjargal',10,null,13.3,null]]),
  recv: [] as typeof A_RECV,
}
// W4: 2026.07.27–08.02  —  1,486 дуудлага · 1,077 тикет · Success 72.5% · CSAT 4.66/5
const RC: Agg = {
  uniq: 725, callTransferred: null as number | null, resolved: 1024, unresolved: 21, tkTransferred: 53,
  channels: mkCh([['Утасаар',1300],['Remote',100],['Сошиал',60],['Биечлэн',20],['Дуудлагаар',6]]),
  products: mkPr([['PROPOS',530],['MPLUS',408],['MPOS',60],['LITEPOS',4],['MOBILEPOS',1]]),
  issues: mkIs([
    ['MBusiness Plus мэдээлэл',133,'Мэдээлэл'],['Программын тохиргоо',60,'Тохиргоо'],
    ['MBusiness Plus засвар',59,'Засвар'],['MBusiness Plus сургалт',57,'Сургалт'],
    ['Бусад мэдээлэл',53,'Мэдээлэл'],['Төлбөрийн мэдээлэл',52,'Санхүү'],
    ['MBusiness Plus санхүү',39,'Санхүү'],['MBusiness Plus бүтээгдэхүүн',31,'Бүтээгдэхүүн'],
  ]),
  agents: mkAg([
    ['Otgonbayar.L',151,157,4.6,3.38],['Zolbayar.U',117,116,2.9,3.00],
    ['Tugssaikhan.G',93,107,3.8,3.50],['Zolbayar.G',85,64,4.8,4.88],
    ['Bayarsaikhan.E',83,60,7.1,4.93],['Byambatogtokh.T',78,82,5.2,3.00],
    ['Bujinlkham.T',73,80,4.5,null],['Turmandakh.O',73,87,4.2,4.87],
    ['Soyolzul.Ts',67,106,3.2,3.00],['Unubold.T',44,49,3.1,null],
  ]),
  recv: C_RECV,
}
// W5: 2026.08.03–08.09  —  4,961 дуудлага · 1,318 тикет · Answered 27.9% · CSAT 3.68/5
const RD: Agg = {
  uniq: 1373, callTransferred: null as number | null, resolved: 1246, unresolved: 40, tkTransferred: 62,
  channels: mkCh([['Утасаар',1100],['Remote',160],['Сошиал',50],['Биечлэн',8],['Дуудлагаар',0]]),
  products: mkPr([['MPLUS',618],['PROPOS',614],['MPOS',76],['LITEPOS',9],['MOBILEPOS',1]]),
  issues: mkIs([
    ['MBusiness Plus мэдээлэл',181,'Мэдээлэл'],['Программын тохиргоо',122,'Тохиргоо'],
    ['Бусад мэдээлэл',108,'Мэдээлэл'],['MBusiness Plus алдаа',103,'Алдаа'],
    ['MBusiness Plus засвар',65,'Засвар'],['MBusiness Plus сургалт',43,'Сургалт'],
    ['Ибаримтай холбоотой',51,'Мэдээлэл'],['Төлбөрийн мэдээлэл',34,'Санхүү'],
  ]),
  agents: mkAg([
    ['Otgonbayar.L',227,235,4.33,null],['Bymbatogtokh.T',155,155,5.70,null],
    ['Bayartsogt',155,145,2.37,null],['Yumjirdulam',136,65,4.14,null],
    ['Tugssaikhan.G',134,117,3.55,null],['Bayarsaikhan.E',102,96,5.13,null],
    ['Zolbayr',95,89,3.72,null],['Saranchimeg',82,89,6.90,null],
    ['Bujinlkham.T',74,76,4.47,null],['Turmandakh.O',72,91,3.66,null],
    ['Unubold.T',70,84,3.91,null],['Baaska.U',16,22,1.72,null],
  ]),
  recv: [] as typeof A_RECV,
}
// W6: 2026.08.10–08.16  —  1,867 дуудлага · 1,232 тикет · Answered 60.4% · CSAT 3.59/5
const RE: Agg = {
  uniq: 657, callTransferred: null as number | null, resolved: 1115, unresolved: 52, tkTransferred: 65,
  channels: mkCh([['Утасаар',1050],['Remote',110],['Сошиал',50],['Биечлэн',18],['Дуудлагаар',4]]),
  products: mkPr([['PROPOS',620],['MPLUS',513],['MPOS',92],['LITEPOS',5],['MOBILEPOS',2]]),
  issues: mkIs([
    ['MBusiness Plus мэдээлэл',200,'Мэдээлэл'],['Бусад мэдээлэл',120,'Мэдээлэл'],
    ['Программын тохиргоо',100,'Тохиргоо'],['MBusiness Plus алдаа',95,'Алдаа'],
    ['MBusiness Plus засвар',90,'Засвар'],['MBusiness Plus сургалт',85,'Сургалт'],
    ['Төлбөрийн мэдээлэл',55,'Санхүү'],['Мбанк пос мэдээлэл',40,'Мэдээлэл'],
    ['MBusiness Plus бүтээгдэхүүн',40,'Бүтээгдэхүүн'],['Ибаримттай холбоотой',35,'Мэдээлэл'],
  ]),
  agents: mkAg([
    ['Tugssaikhan.G',  146, 147, 4.1, null],
    ['Saranchimeg',    132, 123, 6.6, null],
    ['Otgonbayar.L',   123, 126, 4.3, null],
    ['Bayarsaikhan.E', 113, 109, 4.1, null],
    ['Bymbatogtokh.T',  99,  96, 5.0, null],
    ['Yumjirdulam',     98,  63, 4.2, null],
    ['Tsenguun',        88,  81, 5.7, null],
    ['Unubold.T',       84,  97, 3.1, null],
    ['Zolbayr',         81,  91, 4.0, null],
    ['Bujinlkham.T',    58,  63, 3.5, null],
    ['Bayartsogt',      56, 121, 1.5, null],
  ]),
  recv: E_RECV,
}
// W7 transferred ticket receivers — ok=шийдсэн, wait=шилжүүлсэн хэвээрээ, unres=шийдэгдээгүй
const F_RECV = [
  { n: 'tsogoo',        team: 'IT баг',            ok: 24, wait: 0, unres: 0 },
  { n: 'Tsenguun',      team: 'MPOS тохиргоо',     ok: 6,  wait: 1, unres: 0 },
  { n: 'Otgonbayar.L',  team: 'Техникийн баг',     ok: 5,  wait: 1, unres: 0 },
  { n: 'Baaska.U',      team: 'Суулгалт/Сургалт',  ok: 4,  wait: 0, unres: 1 },
  { n: 'Octa.Tuguldur', team: 'Техникийн баг',     ok: 4,  wait: 1, unres: 0 },
  { n: 'Ganchimeg.A',   team: 'Техникийн баг',     ok: 3,  wait: 1, unres: 0 },
  { n: 'Zolbayr',       team: 'Техникийн баг',     ok: 3,  wait: 1, unres: 0 },
  { n: 'Bayarmaa.T',    team: 'Техникийн дэмжлэг', ok: 2,  wait: 1, unres: 0 },
]
// W7: 2026.08.17–08.23  —  2,148 дуудлага · 1,134 тикет · Answered 49.6% · CSAT 3.79/5
const RF: Agg = {
  uniq: 917, callTransferred: null as number | null, resolved: 1067, unresolved: 28, tkTransferred: 84,
  channels: mkCh([['Утасаар',900],['Remote',187],['Сошиал',30],['Биечлэн',12],['Дуудлагаар',5]]),
  products: mkPr([['PROPOS',657],['MPLUS',354],['MPOS',110],['LITEPOS',10],['MOBILEPOS',3]]),
  issues: mkIs([
    ['MBusiness Plus мэдээлэл',100,'Мэдээлэл'],['Бусад мэдээлэл',86,'Мэдээлэл'],
    ['Программын тохиргоо',79,'Тохиргоо'],['MBusiness Plus бүтээгдэхүүн',47,'Бүтээгдэхүүн'],
    ['Мэдээлэл - И-баримт',44,'Мэдээлэл'],['Алдаа - И-баримт',33,'Алдаа'],
    ['MBusiness Plus сургалт',33,'Сургалт'],['MBusiness Plus засвар',31,'Засвар'],
  ]),
  agents: mkAg([
    ['Otgonbayar.L',  207, 214, 4.67, 3.79],
    ['Yumjirdulam',   131, 77,  2.82, 3.79],
    ['Saranchimeg',   104, 114, 4.83, 3.79],
    ['Bayartsogt',    96,  104, 3.05, 3.79],
    ['Zolbayr',       96,  113, 4.14, 3.79],
    ['Tugssaikhan.G', 84,  88,  3.33, 3.79],
    ['Bayarsaikhan.E',76,  87,  4.60, 3.79],
    ['Bujinlkham.T',  74,  85,  5.66, 3.79],
    ['Unubold.T',     59,  92,  2.68, null],
    ['Turmandakh.O',  53,  83,  6.06, null],
    ['Tsevelmaa',     38,  null,1.67, null],
    ['Bayarmaa.Nyam', 24,  3,   5.42, null],
    ['Bayarmaa.T',    15,  null,1.84, null],
    ['Tsenguun',      8,   5,   3.50, null],
  ]),
  recv: F_RECV,
}

// W8: 2026.08.24–08.30  —  1,399 дуудлага · ~1,190 тикет · Answered 78.3% · Transferred 14 · Нөхөж 35
const RG: Agg = {
  uniq: 711, callTransferred: 14 as number | null, resolved: 1162, unresolved: 14, tkTransferred: 14,
  channels: mkCh([['Утасаар',1100],['Remote',70],['Сошиал',15],['Биечлэн',5],['Дуудлагаар',0]]),
  products: mkPr([['PROPOS',748],['MPLUS',368],['MPOS',188],['LITEPOS',9],['MOBILEPOS',3]]),
  issues: mkIs([
    ['MBusiness Plus мэдээлэл',110,'Мэдээлэл'],['Бусад мэдээлэл',95,'Мэдээлэл'],
    ['Программын тохиргоо',88,'Тохиргоо'],['MBusiness Plus засвар',60,'Засвар'],
    ['MBusiness Plus сургалт',55,'Сургалт'],['MBusiness Plus алдаа',45,'Алдаа'],
    ['Төлбөрийн мэдээлэл',40,'Санхүү'],['MBusiness Plus бүтээгдэхүүн',35,'Бүтээгдэхүүн'],
  ]),
  agents: mkAg([
    ['Otgonbayar.L',   153, 157, 5.3, null],
    ['Yumjirdulam',    135, 115, 3.6, null],
    ['Bayartsogt',     94,  131, 4.3, null],
    ['Zolbayar.U',     94,  99,  3.4, null],
    ['Bayarsaikhan.E', 89,  91,  6.3, null],
    ['Bujinlkham.T',   81,  82,  4.3, null],
    ['Tugssaikhan.G',  79,  83,  6.0, null],
    ['Byambatogtokh.T',77,  80,  3.9, null],
    ['Saranchimeg',    76,  92,  5.0, null],
    ['Soyolzul.Ts',    51,  90,  3.7, null],
    ['Turmandakh.O',   49,  88,  4.0, null],
    ['Unubold.T',      46,  74,  2.8, null],
    ['Tsevelmaa',      29,  null,1.6, null],
    ['Bayarmaa.N',     27,  null,2.9, null],
    ['Bayarmaa.T',     10,  null,1.1, null],
    ['Tsenguun',       5,   8,   3.7, null],
  ]),
  recv: [] as typeof A_RECV,
}

// All 8 weeks combined
const RALL: Agg = {
  uniq: 5858, callTransferred: null as number | null, resolved: 8164, unresolved: 198, tkTransferred: 341,
  channels: mkCh([['Утасаар',7709],['Remote',889],['Сошиал',324],['Биечлэн',79],['Дуудлагаар',16]]),
  products: mkPr([['PROPOS',4952],['MPLUS',2937],['MPOS',709],['MOBILEPOS',15],['LITEPOS',46]]),
  issues: mkIs([
    ['MBusiness Plus мэдээлэл',690,'Мэдээлэл'],['Программын тохиргоо',520,'Тохиргоо'],
    ['Бусад мэдээлэл',497,'Мэдээлэл'],['MBusiness Plus сургалт',305,'Сургалт'],
    ['MBusiness Plus засвар',300,'Засвар'],['MBusiness Plus алдаа',289,'Алдаа'],
    ['Төлбөрийн мэдээлэл',216,'Санхүү'],['MBusiness Plus бүтээгдэхүүн',179,'Бүтээгдэхүүн'],
    ['Ибаримттай холбоотой',159,'Мэдээлэл'],['Нөхөж залгасан',111,'Мэдээлэл'],
    ['Мбанк пос мэдээлэл',118,'Мэдээлэл'],['Мбанк бусад',79,'Мэдээлэл'],
    ['MBusiness Plus санхүү',59,'Санхүү'],['Интернет мэдээлэл',48,'Мэдээлэл'],['РД солих',39,'Засвар'],
  ]),
  agents: mkAg([
    ['Otgonbayar.L',1325,1108,5.2,4.7],['Bymbatogtokh',666,516,8.5,5.0],
    ['Tugssaikhan.G',737,621,5.2,3.50],['Bujinlkham.T',567,474,4.8,null],
    ['Yumjirdulam',584,320,8.5,null],['Bayarsaikhan.E',538,451,7.5,4.93],
    ['Saranchimeg',543,466,7.2,5.0],['Zolbayar.U',503,350,10.0,5.0],
    ['Soyolzul.Ts',405,386,8.5,3.9],['Turmandakh.O',353,472,6.5,5.0],
    ['Unubold.T',342,423,3.8,null],['Bayartsogt',401,501,2.5,null],
    ['Zolbayar.G',373,149,9.0,4.88],['Zolbayr',272,293,3.8,null],
    ['Tsenguun',101,94,5.2,null],['Tsevelmaa',78,0,1.7,null],
    ['Bayarmaa.Nyam',110,4,18.0,5.0],['Bayarmaa.T',87,0,4.5,5.0],
    ['Baasanjargal',86,110,5.0,null],['Tsogbayar',80,120,5.2,4.5],
    ['Khaliunaa.P',21,24,3.7,null],['Baaska.U',16,22,1.72,null],
  ]),
  recv: [...A_RECV, ...C_RECV, ...E_RECV, ...F_RECV],
}

// Roll several weekly aggregates up into one (for the month / all views).
// Sums counts, call-weights the per-agent minutes & rating, re-colours by rank.
function mergeAgg(...list: Agg[]): Agg {
  const mergeNamed = (arrs: { n: string; v: number }[][], cols: string[]) => {
    const m = new Map<string, number>()
    for (const arr of arrs) for (const it of arr) m.set(it.n, (m.get(it.n) ?? 0) + it.v)
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([n, v], i) => ({ n, v, c: cols[i % cols.length] }))
  }
  const issues = (() => {
    const m = new Map<string, { v: number; t: string }>()
    for (const arr of list.map(a => a.issues)) for (const it of arr) {
      const e = m.get(it.n)
      if (e) e.v += it.v
      else m.set(it.n, { v: it.v, t: it.t })
    }
    return [...m.entries()].sort((a, b) => b[1].v - a[1].v).slice(0, 15).map(([n, e]) => ({ n, v: e.v, t: e.t }))
  })()
  const agents = (() => {
    const m = new Map<string, { n: string; c: number; tk: number | null; tS: number; tW: number; rS: number; rW: number }>()
    for (const ag of list) for (const a of ag.agents) {
      const e = m.get(a.n) ?? { n: a.n, c: 0, tk: null, tS: 0, tW: 0, rS: 0, rW: 0 }
      e.c += a.c
      if (a.tk != null) e.tk = (e.tk ?? 0) + a.tk
      e.tS += a.t * a.c; e.tW += a.c
      if (a.r != null) { e.rS += a.r * a.c; e.rW += a.c }
      m.set(a.n, e)
    }
    return [...m.values()]
      .map(e => ({ n: e.n, c: e.c, tk: e.tk, t: e.tW ? e.tS / e.tW : 0, r: e.rW ? e.rS / e.rW : null }))
      .sort((a, b) => b.c - a.c)
  })()
  const recv = (() => {
    const m = new Map<string, typeof A_RECV[number]>()
    for (const a of list) for (const r of a.recv) {
      const e = m.get(r.n) as ({ n: string; team: string; ok: number; wait: number; unres: number }) | undefined
      const u = (r as { unres?: number }).unres ?? 0
      if (e) { e.ok += r.ok; e.wait += r.wait; e.unres += u }
      else m.set(r.n, { n: r.n, team: r.team, ok: r.ok, wait: r.wait, unres: u })
    }
    return [...m.values()].sort((a, b) => b.ok + b.wait - (a.ok + a.wait))
  })()
  return {
    uniq: list.reduce((s, a) => s + a.uniq, 0),
    callTransferred: null,
    resolved: list.reduce((s, a) => s + a.resolved, 0),
    unresolved: list.reduce((s, a) => s + a.unresolved, 0),
    tkTransferred: list.reduce((s, a) => s + a.tkTransferred, 0),
    channels: mergeNamed(list.map(a => a.channels), CHCOL),
    products: mergeNamed(list.map(a => a.products), PRCOL),
    issues,
    agents,
    recv,
  }
}
const RM7 = mergeAgg(RA, RB, RC)
const RM8 = mergeAgg(RD, RE, RF, RG)
const JUL_DAYS = DAILY_ALL.filter(r => r.d < '2026-08-01').map(r => r.d)
const AUG_DAYS = DAILY_ALL.filter(r => r.d >= '2026-08-01').map(r => r.d)

// ── Reports config ─────────────────────────────────────────────────────────────
type RepKey = 'W1' | 'W2' | 'W3' | 'W4' | 'W5' | 'W6' | 'W7' | 'W8' | 'M7' | 'M8' | 'ALL'
const REPORTS: Record<RepKey, { daily: DayRow[]; agg: Agg; hourly: HourRow[]; label: string; defaultDays: string[] }> = {
  W1: { daily: DAILY_A, agg: RA, hourly: HOURLY, label: '07/06–07/12',
        defaultDays: DAILY_A.filter(r => r.d <= '2026-07-12').map(r => r.d) },
  W2: { daily: DAILY_A, agg: RA, hourly: HOURLY, label: '07/13–07/19',
        defaultDays: DAILY_A.filter(r => r.d >= '2026-07-13' && r.d <= '2026-07-19').map(r => r.d) },
  W3: { daily: DAILY_B, agg: RB, hourly: HOURLY, label: '07/20–07/26',
        defaultDays: DAILY_B.map(r => r.d) },
  W4: { daily: DAILY_C, agg: RC, hourly: HOURLY_W4, label: '07/27–08/02',
        defaultDays: DAILY_C.map(r => r.d) },
  W5: { daily: DAILY_D, agg: RD, hourly: HOURLY_W5, label: '08/03–08/09',
        defaultDays: DAILY_D.map(r => r.d) },
  W6: { daily: DAILY_E, agg: RE, hourly: HOURLY_W6, label: '08/10–08/16',
        defaultDays: DAILY_E.map(r => r.d) },
  W7: { daily: DAILY_F, agg: RF, hourly: HOURLY_W7, label: '08/17–08/23',
        defaultDays: DAILY_F.map(r => r.d) },
  W8: { daily: DAILY_G, agg: RG, hourly: HOURLY_W8, label: '08/24–08/30',
        defaultDays: DAILY_G.map(r => r.d) },
  M7: { daily: DAILY_ALL.filter(r => r.d < '2026-08-01'), agg: RM7, hourly: HOURLY, label: '7-р сар',
        defaultDays: JUL_DAYS },
  M8: { daily: DAILY_ALL.filter(r => r.d >= '2026-08-01'), agg: RM8, hourly: HOURLY, label: '8-р сар',
        defaultDays: AUG_DAYS },
  ALL: { daily: DAILY_ALL, agg: RALL, hourly: HOURLY, label: 'Нэгдсэн',
         defaultDays: DAILY_ALL.map(r => r.d) },
}

// Product name → DayRow channel key (сувгийн задаргааны тулгуур)
const PROD_CHAN: Record<string, string> = {
  'PROPOS':              'ts',
  'MPLUS':               'mb',
  'Mbusiness Plus Cass': 'mb',
  'MPOS':                'pos',
  'LITEPOS':             'pos',
  'MOBILEPOS':           'pos',
  'Business loan':       'loan',
  'Sungaltiin tulbur':   'nd',
}

// Per-channel answered success rates (PDF-с авсан тодорхой мэдээлэл)
const CHAN_RATES: Record<RepKey, Record<string, number>> = {
  W1:  { ts: 0.86,  mb: 0.82,  pos: 0.81,  loan: 0.80,  nd: 0.88 },
  W2:  { ts: 0.80,  mb: 0.78,  pos: 0.78,  loan: 0.80,  nd: 0.88 },
  W3:  { ts: 0.75,  mb: 0.72,  pos: 0.70,  loan: 0.80,  nd: 0.80 },
  W4:  { ts: 0.624, mb: 0.728, pos: 0.626, loan: 0.831, nd: 1.0  },
  W5:  { ts: 0.349, mb: 0.194, pos: 0.296, loan: 0.730, nd: 1.0  },
  W6:  { ts: 0.576, mb: 0.672, pos: 0.644, loan: 0.548, nd: 0.50 },
  W7:  { ts: 0.470, mb: 0.446, pos: 0.602, loan: 0.865, nd: 0.50 },
  W8:  { ts: 0.767, mb: 0.829, pos: 0.750, loan: 0.807, nd: 0.80 },
  M7:  { ts: 0.76,  mb: 0.71,  pos: 0.71,  loan: 0.81,  nd: 0.90 },
  M8:  { ts: 0.54,  mb: 0.54,  pos: 0.57,  loan: 0.74,  nd: 0.70 },
  ALL: { ts: 0.55,  mb: 0.50,  pos: 0.52,  loan: 0.78,  nd: 0.90 },
}

// Keywords to match issues to products for product-filter drill-down
const PROD_KEYS: Record<string, string[]> = {
  'MPLUS':      ['mbusiness plus','mplus','нөхөж','mbusiness'],
  'PROPOS':     ['программын тохиргоо','рд ','ибаримт','propos'],
  'MPOS':       ['мбанк пос','мбанк бусад','mpos','принтер'],
  'LITEPOS':    ['litepos'],
  'MOBILEPOS':  ['mobilepos'],
}
function issueMatchesProd(name: string, prod: string): boolean {
  const n = name.toLowerCase()
  const keys = PROD_KEYS[prod.toUpperCase()] ?? PROD_KEYS[prod] ?? []
  return keys.some(k => n.includes(k))
}

const TAGCOL: Record<string, string> = {
  'Тохиргоо': C.blue, 'Мэдээлэл': C.teal, 'Алдаа': C.coral,
  'Засвар': C.amber, 'Сургалт': C.violet, 'Санхүү': C.gold, 'Бүтээгдэхүүн': C.pink,
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const WD = ['Ня', 'Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя']
const dow = (isoDate: string) => new Date(isoDate + 'T00:00:00').getDay()
const weekday = (isoDate: string) => WD[dow(isoDate)]
const isWeekend = (isoDate: string) => { const d = dow(isoDate); return d === 0 || d === 6 }
const dayTot = (r: DayRow) => r.ts + r.mb + r.pos + r.loan + r.nd
// chTot is an alias for dayTot: the "Оператор" (nd) channel is a real queue, so it
// must be counted in call totals and success rates. Excluding it previously inflated
// the success KPI past 100% on operator-heavy weeks (W1/W2), where `a` counts nd
// answers but the denominator did not.
const chTot = dayTot
const fmt = (n: number) => Math.round(n).toLocaleString('en-US')

// Week-tab config: month groups + per-week call volume (for the mini load bars)
const MONTHS: { label: string; rep: RepKey; keys: RepKey[] }[] = [
  { label: '7-р сар', rep: 'M7', keys: ['W1', 'W2', 'W3', 'W4'] },
  { label: '8-р сар', rep: 'M8', keys: ['W5', 'W6', 'W7', 'W8'] },
]
const OVERVIEW: { rep: RepKey; label: string; sub: string; ic: string }[] = [
  { rep: 'ALL', label: 'Бүх хугацаа', sub: '8 долоо хоног', ic: '📊' },
  { rep: 'M7', label: '7-р сар', sub: '4 долоо хоног', ic: '📅' },
  { rep: 'M8', label: '8-р сар', sub: '4 долоо хоног', ic: '📅' },
]
const WEEK_VOL: Record<string, number> = Object.fromEntries(
  MONTHS.flatMap(m => m.keys).map(k => {
    const set = new Set(REPORTS[k].defaultDays)
    return [k, REPORTS[k].daily.filter(r => set.has(r.d)).reduce((a, r) => a + dayTot(r), 0)]
  }),
)
const WEEK_VOL_MAX = Math.max(...Object.values(WEEK_VOL), 1)

function sparkPath(vals: number[], w: number, h: number, pad: number) {
  const min = Math.min(...vals), max = Math.max(...vals), rng = (max - min) || 1
  const pts = vals.map((v, i) => [pad + i * (w - 2 * pad) / (vals.length - 1 || 1), h - pad - ((v - min) / rng) * (h - 2 * pad)])
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], cx = (x0 + x1) / 2
    d += ` C ${cx} ${y0} ${cx} ${y1} ${x1} ${y1}`
  }
  return { d, pts }
}
function mkSparkSvg(id: string, vals: number[], color: string) {
  const w = 220, h = 40, pad = 5
  if (vals.length < 2) return ''
  const { d, pts } = sparkPath(vals, w, h, pad)
  const last = pts[pts.length - 1]
  const hi = pts[vals.indexOf(Math.max(...vals))]
  return `<svg width="100%" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <defs><linearGradient id="g${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${color}" stop-opacity=".3"/>
      <stop offset="1" stop-color="${color}" stop-opacity="0"/>
    </linearGradient></defs>
    <path class="spk-fill" d="${d} L ${last[0]} ${h} L ${pts[0][0]} ${h} Z" fill="url(#g${id})"/>
    <path class="spk-line" pathLength="1" d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" style="filter:drop-shadow(0 0 4px ${color}88)"/>
    <circle class="spk-dot" cx="${hi[0]}" cy="${hi[1]}" r="3" fill="${color}" style="filter:drop-shadow(0 0 5px ${color})"/>
  </svg>`
}

/** rAF flag → false on mount, true next frame, so bars can transition up from 0. */
function useMountFlag() {
  const [lit, setLit] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setLit(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return lit
}

function DailyChart({ rows, selDays, selChan, onToggle }: {
  rows: DayRow[]
  selDays: Set<string>
  selChan: string | null
  onToggle: (d: string) => void
}) {
  const w = 760, h = 244, padB = 34, padT = 16, padL = 30, plot = h - padT - padB
  const [hover, setHover] = useState<string | null>(null)
  const lit = useMountFlag()
  const max = Math.max(...rows.map(r => chTot(r)), 1) * 1.12
  const bw = (w - padL - 8) / rows.length
  const barW = Math.min(bw * 0.62, 30)
  const chanVal = (r: DayRow) => selChan ? ((r as unknown) as Record<string, number>)[selChan] as number : chTot(r)
  const barTr = 'height .45s var(--ease-out), y .45s var(--ease-out), opacity .25s ease'
  return (
    <div className="chart-host" onMouseLeave={() => setHover(null)}>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
        {[0, 1, 2, 3, 4].map(g => {
          const y = padT + plot * g / 4
          return (
            <g key={g}>
              <line x1={padL} y1={y} x2={w - 4} y2={y} stroke="var(--c-grid)" strokeWidth={1} />
              <text x={0} y={y + 3} fill="var(--c-axis)" fontSize={9}>{Math.round(max * (1 - g / 4))}</text>
            </g>
          )
        })}
        {rows.map((r, i) => {
          const sel = selDays.has(r.d)
          const hovd = hover === r.d
          const x = padL + i * bw + (bw - barW) / 2
          const cx = padL + i * bw + bw / 2
          let acc = 0
          const segs = CH.map(ch => {
            const val = ((r as unknown) as Record<string, number>)[ch.k] as number
            const bh = lit && val > 0 ? val / max * plot : 0
            const y = h - padB - acc - bh
            acc += bh
            const isHl = !selChan || selChan === ch.k
            let op = sel ? (isHl ? 1 : 0.06) : (isHl ? 0.2 : 0.04)
            if (hovd && !sel && isHl) op = Math.min(1, op + 0.4)
            return { ch, bh, y, op, val }
          })
          const stackTop = h - padB - (lit ? chTot(r) / max * plot : 0)
          return (
            <g key={i}>
              <rect x={padL + i * bw} y={padT} width={bw} height={plot + 20} fill="transparent"
                style={{ cursor: 'pointer' }} onClick={() => onToggle(r.d)} onMouseEnter={() => setHover(r.d)} />
              {segs.map((s, j) => s.val > 0 && (
                <rect key={j} className="cz-bar" x={x} y={s.y} width={barW} height={s.bh} fill={s.ch.c} rx={1.5}
                  opacity={s.op} style={{ pointerEvents: 'none', transition: barTr }} />
              ))}
              <text x={cx} y={stackTop - 4} fill={sel ? 'var(--c-lbl-hi)' : 'var(--c-lbl-dim)'} fontSize={9} textAnchor="middle"
                fontWeight={600} style={{ pointerEvents: 'none', transition: 'y .45s var(--ease-out)' }}>{chanVal(r) || ''}</text>
              <text x={cx} y={h - padB + 14} fill={sel ? 'var(--c-lbl-hi)' : 'var(--c-lbl)'} fontSize={9} textAnchor="middle"
                fontWeight={sel ? 700 : 400} style={{ pointerEvents: 'none' }}>{r.lab}</text>
              {sel && <rect x={x} y={h - padB + 18} width={barW} height={2.5} rx={1.2} fill="var(--sel-1)" style={{ pointerEvents: 'none' }} />}
              {hovd && <line x1={cx} y1={padT} x2={cx} y2={h - padB} stroke="var(--c-cross)" strokeWidth={1} strokeDasharray="3 3" style={{ pointerEvents: 'none' }} />}
            </g>
          )
        })}
      </svg>
      {hover != null && (() => {
        const i = rows.findIndex(r => r.d === hover)
        if (i < 0) return null
        const r = rows[i]
        const leftPct = ((padL + i * bw + bw / 2) / w) * 100
        return (
          <div className="chart-tip" style={{ left: `clamp(64px, ${leftPct}%, calc(100% - 64px))` }}>
            <div className="chart-tip-h">{r.lab}</div>
            {CH.map(ch => {
              const v = ((r as unknown) as Record<string, number>)[ch.k] as number
              return v > 0 ? (
                <div key={ch.k} className="chart-tip-row">
                  <span><i style={{ background: ch.c }} />{ch.n}</span><b>{v}</b>
                </div>
              ) : null
            })}
            <div className="chart-tip-row chart-tip-tot"><span>Нийт</span><b>{chTot(r)}</b></div>
            <div className="chart-tip-row"><span>Авсан</span><b>{r.a}</b></div>
          </div>
        )
      })()}
    </div>
  )
}

function HourChart({ hourly, fac }: { hourly: HourRow[]; fac: number }) {
  const w = 900, h = 210, padB = 26, padT = 14, padL = 28, plot = h - padT - padB
  const [hover, setHover] = useState<number | null>(null)
  const lit = useMountFlag()
  const merged = hourly.map(r => [r[0], r[1] * fac, (r[2] + r[3]) * fac] as [string, number, number])
  const max = Math.max(...merged.map(r => r[1] + r[2]), 1) * 1.1
  const bw = (w - padL - 8) / merged.length
  const barW = Math.min(bw * 0.62, 44)
  const barTr = 'height .5s var(--ease-out), y .5s var(--ease-out), opacity .2s ease'
  return (
    <div className="chart-host" onMouseLeave={() => setHover(null)}>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
        {[0, 1, 2, 3, 4].map(g => {
          const y = padT + plot * g / 4
          return (
            <g key={g}>
              <line x1={padL} y1={y} x2={w - 4} y2={y} stroke="var(--c-grid)" />
              <text x={0} y={y + 3} fill="var(--c-axis)" fontSize={9}>{Math.round(max * (1 - g / 4))}</text>
            </g>
          )
        })}
        {merged.map((r, i) => {
          const x = padL + i * bw + (bw - barW) / 2
          const cx = padL + i * bw + bw / 2
          const tot = r[1] + r[2]
          const ansBh = lit ? r[1] / max * plot : 0
          const lossBh = lit ? r[2] / max * plot : 0
          const lossY = h - padB - lossBh
          const ansY = lossY - ansBh
          const topY = h - padB - (lit ? tot / max * plot : 0)
          const ansRate = tot > 0 ? Math.round(r[1] / tot * 100) : 0
          const hv = hover === i
          return (
            <g key={i}>
              <rect x={padL + i * bw} y={padT} width={bw} height={plot + 20} fill="transparent"
                onMouseEnter={() => setHover(i)} />
              {lossBh > 0 && <rect className="hz-bar" x={x} y={lossY} width={barW} height={lossBh} fill={C.coral} rx={1.5}
                opacity={hv ? 1 : 0.92} style={{ pointerEvents: 'none', transition: barTr }} />}
              {ansBh > 0 && <rect className="hz-bar" x={x} y={ansY} width={barW} height={ansBh} fill={C.teal} rx={1.5}
                opacity={hv ? 1 : 0.92} style={{ pointerEvents: 'none', transition: barTr }} />}
              {tot > 0 && (
                <text x={cx} y={topY - 4} fill="var(--c-lbl-hi)" fontSize={8.5} textAnchor="middle" fontWeight={600}
                  style={{ pointerEvents: 'none', fontFamily: 'Space Grotesk,Inter,sans-serif', transition: 'y .5s var(--ease-out)' }}>{Math.round(tot)}</text>
              )}
              {ansBh >= 13 && (
                <text x={cx} y={ansY + ansBh / 2 + 3} fill="#0d1b2a" fontSize={7.5} textAnchor="middle" fontWeight={800}
                  style={{ pointerEvents: 'none', fontFamily: 'Space Grotesk,Inter,sans-serif' }}>{ansRate}%</text>
              )}
              {lossBh >= 13 && (
                <text x={cx} y={lossY + lossBh / 2 + 3} fill="#fff" fontSize={7.5} textAnchor="middle" fontWeight={700}
                  style={{ pointerEvents: 'none', fontFamily: 'Space Grotesk,Inter,sans-serif' }}>{100 - ansRate}%</text>
              )}
              <text x={cx} y={h - padB + 14} fill="var(--c-lbl)" fontSize={9} textAnchor="middle" style={{ pointerEvents: 'none' }}>{r[0]}</text>
            </g>
          )
        })}
      </svg>
      {hover != null && merged[hover] && (() => {
        const r = merged[hover]
        const tot = r[1] + r[2]
        const leftPct = ((padL + hover * bw + bw / 2) / w) * 100
        return (
          <div className="chart-tip" style={{ left: `clamp(64px, ${leftPct}%, calc(100% - 64px))` }}>
            <div className="chart-tip-h">{r[0]}:00</div>
            <div className="chart-tip-row"><span><i style={{ background: C.teal }} />Авсан</span><b>{Math.round(r[1])}</b></div>
            <div className="chart-tip-row"><span><i style={{ background: C.coral }} />Алдсан</span><b>{Math.round(r[2])}</b></div>
            <div className="chart-tip-row chart-tip-tot"><span>Нийт</span><b>{Math.round(tot)}</b></div>
          </div>
        )
      })()}
    </div>
  )
}

function mkDonutSvg(channels: typeof RA.channels) {
  const size = 140, r = 54, cx = 70, cy = 70, sw = 14
  const C2 = 2 * Math.PI * r
  const tot = channels.reduce((a, c) => a + c.v, 0) || 1
  let off = 0, arcs = ''
  channels.forEach(c => {
    const frac = c.v / tot; const len = C2 * frac
    arcs += `<circle class="dn-arc" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${c.c}" stroke-width="${sw}" stroke-dasharray="${len} ${C2 - len}" stroke-dashoffset="${-off}" transform="rotate(-90 ${cx} ${cy})"/>`
    off += len
  })
  return { svg: `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--c-grid)" stroke-width="${sw}"/>${arcs}</svg>`, tot }
}

function mkSatGaugeSvg(dist: number[]) {
  const resp = dist.reduce((a, b) => a + b, 0)
  const score = resp ? dist.reduce((a, c, i) => a + c * (i + 1), 0) / resp : 0
  const size = 132, r = 50, cx = 66, cy = 66, sw = 11
  const C2 = 2 * Math.PI * r; const len = C2 * (score / 5)
  return { svg: `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--c-grid)" stroke-width="${sw}"/>
    <circle class="gg-arc" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.gold}" stroke-width="${sw}" stroke-dasharray="${len} ${C2 - len}" stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})" style="filter:drop-shadow(0 0 6px ${C.gold}aa)"/>
  </svg>`, score, resp }
}

export { ErrorBoundary }

// ── Component ─────────────────────────────────────────────────────────────────
export default function App() {
  const [rep, setRep] = useState<RepKey>('W1')
  const [selDays, setSelDays] = useState<Set<string>>(new Set(REPORTS.W1.defaultDays))
  const [selProd, setSelProd] = useState<string | null>(null)
  const reducedMotion = useReducedMotion()
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try { return localStorage.getItem('crm-theme') === 'light' ? 'light' : 'dark' } catch { return 'dark' }
  })
  const [weekOpen, setWeekOpen] = useState(false)
  const stripRef = useRef<HTMLDivElement>(null)
  const [dayRange, setDayRange] = useState<{ x: number; w: number } | null>(null)
  const anchorRef = useRef<string | null>(null)

  const { daily, agg: R, hourly } = REPORTS[rep]

  const refSum    = useMemo(() => daily.reduce((a, r) => a + dayTot(r), 0), [daily])
  const selRows   = useMemo(() => daily.filter(r => selDays.has(r.d)), [daily, selDays])
  const selSum    = useMemo(() => selRows.reduce((a, r) => a + dayTot(r), 0), [selRows])
  const chSelSum  = useMemo(() => selRows.reduce((a, r) => a + chTot(r), 0), [selRows])
  const factor    = refSum ? selSum / refSum : 0
  const selAnswered = useMemo(() => selRows.reduce((a, r) => a + r.a, 0), [selRows])
  const selSat  = useMemo(() => { const s = [0,0,0,0,0]; selRows.forEach(r => r.sat.forEach((v,i) => s[i]+=v)); return s }, [selRows])
  const selSent = useMemo(() => selRows.reduce((a, r) => a + r.sent, 0), [selRows])
  const selSuccess = chSelSum ? selAnswered / chSelSum * 100 : 0

  const ptot = useMemo(() => R.products.reduce((a, x) => a + x.v, 0) || 1, [R.products])

  // Product-channel drill-down computations
  const prodChanKey = selProd ? (PROD_CHAN[selProd] ?? null) : null

  // When multiple products share one channel (MPOS/LITEPOS/MOBILEPOS → pos),
  // compute this product's fraction of that channel from ticket distribution
  const prodShareFrac = useMemo(() => {
    if (!selProd || !prodChanKey) return 1
    const sameChan = R.products.filter(p => PROD_CHAN[p.n] === prodChanKey)
    if (sameChan.length <= 1) return 1
    const chanTotal = sameChan.reduce((a, p) => a + p.v, 0) || 1
    const thisProd  = sameChan.find(p => p.n === selProd)
    return thisProd ? thisProd.v / chanTotal : 1
  }, [selProd, prodChanKey, R.products])

  const prodTotalCalls = useMemo(() => {
    if (!prodChanKey) return chSelSum
    const chanCalls = selRows.reduce((a, r) => a + (((r as unknown) as Record<string, number>)[prodChanKey] as number || 0), 0)
    return Math.round(chanCalls * prodShareFrac)
  }, [selRows, prodChanKey, chSelSum, prodShareFrac])

  const chanSuccessRate = prodChanKey ? (CHAN_RATES[rep]?.[prodChanKey] ?? (chSelSum ? selAnswered / chSelSum : 0)) : (chSelSum ? selAnswered / chSelSum : 0)
  const prodAnswered   = prodChanKey ? Math.round(prodTotalCalls * chanSuccessRate) : selAnswered
  const prodSuccess    = prodTotalCalls ? prodAnswered / prodTotalCalls * 100 : 0
  const prodUniq       = Math.round(R.uniq * factor * (selSum ? prodTotalCalls / selSum : 0))
  const hourFrac       = chSelSum ? prodTotalCalls / chSelSum : 1

  const prodFactor = useMemo(() => {
    if (!selProd) return factor
    const p = R.products.find(p => p.n === selProd)
    return p ? factor * p.v / ptot : factor
  }, [selProd, factor, R.products, ptot])
  const filteredIssues = useMemo(() => {
    if (!selProd) return R.issues
    const matched = R.issues.filter(it => issueMatchesProd(it.n, selProd))
    return matched.length > 0 ? matched : R.issues
  }, [selProd, R.issues])

  const toggleDay = (d: string) => setSelDays(prev => { const n = new Set(prev); n.has(d) ? n.delete(d) : n.add(d); return n })
  const pickDay = (d: string, extend: boolean) => {
    if (extend && anchorRef.current) {
      const [a, b] = [anchorRef.current, d].sort()
      setSelDays(new Set(daily.filter(r => r.d >= a && r.d <= b).map(r => r.d)))
    } else {
      toggleDay(d)
      anchorRef.current = d
    }
  }
  const applyRep = (key: RepKey) => { setRep(key); setSelDays(new Set(REPORTS[key].defaultDays)); setSelProd(null); anchorRef.current = null }
  const handleRepChange = (key: RepKey) => {
    if (key === rep) return
    const vt = (document as { startViewTransition?: (cb: () => void) => void }).startViewTransition
    if (vt && !reducedMotion) vt.call(document, () => applyRep(key))
    else applyRep(key)
  }

  // Close the week dropdown on Escape
  useEffect(() => {
    if (!weekOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setWeekOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [weekOpen])

  // Apply + persist theme
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('crm-theme', theme) } catch { /* private mode */ }
  }, [theme])

  const toggleTheme = (e: React.MouseEvent) => {
    const next = theme === 'dark' ? 'light' : 'dark'
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> }
    }
    const x = e.clientX, y = e.clientY
    // ripple ring from the button — the "wave"
    if (!reducedMotion) {
      const ring = document.createElement('span')
      ring.className = 'theme-ripple'
      ring.style.left = `${x}px`
      ring.style.top = `${y}px`
      document.body.appendChild(ring)
      setTimeout(() => ring.remove(), 700)
    }
    if (!doc.startViewTransition || reducedMotion) { setTheme(next); return }
    const root = document.documentElement
    root.classList.add('theme-vt')
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
    const t = doc.startViewTransition(() => setTheme(next))
    t.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 520, easing: 'cubic-bezier(.22,1,.36,1)', pseudoElement: '::view-transition-new(root)' },
      )
    })
    t.finished.finally(() => root.classList.remove('theme-vt'))
  }

  const selContiguous = useMemo(() => {
    const ds = [...selDays].sort()
    if (ds.length < 2) return true
    return ds.length === daily.filter(r => r.d >= ds[0] && r.d <= ds[ds.length - 1]).length
  }, [selDays, daily])
  const dayVolMax = useMemo(() => Math.max(...daily.map(dayTot), 1), [daily])

  const periodLabel = useMemo(() => {
    const ds = [...selDays].sort()
    if (!ds.length) return 'Өдөр сонгоогүй'
    const min = ds[0], max = ds[ds.length - 1]
    return selContiguous ? `${min.replace(/-/g,'.')} – ${max.replace(/-/g,'.')}` : `${ds.length} өдөр сонгосон`
  }, [selDays, selContiguous])

  // Slide the connected highlight across the selected day span
  useLayoutEffect(() => {
    const strip = stripRef.current
    if (!strip) return
    const measure = () => {
      const on = strip.querySelectorAll<HTMLElement>('.daycell.on')
      if (!on.length || !selContiguous) { setDayRange(null); return }
      const first = on[0], last = on[on.length - 1]
      setDayRange({ x: first.offsetLeft, w: last.offsetLeft + last.offsetWidth - first.offsetLeft })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(strip)
    return () => ro.disconnect()
  }, [selDays, daily, rep, selContiguous])

  const isAllSel = Math.abs(factor - 1) < 0.005

  const hourFac = factor * (prodChanKey ? hourFrac : 1)
  const rangeLabel = useMemo(() => {
    const ct = prodChanKey
      ? selRows.reduce((a, r) => a + (((r as unknown) as Record<string, number>)[prodChanKey] as number || 0), 0)
      : chSelSum
    return `${selDays.size} өдөр · ${fmt(ct)} дуудлага${prodChanKey ? ` (${CH.find(c => c.k === prodChanKey)?.n})` : ''}`
  }, [selRows, prodChanKey, chSelSum, selDays])
  const { svg: donutSvg, tot: chanTot } = useMemo(() => mkDonutSvg(R.channels), [R.channels])
  const { svg: satSvg, score: satScore, resp: satResp } = useMemo(() => mkSatGaugeSvg(selSat), [selSat])

  // Callback / reconnect stats from ticket issues
  const nokhjIssue = useMemo(() => R.issues.find(i => i.n.toLowerCase().includes('нөхөж')), [R.issues])
  const cbFromRows  = useMemo(() => selRows.reduce((s, r) => s + (r.cb ?? 0), 0), [selRows])
  const cbNeedTotal = useMemo(() => selRows.reduce((s, r) => s + (r.cbNeed ?? 0), 0), [selRows])
  const nokhjCount  = cbFromRows > 0 ? Math.round(cbFromRows * prodFactor) : Math.round((nokhjIssue?.v ?? 0) * prodFactor)
  const missedCalls = Math.max((prodChanKey ? prodTotalCalls - prodAnswered : chSelSum - selAnswered), 0)
  const cbDenom     = cbNeedTotal > 0 ? Math.round(cbNeedTotal * prodFactor) : missedCalls
  const callbackRate = cbDenom > 0 ? nokhjCount / cbDenom * 100 : 0

  // Sparklines computed as SVG strings (avoids useEffect deps-size mismatch on HMR)
  const sparkSvgs = useMemo(() => {
    const getChanVal = (r: DayRow) => prodChanKey ? (((r as unknown) as Record<string, number>)[prodChanKey] as number || 0) : chTot(r)
    const sv = selRows.map(getChanVal)
    const rate = CHAN_RATES[rep]?.[prodChanKey ?? ''] ?? (refSum ? selAnswered / refSum : 0)
    const av = prodChanKey ? sv.map(v => Math.round(v * rate)) : selRows.map(r => r.a)
    const sc = sv.map((v, i) => v ? av[i] / v * 100 : 0)
    const uv = sv.map(v => v * R.uniq / (refSum || 1))
    const pad = (v: number[]) => v.length > 1 ? v : [0, 0]
    return {
      sp1: mkSparkSvg('sp1', pad(sv), C.blue),
      sp2: mkSparkSvg('sp2', pad(av), C.teal),
      sp3: mkSparkSvg('sp3', pad(uv), C.violet),
      sp4: mkSparkSvg('sp4', pad(sc), C.gold),
    }
  }, [selRows, R.uniq, refSum, prodChanKey, rep, selAnswered])

  const tkTot = R.resolved + R.unresolved + R.tkTransferred || 1
  const satCols = [C.coral, C.amber, C.gold, C.blue, C.teal]
  const satMax = Math.max(...selSat, 1)
  const issueMax = filteredIssues[0]?.v || 1
  const agentMax = Math.max(...R.agents.map(a => a.c))
  const rated = R.agents.filter(a => a.r != null)
  const avgR = rated.length ? rated.reduce((a, x) => a + x.r!, 0) / rated.length : null
  const showOutage = selDays.has('2026-07-07')

  return (
    <div className="wrap">
      {/* Topbar */}
      <div className="topbar">
        <div className="brand">
          <img className="logo-img" src={ontimeLogo} alt="Ontime" width={120} height={83} />
          <div>
            <h1>CRM дуудлагын тайлан</h1>
            <div className="sub">
              <span>OnTime Support</span> ·
              <span>{periodLabel}</span>
              <span className={`badge ${isAllSel ? 'real' : 'est'}`}>
                {isAllSel ? 'Бодит тайлан' : 'Сонгосон өдрүүд'}
              </span>
            </div>
          </div>
        </div>
        <div className="topctrls">
          <button
            type="button"
            className="theme-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Цайвар загвар' : 'Бараан загвар'}
            aria-label="Загвар солих"
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <div className="weeksel">
          <button
            type="button"
            className={`weeksel-trigger${weekOpen ? ' open' : ''}`}
            aria-expanded={weekOpen}
            aria-haspopup="listbox"
            onClick={() => setWeekOpen(o => !o)}
          >
            <span className="wst-ic">{rep === 'ALL' ? '📊' : rep[0] === 'M' ? '📅' : '🗓'}</span>
            <span className="wst-label">
              <b>{rep === 'ALL' ? 'Нэгдсэн' : REPORTS[rep].label.replace(/\//g, '.')}</b>
              <i>{rep === 'ALL' ? 'Бүх хугацаа · 8 долоо хоног' : rep[0] === 'M' ? 'Бүтэн сар' : 'Тайлант 7 хоног'}</i>
            </span>
            <span className="wst-caret">▾</span>
          </button>
          {weekOpen && (
            <>
              <div className="weeksel-backdrop" onClick={() => setWeekOpen(false)} />
              <div className="weeksel-panel" role="listbox" aria-label="Хугацаа сонгох">
                <div className="wsp-month">
                  <div className="wsp-month-h">Ерөнхий</div>
                  {OVERVIEW.map(o => (
                    <button
                      key={o.rep}
                      type="button"
                      role="option"
                      aria-selected={rep === o.rep}
                      className={`wsp-row wsp-row--agg${rep === o.rep ? ' on' : ''}`}
                      onClick={() => { handleRepChange(o.rep); setWeekOpen(false) }}
                    >
                      <span className="wsp-ic">{o.ic}</span>
                      <span className="wsp-d">{o.label}</span>
                      <span className="wsp-sub2">{o.sub}</span>
                      <span className="wsp-check">{rep === o.rep ? '✓' : ''}</span>
                    </button>
                  ))}
                </div>
                {MONTHS.map(m => (
                  <div className="wsp-month" key={m.label}>
                    <div className="wsp-month-h">{m.label} · долоо хоногоор</div>
                    {m.keys.map(k => (
                      <button
                        key={k}
                        type="button"
                        role="option"
                        aria-selected={rep === k}
                        className={`wsp-row${rep === k ? ' on' : ''}`}
                        onClick={() => { handleRepChange(k); setWeekOpen(false) }}
                      >
                        <span className="wsp-d">{REPORTS[k].label.replace(/\//g, '.')}</span>
                        <span className="wsp-vol"><i style={{ ['--v' as string]: (WEEK_VOL[k] / WEEK_VOL_MAX).toFixed(3) }} /></span>
                        <span className="wsp-check">{rep === k ? '✓' : ''}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
          </div>
        </div>
      </div>

      {/* Day picker */}
      <div className="daypick">
        <div className="daypick-head">
          <span className="daypick-hint">Өдрөөр шүүх · Shift+дарж хугацаа сонгох</span>
          <span className="daypick-lg"><i />Амралтын өдөр</span>
          <span className="daycount">{selDays.size}<i>/{daily.length}</i></span>
          <button className="daybtn-mini" onClick={() => setSelDays(new Set(daily.map(r => r.d)))}>Бүгд</button>
          <button className="daybtn-mini" onClick={() => setSelDays(new Set())}>Цэвэрлэх</button>
        </div>
        <div className={`daystrip${daily.length > 16 ? ' dense' : ''}`} ref={stripRef}>
          {dayRange && (
            <span className="daystrip-range" style={{ transform: `translateX(${dayRange.x}px)`, width: dayRange.w }} />
          )}
          {daily.map(r => {
            const on = selDays.has(r.d)
            const wknd = isWeekend(r.d)
            return (
              <button
                key={r.d}
                type="button"
                title={`${r.lab}${wknd ? ' · амралт' : ''}`}
                className={`daycell${on ? ' on' : ''}${on && !selContiguous ? ' solo' : ''}${wknd ? ' wknd' : ''}`}
                style={{ ['--v' as string]: (dayTot(r) / dayVolMax).toFixed(3) }}
                onClick={e => pickDay(r.d, e.shiftKey)}
              >
                <span className="dc-wd">{weekday(r.d)}</span>
                <span className="dc-d num">{r.d.slice(-2)}</span>
                <span className="dc-vol" />
              </button>
            )
          })}
        </div>
      </div>

      {/* KPI */}
      {selProd && (
        <div className="prod-banner" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '6px 12px', background: `${C.gold}12`, border: `1px solid ${C.gold}33`, borderRadius: 8, fontSize: 12 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: C.gold, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ color: C.gold, fontWeight: 600 }}>{selProd}</span>
          <span style={{ color: 'var(--muted)', fontWeight: 400 }}>бүтээгдэхүүнээр шүүсэн дата</span>
          <button className="daybtn-mini" onClick={() => setSelProd(null)} style={{ marginLeft: 'auto', fontSize: 10 }}>✕ Арилгах</button>
        </div>
      )}
      <div className="grid kpis" style={{ marginBottom: 14 }}>
        <div className="card kpi">
          <div className="top">
            <div className="ic" style={{ background: 'rgba(78,168,255,.16)', color: C.blue }}>📞</div>
            <div>
              <div className="clabel">Нийт дуудлага</div>
              <div className="cbig num"><CountUp value={prodChanKey ? prodTotalCalls : chSelSum} /></div>
            </div>
          </div>
          <div className="spark" dangerouslySetInnerHTML={{ __html: sparkSvgs.sp1 }} />
        </div>
        <div className="card kpi">
          <div className="top">
            <div className="ic" style={{ background: 'rgba(47,211,165,.16)', color: C.teal }}>✅</div>
            <div>
              <div className="clabel">Авсан дуудлага</div>
              <div className="cbig num"><CountUp value={prodChanKey ? prodAnswered : selAnswered} /></div>
            </div>
          </div>
          <div className="spark" dangerouslySetInnerHTML={{ __html: sparkSvgs.sp2 }} />
        </div>
        <div className="card kpi">
          <div className="top">
            <div className="ic" style={{ background: 'rgba(157,140,255,.16)', color: C.violet }}>👥</div>
            <div>
              <div className="clabel">Давхцаагүй хэрэглэгч</div>
              <div className="cbig num"><CountUp value={prodChanKey ? prodUniq : R.uniq * factor} /></div>
            </div>
          </div>
          <div className="spark" dangerouslySetInnerHTML={{ __html: sparkSvgs.sp3 }} />
        </div>
        <div className="card kpi">
          <div className="top">
            <div className="ic" style={{ background: 'rgba(245,196,81,.16)', color: C.gold }}>📊</div>
            <div>
              <div className="clabel">Амжилтын хувь</div>
              <div className="cbig num">
                {(prodChanKey ? prodTotalCalls : chSelSum)
                  ? <CountUp value={prodChanKey ? prodSuccess : selSuccess} format={n => n.toFixed(1)} />
                  : '0'}%
              </div>
            </div>
          </div>
          <div className="spark" dangerouslySetInnerHTML={{ __html: sparkSvgs.sp4 }} />
        </div>
      </div>

      {/* Sub strip */}
      <div className="substrip">
        <div className="subchip">
          <div className="sic" style={{ background: 'rgba(255,125,107,.16)', color: C.coral }}>📵</div>
          <div><div className="sv num"><CountUp value={Math.max((prodChanKey ? prodTotalCalls : selSum) - (prodChanKey ? prodAnswered : selAnswered), 0)} /></div><div className="sl">Missed call</div></div>
        </div>
        {/* Compact callback info chip */}
        <div className="subchip" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4, padding: '8px 12px', minWidth: 140 }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 2 }}>Эргэн холбогдол</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontSize: 9, color: 'var(--muted)' }}>{cbNeedTotal > 0 ? 'Шаардлагатай' : 'Алдсан'}</span>
              <span className="num" style={{ fontSize: 14, fontWeight: 700, color: C.coral, lineHeight: 1 }}>{fmt(cbDenom)}</span>
            </div>
            <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontSize: 9, color: 'var(--muted)' }}>Холбогдсон</span>
              <span className="num" style={{ fontSize: 14, fontWeight: 700, color: C.teal, lineHeight: 1 }}>{fmt(nokhjCount)}</span>
            </div>
            <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontSize: 9, color: 'var(--muted)' }}>Эргэн %</span>
              <span className="num" style={{ fontSize: 14, fontWeight: 700, color: C.gold, lineHeight: 1 }}>{cbDenom > 0 ? callbackRate.toFixed(1) + '%' : '—'}</span>
            </div>
          </div>
        </div>
        <div className="subchip">
          <div className="sic" style={{ background: 'rgba(47,211,165,.16)', color: C.teal }}>🎫</div>
          <div><div className="sv num"><CountUp value={(R.resolved + R.unresolved + R.tkTransferred) * prodFactor} /></div><div className="sl">Нийт тикет{selProd ? ` · ${selProd}` : ''}</div></div>
        </div>
        <div className="subchip">
          <div className="sic" style={{ background: 'rgba(78,168,255,.16)', color: C.blue }}>📅</div>
          <div><div className="sv num">{selDays.size}</div><div className="sl">Тайлант хоног</div></div>
        </div>
      </div>

      {/* Mid */}
      <div className="grid mid" style={{ marginBottom: 14 }}>
        <div className="card">
          <div className="card-h"><div className="card-title"><span className="tdot" style={{ background: C.teal }} />Тикетийн статус</div></div>
          {[['Шийдэгдсэн', C.teal, R.resolved], ['Шийдэгдээгүй', C.amber, R.unresolved], ['Шилжүүлсэн', C.violet, R.tkTransferred]].map(([label, color, val]) => (
            <div key={label as string} className="tk-row">
              <div className="tk-l"><span className="tk-mk" style={{ background: color as string }} />{label as string}</div>
              <div><span className="tk-v num">{fmt((val as number) * prodFactor)}</span><span className="tk-pct">{((val as number) / tkTot * 100).toFixed(1)}%</span></div>
            </div>
          ))}
          <div style={{ marginTop: 13 }}>
            <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', background: 'var(--track)' }}>
              {[[R.resolved, C.teal],[R.unresolved, C.amber],[R.tkTransferred, C.violet]].map(([v,c], i) => (
                <div key={i} style={{ width: `${(v as number) / tkTot * 100}%`, background: c as string }} />
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-h"><div className="card-title"><span className="tdot" style={{ background: C.gold }} />Сэтгэл ханамж</div></div>
          <div className="sat-wrap">
            <div style={{ position: 'relative', width: 132, height: 132 }}>
              <div dangerouslySetInnerHTML={{ __html: satSvg }} />
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                <div className="sat-score num">{satResp ? satScore.toFixed(2) : '—'}</div>
                <div className="sat-of">/ 5.0 ★</div>
              </div>
            </div>
          </div>
          <div className="satdist">
            {[5,4,3,2,1].map(s => (
              <div key={s} className="sd-row">
                <span className="st">{s}★</span>
                <div className="sd-bar"><span style={{ width: `${selSat[s-1] / satMax * 100}%`, background: satCols[s-1] }} /></div>
                <span className="sd-n">{selSat[s-1]}</span>
              </div>
            ))}
          </div>
          <div className="sat-rate">Хариу өгсөн: <b>{selSent ? (satResp / selSent * 100).toFixed(1) : '—'}%</b> ({satResp}/{selSent})</div>
        </div>

        <div className="card">
          <div className="card-h"><div className="card-title"><span className="tdot" style={{ background: C.blue }} />Харилцсан суваг</div></div>
          <div className="donut-wrap">
            <div style={{ position: 'relative', width: 140, height: 140 }}>
              <div dangerouslySetInnerHTML={{ __html: donutSvg }} />
              <div className="donut-center">
                <div className="dc-val num">{(R.channels[0].v / chanTot * 100).toFixed(1)}%</div>
                <div className="dc-lab">{R.channels[0].n}</div>
              </div>
            </div>
            <div className="legend">
              {R.channels.filter(c => c.n !== 'Remote').map((c, i) => (
                <div key={i} className="lg">
                  <div className="lg-l"><span className="lg-mk" style={{ background: c.c }} />{c.n}</div>
                  <div><span className="lg-v">{(c.v / chanTot * 100).toFixed(1)}%</span><span className="lg-c">{fmt(c.v * factor)}</span></div>
                </div>
              ))}
            </div>
          </div>
          {(() => {
            const remote = R.channels.find(c => c.n === 'Remote')
            if (!remote) return null
            const pct = (remote.v / chanTot * 100).toFixed(1)
            return (
              <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: `${remote.c}14`, border: `1px solid ${remote.c}30`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: remote.c, display: 'inline-block' }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg)' }}>Remote</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: remote.c }}>{pct}%</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{fmt(remote.v * factor)}</span>
                </div>
              </div>
            )
          })()}
        </div>
      </div>

      {/* Daily chart + products */}
      <Reveal className="grid charts" style={{ marginBottom: 14 }}>
        <div className="card">
          <div className="card-h">
            <div className="card-title"><span className="tdot" style={{ background: C.blue }} />Өдрийн дуудлага — сувгаар</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{rangeLabel}</div>
          </div>
          <DailyChart rows={daily} selDays={selDays} selChan={prodChanKey} onToggle={toggleDay} />
          <div className="legend-inline">
            {CH.map(c => <span key={c.k}><i style={{ background: c.c }} />{c.n}</span>)}
            <span style={{ color: 'var(--muted2)' }}>👆 багана дарж өдөр нэмэх/хасах</span>
          </div>
        </div>
        <div className="card">
          <div className="card-h">
            <div className="card-title"><span className="tdot" style={{ background: C.gold }} />Бүтээгдэхүүний төрөл</div>
          </div>
          <div style={{ marginTop: 4 }}>
            {(() => {
              const pmax = Math.max(...R.products.map(x => x.v))
              return R.products.map((p, i) => {
                const active = selProd === p.n
                const dimmed = selProd !== null && !active
                return (
                  <div key={i} className="hbar" style={{ cursor: 'pointer', opacity: dimmed ? 0.35 : 1, transition: 'opacity .15s' }}
                    onClick={() => setSelProd(prev => prev === p.n ? null : p.n)}>
                    <div className="hbar-top">
                      <span className="n" style={{ fontWeight: active ? 700 : 400, color: active ? C.gold : undefined }}>
                        {active && '▶ '}{p.n}
                      </span>
                      <span className="v" style={{ color: p.c }}>{(p.v / ptot * 100).toFixed(1)}% · {fmt(p.v * factor)}</span>
                    </div>
                    <div className="hbar-track" style={{ outline: active ? `1.5px solid ${C.gold}55` : 'none', borderRadius: 4 }}>
                      <div className="hbar-fill" style={{ width: `${Math.max(p.v / pmax * 100, 2)}%`, background: `linear-gradient(90deg,${p.c}99,${p.c})`, boxShadow: active ? `0 0 14px ${p.c}88` : `0 0 10px ${p.c}44` }} />
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        </div>
      </Reveal>

      {/* Hourly */}
      <Reveal className="grid" style={{ gridTemplateColumns: '1fr', marginBottom: 14 }}>
        <div className="card">
          <div className="card-h">
            <div className="card-title"><span className="tdot" style={{ background: C.teal }} />Цагийн ачаалал</div>
            <div className="legend-inline">
              <span><i style={{ background: C.teal }} />Авсан</span>
              <span><i style={{ background: C.coral }} />Алдсан</span>
            </div>
          </div>
          <HourChart hourly={hourly} fac={hourFac} />
          {showOutage && (
            <div className="callout">
              ⚠️ <b>Гэнэтийн ачаалал:</b> 7 сарын 7-ны 12:00 цагт MBusiness Plus дээр бүх хэрэглэгч НӨАТ баримт гаргаж чадахгүй саатал үүсэж, 12:30-д хэвийн болсон. Тухайн үед 316 дуудлага, 233 авсан (73.7%).
            </div>
          )}
        </div>
      </Reveal>

      {/* Issues */}
      <Reveal className="grid" style={{ gridTemplateColumns: '1fr', marginBottom: 14 }}>
        <div className="card">
          <div className="card-h">
            <div className="card-title"><span className="tdot" style={{ background: C.violet }} />Топ асуудлын төрөл
              {selProd && <span style={{ fontSize: 10, color: C.gold, fontWeight: 600, marginLeft: 10, letterSpacing: .5 }}>· {selProd}</span>}
            </div>
          </div>
          <div style={{ marginTop: 4 }} key={selProd ?? 'all'} className="issue-list">
            {filteredIssues.map((it, i) => {
              const col = TAGCOL[it.t] || C.blue
              return (
                <div key={i} className="hbar">
                  <div className="hbar-top">
                    <span className="n"><b style={{ color: 'var(--muted)', marginRight: 6 }}>{i + 1}</b>{it.n} <span className="tag" style={{ background: `${col}22`, color: col }}>{it.t}</span></span>
                    <span className="v" style={{ color: col }}>{Math.round(it.v * prodFactor)}</span>
                  </div>
                  <div className="hbar-track">
                    <div className="hbar-fill" style={{ width: `${it.v / issueMax * 100}%`, background: `linear-gradient(90deg,${col}88,${col})` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Reveal>

      {/* Agents + transferred */}
      <Reveal className="grid two">
        <div className="card">
          <div className="card-h">
            <div className="card-title"><span className="tdot" style={{ background: C.gold }} />Ажилтны үзүүлэлт</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              {R.agents.length} ажилтан · {fmt(selAnswered)} дуудлага{avgR != null ? ' · ★ ' + avgR.toFixed(2) : ''}
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead><tr><th>#</th><th>Нэр</th><th>📞</th><th>Ачаалал</th><th>📋</th><th>⏱ мин</th><th style={{ textAlign: 'right' }}>Үнэлгээ</th></tr></thead>
              <tbody>
                {R.agents.map((a, i) => {
                  const rc = i < 3 ? C.gold : 'var(--muted)'
                  const stars = a.r != null
                    ? <><span className="stars">{'★'.repeat(Math.round(a.r))}{'☆'.repeat(5 - Math.round(a.r))}</span> {a.r.toFixed(2)}</>
                    : <span className="norate">үнэлгээгүй</span>
                  return (
                    <tr key={i}>
                      <td className="rank" style={{ color: rc }}>{i + 1}</td>
                      <td className="name">{a.n}</td>
                      <td className="num" style={{ color: C.blue, fontWeight: 600 }}>{fmt(a.c * factor)}</td>
                      <td className="barcell"><div className="tbl-bar"><span style={{ width: `${a.c / agentMax * 100}%`, background: `linear-gradient(90deg,${C.blue}88,${C.blue})` }} /></div></td>
                      <td className="num" style={{ color: C.teal }}>{a.tk != null ? fmt(a.tk * factor) : <span className="norate">—</span>}</td>
                      <td className="num" style={{ color: a.t > 5.5 ? C.coral : a.t < 3 ? C.teal : '#c9cfdc' }}>{a.t.toFixed(1)}</td>
                      <td style={{ textAlign: 'right', fontSize: 11.5 }}>{stars}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-h"><div className="card-title"><span className="tdot" style={{ background: C.coral }} />Шилжүүлсэн тикет — хүлээн авагчид</div></div>
          {R.recv.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--muted)', padding: '8px 0' }}>Энэ хугацаанд шилжүүлсэн тикетийн задаргаа алга.</div>
          ) : (() => {
            const totalOk   = R.recv.reduce((s, r) => s + r.ok, 0)
            const totalWait = R.recv.reduce((s, r) => s + r.wait, 0)
            const totalUnres= R.recv.reduce((s, r) => s + ((r as {unres?:number}).unres ?? 0), 0)
            const grand = totalOk + totalWait + totalUnres
            return (
              <div>
                {/* Status summary strip */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 10 }}>
                  <div style={{ background: `${C.green}14`, border: `1px solid ${C.green}30`, borderRadius: 8, padding: '7px 10px' }}>
                    <div style={{ fontSize: 9, color: C.green, fontWeight: 600, letterSpacing: '0.05em', marginBottom: 3 }}>ШИЙДСЭН</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span className="num" style={{ fontSize: 20, fontWeight: 700, color: C.green }}>{totalOk}</span>
                      <span style={{ fontSize: 10, color: 'var(--muted)' }}>{grand > 0 ? Math.round(totalOk/grand*100) : 0}%</span>
                    </div>
                  </div>
                  <div style={{ background: `${C.gold}12`, border: `1px solid ${C.gold}30`, borderRadius: 8, padding: '7px 10px' }}>
                    <div style={{ fontSize: 9, color: C.gold, fontWeight: 600, letterSpacing: '0.05em', marginBottom: 3 }}>ХЭВЭЭРЭЭ</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span className="num" style={{ fontSize: 20, fontWeight: 700, color: C.gold }}>{totalWait}</span>
                      <span style={{ fontSize: 10, color: 'var(--muted)' }}>{grand > 0 ? Math.round(totalWait/grand*100) : 0}%</span>
                    </div>
                  </div>
                  <div style={{ background: `${C.coral}12`, border: `1px solid ${C.coral}30`, borderRadius: 8, padding: '7px 10px' }}>
                    <div style={{ fontSize: 9, color: C.coral, fontWeight: 600, letterSpacing: '0.05em', marginBottom: 3 }}>ШИЙДЭГДЭЭГҮЙ</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span className="num" style={{ fontSize: 20, fontWeight: 700, color: C.coral }}>{totalUnres}</span>
                      <span style={{ fontSize: 10, color: 'var(--muted)' }}>{grand > 0 ? Math.round(totalUnres/grand*100) : 0}%</span>
                    </div>
                  </div>
                </div>
                {/* Progress bar */}
                {grand > 0 && (
                  <div style={{ display: 'flex', height: 4, borderRadius: 4, overflow: 'hidden', marginBottom: 10, gap: 1 }}>
                    {totalOk   > 0 && <div style={{ flex: totalOk,   background: C.green }} />}
                    {totalWait > 0 && <div style={{ flex: totalWait, background: C.gold  }} />}
                    {totalUnres> 0 && <div style={{ flex: totalUnres,background: C.coral }} />}
                  </div>
                )}
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px 4px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                  <span style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.04em' }}>ХҮЛЭЭН АВАГЧ</span>
                  <div style={{ display: 'flex', gap: 16, fontSize: 9, color: 'var(--muted)', fontWeight: 600 }}>
                    <span style={{ color: C.green, minWidth: 28, textAlign: 'center' }}>✓</span>
                    <span style={{ color: C.gold,  minWidth: 28, textAlign: 'center' }}>↗</span>
                    <span style={{ color: C.coral, minWidth: 28, textAlign: 'center' }}>✗</span>
                    <span style={{ minWidth: 22, textAlign: 'right' }}>Нийт</span>
                  </div>
                </div>
                {/* Per-receiver rows */}
                {R.recv.map((r, i) => {
                  const unres = (r as { unres?: number }).unres ?? 0
                  const rowBg = unres > 0 ? `${C.coral}10` : r.wait > 0 ? `${C.gold}0c` : `${C.green}08`
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 6px', background: rowBg, borderRadius: 6, marginBottom: 2 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg)' }}>{r.n}</div>
                        <div style={{ fontSize: 10, color: 'var(--muted)' }}>{r.team}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <span className="num" style={{ minWidth: 28, textAlign: 'center', fontSize: 13, fontWeight: 700, color: r.ok > 0 ? C.green : 'var(--muted)', opacity: r.ok > 0 ? 1 : 0.3 }}>{r.ok}</span>
                        <span className="num" style={{ minWidth: 28, textAlign: 'center', fontSize: 13, fontWeight: 700, color: r.wait > 0 ? C.gold : 'var(--muted)', opacity: r.wait > 0 ? 1 : 0.3 }}>{r.wait}</span>
                        <span className="num" style={{ minWidth: 28, textAlign: 'center', fontSize: 13, fontWeight: 700, color: unres > 0 ? C.coral : 'var(--muted)', opacity: unres > 0 ? 1 : 0.3 }}>{unres}</span>
                        <b className="num" style={{ minWidth: 22, textAlign: 'right', fontSize: 12, color: 'var(--fg)' }}>{r.ok + r.wait + unres}</b>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </div>
      </Reveal>

      <div className="hint">
        💡 Дээд талд <b>«W1–W8 · Нэгдсэн»</b>-ээс долоо хоногоо сонгоно.
        Доор нь өдрийн чипээр эсвэл <b>графикийн багана дээр дарж</b> хүссэн өдрүүдээ шүүнэ.
      </div>
    </div>
  )
}
