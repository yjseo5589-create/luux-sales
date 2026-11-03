import {validTaskDay} from './tasks.ts';
import {companyContacts} from './projects.ts';
export type MeetingRecord={id:string;kind:string;[key:string]:any};
export const meetingStatuses=['예정','완료','취소'] as const;
const validTime=(time:string)=>/^([01]\d|2[0-3]):[0-5]\d$/.test(time);
export function meetingValidation(meeting:MeetingRecord,rows:MeetingRecord[]){
 if(!validTaskDay(meeting.date||''))return '미팅 날짜를 선택해 주세요.';
 if(!validTime(meeting.time||''))return '시작 시간을 선택해 주세요.';
 if(!meetingStatuses.includes(meeting.status||'예정'))return '미팅 상태를 확인해 주세요.';
 const company=rows.find(r=>r.kind==='customer'&&r.id===meeting.customer);
 if(meeting.customer&&!company)return '거래처를 확인해 주세요.';
 if(meeting.contactId&&(!company||!companyContacts(company).some((p:any)=>p.id===meeting.contactId)))return '해당 거래처의 담당자를 선택해 주세요.';
 return '';
}
export function meetingParties(meeting:MeetingRecord,rows:MeetingRecord[]){
 const company=rows.find(r=>r.kind==='customer'&&r.id===meeting.customer);
 const person=companyContacts(company).find((p:any)=>p.id===meeting.contactId);
 return [company?.name,person?.contact].filter(Boolean).join(' · ');
}
export function meetingGroups(rows:MeetingRecord[],query:string,filter:string,today:string){
 const meetings=rows.filter(r=>r.kind==='meeting').filter(r=>[r.name,r.location,meetingParties(r,rows)].join(' ').toLowerCase().includes(query.trim().toLowerCase())).filter(r=>filter==='전체'||(filter==='예정'?r.date>=today&&(r.status||'예정')==='예정':r.date<today||(r.status||'예정')!=='예정'));
 const groups=new Map<string,MeetingRecord[]>();
 for(const meeting of meetings)groups.set(meeting.date,[...(groups.get(meeting.date)||[]),meeting]);
 return [...groups].sort(([a],[b])=>filter==='지난'?b.localeCompare(a):a.localeCompare(b)).map(([date,items])=>({date,items:items.sort((a,b)=>(a.time||'').localeCompare(b.time||'')||(a.name||'').localeCompare(b.name||'','ko'))}));
}
