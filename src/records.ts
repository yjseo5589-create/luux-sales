import {withProjectTimeline} from './project-timeline.ts';
import {projectCompanyIds,projectRoles,companyContacts} from './projects.ts';
import defaults from './default-records.json' with {type:'json'};
type RecordItem={id:string;kind:string;[key:string]:any};
export const STORAGE_KEY='luux-sales-records-v1';
export const SEED_KEY='luux-sales-default-contacts-v1';
export const NASMEDIA_ADDITION_KEY='luux-sales-nasmedia-contacts-20261026';
function read():RecordItem[]{
 const raw=localStorage.getItem(STORAGE_KEY);
 let rows:RecordItem[]=raw?JSON.parse(raw):[];
 if(!Array.isArray(rows))throw Error('저장된 데이터를 확인해 주세요.');
 if(localStorage.getItem(SEED_KEY)!=='1'){
  const all=new Map<string,RecordItem>((defaults as RecordItem[]).map(r=>[r.id,r]));
  for(const r of rows){
   const base=all.get(r.id);
   if(base?.contacts&&r.contacts){const people=new Map(base.contacts.map((p:any)=>[p.id,p]));for(const p of r.contacts)people.set(p.id,p);all.set(r.id,{...base,...r,contacts:[...people.values()]});}
   else all.set(r.id,r);
  }
  const seeded=[...all.values()];
  localStorage.setItem(STORAGE_KEY,JSON.stringify(seeded));
  localStorage.setItem(SEED_KEY,'1');
  rows=seeded;
 }
 // Add only this newly supplied company once; never reseed previously deleted contacts.
 if(localStorage.getItem(NASMEDIA_ADDITION_KEY)!=='1'){
  const incoming=(defaults as RecordItem[]).find(r=>r.id==='nasmedia-20261026')!;
  const normalized=(s:string)=>s.replace(/\s/g,'').toLowerCase();
  const aliases=['나스미디어','케이티나스미디어','ktnasmedia','nasmedia'];
  const current=rows.find(r=>r.kind==='customer'&&(r.id===incoming.id||aliases.includes(normalized(r.name||''))||companyContacts(r).some((p:any)=>incoming.contacts.some((n:any)=>p.email&&p.email.toLowerCase()===n.email.toLowerCase()))));
  if(!current)rows=[...rows,incoming];
  else{
   const people=[...companyContacts(current)];
   for(const person of incoming.contacts){
    const index=people.findIndex((p:any)=>p.id===person.id||(p.email&&p.email.toLowerCase()===person.email.toLowerCase())||(p.phone&&p.phone.replace(/\D/g,'')===person.phone.replace(/\D/g,'')));
    if(index<0)people.push(person);
    else people[index]={...person,...people[index]};
   }
   rows=rows.map(r=>r.id===current.id?{...r,contacts:people}:r);
  }
  localStorage.setItem(STORAGE_KEY,JSON.stringify(rows));
  localStorage.setItem(NASMEDIA_ADDITION_KEY,'1');
 }
 return rows;
}

export async function recordsRequest(path:string,options:RequestInit={}):Promise<Response>{
 const execute=async()=>{
  try{
   const rows=read();
   if(options.method==='POST'){
    const {items}=JSON.parse(String(options.body));
    if(!Array.isArray(items)||!items.length||items.length>3000)throw Error('입력 형식을 확인해 주세요.');
    const all=new Map(rows.map(r=>[r.id,r]));
    const ids=new Set<string>();
    for(const r of items){
     if(!r||typeof r.id!=='string'||!r.id||r.id.length>100||!['customer','deal','log'].includes(r.kind)||ids.has(r.id))throw Error('입력 형식을 확인해 주세요.');
     ids.add(r.id);const old=all.get(r.id);if(old&&old.kind!==r.kind)throw Error('기록 유형은 바꿀 수 없습니다.');all.set(r.id,r);
    }
    for(const r of items){
     if(!(r.kind==='log'?r.note:r.name)?.trim())throw Error('이름 또는 연락 내용을 입력해 주세요.');
     if(r.kind==='customer'){
      if(r.contacts&&(!Array.isArray(r.contacts)||!r.contacts.length||r.contacts.length>100))throw Error('담당자 정보를 확인해 주세요.');
      const pids=new Set();for(const p of r.contacts||[]){if(!p.id||pids.has(p.id))throw Error('담당자 정보가 중복되었습니다.');pids.add(p.id);}
     }else{
      const company=all.get(r.customer);if((r.kind==='log'||r.customer)&&company?.kind!=='customer')throw Error('연결할 회사를 선택해 주세요.');
      if(r.kind==='log'){
       const people=company!.contacts?.length?company!.contacts:[{id:company!.id+'-contact'}];
       if(r.contactId&&!people.some((p:any)=>p.id===r.contactId))throw Error('해당 회사의 담당자를 선택해 주세요.');
       if(!r.contactId&&!rows.some(p=>p.id===r.id)&&!r.legacyImport)throw Error('담당자를 선택해 주세요.');
       if(r.next&&!/^\d{4}-\d{2}-\d{2}$/.test(r.due||''))throw Error('후속 업무의 기한을 선택해 주세요.');
      }
      if(r.kind==='deal'){
       if(!projectCompanyIds(r).length&&!r.advertiserName?.trim())throw Error('대행사·렙사 또는 광고주를 입력해 주세요.');
       if(r.start&&r.end&&r.end<r.start)throw Error('종료일을 확인해 주세요.');
       for(const role of projectRoles){if(!r[role.key]){if(r[role.contactKey])throw Error('담당자의 회사를 선택해 주세요.');continue;}const party=all.get(r[role.key]);if(party?.kind!=='customer')throw Error('프로젝트 거래처를 확인해 주세요.');if(r[role.contactKey]&&!companyContacts(party).some((p:any)=>p.id===r[role.contactKey]))throw Error('해당 회사의 담당자를 선택해 주세요.');}
       for(const key of ['amount','quotedAmount','wonAmount'])if(r[key]!==undefined&&r[key]!==''&&(!Number.isFinite(Number(r[key]))||Number(r[key])<0))throw Error('금액을 확인해 주세요.');
      }
      if(r.deal&&(all.get(r.deal)?.kind!=='deal'||!projectCompanyIds(all.get(r.deal)!).includes(r.customer)))throw Error('연결된 프로젝트를 확인해 주세요.');
     }
     if(r.url&&!/^https?:\/\//i.test(r.url))throw Error('자료 링크를 확인해 주세요.');
    }
    for(const r of all.values())if(r.kind==='log'&&r.contactId){const company=all.get(r.customer);const people=company?.contacts?.length?company.contacts:[{id:company?.id+'-contact'}];if(!people.some((p:any)=>p.id===r.contactId))throw Error('연락 이력이 있는 담당자는 제거할 수 없습니다.');}
    for(const r of all.values()){
     if(r.kind==='deal')for(const role of projectRoles)if(r[role.contactKey]&&!companyContacts(all.get(r[role.key])).some((p:any)=>p.id===r[role.contactKey]))throw Error('프로젝트에 연결된 담당자는 제거할 수 없습니다.');
     if(r.kind==='log'&&r.deal){const deal=all.get(r.deal);if(!deal||!projectCompanyIds(deal).includes(r.customer))throw Error('연락 이력에 연결된 프로젝트 거래처를 확인해 주세요.');}
    }
    const updated=new Date().toISOString();
    const next=[...all.values()].map(r=>{const {legacyImport,...value}=r;return ids.has(r.id)?{...(r.kind==='deal'?withProjectTimeline(rows.find(old=>old.id===r.id),value,updated):value),updated}:value;});
    localStorage.setItem(STORAGE_KEY,JSON.stringify(next));
    return Response.json({ok:true});
   }
   if(options.method==='DELETE'){
    const id=new URL(path,'https://local.invalid').searchParams.get('id');
    if(rows.some(r=>(r.kind==='log'||r.kind==='deal')&&(r.customer===id||r.agency===id||r.rep===id||r.deal===id)))throw Error('연결된 연락 이력을 먼저 정리해 주세요.');
    localStorage.setItem(STORAGE_KEY,JSON.stringify(rows.filter(r=>r.id!==id)));
    return Response.json({ok:true});
   }
   return Response.json(rows);
  }catch(e:any){return Response.json({error:e.name==='QuotaExceededError'?'브라우저 저장 공간이 부족합니다.':e.message||'저장하지 못했습니다.'},{status:400});}
 };
 if(typeof navigator!=='undefined'&&navigator.locks&&options.method)return navigator.locks.request(STORAGE_KEY,execute);
 return execute();
}
