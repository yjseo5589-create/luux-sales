export type ProjectRecord={id:string;kind:string;[key:string]:any};
export const projectStages=['제안 준비','제안 완료','협의 중','결과 확정','집행 중','완료'];
export const projectResults=['미정','수주','미수주','보류'];
export const projectRoles=[
 {key:'customer',contactKey:'advertiserContactId',label:'광고주',required:false},
 {key:'agency',contactKey:'agencyContactId',label:'대행사',required:false},
 {key:'rep',contactKey:'repContactId',label:'렙사',required:false},
] as const;
export function companyContacts(r:ProjectRecord|undefined){return r?.contacts?.length?r.contacts:r?[{id:r.id+'-contact',contact:r.contact||'',position:r.position||'',department:r.department||'',phone:r.phone||'',officePhone:r.officePhone||'',email:r.email||''}]:[];}
export function projectCompanyIds(r:ProjectRecord):string[]{return [...new Set([r.customer,r.agency,r.rep].filter(Boolean))] as string[];}
export const projectDisplayRoles=[projectRoles[1],projectRoles[2],projectRoles[0]];
export function advertiserName(r:ProjectRecord,rows:ProjectRecord[]):string{return rows.find(c=>c.kind==='customer'&&c.id===r.customer)?.name||r.advertiserName||'';}
export function projectStage(r:ProjectRecord):string{
 if(projectStages.includes(r.stage))return r.stage;
 return ({'진행 중':'집행 중','수주':'결과 확정','실주':'결과 확정','보류':'결과 확정','접촉 전':'제안 준비','접촉 중':'제안 준비'} as Record<string,string>)[r.stage]||'제안 준비';
}
export function projectResult(r:ProjectRecord):string{return projectResults.includes(r.result)?r.result:({'수주':'수주','실주':'미수주','보류':'보류'} as Record<string,string>)[r.stage]||'미정';}
export function filterProjects(rows:ProjectRecord[],query='',stage='진행 중',result='전체'):ProjectRecord[]{
 const companies=new Map(rows.filter(r=>r.kind==='customer').map(r=>[r.id,r.name]));const needle=query.trim().toLocaleLowerCase('ko-KR');
 return rows.filter(r=>r.kind==='deal').filter(r=>stage==='전체'||(stage==='진행 중'?projectStage(r)!=='완료'&&!['미수주','보류'].includes(projectResult(r)):projectStage(r)===stage)).filter(r=>result==='전체'||projectResult(r)===result).filter(r=>!needle||[r.name,r.advertiserName,r.next,r.note,r.resultReason,...projectCompanyIds(r).map(id=>companies.get(id))].join(' ').toLocaleLowerCase('ko-KR').includes(needle)).sort((a,b)=>(b.updated||'').localeCompare(a.updated||'')||a.name.localeCompare(b.name,'ko'));
}
