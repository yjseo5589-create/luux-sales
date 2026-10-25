import {projectStage,type ProjectRecord} from './projects.ts';
export type StageEvent={from:string|null;to:string;at:string};
export function seoulDate(iso:string):string{
 const date=new Date(iso);if(Number.isNaN(date.getTime()))return '';
 return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
}
export function stageEvents(r:ProjectRecord):StageEvent[]{
 return Array.isArray(r.stageHistory)?r.stageHistory.filter((e:any)=>e&&typeof e.to==='string'&&typeof e.at==='string'&&seoulDate(e.at)):[];
}
// Dates and history are written at save time, never accepted from the form.
export function withProjectTimeline(previous:ProjectRecord|undefined,incoming:ProjectRecord,at:string):ProjectRecord{
 const to=projectStage(incoming),from=previous?projectStage(previous):null;
 const changed=!previous||from!==to;
 const history=previous?stageEvents(previous):[];
 return {...incoming,createdAt:previous?previous.createdAt:at,stageChangedAt:changed?at:previous?.stageChangedAt,stageHistory:changed?[...history,{from,to,at}]:history};
}
