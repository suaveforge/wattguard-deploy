export const EVIDENCE_CATEGORIES = Object.freeze({
  MARKET: '시장·문제 근거',
  TECH: '기술 근거',
  DATA: '데이터·제도 근거',
  LIMIT: '한계 및 안전경계',
});

export const EVIDENCE_REGISTRY = Object.freeze([
  {
    id:'TECH-AE-2021-001', category:'TECH',
    claim:'건물 전력사용 데이터에 AI/통계 기반 이상탐지를 적용할 수 있으며, 실제 원인 이해와 성능 개선을 위해 occupancy·ambient condition 등 추가 context를 함께 고려하는 방향이 중요하다.',
    title:'Artificial intelligence based anomaly detection of energy consumption in buildings: A review, current trends and new perspectives',
    publisher:'Applied Energy (Elsevier)', authors:'Yassine Himeur; Khalida Ghanem; Abdullah Alsalemi; Faycal Bensaali; Abbes Amira', year:2021,
    source_type:'학술논문 · Review', url:'https://doi.org/10.1016/j.apenergy.2021.116601', doi:'10.1016/j.apenergy.2021.116601',
    applies_to:['baseline','anomaly_detection','context','duration','cause_priority'],
    product_implication:'와트가드는 단일 고정 임계값만 보지 않고 매장별 baseline과 시간·영업상태·지속시간을 함께 본다. 향후 날씨·occupancy 등 context 확장이 가능하도록 분리한다.',
    limitations:'이 논문은 특정 매장·특정 설비 고장을 확정해 주는 임상적/안전 진단 기준이 아니다. 논문이 특정 30분/90분 임계값을 제시한다고 표현하지 않는다.',
    evidence_level:'Peer-reviewed review', verified_at:'2026-10-01', status:'verified', scope:'연구근거'
  },
  {
    id:'DATA-KEPCO-2026-001', category:'DATA',
    claim:'한전은 AMI 구축 고객에게 실시간 전력정보, 시간대별 전력사용량, 전력소비 패턴, 목표 사용량 초과 알림 등을 제공하는 파워플래너 서비스를 운영한다.',
    title:'데이터로 그리는 일상의 변화! 파워플래너부터 안부살핌까지', publisher:'한국전력공사(KEPCO)', authors:'한국전력공사', year:2026,
    source_type:'공공기관 공식자료', url:'https://www.kepco.co.kr/KEPCO_FILE/html/2026_05/mission.html', doi:'',
    applies_to:['ami','power_planner','future_integration','time_series'],
    product_implication:'MVP는 외부 API 없이 동작하지만 데이터 계층을 분리해 향후 AMI/스마트미터 계열 시계열 입력으로 교체할 수 있게 한다.',
    limitations:'현재 MVP가 한전 파워플래너 API와 실시간 연동되어 있다는 뜻이 아니다. 연동 가능 구조와 현재 구현을 구분한다.',
    evidence_level:'공공기관 공식 서비스 자료', verified_at:'2026-10-01', status:'verified', scope:'향후 계획'
  },
  {
    id:'MARKET-KEA-2026-001', category:'MARKET',
    claim:'2026년 한국에너지공단은 소상공인 에너지효율향상 지원사업을 공고했고, 지정 고효율설비 설치비의 최대 70%를 지원 대상으로 제시했다.',
    title:'2026년 소상공인 에너지효율향상 지원사업 공고', publisher:'한국에너지공단', authors:'한국에너지공단', year:2026,
    source_type:'공공기관 사업공고', url:'https://www.energy.or.kr/front/board/View2.do?boardMngNo=2&boardNo=24521', doi:'',
    applies_to:['small_business','energy_efficiency','policy'],
    product_implication:'소상공인의 에너지효율 개선이 실제 정책지원 영역이라는 시장·정책 맥락을 뒷받침한다.',
    limitations:'지원사업의 존재가 와트가드의 절감효과나 지원사업 선정 가능성을 보증하지 않는다.',
    evidence_level:'공공기관 공식 공고', verified_at:'2026-10-01', status:'verified', scope:'시장근거'
  },
  {
    id:'MARKET-GMR-2024-001', category:'MARKET',
    claim:'경기도시장상권진흥원 자료는 2023년 전국 무인점포 약 6,300개, 그중 경기도 31.9%를 제시하고 무인편의점이 최근 4년간 18배 이상 증가했다고 보고했다.',
    title:'경기도 소상공인 경제 이슈 브리프 「무인점포의 현황과 전망」 관련 보도자료', publisher:'경기도시장상권진흥원', authors:'경기도시장상권진흥원 상권정책연구팀', year:2024,
    source_type:'공공기관 시장자료', url:'https://www.gmr.or.kr/storage/board/gallery/2024/11/16/GALLERY_ATTACH_1731745381242.pdf', doi:'',
    applies_to:['unmanned_store','market_growth','target_customer'],
    product_implication:'상주 관리자가 적거나 없는 점포에서 운영상태를 원격으로 빠르게 파악하려는 제품 타깃의 시장 맥락으로 사용한다.',
    limitations:'전국 모든 무인점포의 장기 추세를 확정하는 통계로 과장하지 않는다. 2023년 관측값과 특정 업종의 기간별 증가치를 구분한다.',
    evidence_level:'공공기관 발간 시장자료', verified_at:'2026-10-01', status:'verified', scope:'시장근거'
  },
  {
    id:'MARKET-NFA-2023-001', category:'MARKET',
    claim:'소방청은 무인점포 증가에 따라 현황조사와 업종별 안전관리 필요성을 검토·강화해 왔다.',
    title:'소방청, 무인점포 현황조사 및 다중이용업 지정 검토 추진', publisher:'소방청', authors:'소방청', year:2023,
    source_type:'공공기관 보도자료', url:'https://www.nfa.go.kr/nfa/news/pressrelease/press/?cntId=1642&mode=view', doi:'',
    applies_to:['unmanned_store','management_need'],
    product_implication:'무인 운영환경에서 원격 관리 필요성이 존재한다는 배경 근거로만 사용한다.',
    limitations:'와트가드는 전기화재 위험평가·소방안전 진단 서비스가 아니다. 전력 이상과 화재위험을 동일시하지 않는다.',
    evidence_level:'중앙행정기관 공식자료', verified_at:'2026-10-01', status:'verified', scope:'시장근거'
  },
  {
    id:'MARKET-SMROADMAP-2023-001', category:'MARKET',
    claim:'중소기업 전략기술로드맵은 정보통신 서비스 분야 전략품목으로 ‘소상공인 무인점포 지원 솔루션’을 다루고, 무인점포 증가와 관리기술 필요성을 기술한다.',
    title:'중소기업 전략기술로드맵 — 소상공인 무인점포 지원 솔루션', publisher:'중소기업 기술로드맵', authors:'중소벤처기업부·중소기업기술정보진흥원 계열 로드맵', year:2023,
    source_type:'정부 전략기술 로드맵', url:'https://smroadmap.smtech.go.kr/mpsvc/dtrprt/mpsvcDtrprtDetail.do?cmIdx=3881&cmYyyy=2023', doi:'',
    applies_to:['unmanned_store','market_growth','management_technology'],
    product_implication:'무인·다점포 운영지원 기술이 정책적 기술개발 대상이라는 배경 근거로 사용한다.',
    limitations:'로드맵의 시장전망은 전망치이며 실제 관측값과 구분한다. 제시 시장규모를 와트가드의 직접 시장규모로 환산하지 않는다.',
    evidence_level:'정부 전략기술 자료', verified_at:'2026-10-01', status:'verified', scope:'시장근거'
  },
  {
    id:'LIMIT-AGGREGATE-001', category:'LIMIT',
    claim:'전체 계량기 전력 시계열만으로 특정 설비의 고장 원인을 확정하지 않는다.',
    title:'와트가드 원인표현 안전경계 — aggregate meter 한계', publisher:'와트가드', authors:'SuaveForge', year:2026,
    source_type:'제품 안전경계 · 연구근거 보수 적용', url:'https://doi.org/10.1016/j.apenergy.2021.116601', doi:'10.1016/j.apenergy.2021.116601',
    applies_to:['cause_priority','anomaly_detail','safety_boundary'],
    product_implication:'앱은 “원인”을 단정하지 않고 영업상태·시간대·패턴에 따라 “먼저 확인해 보세요” 형태의 점검 우선순위만 제시한다.',
    limitations:'서브미터·설비센서·현장점검 등 추가 근거가 생기기 전에는 특정 기기 고장·화재 위험을 확정하지 않는다.',
    evidence_level:'제품 안전경계', verified_at:'2026-10-01', status:'implemented', scope:'현재 구현'
  },
  {
    id:'RULE-DURATION-001', category:'TECH',
    claim:'MVP는 순간 튐보다 지속되는 차이를 우선하기 위해 절대차이·상대차이와 함께 연속 지속시간을 판정축으로 사용한다.',
    title:'와트가드 baseline-v1 지속시간 판정 규칙', publisher:'와트가드', authors:'SuaveForge', year:2026,
    source_type:'제품 구현 규칙', url:'', doi:'',
    applies_to:['duration','anomaly_detection','current_engine'],
    product_implication:'현재 엔진은 15분 슬롯에서 연속 후보 구간을 계산한다. 비영업시간/영업시간 임계값과 함께 사용한다.',
    limitations:'현재 30분·90분 등의 임계값은 MVP 제품 휴리스틱이며 학술논문이나 법정 안전기준에서 가져온 값이라고 주장하지 않는다.',
    evidence_level:'내부 제품 규칙', verified_at:'2026-10-01', status:'implemented', scope:'현재 구현'
  },
  {
    id:'RULE-COST-001', category:'LIMIT',
    claim:'예상 추가비용은 검출된 양(+)의 추가사용량에 사용자가 입력한 평균 전력단가를 곱한 추정치다.',
    title:'와트가드 비용 추정 규칙', publisher:'와트가드', authors:'SuaveForge', year:2026,
    source_type:'제품 계산 규칙', url:'', doi:'',
    applies_to:['cost_estimate','monthly_projection'],
    product_implication:'현재까지 추정 낭비비용과 월 환산 값을 계산하되, 실제 한전 청구요금과 구분해 표시한다.',
    limitations:'계약종별·기본요금·시간대별요금·부가세·기금 등 실제 청구요금 체계를 완전 재현하지 않는다. 월 환산은 같은 패턴 반복 가정이다.',
    evidence_level:'내부 계산 규칙', verified_at:'2026-10-01', status:'implemented', scope:'현재 구현'
  }
]);

export function evidenceByIds(ids=[]){
  const set=new Set(ids);
  return EVIDENCE_REGISTRY.filter(item=>set.has(item.id));
}

export function evidenceFor(tags=[]){
  const set=new Set(tags);
  return EVIDENCE_REGISTRY.filter(item=>item.applies_to.some(tag=>set.has(tag)));
}
