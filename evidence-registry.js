export const EVIDENCE_CATEGORIES = Object.freeze({
  MARKET: '시장·문제 근거',
  TECH: '기술 근거',
  DATA: '데이터·제도 근거',
  IMPACT: '비용·운영 영향 근거',
  CASE: '실제 절감 사례',
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
    id:'MARKET-KEA-2026-001', category:'MARKET', highlight:{value:'최대 70%',label:'고효율설비 설치비 지원'},
    claim:'2026년 한국에너지공단은 소상공인 에너지효율향상 지원사업을 공고했고, 지정 고효율설비 설치비의 최대 70%를 지원 대상으로 제시했다.',
    title:'2026년 소상공인 에너지효율향상 지원사업 공고', publisher:'한국에너지공단', authors:'한국에너지공단', year:2026,
    source_type:'공공기관 사업공고', url:'https://www.energy.or.kr/front/board/View2.do?boardMngNo=2&boardNo=24521', doi:'',
    applies_to:['small_business','energy_efficiency','policy'],
    product_implication:'소상공인의 에너지효율 개선이 실제 정책지원 영역이라는 시장·정책 맥락을 뒷받침한다.',
    limitations:'지원사업의 존재가 와트가드의 절감효과나 지원사업 선정 가능성을 보증하지 않는다.',
    evidence_level:'공공기관 공식 공고', verified_at:'2026-10-01', status:'verified', scope:'시장근거'
  },
  {
    id:'MARKET-GMR-2024-001', category:'MARKET', highlight:{value:'18배',label:'무인편의점 최근 4년 증가'},
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
    id:'MARKET-SMROADMAP-2023-001', category:'MARKET', highlight:{value:'CAGR 51.0%',label:'무인점포 지원 솔루션 국내시장 전망 · 2021~2027'},
    claim:'중소기업 전략기술로드맵은 ‘소상공인 무인점포 지원 솔루션’을 전략품목으로 다루며, 관련 국내 시장을 2021~2027년 연평균 51.0% 성장으로 전망한다.',
    title:'중소기업 전략기술로드맵 — 소상공인 무인점포 지원 솔루션', publisher:'중소기업 기술로드맵', authors:'중소벤처기업부·중소기업기술정보진흥원 계열 로드맵', year:2023,
    source_type:'정부 전략기술 로드맵', url:'https://smroadmap.smtech.go.kr/mpsvc/dtrprt/mpsvcDtrprtDetail.do?cmIdx=3881&cmYyyy=2023', doi:'',
    applies_to:['unmanned_store','market_growth','management_technology'],
    product_implication:'무인·다점포 운영지원 기술이 정책적 기술개발 대상이라는 배경 근거로 사용한다.',
    limitations:'로드맵의 시장전망은 전망치이며 실제 관측값과 구분한다. 제시 시장규모를 와트가드의 직접 시장규모로 환산하지 않는다.',
    evidence_level:'정부 전략기술 자료', verified_at:'2026-10-01', status:'verified', scope:'시장근거'
  },

  {
    id:'MARKET-FTC-2024-001', category:'MARKET', highlight:{value:'365,014개',label:'전국 가맹점 · 전년 대비 +3.4%'},
    claim:'공정거래위원회 2024년 가맹사업 현황은 전체 가맹점 수 365,014개를 제시하고, 전년 대비 가맹점 수가 3.4% 증가했다고 발표했다.',
    title:'2024년 가맹사업 현황 통계 발표', publisher:'공정거래위원회', authors:'가맹거래정책과', year:2025,
    source_type:'정부 공식 통계', url:'https://www.ftc.go.kr/www/selectBbsNttView.do?bordCd=3&key=12&nttSn=45987', doi:'',
    applies_to:['franchise','multi_store','market_size','market_growth'],
    product_implication:'와트가드의 확장 타깃인 다점포 운영자·가맹본부가 이미 큰 운영단위를 형성하고 있음을 보여주는 시장 기반 자료로 사용한다.',
    limitations:'전체 가맹점 수가 곧 와트가드의 직접 고객 수 또는 직접 TAM을 의미하지 않는다. 가맹점 수와 무인점포 수를 같은 모집단으로 합산하지 않는다.',
    evidence_level:'중앙행정기관 공식 통계', verified_at:'2026-10-02', status:'verified', scope:'시장근거'
  },
  {
    id:'TECH-ENERGYSTAR-CSTORE-001', category:'TECH', highlight:{value:'최대 40%',label:'편의점 에너지 중 냉장·냉동 비중'},
    claim:'ENERGY STAR는 편의점에서 냉장·냉동이 건물 전체 에너지 사용의 최대 40%를 차지할 수 있다고 설명한다.',
    title:'Energy Savings Tips for Small Businesses: Convenience Stores', publisher:'ENERGY STAR / U.S. EPA', authors:'ENERGY STAR', year:2026,
    source_type:'공공기관 기술가이드', url:'https://www.energystar.gov/buildings/resources-audience/small-biz/convenience-stores', doi:'',
    applies_to:['refrigeration','energy_cost','store_operation','baseline'],
    product_implication:'24시간 또는 장시간 운영하는 편의·무인점포에서 냉장·냉동 부하를 포함한 기저부하 변화가 비용에 미치는 영향이 작지 않다는 배경 근거로 사용한다.',
    limitations:'40%는 편의점 업종에 대한 최대 비중 설명이며 모든 무인점포·모든 매장에 동일하게 적용되는 값이 아니다.',
    evidence_level:'공공기관 기술가이드', verified_at:'2026-10-02', status:'verified', scope:'연구근거'
  },
  {
    id:'CASE-GSRETAIL-2024-001', category:'CASE', highlight:{value:'2,447 kWh/년',label:'오픈 쇼케이스 야간 커버 적용 후 전력 감소'},
    claim:'GS리테일 2024 지속가능경영보고서는 편의점 오픈 쇼케이스에 야간 커버를 적용해 연간 전력 사용량 2,447kWh를 줄인 사례를 제시한다.',
    title:'GS Retail Sustainability Report 2024 — Environmental Management Performance', publisher:'GS리테일', authors:'GS Retail', year:2024,
    source_type:'기업 지속가능경영 보고서', url:'https://hpimg.gsretail.com/_ui/desktop/common/docs/gsr_sustainability_report_2024_eng.pdf', doi:'',
    applies_to:['case_savings','refrigeration','off_hours','operational_waste'],
    product_implication:'영업 외 시간의 운영 방식 변경만으로도 반복 전력소비를 줄일 수 있는 실제 사례로, 와트가드가 찾으려는 “운영상 비정상·낭비”의 경제적 의미를 설명한다.',
    limitations:'와트가드가 2,447kWh 절감을 보장한다는 뜻이 아니다. 해당 수치는 GS리테일의 특정 조치 사례이며 매장 조건에 따라 달라진다.',
    evidence_level:'기업 공개 실적 사례', verified_at:'2026-10-02', status:'verified', scope:'실증사례'
  },
  {
    id:'CASE-SHARIS-001', category:'CASE', highlight:{value:'$2,204/년',label:'점포 1곳 · 온수 설정 조정 사례'},
    claim:'미국 DOE Better Buildings에 공개된 Shari’s 사례는 주방 온수기 설정을 155°F에서 140°F로 조정해 점포당 연간 약 2,204달러를 절감할 수 있음을 확인했다.',
    title:"As Easy as Pie: Shari's Cafe and Pies Drives Energy Savings through Employee Behavior Change", publisher:'U.S. DOE Better Buildings', authors:"Shari's Cafe & Pies / Better Buildings", year:2016,
    source_type:'정부 프로그램 공개 사례', url:'https://betterbuildingssolutioncenter.energy.gov/implementation-models/easy-pie-sharis-cafe-and-pies-drives-energy-savings-through-employee-behavior', doi:'',
    applies_to:['case_savings','operational_waste','settings','store_operation'],
    product_implication:'설비 교체가 아닌 운영 설정 하나도 점포 단위에서 반복비용 차이를 만들 수 있다는 실증 사례로 사용한다.',
    limitations:'미국 24시간 레스토랑의 특정 운영개선 사례다. 환율·요금제·업종이 다른 국내 점포에 절감액을 그대로 적용하지 않는다.',
    evidence_level:'정부 프로그램 파트너 공개 사례', verified_at:'2026-10-02', status:'verified', scope:'실증사례'
  },
  {
    id:'CASE-PECO-LANDHOPE-001', category:'CASE', highlight:{value:'$16,308/년',label:'편의점 종합 에너지 개선 사례'},
    claim:'PECO의 Landhope Farms 편의점 사례는 LED 조명과 냉장모터 개선 등을 포함한 프로젝트에서 연간 16,308달러, 135,567kWh의 에너지 절감 실적을 제시한다.',
    title:'Energy Upgrades Increase Savings and Safety at Landhope Farms', publisher:'PECO', authors:'PECO Small Business Direct Install Solutions', year:2026,
    source_type:'전력사 프로그램 사례', url:'https://solutions.peco-energy.com/landhopefarms', doi:'',
    applies_to:['case_savings','refrigeration','lighting','store_operation'],
    product_implication:'점포 에너지 낭비·비효율의 금액 규모가 작지 않을 수 있음을 보여주는 상한 사례로 사용한다. 와트가드는 이 중 비정상 사용을 조기에 발견하는 역할에 집중한다.',
    limitations:'조명·냉장모터 교체가 포함된 종합 개선 사례이며 와트가드 단독 절감효과가 아니다. 국내 요금·매장 규모로 직접 환산하지 않는다.',
    evidence_level:'전력사 프로그램 공개 사례', verified_at:'2026-10-02', status:'verified', scope:'실증사례'
  },
  {
    id:'IMPACT-JAMA-2025-001', category:'IMPACT', highlight:{value:'2.29× / 2.31×',label:'불안 / 우울 증상 odds · 에너지 불안정 경험군'},
    claim:'JAMA Network Open의 미국 성인 연구에서 에너지 불안정 경험은 사회적 요인을 보정한 뒤에도 불안 증상 odds 2.29, 우울 증상 odds 2.31과 연관됐다.',
    title:'Energy Insecurity and Mental Health Symptoms in US Adults', publisher:'JAMA Network Open', authors:'Michelle Graff; Ther W Aung', year:2025,
    source_type:'학술논문 · 전국 대표 반복 횡단면 조사', url:'https://pubmed.ncbi.nlm.nih.gov/41143792/', doi:'10.1001/jamanetworkopen.2025.39479',
    applies_to:['energy_burden','stress','cost_pressure','impact'],
    product_implication:'에너지비 부담이 단순 회계 항목에 그치지 않고 심리적 부담과 함께 나타날 수 있다는 배경 근거로 사용한다.',
    limitations:'가정의 에너지 불안정을 조사한 미국 성인 연구이며 무인점포 점주를 직접 조사한 결과가 아니다. 인과관계를 확정하거나 “점주 스트레스가 2.29배”라고 표현하지 않는다.',
    evidence_level:'Peer-reviewed observational study', verified_at:'2026-10-02', status:'verified', scope:'연구근거'
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
