export type TaskRecord={id:string;kind:string;name?:string;done?:boolean;sortOrder?:number;taskDate?:string;start?:string;due?:string;priority?:string;createdAt?:string;completedAt?:string;[key:string]:any};
export const taskPriorities=['높음','보통','낮음'] as const;
export const validTaskDay=(day:string)=>/^\d{4}-\d{2}-\d{2}$/.test(day)&&Number.isFinite(Date.parse(day+'T00:00:00Z'))&&new Date(day+'T00:00:00Z').toISOString().slice(0,10)===day;
export function taskTimestampDay(at?:string){if(!at||!Number.isFinite(Date.parse(at)))return '';return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(at))}
export function taskDay(task:TaskRecord){return validTaskDay(task.taskDate||'')?task.taskDate!:validTaskDay(task.start||'')?task.start!:taskTimestampDay(task.createdAt)}
export function groupTasks(rows:TaskRecord[],query=''){
 const groups=new Map<string,TaskRecord[]>();
 for(const task of rows.filter(r=>r.kind==='task'&&(r.name||'').toLowerCase().includes(query.trim().toLowerCase()))){const day=taskDay(task);groups.set(day,[...(groups.get(day)||[]),task])}
 return [...groups].sort(([a],[b])=>b.localeCompare(a)).map(([day,tasks])=>({day,tasks:tasks.sort((a,b)=>{const ar=Number.isSafeInteger(a.sortOrder),br=Number.isSafeInteger(b.sortOrder);return Number(!!a.done)-Number(!!b.done)||(ar&&br?a.sortOrder!-b.sortOrder!:(ar?1:br?-1:0))||(b.createdAt||'').localeCompare(a.createdAt||'')})}));
}
export function taskValidation(task:TaskRecord){
 if(typeof task.done!=='boolean')return '완료 상태를 확인해 주세요.';
 if(task.sortOrder!==undefined&&(!Number.isSafeInteger(task.sortOrder)||task.sortOrder<0))return '업무 순서를 확인해 주세요.';
 if(task.taskDate!==undefined&&!validTaskDay(task.taskDate))return '날짜를 선택해 주세요.';
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

export function reorderTasks(rows:TaskRecord[],sourceId:string,targetId:string,after=false):TaskRecord[]{
 const source=rows.find(row=>row.kind==='task'&&row.id===sourceId),target=rows.find(row=>row.kind==='task'&&row.id===targetId);
 if(!source||!target||sourceId===targetId||taskDay(source)!==taskDay(target)||!!source.done!==!!target.done)return [];
 const tasks=groupTasks(rows).find(group=>group.day===taskDay(source))!.tasks;
 const next=tasks.filter(task=>task.id!==sourceId),targetIndex=next.findIndex(task=>task.id===targetId);
 next.splice(targetIndex+(after?1:0),0,source);
 if(next.every((task,index)=>task.id===tasks[index].id))return [];
 return next.map((task,index)=>({...task,sortOrder:index})).filter(task=>task.sortOrder!==rows.find(row=>row.id===task.id)?.sortOrder);
}

export function moveTaskToDay(rows:TaskRecord[],sourceId:string,day:string,targetId?:string,after=false):TaskRecord[]{
 const source=rows.find(row=>row.kind==='task'&&row.id===sourceId);
 if(!source||!validTaskDay(day)||taskDay(source)===day)return [];
 const tasks=groupTasks(rows).find(group=>group.day===day)?.tasks||[];
 const peers=tasks.filter(task=>!!task.done===!!source.done);
 const targetIndex=peers.findIndex(task=>task.id===targetId);
 peers.splice(targetIndex<0?peers.length:targetIndex+(after?1:0),0,{...source,taskDate:day});
 const next=source.done?[...tasks.filter(task=>!task.done),...peers]:[...peers,...tasks.filter(task=>task.done)];
 return next.map((task,index)=>({...task,sortOrder:index})).filter(task=>task.id===sourceId||task.sortOrder!==rows.find(row=>row.id===task.id)?.sortOrder);
}

export function setTaskCompletion(rows:TaskRecord[],id:string,done:boolean):TaskRecord[]{
 const task=rows.find(row=>row.kind==='task'&&row.id===id);if(!task)return [];
 if(!done)return [{...task,done:false}];
 const tasks=groupTasks(rows).find(group=>group.day===taskDay(task))!.tasks;
 return [...tasks.filter(row=>row.id!==id),{...task,done:true}].map((row,index)=>({...row,sortOrder:index})).filter(row=>row.id===id||row.sortOrder!==rows.find(old=>old.id===row.id)?.sortOrder);
}
