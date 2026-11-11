import type {TaskRecord} from './tasks.ts';

export type TaskChange={before:(TaskRecord|null)[];after:(TaskRecord|null)[];ids:string[]};
export function taskChange(before:TaskRecord[],after:TaskRecord[],ids:string[]):TaskChange{
 return structuredClone({ids,before:ids.map(id=>before.find(r=>r.id===id)??null),after:ids.map(id=>after.find(r=>r.id===id)??null)});
}
function sameTask(a:TaskRecord|null,b:TaskRecord|null){
 const canonical=(r:TaskRecord|null)=>r?JSON.stringify(Object.fromEntries(Object.entries(r).filter(([key])=>key!=='updated').sort(([a],[b])=>a.localeCompare(b)))):'null';
 return canonical(a)===canonical(b);
}
export function revertTaskChange(rows:TaskRecord[],change:TaskChange,now:string){
 if(!change.ids.length||change.ids.length!==change.before.length||change.ids.length!==change.after.length||new Set(change.ids).size!==change.ids.length)throw Error('실행 취소 기록을 확인해 주세요.');
 for(const [index,id] of change.ids.entries()){
  for(const record of [change.before[index],change.after[index]])if(record&&(record.kind!=='task'||record.id!==id))throw Error('업무만 실행 취소할 수 있습니다.');
  if(!sameTask(rows.find(r=>r.id===id)??null,change.after[index]))throw Error('이후 변경된 업무가 있어 실행 취소할 수 없습니다.');
 }
 const upserts=change.before.filter((r):r is TaskRecord=>!!r).map(r=>({...r,updated:now}));
 const deletes=change.ids.filter((_,index)=>!change.before[index]);
 return {rows:[...rows.filter(r=>!change.ids.includes(r.id)),...upserts],upserts,deletes};
}
