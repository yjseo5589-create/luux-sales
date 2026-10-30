export type TaskRecord={id:string;kind:string;name?:string;done?:boolean;start?:string;due?:string;priority?:string;createdAt?:string;completedAt?:string;[key:string]:any};
export const taskPriorities=['높음','보통','낮음'] as const;
export const validTaskDay=(day:string)=>/^\d{4}-\d{2}-\d{2}$/.test(day)&&Number.isFinite(Date.parse(day+'T00:00:00Z'))&&new Date(day+'T00:00:00Z').toISOString().slice(0,10)===day;
export function taskTimestampDay(at?:string){if(!at||!Number.isFinite(Date.parse(at)))return '';return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(at))}
export function taskDay(task:TaskRecord){return validTaskDay(task.start||'')?task.start!:taskTimestampDay(task.createdAt)}
export function groupTasks(rows:TaskRecord[],query=''){
 const groups=new Map<string,TaskRecord[]>();
 for(const task of rows.filter(r=>r.kind==='task'&&(r.name||'').toLowerCase().includes(query.trim().toLowerCase()))){const day=taskDay(task);groups.set(day,[...(groups.get(day)||[]),task])}
 const priority=(task:TaskRecord)=>({높음:0,보통:1,낮음:2}[task.priority||'보통']??1);
 return [...groups].sort(([a],[b])=>b.localeCompare(a)).map(([day,tasks])=>({day,tasks:tasks.sort((a,b)=>priority(a)-priority(b)||(a.due||'9999').localeCompare(b.due||'9999')||(b.createdAt||'').localeCompare(a.createdAt||''))}));
}
export function taskValidation(task:TaskRecord){
 if(typeof task.done!=='boolean')return '완료 상태를 확인해 주세요.';
 if((task.start&&!validTaskDay(task.start))||(task.due&&!validTaskDay(task.due)))return '시작일과 마감일을 확인해 주세요.';
 if(task.start&&task.due&&task.due<task.start)return '마감일은 시작일 이후로 선택해 주세요.';
 if(task.priority&&!taskPriorities.includes(task.priority as typeof taskPriorities[number]))return '우선순위를 확인해 주세요.';
 return '';
}
export function withTaskMetadata(old:TaskRecord|undefined,value:TaskRecord,now:string){
 const next={...value};
 if(old?.createdAt)next.createdAt=old.createdAt;else if(!old)next.createdAt=now;else delete next.createdAt;
 if(!value.done)next.completedAt='';else if(!old?.done)next.completedAt=now;else if(old.completedAt)next.completedAt=old.completedAt;else delete next.completedAt;
 return next;
}
