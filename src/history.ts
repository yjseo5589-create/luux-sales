export type HistoryRecord={id:string;kind:string;[key:string]:any};
export type HistoryFilters={query?:string;channel?:string;from?:string;to?:string};
export function historyContactName(log:HistoryRecord,rows:HistoryRecord[]):string{
 const company=rows.find(r=>r.id===log.customer&&r.kind==='customer');
 const current=company?.contacts?.find((p:any)=>p.id===log.contactId)?.contact;
 const legacy=company&&log.contactId===company.id+'-contact'?company.contact:'';
 return current||legacy||log.contact||'담당자 미지정';
}
export function filterHistory(rows:HistoryRecord[],filters:HistoryFilters={}):HistoryRecord[]{
 const {query='',channel='전체',from='',to=''}=filters;
 if(from&&to&&from>to)return [];
 const needle=query.trim().toLocaleLowerCase('ko-KR');
 const names=new Map(rows.filter(r=>r.kind==='customer').map(r=>[r.id,r.name]));
 return rows.filter(r=>r.kind==='log')
  .filter(r=>channel==='전체'||r.channel===channel)
  .filter(r=>(!from||!!r.date&&r.date>=from)&&(!to||!!r.date&&r.date<=to))
  .filter(r=>!needle||[names.get(r.customer),historyContactName(r,rows),r.contact,r.note].join(' ').toLocaleLowerCase('ko-KR').includes(needle))
  .sort((a,b)=>(b.date||'').localeCompare(a.date||'')||(b.updated||'').localeCompare(a.updated||'')||a.id.localeCompare(b.id));
}
