export const resourceCategories=['전체','제안','계약·집행','보고'];
export const resourcesReviewedOn='2026-10-25';
export const resourceSourceRoot='https://drive.google.com/drive/folders/0ANWx4VkNnl-OUk9PVA';
export type WorkResource={id:string;category:string;title:string;purpose:string;format:string;edition:string;url:string;keywords:string;note?:string};
// Only verified folders within the user-designated shared drive. Original files and permissions are unchanged.
export const workResources:WorkResource[]=[
 {id:'schedule',category:'계약·집행',title:'룩스 편성표',purpose:'일자별 송출 편성 확인',format:'폴더',edition:'',url:'https://drive.google.com/drive/folders/1OXaFwd8WUzv_RvHDWNeNsxTka_UUvxN0',keywords:'편성 일정 송출 운영 내부 제출',note:'연도·월·내부용/제출용을 선택해 적용일에 맞는 편성표를 확인하세요.'},
 {id:'delivery-request',category:'계약·집행',title:'송출·촬영 요청서',purpose:'촬영·보고 일정과 요청 항목 확인',format:'폴더',edition:'',url:'https://drive.google.com/drive/folders/1DfTaqRJnyEk_QqE5DItU8e9HOWup6Z-p',keywords:'송출 촬영 관리보고 요청서 보고일 사진 동영상',note:'기입된 과거 요청서가 포함되어 있습니다. 해당 집행 건의 일정과 요청 항목을 확인하세요.'},
 {id:'custom-proposals',category:'제안',title:'맞춤 제안서',purpose:'광고주별 제안 구성 참고',format:'폴더',edition:'',url:'https://drive.google.com/drive/folders/18XkBgWpN9n0Vyr6vyWqHBCptzo0YWotk',keywords:'맞춤형 제안서 브랜드 영업 제안 사례',note:'기존 제안 참고용입니다. 당시 제안 조건을 현재 조건으로 해석하지 않습니다.'},
 {id:'campaign-media',category:'제안',title:'영상 소재',purpose:'월별 집행 소재 확인',format:'폴더',edition:'',url:'https://drive.google.com/drive/folders/1cG003P0STknYDegKjjHYRxibkLmc3puQ',keywords:'영상 소재 캠페인 광고 송출 파일'},
 {id:'contracts',category:'계약·집행',title:'계약·청약 자료',purpose:'기존 계약·청약 내역 확인',format:'폴더',edition:'',url:'https://drive.google.com/drive/folders/1RKacgeIM5krGnZKxQQ2YLL384HDrHlL0',keywords:'계약서 청약 의뢰서 계약 집행',note:'기존 건의 보관 자료입니다. 빈 양식이나 신규 계약 조건으로 사용하지 마세요.'},
 {id:'placement-reports',category:'보고',title:'게첨보고서',purpose:'광고주별 게첨 결과 확인',format:'폴더',edition:'',url:'https://drive.google.com/drive/folders/1zMAleJ-9xO9rPXG7UuUbCfLdgxLK7cKd',keywords:'게첨 보고서 집행 결과 사진 증빙'},
 {id:'campaign-reports',category:'보고',title:'관리보고서',purpose:'월별·광고주별 관리보고 확인',format:'폴더',edition:'',url:'https://drive.google.com/drive/folders/1hUG6OZJ47iTKGF0gnRJbEdeJ3e-GPUVp',keywords:'관리 보고서 광고 집행 보고'},
 {id:'mockup-videos',category:'제안',title:'목업 영상',purpose:'제안용 송출 시안 참고',format:'폴더',edition:'',url:'https://drive.google.com/drive/folders/1iwVFHfKZE6sJ6XBxgmPIqMLNoLnbG8sI',keywords:'목업 영상 시안 미리보기 제안'}
];
export function filterResources(query='',category='전체'):WorkResource[]{
 const needle=query.trim().toLocaleLowerCase('ko-KR');
 return workResources.filter(r=>(category==='전체'||r.category===category)&&(!needle||[r.title,r.purpose,r.category,r.keywords].join(' ').toLocaleLowerCase('ko-KR').includes(needle)));
}
