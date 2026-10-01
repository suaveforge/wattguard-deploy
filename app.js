import { analyzeEnergy, generateBaseline, generateCurrent, formatDuration, learningProgress } from './engine.js';
import { EVIDENCE_REGISTRY, EVIDENCE_CATEGORIES, evidenceFor } from './evidence-registry.js';

const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const money = (n) => `${Math.round(Number(n)||0).toLocaleString('ko-KR')}원`;
const kwh = (n) => `${Number(n||0).toFixed(2)} kWh`;
const kw = (n) => `${Number(n||0).toFixed(2)} kW`;
const pct = (n) => `${n>=0?'+':''}${Number(n||0).toFixed(1)}%`;
const brandIcon = (stateName='normal', cls='') => `<img class="brand-icon ${cls}" src="./assets/icons/state-${stateName}.svg" alt="">`;
const delay = (ms) => new Promise(resolve=>setTimeout(resolve,ms));

const DEFAULT_STORE={id:'store-mokdong-demo',name:'목동 데모카페',type:'카페',openTime:'09:00',closeTime:'22:00',holidays:[0],pricePerKwh:190};
const state = {
  store: JSON.parse(localStorage.getItem('wattguardStore')||'null'),
  scenario: localStorage.getItem('wattguardScenario')||'A',
  demoStep: localStorage.getItem('wattguardStep')||'full',
  actions: JSON.parse(localStorage.getItem('wattguardActions')||'[]'),
  alerts: JSON.parse(localStorage.getItem('wattguardAlerts')||'[]'),
  route: location.hash.replace('#/','').split('/')[0]||'home',
};

function persist(){
  localStorage.setItem('wattguardStore',JSON.stringify(state.store));
  localStorage.setItem('wattguardScenario',state.scenario);
  localStorage.setItem('wattguardStep',state.demoStep);
  localStorage.setItem('wattguardActions',JSON.stringify(state.actions.slice(-50)));
  localStorage.setItem('wattguardAlerts',JSON.stringify(state.alerts.slice(-50)));
}

function dataset(){
  const store=state.store||DEFAULT_STORE;
  const baseline=generateBaseline(store);
  let current=generateCurrent(store,state.scenario,state.demoStep);
  return {store,baseline,current,analysis:analyzeEnergy({baselineReadings:baseline,currentReadings:current,store})};
}

function maybeRecordAlert(analysis){
  if(!analysis.event || analysis.level==='NORMAL') return;
  const fingerprint=`${analysis.event.type}-${analysis.level}-${String(analysis.event.start).slice(0,13)}`;
  if(state.alerts.some(a=>a.fingerprint===fingerprint)) return;
  state.alerts.push({fingerprint,createdAt:new Date().toISOString(),...analysis.event});
  persist();
}

function appShell(content){
  return `<div class="app-shell">
    <header class="topbar">
      <a href="#/home" class="brand"><span class="brand-mark">${brandIcon('normal')}</span><span><strong>와트가드</strong><small>새는 전력을 먼저 발견합니다</small></span></a>
      <div class="top-actions"><a class="evidence-link" href="#/evidence">근거</a><div class="store-pill">${escapeHtml((state.store||DEFAULT_STORE).name)}</div></div>
    </header>
    <main id="main" class="page">${content}</main>
    <nav class="bottom-nav" aria-label="주요 메뉴">
      ${nav('home','홈','⌂')}${nav('history','히스토리','▥')}${nav('alerts','알림','◉')}${nav('settings','설정','⚙')}${nav('demo','데모','▶')}
    </nav>
  </div>`;
}
function nav(route,label,icon){return `<a class="${state.route===route?'active':''}" href="#/${route}"><span>${icon}</span>${label}</a>`;}

function statusClass(level){return level==='ATTENTION'?'attention':level==='WATCH'?'watch':'normal';}

function homeView(){
  const {analysis,current}=dataset(); maybeRecordAlert(analysis);
  const last=current.at(-1);
  const lastTime=last?new Date(last.timestamp).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'}):'-';
  return appShell(`
    <section class="status-card ${statusClass(analysis.level)}">
      <div class="eyebrow">현재 상태 · ${lastTime}</div>
      <div class="status-row"><div><h1>${analysis.label}</h1><p>${analysis.message}</p></div><div class="status-orb">${analysis.level==='NORMAL'?'✓':analysis.level==='WATCH'?'!':'!!'}</div></div>
      ${analysis.level!=='NORMAL'?`<div class="loss-highlight"><span>현재까지 추정 낭비</span><strong>${money(analysis.extraCost)}</strong><small>${kwh(analysis.wasteKwh)} · 입력한 평균 전력단가 기준 추정</small></div>`:''}
    </section>

    <section class="metric-grid">
      ${metric('현재 사용전력',kw(analysis.currentKw),'지금')}
      ${metric('평소 사용전력',kw(analysis.expectedKw),'같은 요일군·시간대')}
      ${metric('평소 대비',pct(analysis.relativePct),analysis.durationMinutes?`${formatDuration(analysis.durationMinutes)} 지속`:'평소 범위')}
      ${metric('월 환산 추정',money(analysis.monthlyCost),'같은 패턴이 매일 반복될 경우')}
    </section>

    <section class="panel"><div class="panel-head"><div><h2>오늘 전력 흐름</h2><p>평소 범위와 오늘 사용량을 겹쳐 봅니다.</p></div><a href="#/history">자세히</a></div>${chartSvg(analysis.rows)}</section>

    <section class="panel explain"><h2>왜 알렸나요?</h2>${whyText(analysis)}<div class="evidence-inline"><h3>숫자와 판단의 근거</h3>${evidenceMini(evidenceFor(['market_growth','refrigeration','case_savings','energy_burden','anomaly_detection']).slice(0,3))}<a class="secondary evidence-more" href="#/evidence">Evidence 전체 보기</a></div></section>

    <section class="panel"><h2>먼저 확인해 보세요</h2>${analysis.causes.length?`<ol class="check-list">${analysis.causes.slice(0,4).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ol>`:'<p class="muted">현재는 평소 범위라 점검할 항목이 없습니다.</p>'}
      ${analysis.level!=='NORMAL'?`<div class="action-row"><a class="secondary wide" href="#/detail">이상 상세보기</a><button class="primary wide" id="action-complete">확인·조치 완료</button></div>`:''}
    </section>
    <div class="source-note">분석 기준: 14일 데모 baseline · 요일군 + 15분 시간슬롯 + 영업 여부 · median 기반</div>
  `);
}

function whyText(a){
  if(a.level==='NORMAL') return `<p>현재 전력 사용은 우리 매장의 같은 요일군·시간대 평소 범위 안에 있습니다.</p>`;
  return `<p>같은 요일군·시간대의 평소 사용전력은 <strong>${kw(a.expectedKw)}</strong>인데, 지금은 <strong>${kw(a.currentKw)}</strong>입니다. ${a.durationMinutes?`이 차이가 <strong>${formatDuration(a.durationMinutes)}</strong> 이어졌습니다.`:''}</p><div class="why-stats"><span>평소 대비 <b>${pct(a.relativePct)}</b></span><span>추가 사용 <b>${kwh(a.wasteKwh)}</b></span></div>`;
}

function metric(label,value,sub){return `<article class="metric"><span>${label}</span><strong>${value}</strong><small>${sub}</small></article>`;}

function chartSvg(rows){
  const data=rows.filter((_,i)=>i%2===0); if(!data.length) return '<div class="empty">데이터 없음</div>';
  const w=760,h=230,p=28; const max=Math.max(5,...data.map(r=>Math.max(r.actual,r.high)))*1.08;
  const x=i=>p+(w-2*p)*(i/(data.length-1||1)); const y=v=>h-p-(h-2*p)*(v/max);
  const line=field=>data.map((r,i)=>`${i?'L':'M'}${x(i).toFixed(1)},${y(r[field]).toFixed(1)}`).join(' ');
  const bandTop=data.map((r,i)=>`${i?'L':'M'}${x(i).toFixed(1)},${y(r.high).toFixed(1)}`).join(' ');
  const bandBottom=[...data].reverse().map((r,ii)=>{const i=data.length-1-ii; return `L${x(i).toFixed(1)},${y(r.low).toFixed(1)}`;}).join(' ');
  const anomalies=data.map((r,i)=>r.anomalous?`<circle cx="${x(i)}" cy="${y(r.actual)}" r="3.8" class="anomaly-dot"/>`:'' ).join('');
  return `<div class="chart-wrap"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="평소 범위와 오늘 전력 사용량 그래프"><path class="range" d="${bandTop} ${bandBottom} Z"/><path class="expected" d="${line('expected')}"/><path class="actual" d="${line('actual')}"/>${anomalies}<line x1="${p}" y1="${h-p}" x2="${w-p}" y2="${h-p}" class="axis"/></svg><div class="legend"><span><i class="lg range-lg"></i>평소 범위</span><span><i class="lg expected-lg"></i>평소</span><span><i class="lg actual-lg"></i>오늘</span><span><i class="lg anomaly-lg"></i>이상 구간</span></div></div>`;
}

function detailView(){
  const {analysis}=dataset();
  const ev=analysis.event;
  const anomalous=analysis.rows.filter(r=>r.anomalous);
  return appShell(`<section class="page-title"><h1>이상 상세</h1><p>왜 알렸는지, 얼마가 더 쓰였는지, 무엇부터 확인할지 한 화면에서 봅니다.</p></section>
    <section class="status-card ${statusClass(analysis.level)}"><div class="eyebrow">현재 판정</div><div class="status-row"><div><h1>${analysis.label}</h1><p>${analysis.message}</p></div><div class="status-orb">${analysis.level==='NORMAL'?'✓':analysis.level==='WATCH'?'!':'!!'}</div></div></section>
    <section class="metric-grid">
      ${metric('평소 대비',pct(analysis.relativePct),analysis.durationMinutes?`${formatDuration(analysis.durationMinutes)} 지속`:'현재 정상')}
      ${metric('추가 사용량',kwh(analysis.wasteKwh),'actual − expected 누적')}
      ${metric('오늘 추가비용',money(analysis.extraCost),'입력한 평균 전력단가 기준')}
      ${metric('월 환산',money(analysis.monthlyCost),'같은 패턴이 매일 반복된다는 가정')}
    </section>
    <section class="panel explain"><div class="panel-head"><div><h2>왜 이 알림이 발생했나요?</h2><p>판정에 실제로 사용한 신호와 제품 규칙입니다.</p></div><a href="#/evidence">전체 근거</a></div>${whyText(analysis)}${decisionTrace(analysis)}<div class="evidence-inline"><h3>관련 근거</h3>${evidenceMini(evidenceFor(['baseline','anomaly_detection','duration','cause_priority','cost_estimate']).slice(0,4))}<a class="secondary evidence-more" href="#/evidence">관련 근거 전체 보기</a></div></section>
    <section class="panel"><h2>먼저 확인해 보세요</h2>${analysis.causes.length?`<ol class="check-list">${analysis.causes.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ol>`:'<p class="muted">현재 점검할 이상이 없습니다.</p>'}<p class="boundary-note"><b>안전경계</b> 매장 전체 전력만으로 특정 설비 고장이나 전기화재 위험을 확정하지 않습니다. 점검 우선순위만 제공합니다.</p></section>
    <section class="panel table-panel"><h2>이상 구간 데이터</h2>${anomalous.length?`<table><thead><tr><th>시간</th><th>실제</th><th>평소</th><th>차이</th></tr></thead><tbody>${anomalous.slice(-16).map(r=>`<tr><td>${new Date(r.timestamp).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})}</td><td>${kw(r.actual)}</td><td>${kw(r.expected)}</td><td>${kw(r.delta)}</td></tr>`).join('')}</tbody></table>`:'<div class="empty">현재 진행 중인 이상 구간이 없습니다.</div>'}</section>
    <div class="action-row"><a class="secondary wide" href="#/home">홈으로</a>${analysis.level!=='NORMAL'?'<button class="primary wide" id="action-complete">확인·조치 완료</button>':''}</div>`);
}

function historyView(){
  const {analysis}=dataset();
  const rows=[...analysis.rows].reverse().filter((_,i)=>i%4===0).slice(0,24);
  return appShell(`<section class="page-title"><h1>전력 사용 히스토리</h1><p>원시 데이터 대신 판단에 필요한 차이만 보여줍니다.</p></section><section class="panel">${chartSvg(analysis.rows)}</section><section class="panel table-panel"><table><thead><tr><th>시간</th><th>오늘</th><th>평소</th><th>차이</th></tr></thead><tbody>${rows.map(r=>`<tr class="${r.anomalous?'row-alert':''}"><td>${new Date(r.timestamp).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})}</td><td>${kw(r.actual)}</td><td>${kw(r.expected)}</td><td>${r.expected?pct(((r.actual-r.expected)/r.expected)*100):'-'}</td></tr>`).join('')}</tbody></table></section>`);
}

function alertsView(){
  const items=[...state.alerts].reverse();
  return appShell(`<section class="page-title"><h1>알림 기록</h1><p>평소와 다른 사용이 실제 기준을 넘었을 때만 기록합니다.</p></section><section class="stack">${items.length?items.map(a=>`<article class="alert-item ${statusClass(a.level)}"><div><b>${a.level==='ATTENTION'?'확인 필요':'주의'}</b><span>${new Date(a.createdAt).toLocaleString('ko-KR')}</span></div><p>${escapeHtml(a.summary)}</p><small>${kwh(a.wasteKwh)} · ${money(a.extraCost)}</small></article>`).join(''):'<div class="panel empty">아직 알림 기록이 없습니다.</div>'}</section>`);
}

function settingsView(){
  const s=state.store||DEFAULT_STORE;
  return appShell(`<section class="page-title"><h1>매장 설정</h1><p>전력 전문가가 아니어도 필요한 값만 입력합니다.</p></section><form class="panel form-grid" id="store-form">
    <label>매장명<input name="name" value="${escapeAttr(s.name)}" required></label><label>업종<select name="type">${['카페','음식점','편의점','무인점포','미용실','숙박업','기타'].map(x=>`<option ${x===s.type?'selected':''}>${x}</option>`).join('')}</select></label>
    <label>영업 시작<input type="time" name="openTime" value="${s.openTime}" required></label><label>영업 종료<input type="time" name="closeTime" value="${s.closeTime}" required></label>
    <label class="full">평균 전력단가(원/kWh)<input type="number" min="1" name="pricePerKwh" value="${s.pricePerKwh}" required><small>실제 한전 청구액이 아니라 추정 계산에 쓰는 평균 단가입니다.</small></label>
    <button class="primary" type="submit">저장</button></form><section class="panel"><h2>데이터소스</h2><div class="data-source"><b>현재</b><span>내장 데모 데이터 · 오프라인 작동</span></div><div class="data-source muted"><b>향후</b><span>CSV · 한전 AMI/Power Planner · 스마트미터</span></div></section><section class="panel evidence-entry"><div><h2>Evidence / 근거</h2><p>왜 이 신호를 보고 왜 이런 판단을 하는지, 원출처와 제품 적용범위를 분리해 공개합니다.</p></div><a class="secondary" href="#/evidence">근거 보기</a></section>`);
}


function decisionTrace(a){
  const offHours = a.event?.businessStatus === 'closed' || a.event?.type === 'OFF_HOURS';
  return `<div class="decision-trace">
    <div><span>① 평소 동일 시간대</span><b>${kw(a.expectedKw)}</b></div>
    <div><span>② 현재 사용</span><b>${kw(a.currentKw)}</b></div>
    <div><span>③ 평소 대비 차이</span><b>${pct(a.relativePct)}</b></div>
    <div><span>④ 영업 상태</span><b>${offHours?'비영업시간':'영업시간 기준'}</b></div>
    <div><span>⑤ 지속시간</span><b>${a.durationMinutes?formatDuration(a.durationMinutes):'지속 이상 없음'}</b></div>
    <div><span>⑥ 비용 계산</span><b>추가사용량 × 입력 단가</b></div>
  </div><p class="muted rule-disclosure">현재 엔진의 구체 임계값은 MVP 제품 휴리스틱입니다. 논문·공공기관의 법정 기준이라고 표시하지 않습니다.</p>`;
}

function evidenceMini(items){
  return `<div class="evidence-mini-list">${items.map(e=>`<a href="#/evidence/${encodeURIComponent(e.id)}" class="evidence-mini"><span class="source-type">${escapeHtml(e.source_type)}</span><b>${escapeHtml(e.title)}</b><small>${escapeHtml(e.product_implication)}</small></a>`).join('')}</div>`;
}

function categoryCount(key){return EVIDENCE_REGISTRY.filter(e=>e.category===key).length;}
function scopeBadge(scope){return `<span class="scope-badge ${scope==='현재 구현'?'implemented':scope==='향후 계획'?'future':'reference'}">${escapeHtml(scope)}</span>`;}
function evidenceVisual(e){
  const v=e.visual;
  if(!v) return e.highlight?`<div class="evidence-highlight"><b>${escapeHtml(e.highlight.value)}</b><span>${escapeHtml(e.highlight.label)}</span></div>`:'';
  if(v.type==='bars'){
    const max=Math.max(1,...v.items.map(x=>Number(x.value)||0));
    return `<div class="evi-graphic evi-bars" role="img" aria-label="${escapeAttr(v.label||e.highlight?.label||'근거 인포그래픽')}"><div class="evi-bars-grid">${v.items.map(x=>`<div class="evi-bar-col"><b>${escapeHtml(x.display||x.value)}</b><div class="evi-bar-track"><i style="height:${Math.max(8,Math.round((Number(x.value)||0)/max*100))}%"></i></div><span>${escapeHtml(x.label)}</span></div>`).join('')}</div>${v.note?`<small>${escapeHtml(v.note)}</small>`:''}</div>`;
  }
  if(v.type==='trend'){
    const ratio=Math.max(1,Math.min(100,Math.round((Number(v.startValue)||0)/(Number(v.endValue)||1)*100)));
    return `<div class="evi-graphic evi-trend" role="img" aria-label="${escapeAttr(v.badge||'시장 전망 인포그래픽')}"><div class="evi-trend-head"><b>${escapeHtml(v.badge||'')}</b><span>${escapeHtml(v.note||'')}</span></div><div class="evi-trend-row"><div><span>${escapeHtml(v.startLabel)}</span><strong>${escapeHtml(v.startDisplay)}</strong><i style="width:${ratio}%"></i></div><em>→</em><div><span>${escapeHtml(v.endLabel)}</span><strong>${escapeHtml(v.endDisplay)}</strong><i style="width:100%"></i></div></div></div>`;
  }
  if(v.type==='donut'){
    const p=Math.max(0,Math.min(100,Number(v.value)||0));
    return `<div class="evi-graphic evi-donut-wrap" role="img" aria-label="${escapeAttr(v.center+' '+v.label)}"><div class="evi-donut" style="--pct:${p}"><div><b>${escapeHtml(v.center||p+'%')}</b><span>${escapeHtml(v.label||'')}</span></div></div><p>${escapeHtml(v.note||'')}</p></div>`;
  }
  if(v.type==='stats'){
    return `<div class="evi-graphic evi-stats" role="img" aria-label="${escapeAttr(v.items.map(x=>x.value+' '+x.label).join(', '))}"><div>${v.items.map(x=>`<article><b>${escapeHtml(x.value)}</b><span>${escapeHtml(x.label)}</span></article>`).join('')}</div>${v.note?`<small>${escapeHtml(v.note)}</small>`:''}</div>`;
  }
  if(v.type==='saving'){
    return `<div class="evi-graphic evi-saving" role="img" aria-label="${escapeAttr(v.value+' '+v.label)}"><span class="evi-saving-arrow">↓</span><div><b>${escapeHtml(v.value)}<small>${escapeHtml(v.period||'')}</small></b><strong>${escapeHtml(v.label||'')}</strong><p>${escapeHtml(v.note||'')}</p></div></div>`;
  }
  if(v.type==='odds'){
    const max=Math.max(1,...v.items.map(x=>Number(x.value)||0));
    return `<div class="evi-graphic evi-odds" role="img" aria-label="에너지 불안정과 정신건강 연관성"><div>${v.items.map(x=>`<article><span>${escapeHtml(x.label)}</span><div class="evi-odds-track"><i style="width:${Math.max(10,Math.round((Number(x.value)||0)/max*100))}%"></i></div><b>${escapeHtml(x.display)}</b></article>`).join('')}</div><small>${escapeHtml(v.note||'')}</small></div>`;
  }
  if(v.type==='timeline'){
    return `<div class="evi-graphic evi-timeline" role="img" aria-label="${escapeAttr(v.value+' '+v.label)}"><div class="evi-time-chip">${escapeHtml(v.value)}</div><div><b>${escapeHtml(v.label||'')}</b><p>${escapeHtml(v.note||'')}</p></div></div>`;
  }
  return e.highlight?`<div class="evidence-highlight"><b>${escapeHtml(e.highlight.value)}</b><span>${escapeHtml(e.highlight.label)}</span></div>`:'';
}
function evidenceCard(e){
  const sourceLink=e.url?`<a class="source-button" href="${escapeAttr(e.url)}" target="_blank" rel="noopener noreferrer">원출처 열기 ↗</a>`:'<span class="source-button disabled">내부 제품 규칙</span>';
  return `<article class="evidence-card" id="ev-${escapeAttr(e.id)}" data-evidence-id="${escapeAttr(e.id)}">
    <div class="evidence-card-head"><div><span class="source-type">${escapeHtml(e.source_type)}</span>${scopeBadge(e.scope)}</div><code>${escapeHtml(e.id)}</code></div>
    <h2>${escapeHtml(e.title)}</h2>${evidenceVisual(e)}<p class="claim">${escapeHtml(e.claim)}</p>
    <dl class="evidence-meta"><div><dt>발행</dt><dd>${escapeHtml(e.publisher)} · ${e.year}</dd></div>${e.authors?`<div><dt>저자/기관</dt><dd>${escapeHtml(e.authors)}</dd></div>`:''}${e.doi?`<div><dt>DOI</dt><dd>${escapeHtml(e.doi)}</dd></div>`:''}<div><dt>Evidence level</dt><dd>${escapeHtml(e.evidence_level)}</dd></div><div><dt>검증일</dt><dd>${escapeHtml(e.verified_at)}</dd></div></dl>
    <div class="implication"><b>와트가드에는 이렇게 적용</b><p>${escapeHtml(e.product_implication)}</p></div>
    <div class="limitation"><b>한계 / 과장 금지선</b><p>${escapeHtml(e.limitations)}</p></div>
    ${sourceLink}
  </article>`;
}

function evidenceView(){
  const hashId=decodeURIComponent((location.hash.split('/')[2]||''));
  const groups=Object.keys(EVIDENCE_CATEGORIES).map(key=>`<button class="evidence-filter" data-ev-filter="${key}"><span>${EVIDENCE_CATEGORIES[key]}</span><b>${categoryCount(key)}</b></button>`).join('');
  const cards=EVIDENCE_REGISTRY.map(e=>evidenceCard(e)).join('');
  setTimeout(()=>{if(hashId){document.querySelector(`[data-evidence-id="${CSS.escape(hashId)}"]`)?.scrollIntoView({behavior:'smooth',block:'start'});}},0);
  return appShell(`<section class="page-title evidence-title"><div><span class="eyebrow">Evidence registry · verified 2026-10-02</span><h1>왜 이 신호를 보고,<br>왜 이렇게 판단하나요?</h1><p>시장자료 · 연구근거 · 현재 구현 · 향후 계획 · 안전경계를 섞지 않고 각각 추적합니다.</p></div><div class="evidence-summary"><b>${EVIDENCE_REGISTRY.length}</b><span>등록 근거</span><small>외부 출처 + 제품 규칙</small></div></section>
    <section class="evidence-principles"><div><b>원출처 우선</b><span>외부 수치에는 출처를 붙입니다.</span></div><div><b>원인 확정 금지</b><span>설비 고장이 아니라 점검 우선순위입니다.</span></div><div><b>구현과 계획 분리</b><span>현재 연결된 것과 향후 연동을 구분합니다.</span></div></section>
    <section class="evidence-filters"><button class="evidence-filter active" data-ev-filter="ALL"><span>전체</span><b>${EVIDENCE_REGISTRY.length}</b></button>${groups}</section>
    <section class="evidence-list" id="evidence-list">${cards}</section>`);
}

function learningView(){
  const store=state.store||DEFAULT_STORE;
  const day=learningProgress(generateBaseline(store));
  return appShell(`<section class="page-title"><span class="eyebrow">14일 기준선 학습</span><h1>우리 매장의 평소를 먼저 배웁니다.</h1><p>요일 · 시간대 · 영업 여부별로 평소 전력 패턴을 만들어 이후 변화를 비교합니다.</p></section>
    <section class="panel learning-hero"><div class="learning-orbit">${brandIcon('normal','learning-icon')}</div><div><span>기준선 학습</span><strong>DAY ${day} / 14</strong><p>데모 데이터 기준 학습 완료 · 실제 서비스에서는 누적 데이터에 따라 진행됩니다.</p></div></section>
    <section class="panel"><div class="progress-label"><span>평소 패턴 학습률</span><b>${Math.round(day/14*100)}%</b></div><div class="progress"><i style="width:${Math.round(day/14*100)}%"></i></div><div class="learning-rules"><div><b>요일군</b><span>평일 / 주말</span></div><div><b>시간</b><span>15분 슬롯</span></div><div><b>상태</b><span>영업 / 비영업</span></div><div><b>기준값</b><span>median 중심</span></div></div></section>
    <section class="panel explain"><h2>학습이 끝나면</h2><p>같은 시간대의 평소 사용량과 현재 사용량의 차이, 그 차이가 이어진 시간, 영업 여부를 함께 보고 이상징후를 판단합니다.</p></section>`);
}

function captureView(){
  return `<div class="capture-ready-screen"><div class="capture-ready-card">${brandIcon('normal','capture-ready-icon')}<span class="eyebrow">SUBMISSION LIVE CAPTURE</span><h1>와트가드 실제화면 시연</h1><p>실제 웹앱 화면을 자동 진행해 제출용 영상을 녹화합니다.</p><button class="primary" id="capture-start">시연 시작</button></div></div>`;
}

let captureRunning=false;
function setCaptureMeta(scene,caption=''){
  const root=$('#app');
  if(!root)return;
  root.dataset.captureScene=scene;
  root.dataset.captureCaption=caption;
  root.dataset.captureState='running';
}
function showCaptureSplash({icon='normal',scene,title='',subtitle='',theme='dark',footer=''}){
  const root=$('#app');
  root.innerHTML=`<section class="capture-splash ${theme}"><div class="capture-splash-inner">${brandIcon(icon,'capture-splash-icon')}<div class="capture-splash-copy"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(subtitle)}</p></div>${footer?`<div class="capture-splash-footer">${escapeHtml(footer)}</div>`:''}</div></section>`;
  setCaptureMeta(scene,title);
}
function showCaptureApp(viewFn,route,caption,scene){
  state.route=route;
  $('#app').innerHTML=viewFn();
  bind();
  document.body.classList.add('capture-tour-active');
  window.scrollTo(0,0);
  setCaptureMeta(scene,caption);
}
function captureSnapshot(){
  const keys=['wattguardStore','wattguardScenario','wattguardStep','wattguardActions','wattguardAlerts'];
  return {state:{store:state.store?JSON.parse(JSON.stringify(state.store)):null,scenario:state.scenario,demoStep:state.demoStep,actions:JSON.parse(JSON.stringify(state.actions)),alerts:JSON.parse(JSON.stringify(state.alerts))},storage:Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)]))};
}
function restoreCaptureSnapshot(snapshot){
  Object.entries(snapshot.storage).forEach(([k,v])=>v==null?localStorage.removeItem(k):localStorage.setItem(k,v));
  state.store=snapshot.state.store;state.scenario=snapshot.state.scenario;state.demoStep=snapshot.state.demoStep;state.actions=snapshot.state.actions;state.alerts=snapshot.state.alerts;
}
async function runCaptureTour(){
  if(captureRunning)return;
  captureRunning=true;
  const snapshot=captureSnapshot();
  window.__WATTGUARD_CAPTURE_DONE__=false;
  document.body.classList.add('capture-mode','capture-tour-active');
  try{
    state.store={...DEFAULT_STORE,name:'와트가드 데모매장',type:'무인점포'};
    state.actions=[];state.alerts=[];
    showCaptureSplash({icon:'normal',scene:'intro-normal',title:'',subtitle:'',theme:'dark'}); await delay(700);
    showCaptureSplash({icon:'drift',scene:'intro-drift',title:'평소와 다른 전력이',subtitle:'조용히 시작됩니다',theme:'dark'}); await delay(950);
    showCaptureSplash({icon:'attention',scene:'intro-attention',title:'와트가드',subtitle:'새는 전력을 먼저 발견합니다',theme:'dark',footer:'평소 → 벗어남 → 확인 필요'}); await delay(1500);

    state.scenario='A';state.demoStep='full';
    showCaptureApp(learningView,'learning','14일의 평소 패턴을 먼저 학습합니다','learning-baseline'); await delay(3300);
    showCaptureApp(homeView,'home','지금 전력이 평소 범위인지 바로 확인합니다','home-normal'); await delay(3000);

    state.scenario='B';state.demoStep='start';
    showCaptureApp(homeView,'home','폐점 후 평소보다 높은 전력이 30분째 이어집니다','anomaly-start'); await delay(3500);
    state.demoStep='watch';
    showCaptureApp(homeView,'home','차이가 이어지면 주의 상태로 추적합니다','anomaly-watch'); await delay(3800);
    state.demoStep='attention';
    showCaptureApp(homeView,'home','지속된 이상을 확인 필요로 올리고 예상 손실액을 보여줍니다','anomaly-attention'); await delay(4300);

    showCaptureApp(detailView,'detail','왜 알렸는지 · 얼마나 더 썼는지 · 무엇부터 볼지 설명합니다','detail-top'); await delay(3600);
    $('.evidence-inline')?.scrollIntoView({behavior:'smooth',block:'center'}); setCaptureMeta('detail-evidence','판단 기준과 관련 근거를 알림에서 바로 추적합니다'); await delay(3600);

    showCaptureApp(evidenceView,'evidence','숫자는 출처와 한계를 붙이고, 한눈에 보이는 인포그래픽으로 함께 보여줍니다','evidence-registry');
    await delay(500);document.querySelector('[data-evidence-id="MARKET-GMR-2024-001"]')?.scrollIntoView({behavior:'smooth',block:'start'});await delay(4000);

    state.demoStep='resolved';
    showCaptureApp(homeView,'home','확인·조치 후 평소 범위로 돌아왔는지 다시 확인합니다','home-recovered'); await delay(3500);

    document.body.classList.remove('capture-tour-active');
    showCaptureSplash({icon:'attention',scene:'outro-attention',title:'낭비를 발견하고',subtitle:'원인 후보와 점검 순서를 확인합니다',theme:'light'}); await delay(1000);
    showCaptureSplash({icon:'drift',scene:'outro-drift',title:'조치한 뒤 다시 확인하고',subtitle:'평소 패턴으로 돌아오는지 지켜봅니다',theme:'light'}); await delay(1050);
    showCaptureSplash({icon:'recovered',scene:'outro-recovered',title:'다시, 평소대로',subtitle:'와트가드가 새는 전력의 시작을 먼저 살핍니다',theme:'light',footer:'평소 → 변화 감지 → 점검 → 정상 복귀'}); await delay(2600);
  } finally {
    restoreCaptureSnapshot(snapshot);
    state.route='demo-capture';
    document.body.classList.remove('capture-tour-active');
    const root=$('#app');
    root.dataset.captureScene='outro-recovered';
    root.dataset.captureCaption='다시, 평소대로';
    root.dataset.captureState='complete';
    window.__WATTGUARD_CAPTURE_DONE__=true;
    captureRunning=false;
  }
}

function demoView(){
  const {analysis}=dataset();
  return appShell(`<section class="page-title"><h1>발표용 DEMO MODE</h1><p>버튼을 누르면 데이터가 바뀌고 결과는 엔진이 다시 계산합니다.</p></section>
    <section class="panel"><h2>시나리오</h2><div class="scenario-grid">${demoBtn('A','정상','전형적인 하루')}${demoBtn('B','폐점 후 낭비','핵심 시연')}${demoBtn('C','영업 중 급증','별도 이상')}</div></section>
    <section class="panel"><h2>핵심 시연 순서</h2><div class="demo-flow"><button data-step="full" data-scenario="A">1. 정상</button><button data-step="start" data-scenario="B">2. 이상 시작</button><button data-step="watch" data-scenario="B">3. 주의</button><button data-step="attention" data-scenario="B">4. 확인 필요</button><button data-action="mark">5. 조치 완료</button><button data-step="resolved" data-scenario="B">6. 정상 복귀</button></div><div class="demo-result ${statusClass(analysis.level)}"><b>현재 계산 결과: ${analysis.label}</b><span>${analysis.message}</span><small>${kwh(analysis.wasteKwh)} · ${money(analysis.extraCost)}</small></div></section>
    <section class="panel"><h2>학습 상태</h2><div class="progress-label"><span>우리 매장의 평소 패턴을 배우는 중</span><b>DAY ${learningProgress(generateBaseline(state.store||DEFAULT_STORE))} / 14</b></div><div class="progress"><i style="width:100%"></i></div><p class="muted">데모에서는 14일 이력 데이터를 즉시 불러와 학습 완료 상태를 재현합니다.</p></section>`);
}
function demoBtn(code,title,sub){return `<button class="scenario ${state.scenario===code?'selected':''}" data-scenario="${code}" data-step="full"><b>${code} · ${title}</b><span>${sub}</span></button>`;}

function onboarding(){
  document.querySelector('#app').innerHTML=`<div class="onboarding"><div class="onboard-card"><div class="brand intro"><span class="brand-mark">${brandIcon('normal')}</span><span><strong>와트가드</strong><small>전기요금은 한 달 뒤 나오지만, 낭비는 지금 시작됩니다.</small></span></div><h1>우리 매장의 평소를 먼저 배웁니다.</h1><p>요일·시간대·영업 여부에 따라 평소 전력 패턴을 만들고, 평소와 다른 소비가 계속되면 바로 알려드립니다.</p><form id="onboard-form" class="form-grid"><label class="full">매장명<input name="name" placeholder="예: 목동 OO카페" required></label><label>업종<select name="type"><option>카페</option><option>음식점</option><option>편의점</option><option>무인점포</option><option>미용실</option><option>숙박업</option><option>기타</option></select></label><label>평균 전력단가<input type="number" name="pricePerKwh" value="190" required></label><label>영업 시작<input type="time" name="openTime" value="09:00" required></label><label>영업 종료<input type="time" name="closeTime" value="22:00" required></label><button class="primary wide full" type="submit">우리 매장 와트가드 시작하기</button></form><button id="quick-demo" class="ghost wide">발표용 데모 바로 시작</button></div></div>`;
  $('#onboard-form').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget);state.store={...DEFAULT_STORE,...Object.fromEntries(f.entries()),pricePerKwh:Number(f.get('pricePerKwh'))};persist();render();});
  $('#quick-demo').addEventListener('click',()=>{state.store={...DEFAULT_STORE};state.scenario='B';state.demoStep='attention';persist();render();});
}

function render(){
  document.body.classList.toggle('capture-mode',state.route==='demo-capture');
  if(state.route==='demo-capture'){ $('#app').innerHTML=captureView(); bind(); return; }
  if(!state.store){onboarding();return;}
  const views={home:homeView,detail:detailView,history:historyView,alerts:alertsView,settings:settingsView,demo:demoView,evidence:evidenceView,learning:learningView};
  $('#app').innerHTML=(views[state.route]||homeView)(); bind();
}

function bind(){
  $('#capture-start')?.addEventListener('click',runCaptureTour);
  $('#action-complete')?.addEventListener('click',()=>{const d=dataset();state.actions.push({at:new Date().toISOString(),event:d.analysis.event,cause:'원인 미확인'});state.demoStep='resolved';persist();render();});
  $('#store-form')?.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget);state.store={...state.store,...Object.fromEntries(f.entries()),pricePerKwh:Number(f.get('pricePerKwh'))};persist();toast('매장 설정을 저장했습니다.');render();});
  $$('[data-scenario]').forEach(b=>b.addEventListener('click',()=>{state.scenario=b.dataset.scenario;state.demoStep=b.dataset.step||'full';persist();render();}));
  $$('[data-ev-filter]').forEach(b=>b.addEventListener('click',()=>{const key=b.dataset.evFilter;$$('[data-ev-filter]').forEach(x=>x.classList.toggle('active',x===b));$$('.evidence-card').forEach(card=>{const item=EVIDENCE_REGISTRY.find(e=>e.id===card.dataset.evidenceId);card.hidden=key!=='ALL'&&item?.category!==key;});}));
  $('[data-action="mark"]')?.addEventListener('click',()=>{const d=dataset();state.actions.push({at:new Date().toISOString(),event:d.analysis.event,cause:'냉난방기'});persist();toast('조치 완료를 기록했습니다. 다음으로 정상 복귀를 눌러보세요.');});
}

function toast(text){let t=$('.toast');if(!t){t=document.createElement('div');t.className='toast';document.body.appendChild(t);}t.textContent=text;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800);}
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function escapeAttr(s){return escapeHtml(s);}

window.addEventListener('hashchange',()=>{state.route=location.hash.replace('#/','').split('/')[0]||'home';render();});
window.addEventListener('online',()=>document.body.classList.remove('offline'));
window.addEventListener('offline',()=>document.body.classList.add('offline'));
if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));
render();
