export const ENGINE_VERSION = 'wattguard-baseline-v1';
export const SLOT_MINUTES = 15;
export const SLOT_HOURS = SLOT_MINUTES / 60;

export const DEFAULT_CONFIG = Object.freeze({
  intervalMinutes: SLOT_MINUTES,
  offHours: { relative: 0.30, absoluteKw: 0.50, minMinutes: 30 },
  businessHours: { relative: 0.45, absoluteKw: 0.80, minMinutes: 30 },
  attention: { relative: 0.60, absoluteKw: 1.20, minMinutes: 90 },
});

const pad = (n) => String(n).padStart(2, '0');
const round = (n, digits = 2) => {
  const p = 10 ** digits;
  return Math.round((Number(n) + Number.EPSILON) * p) / p;
};
const safeDate = (value) => value instanceof Date ? new Date(value) : new Date(String(value));
const dayGroup = (d) => [0, 6].includes(d.getDay()) ? 'weekend' : 'weekday';
const slotKey = (d) => `${pad(d.getHours())}:${pad(Math.floor(d.getMinutes() / SLOT_MINUTES) * SLOT_MINUTES)}`;

export function isBusinessHour(date, store) {
  const d = safeDate(date);
  const day = d.getDay();
  const holidays = new Set((store.holidays || []).map(Number));
  if (holidays.has(day)) return false;
  const [oh, om] = String(store.openTime || '09:00').split(':').map(Number);
  const [ch, cm] = String(store.closeTime || '22:00').split(':').map(Number);
  const m = d.getHours() * 60 + d.getMinutes();
  const open = oh * 60 + om;
  const close = ch * 60 + cm;
  return m >= open && m < close;
}

export function median(values) {
  const v = values.filter(Number.isFinite).sort((a,b)=>a-b);
  if (!v.length) return null;
  const mid = Math.floor(v.length/2);
  return v.length % 2 ? v[mid] : (v[mid-1]+v[mid])/2;
}

export function mad(values, center = null) {
  const c = center ?? median(values);
  if (c == null) return null;
  return median(values.filter(Number.isFinite).map(v => Math.abs(v-c)));
}

export function buildBaseline(readings, store) {
  const buckets = new Map();
  for (const r of readings) {
    const d = safeDate(r.timestamp);
    if (Number.isNaN(d.getTime()) || !Number.isFinite(Number(r.power_kw))) continue;
    const key = `${dayGroup(d)}|${slotKey(d)}|${isBusinessHour(d, store) ? 1 : 0}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(Number(r.power_kw));
  }
  const profile = new Map();
  for (const [key, values] of buckets.entries()) {
    const med = median(values);
    const spread = mad(values, med) ?? 0;
    profile.set(key, {
      median: med,
      mad: spread,
      low: Math.max(0, med - Math.max(0.15, spread * 2.5)),
      high: med + Math.max(0.15, spread * 2.5),
      samples: values.length,
    });
  }
  return profile;
}

function expectedFor(profile, timestamp, store) {
  const d = safeDate(timestamp);
  const business = isBusinessHour(d, store);
  const exact = `${dayGroup(d)}|${slotKey(d)}|${business ? 1 : 0}`;
  let hit = profile.get(exact);
  if (hit) return {...hit, key: exact, business};
  const fallback = [...profile.entries()].filter(([k]) => k.includes(`|${slotKey(d)}|${business ? 1 : 0}`));
  if (fallback.length) {
    const meds = fallback.map(([,v]) => v.median);
    const m = median(meds) ?? 0;
    return {median:m, mad:0, low:Math.max(0,m-0.2), high:m+0.2, samples:fallback.length, key:'fallback', business};
  }
  return {median:0, mad:0, low:0, high:0.2, samples:0, key:'missing', business};
}

function thresholdFor(business, config) {
  return business ? config.businessHours : config.offHours;
}

export function analyzeEnergy({baselineReadings, currentReadings, store, config = DEFAULT_CONFIG}) {
  const profile = buildBaseline(baselineReadings, store);
  const sorted = [...currentReadings].sort((a,b)=>safeDate(a.timestamp)-safeDate(b.timestamp));
  const rows = sorted.map(r => {
    const actual = Number(r.power_kw);
    const exp = expectedFor(profile, r.timestamp, store);
    const delta = actual - exp.median;
    const relative = exp.median > 0.05 ? delta / exp.median : null;
    const t = thresholdFor(exp.business, config);
    const candidate = delta >= t.absoluteKw && relative != null && relative >= t.relative;
    return {
      timestamp:r.timestamp,
      actual:round(actual,3), expected:round(exp.median,3), low:round(exp.low,3), high:round(exp.high,3),
      delta:round(delta,3), relative:relative == null ? null : round(relative,4),
      business:exp.business, candidate, anomalous:false, runMinutes:0,
    };
  });

  let run = 0;
  for (const row of rows) {
    if (row.candidate) run += config.intervalMinutes;
    else run = 0;
    row.runMinutes = run;
    const t = thresholdFor(row.business, config);
    row.anomalous = row.candidate && run >= t.minMinutes;
  }

  // Mark the whole consecutive run once it reaches the persistence threshold.
  let i = 0;
  while (i < rows.length) {
    if (!rows[i].candidate) { i++; continue; }
    let j = i;
    while (j < rows.length && rows[j].candidate) j++;
    const minutes = (j-i) * config.intervalMinutes;
    const t = thresholdFor(rows[i].business, config);
    if (minutes >= t.minMinutes) for (let k=i;k<j;k++) rows[k].anomalous = true;
    i = j;
  }

  const anomalous = rows.filter(r=>r.anomalous);
  const wasteKwh = anomalous.reduce((sum,r)=>sum + Math.max(0, r.delta) * (config.intervalMinutes/60), 0);
  const price = Number(store.pricePerKwh || 0);
  const extraCost = wasteKwh * price;
  const last = rows.at(-1) || null;
  const activeRun = (() => {
    let n=0;
    for(let k=rows.length-1;k>=0;k--) { if(rows[k].candidate) n+=config.intervalMinutes; else break; }
    return n;
  })();
  const maxRel = anomalous.reduce((m,r)=>Math.max(m,r.relative || 0),0);
  const maxDelta = anomalous.reduce((m,r)=>Math.max(m,r.delta || 0),0);
  const wasAnomalous = anomalous.length > 0;
  const resolved = wasAnomalous && last && !last.candidate && rows.slice(-2).every(r=>!r.candidate);

  let level = 'NORMAL';
  if (wasAnomalous && !resolved) {
    const att = config.attention;
    if (activeRun >= att.minMinutes && (maxRel >= att.relative || maxDelta >= att.absoluteKw)) level = 'ATTENTION';
    else level = 'WATCH';
  }

  const activeAnomaly = level !== 'NORMAL';
  const reference = last || {actual:0, expected:0, relative:0, business:false};
  const relativePct = reference.expected > 0 ? ((reference.actual-reference.expected)/reference.expected)*100 : 0;
  const causes = causeCandidates({rows, store, level});
  const event = buildEvent({rows, level, wasteKwh, extraCost, causes, store, resolved});

  return {
    engineVersion: ENGINE_VERSION,
    profileSize: profile.size,
    rows,
    level,
    label: level === 'ATTENTION' ? '확인 필요' : level === 'WATCH' ? '주의' : '정상',
    message: statusMessage({level, resolved, last, activeRun}),
    activeAnomaly,
    resolved,
    durationMinutes: activeRun,
    currentKw: round(reference.actual,2),
    expectedKw: round(reference.expected,2),
    relativePct: round(relativePct,1),
    wasteKwh: round(wasteKwh,2),
    extraCost: Math.round(extraCost),
    monthlyCost: resolved ? 0 : Math.round(extraCost * 30),
    causes,
    event,
  };
}

function statusMessage({level, resolved, last, activeRun}) {
  if (resolved) return '조치 후 평소 범위로 돌아왔습니다.';
  if (level === 'NORMAL') return '현재 평소 범위입니다.';
  const when = last?.business ? '영업시간에' : '폐점 후';
  return `${when} 평소보다 높은 전력 사용이 ${formatDuration(activeRun)}째 계속되고 있습니다.`;
}

export function formatDuration(minutes) {
  const m = Math.max(0, Math.round(Number(minutes)||0));
  const h = Math.floor(m/60), r = m%60;
  if (!h) return `${r}분`;
  if (!r) return `${h}시간`;
  return `${h}시간 ${r}분`;
}

function causeCandidates({rows, store, level}) {
  if (level === 'NORMAL') return [];
  const active = rows.filter(r=>r.anomalous);
  const mostlyOff = active.length && active.filter(r=>!r.business).length / active.length >= 0.6;
  const spikes = active.filter(r=>r.delta >= 1.5).length >= 2;
  const longBase = active.length * SLOT_MINUTES >= 90;
  if (mostlyOff && longBase) return ['냉난방기 종료 여부', '전열기·온수기', '냉장·냉동설비 문열림 또는 이상작동', '기타 폐점 후 켜져 있는 설비'];
  if (mostlyOff && spikes) return ['전열기·온수기', '압축기 등 주기 설비', '조명·간판', '기타 심야 가동 설비'];
  if (mostlyOff) return ['냉난방기 종료 여부', '조명·간판', '전열기·온수기', '상시 가동 설비'];
  return ['냉난방기 설정 변화', '고출력 조리·전열 설비', '특별 작업 여부', '평소와 다른 장비 사용'];
}

function buildEvent({rows, level, wasteKwh, extraCost, causes, store, resolved}) {
  const anomalous = rows.filter(r=>r.anomalous);
  if (!anomalous.length) return null;
  const start = anomalous[0].timestamp;
  const end = anomalous.at(-1).timestamp;
  return {
    id:`evt-${String(start).replace(/\D/g,'').slice(-12)}`,
    type: anomalous.filter(r=>!r.business).length >= anomalous.length/2 ? 'AFTER_HOURS' : 'BUSINESS_SPIKE',
    level,
    status: resolved ? 'RESOLVED' : 'OPEN',
    start, end,
    wasteKwh:round(wasteKwh,2), extraCost:Math.round(extraCost),
    summary: resolved ? '조치 후 평소 범위로 복귀' : '평소보다 높은 전력 사용이 지속됨',
    causes,
    storeId:store.id,
  };
}

function seededNoise(i, amplitude=0.05) {
  return (Math.sin(i*12.9898)*43758.5453 % 1) * amplitude;
}

function profileKw(date, store, variant=0) {
  const h = date.getHours() + date.getMinutes()/60;
  const business = isBusinessHour(date, store);
  let base;
  if (!business) base = 0.72;
  else if (h < 11) base = 2.4;
  else if (h < 14) base = 3.45;
  else if (h < 18) base = 2.85;
  else base = 3.65;
  const cycle = 0.20*Math.sin((h/24)*Math.PI*4) + 0.08*Math.cos((h/24)*Math.PI*9);
  return Math.max(0.3, base + cycle + seededNoise(date.getDate()*100 + date.getHours()*4 + date.getMinutes()/15 + variant, 0.09));
}

export function generateBaseline(store, anchorDate = '2026-09-30T00:00:00+09:00') {
  const anchor = safeDate(anchorDate);
  const out=[];
  for(let days=14; days>=1; days--) {
    const d0 = new Date(anchor); d0.setDate(d0.getDate()-days); d0.setHours(0,0,0,0);
    for(let s=0;s<96;s++) {
      const d=new Date(d0); d.setMinutes(s*SLOT_MINUTES);
      out.push({timestamp:d.toISOString(), power_kw:round(profileKw(d,store,days),3)});
    }
  }
  return out;
}

export function generateCurrent(store, scenario='A', step='full', anchorDate = '2026-09-30T00:00:00+09:00') {
  const anchor=safeDate(anchorDate); anchor.setHours(0,0,0,0);
  const all=[];
  const maxSlot = step === 'start' ? 89 : step === 'watch' ? 93 : step === 'attention' ? 99 : 95; // around 22:15-00:45 local display depends on offset
  for(let s=0;s<96;s++) {
    const d=new Date(anchor); d.setMinutes(s*SLOT_MINUTES);
    let kw=profileKw(d,store,30);
    const minutes=d.getHours()*60+d.getMinutes();
    const closeParts=String(store.closeTime||'22:00').split(':').map(Number);
    const close=closeParts[0]*60+closeParts[1];
    if (scenario==='B' && minutes>=close) kw = 2.1 + 0.08*Math.sin(s);
    if (scenario==='C' && minutes>=14*60 && minutes<16*60+15) kw = profileKw(d,store,30)+1.85;
    all.push({timestamp:d.toISOString(),power_kw:round(kw,3)});
  }
  if (step==='resolved' && scenario==='B') {
    // 22:00~23:30 anomaly, then normal for two slots => actual recovery detected from data.
    for(let s=0;s<all.length;s++) {
      const d=safeDate(all[s].timestamp); const m=d.getHours()*60+d.getMinutes();
      const [ch,cm]=String(store.closeTime||'22:00').split(':').map(Number); const close=ch*60+cm;
      if(m>=close && m<close+90) all[s].power_kw=round(2.1+0.05*Math.sin(s),3);
      if(m>=close+90) all[s].power_kw=round(profileKw(d,store,30),3);
    }
    return all.filter(r=>safeDate(r.timestamp).getHours()*60+safeDate(r.timestamp).getMinutes()<=24*60-15);
  }
  if (step==='full' && scenario==='C') {
    return all.filter(r=>{const d=safeDate(r.timestamp); return d.getHours()*60+d.getMinutes()<=16*60;});
  }
  if (step==='full') return all;
  // Cut the day at a deterministic local clock point for demo progression.
  const cut = step==='start' ? 22*60+15 : step==='watch' ? 22*60+45 : 23*60+45;
  return all.filter(r=>{const d=safeDate(r.timestamp); return d.getHours()*60+d.getMinutes()<=cut;});
}

export function learningProgress(baselineReadings) {
  const days=new Set(baselineReadings.map(r=>String(r.timestamp).slice(0,10)));
  return Math.min(14, days.size);
}
