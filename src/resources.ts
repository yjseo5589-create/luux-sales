export const resourceCategories=['전체','제안·영업','집행·운영','성과·분석','참고자료'];
export const resourcesReviewedOn='2026-10-25';
export type WorkResource={id:string;category:string;title:string;purpose:string;format:string;edition:string;url:string;keywords:string;note?:string};
// Curated links only. Drive files, permissions and original content are unchanged.
export const workResources:WorkResource[]=[
 {id:'luux-intro',category:'제안·영업',title:'룩스 매체소개서',purpose:'매체·상품 구성과 집행 조건 확인',format:'PDF',edition:'2026',url:'https://drive.google.com/file/d/1DD3pngxtJIXrQYSfXP4XAXgH9rZqUY0n/view',keywords:'LUUX 소개 제안 단가 스펙'},
 {id:'sales-calendar',category:'제안·영업',title:'세일즈 캘린더',purpose:'월별 이슈·기업별 대행 관계 조회',format:'시트',edition:'2027',url:'https://docs.google.com/spreadsheets/d/1greTgoLS-vm0gAlwljqrMGccnhP8mQ2Sm07jswC4C_E/edit',keywords:'시즌 일정 기념일 광고주 대행사 렙사',note:'기업별 조회와 월별 조회를 확인했습니다. 과거 후원 이력을 미래 후원 확정으로 해석하지 않습니다.'},
 {id:'media-monitor',category:'제안·영업',title:'경쟁매체 집행 조회',purpose:'광고주·브랜드·대행사·렙사 검색',format:'시트',edition:'2026',url:'https://docs.google.com/spreadsheets/d/1f9oOcPBEnCJJtgrz8dnQWplMBdsrtl6jZEp_SLy5wGw/edit',keywords:'모니터링 경쟁 광고 집행 내역 타깃',note:'집행 내역 검색 탭의 항목을 확인했습니다. 원문 조회 조건과 조사일을 함께 확인합니다.'},
 {id:'doodle-kit',category:'제안·영업',title:'두들라이브 미디어키트',purpose:'공연·협찬 상품 구성 · 예정안 포함',format:'PDF',edition:'2027',url:'https://drive.google.com/file/d/1GqP-KLzE04VCrZfVPc2XjbpTIGv3TGmS/view',keywords:'doodle Live 공연 스폰서 PPL 브랜드 파트너십',note:'2027 계획과 과거 공연 사례가 함께 있습니다. 예정 라인업과 상품은 원문에서 확인합니다.'},
 {id:'creative-guide',category:'집행·운영',title:'콘텐츠 제작 가이드',purpose:'소재 제작 전 화면 구성·규격 확인',format:'PDF',edition:'2026',url:'https://drive.google.com/file/d/1JSIJi8zwKfzQh3Zmnbf586QZp19-K3ae/view',keywords:'영상 소재 해상도 픽셀 풀스크린 블랙바 남측 북측',note:'2026-08-04가 파일명에 명시된 원문입니다. 규격 도표는 원본에서 확인합니다.'},
 {id:'blackbar-guide',category:'집행·운영',title:'블랙바 운영 가이드',purpose:'하단 정보창 영역·디자인 기준 확인',format:'PDF',edition:'2026',url:'https://drive.google.com/file/d/1UngQ0p28zrUre9o3XfE_0eXYkS80Hpfy/view',keywords:'하단바 정보창 블랙바 모션 디자인 운영',note:'본문에 2026.05.18이 명시된 디자인 가이드입니다.'},
 {id:'booking-example',category:'집행·운영',title:'청약 의뢰서 · 기입 예시',purpose:'필수 작성 항목 확인 · 빈 양식 아님',format:'XLSX',edition:'기입 예시',url:'https://docs.google.com/spreadsheets/d/1IxznB_NiOxGZ4WuX2Mup0sIhnNPK7D0g/edit',keywords:'청약 계약 신청 서식 양식',note:'기존 내용이 입력된 예시입니다. 새 청약 작성 시 해당 캠페인의 조건을 별도로 확인하세요.'},
 {id:'population-log',category:'성과·분석',title:'유동인구 분석 로그',purpose:'기간·권역별 데이터와 집계 기준 확인',format:'시트',edition:'월별',url:'https://docs.google.com/spreadsheets/d/1r3aCHJz5ZVFfFNkbqwZAnMYDh5bp_gZwBUsoMaIrJgs/edit',keywords:'퍼즐 유동인구 로그 광화문 시청 분석 CPM',note:'2026-10월본의 일자·권역·성별·연령 구성을 확인했습니다. 수치와 기간은 원문에서 확인합니다.'},
 {id:'population-report',category:'성과·분석',title:'퍼즐 리포트 사용법',purpose:'리포트 생성 전 기간·산출 기준 확인',format:'시트',edition:'도구 안내',url:'https://docs.google.com/spreadsheets/d/1CT6yWX_o-sLyzucpJbVRoQ76QylcnnuEH1ZPwZ21wes/edit',keywords:'퍼즐 리포트 생성기 보고서 CPM 유동인구 성별 연령',note:'사용법 탭에서 산출 기준을 확인하세요. 성별·연령 비율은 선택 기간에 따라 기준이 다를 수 있습니다.'},
 {id:'viral-report',category:'성과·분석',title:'바이럴 성과보고 참고',purpose:'사전 홍보·현장·온라인 성과 구성 참고',format:'PDF',edition:'사례 참고',url:'https://drive.google.com/file/d/1t0QX9qhdueTNPDPIT3UMlaEWS1gXR26p/view',keywords:'성과 분석 결과 보고 SNS 유튜브 바이럴 사례',note:'과거 사례의 보고서 구성 참고용입니다. 관객 추정치와 원문 성과 수치를 현재 성과로 사용하지 않습니다.'},
 {id:'package-reference',category:'참고자료',title:'통합패키지 구성 참고',purpose:'소재·옥외·SNS·지면 연계 구성 참고',format:'PDF',edition:'상품 참고',url:'https://drive.google.com/file/d/1zUQepYFq1PFCHZdbcaR_WGHUtwQKjV4G/view',keywords:'패키지 제안 구성 온라인 기사 지면 SNS',note:'상품 구성 참고자료이며 측정된 캠페인 성과가 아닙니다. 제시 조건은 원문에서 확인합니다.'},
 {id:'ppl-reference',category:'참고자료',title:'공연 PPL 제안 참고',purpose:'공연·사이니지·온라인 제안 구성 참고',format:'PDF',edition:'과거 제안',url:'https://drive.google.com/file/d/1K6pqn0G_yAkOnoH0w8gAod5A_jIxZeE8/view',keywords:'퇴근길 라이브 PPL 공연 제안 사례',note:'2026-06-17이 파일명에 명시된 과거 제안입니다. 당시 예정 공연·판매 조건을 현재 확정 내용으로 사용하지 않습니다.'},
 {id:'competitor-products',category:'참고자료',title:'경쟁매체 상품자료',purpose:'매체별 상품소개·판매안 비교',format:'폴더',edition:'적용일 확인',url:'https://drive.google.com/drive/folders/1f56wtn_rqRcUVOBXCOlYq2jk0Z5vsL6C',keywords:'경쟁 매체 소개서 판매안 KT KORYO LUMI SPOON K-VISION 코리아나 KPOP',note:'폴더 내 자료 목록을 확인했습니다. 연도와 행사 한정 조건이 섞여 있어 실제 비교 시 각 원문의 적용일을 확인합니다.'},
];
export function filterResources(query='',category='전체'):WorkResource[]{
 const needle=query.trim().toLocaleLowerCase('ko-KR');
 return workResources.filter(r=>(category==='전체'||r.category===category)&&(!needle||[r.title,r.purpose,r.category,r.format,r.edition,r.keywords].join(' ').toLocaleLowerCase('ko-KR').includes(needle)));
}
