import assert from 'node:assert/strict';
import {taskChange,revertTaskChange} from '../src/task-undo.ts';
import {groupTasks,taskDay,taskValidation,withTaskMetadata,reorderTasks,setTaskCompletion,moveTaskToDay} from '../src/tasks.ts';
import {recordsRequest,STORAGE_KEY,SEED_KEY,NASMEDIA_ADDITION_KEY} from '../src/records.ts';
const base={id:'task',kind:'task',name:'제안서 검토',done:false,start:'2026-10-30',due:'2026-11-02',priority:'높음'};
assert.equal(taskValidation(base),'');
for(const patch of [{start:'2026-02-30'},{due:'2026-10-29'},{priority:'긴급'}])assert.notEqual(taskValidation({...base,...patch}),'');
assert.equal(taskDay({...base,start:'',createdAt:'2026-10-29T15:01:00Z'}),'2026-10-30');
assert.equal(taskDay({id:'legacy',kind:'task',updated:'2026-10-30T00:00:00Z'}),'');
const groups=groupTasks([
 {...base,id:'old',start:'2026-10-28',done:true},
 {...base,id:'normal',priority:'보통'},
 {...base,id:'high'},
 {id:'legacy',kind:'task',name:'날짜 없는 기존 업무',done:false},
 {id:'company',kind:'customer',name:'회사'},
]);
assert.deepEqual(groups.map(g=>g.day),['2026-10-30','2026-10-28','']);
assert.deepEqual(groups[0].tasks.map(t=>t.id),['normal','high']);
assert.equal(groups[1].tasks[0].done,true);
assert.equal(groupTasks(groups.flatMap(g=>g.tasks),'기존')[0].day,'');
const created=withTaskMetadata(undefined,base,'2026-10-30T01:00:00Z');
const completed=withTaskMetadata(created,{...created,done:true},'2026-10-31T01:00:00Z');
const edited=withTaskMetadata(completed,{...completed,name:'수정한 업무'},'2026-11-01T01:00:00Z');
assert.equal(edited.createdAt,created.createdAt);
assert.equal(edited.completedAt,'2026-10-31T01:00:00Z');
assert.equal(taskDay(edited),'2026-10-30');
assert.equal(withTaskMetadata(edited,{...edited,done:false},'2026-11-02T01:00:00Z').completedAt,'');
assert.equal(withTaskMetadata({id:'legacy',kind:'task',done:true},{id:'legacy',kind:'task',done:true},'2026-10-30T00:00:00Z').createdAt,undefined);
const memory=new Map<string,string>([[SEED_KEY,'1'],[NASMEDIA_ADDITION_KEY,'1']]);
Object.defineProperty(globalThis,'localStorage',{value:{getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>memory.set(k,v)}});
const save=(items:unknown)=>recordsRequest('/api/records',{method:'POST',body:JSON.stringify({items})});
assert.equal((await save([base])).status,200);
const saved=JSON.parse(memory.get(STORAGE_KEY)!)[0];
assert.ok(saved.createdAt);
assert.equal((await save([{...saved,done:true}])).status,200);
const done=JSON.parse(memory.get(STORAGE_KEY)!)[0];
assert.ok(done.completedAt);
assert.equal(done.createdAt,saved.createdAt);
assert.equal(groupTasks([done])[0].day,'2026-10-30');
assert.equal((await save([{...done,due:'2026-02-30'}])).status,400);
assert.equal(JSON.parse(memory.get(STORAGE_KEY)!)[0].due,'2026-11-02');
console.log('PASS: daily task archive, stable task ordering, legacy dates, KST boundaries, date validation and automatic creation/completion dates');

// Explicit task day remains independent from creation/completion timestamps.
const planned={id:'planned',kind:'task',name:'선택한 날짜 업무',done:false,taskDate:'2026-11-05'};
assert.equal((await save([planned])).status,200);
let plannedSaved=JSON.parse(memory.get(STORAGE_KEY)!).find((r:any)=>r.id==='planned');
assert.equal(taskDay(plannedSaved),'2026-11-05');
assert.equal((await save([{...plannedSaved,done:true}])).status,200);
plannedSaved=JSON.parse(memory.get(STORAGE_KEY)!).find((r:any)=>r.id==='planned');
assert.equal(groupTasks([plannedSaved])[0].day,'2026-11-05');
assert.ok(plannedSaved.completedAt);
assert.equal(taskDay({...base,taskDate:'2026-10-15'}),'2026-10-15');
assert.equal((await save([{...planned,taskDate:'2026-02-30'}])).status,400);
assert.equal((await save([{...planned,taskDate:''}])).status,400);
console.log('PASS: selected task day survives save/reload and completion, overrides legacy start day and rejects invalid dates');

const ordered=[
 {id:'a',kind:'task',name:'첫 업무',done:false,taskDate:'2026-11-03',createdAt:'2026-11-03T03:00:00Z'},
 {id:'b',kind:'task',name:'둘째 업무',done:true,taskDate:'2026-11-03',createdAt:'2026-11-03T02:00:00Z',completedAt:'2026-11-03T02:30:00Z'},
 {id:'c',kind:'task',name:'숨겨진 업무',done:false,taskDate:'2026-11-03',createdAt:'2026-11-03T01:00:00Z'},
 {id:'other',kind:'task',name:'다른 날짜',done:false,taskDate:'2026-11-04'},
];
const reordered=reorderTasks(ordered,'c','a');
assert.deepEqual(reordered.map(r=>r.id),['c','a','b']);
assert.equal(reordered.find(r=>r.id==='b')?.done,true);
assert.equal(reordered.find(r=>r.id==='b')?.completedAt,ordered[1].completedAt);
assert.equal(reordered.every(r=>r.taskDate==='2026-11-03'),true);
assert.deepEqual(reorderTasks(ordered,'a','other'),[]);
assert.deepEqual(reorderTasks(ordered,'a','a'),[]);
assert.deepEqual(reorderTasks(ordered,'missing','a'),[]);
assert.deepEqual(reorderTasks(ordered,'a','b',true),[]);
assert.deepEqual(reorderTasks(ordered,'a','c',true).map(r=>r.id),['c','a','b']);
assert.equal((await save(ordered)).status,200);
assert.equal((await save(reordered)).status,200);
let ranked=JSON.parse(memory.get(STORAGE_KEY)!);
assert.deepEqual(groupTasks(ranked).find(g=>g.day==='2026-11-03')?.tasks.map(r=>r.id),['c','a','b']);
const changed=ranked.find((r:any)=>r.id==='a');
assert.equal((await save(setTaskCompletion(ranked,'a',true))).status,200);
ranked=JSON.parse(memory.get(STORAGE_KEY)!);
assert.deepEqual(groupTasks(ranked).find(g=>g.day==='2026-11-03')?.tasks.map(r=>r.id),['c','b','a']);
assert.equal((await save([{...changed,sortOrder:-1}])).status,400);
assert.equal((await save([{...changed,sortOrder:NaN}])).status,400);
const fresh={id:'fresh-task',kind:'task',name:'새 업무',done:false,taskDate:'2026-11-03',createdAt:'2026-11-03T04:00:00Z'};
assert.equal(groupTasks([...ranked,fresh]).find(g=>g.day==='2026-11-03')?.tasks[0].id,'fresh-task');
console.log('PASS: persisted task order, hidden tasks preserved, cross-date moves blocked, completion/edit dates retained and new tasks added first');

assert.equal((await save(setTaskCompletion(ranked,'c',true))).status,200);
let completedRows=JSON.parse(memory.get(STORAGE_KEY)!);
assert.deepEqual(groupTasks(completedRows).find(g=>g.day==='2026-11-03')?.tasks.map(r=>r.id),['b','a','c']);
assert.equal((await save(setTaskCompletion(completedRows,'b',false))).status,200);
completedRows=JSON.parse(memory.get(STORAGE_KEY)!);
assert.deepEqual(groupTasks(completedRows).find(g=>g.day==='2026-11-03')?.tasks.map(r=>r.id),['b','a','c']);
assert.equal(completedRows.find((r:any)=>r.id==='b').done,false);
assert.equal(completedRows.find((r:any)=>r.id==='b').completedAt,'');
assert.equal(completedRows.find((r:any)=>r.id==='c').taskDate,'2026-11-03');
assert.deepEqual(setTaskCompletion(completedRows,'unknown',true),[]);
console.log('PASS: each completion appends to the bottom, unfinished manual order retained, reload stable, uncheck returns to unfinished group and cross-status drag blocked');

// Moving dates keeps the same record and completion history, including across status groups.
const moving=[
 {id:'moving',kind:'task',name:'이동 업무',done:false,taskDate:'2026-11-11',createdAt:'2026-11-01T00:00:00Z'},
 {id:'first',kind:'task',name:'대상 업무',done:false,taskDate:'2026-11-12'},
 {id:'finished',kind:'task',name:'완료 업무',done:true,taskDate:'2026-11-12',completedAt:'2026-11-10T00:00:00Z'},
 {id:'finished-move',kind:'task',name:'이동할 완료 업무',done:true,taskDate:'2026-11-10',completedAt:'2026-11-09T00:00:00Z'},
];
assert.equal((await save(moving)).status,200);
const beforeMove=JSON.parse(memory.get(STORAGE_KEY)!);
const updates=moveTaskToDay(beforeMove,'moving','2026-11-12','first');
assert.equal((await save(updates)).status,200);
let moved=JSON.parse(memory.get(STORAGE_KEY)!);
assert.deepEqual(groupTasks(moved).find(g=>g.day==='2026-11-12')?.tasks.map(t=>t.id),['moving','first','finished']);
assert.equal(moved.filter((t:any)=>t.id==='moving').length,1);
assert.equal(moved.find((t:any)=>t.id==='moving').createdAt,beforeMove.find((t:any)=>t.id==='moving').createdAt);
assert.equal((await save(moveTaskToDay(moved,'finished-move','2026-11-12','first'))).status,200);
moved=JSON.parse(memory.get(STORAGE_KEY)!);
assert.deepEqual(groupTasks(moved).find(g=>g.day==='2026-11-12')?.tasks.map(t=>t.id),['moving','first','finished','finished-move']);
assert.equal(moved.find((t:any)=>t.id==='finished-move').completedAt,beforeMove.find((t:any)=>t.id==='finished-move').completedAt);
const emptyDay=moveTaskToDay(moved,'moving','2026-11-20');
assert.equal(emptyDay.length,1);
assert.equal(emptyDay[0].taskDate,'2026-11-20');
assert.deepEqual(moveTaskToDay(moving,'moving','2026-02-30'),[]);
assert.deepEqual(moveTaskToDay(moving,'moving',''),[]);
assert.deepEqual(moveTaskToDay(moving,'missing','2026-11-12'),[]);
assert.deepEqual(moveTaskToDay(moving,'moving','2026-11-11'),[]);
console.log('PASS: cross-date moves persist once, preserve timestamps and completed status, support empty dates and keep completed tasks below unfinished tasks');

// Undo acts on affected task IDs only and preserves original creation/completion timestamps.
const undoBefore=JSON.parse(memory.get(STORAGE_KEY)!);
assert.equal((await save(moveTaskToDay(undoBefore,'moving','2026-11-22'))).status,200);
const undoAfter=JSON.parse(memory.get(STORAGE_KEY)!);
const transaction=taskChange(undoBefore,undoAfter,['moving']);
assert.equal((await recordsRequest('/api/tasks/undo',{method:'POST',body:JSON.stringify(transaction)})).status,200);
let undoRows=JSON.parse(memory.get(STORAGE_KEY)!);
assert.equal(taskDay(undoRows.find((r:any)=>r.id==='moving')),taskDay(undoBefore.find((r:any)=>r.id==='moving')));
assert.equal(undoRows.find((r:any)=>r.id==='moving').createdAt,undoBefore.find((r:any)=>r.id==='moving').createdAt);
const beforeCheck=structuredClone(undoRows);
assert.equal((await save(setTaskCompletion(undoRows,'moving',true))).status,200);
const afterCheck=JSON.parse(memory.get(STORAGE_KEY)!);
const checkIds=afterCheck.filter((r:any)=>JSON.stringify(r)!==JSON.stringify(beforeCheck.find((b:any)=>b.id===r.id))).map((r:any)=>r.id);
assert.equal((await recordsRequest('/api/tasks/undo',{method:'POST',body:JSON.stringify(taskChange(beforeCheck,afterCheck,checkIds))})).status,200);
undoRows=JSON.parse(memory.get(STORAGE_KEY)!);
assert.equal(undoRows.find((r:any)=>r.id==='moving').done,false);
assert.equal(undoRows.find((r:any)=>r.id==='moving').completedAt,beforeCheck.find((r:any)=>r.id==='moving').completedAt);
const added={id:'undo-new',kind:'task',name:'실행 취소 추가',done:false,taskDate:'2026-11-11'};
assert.equal((await save([added])).status,200);
const afterAdd=JSON.parse(memory.get(STORAGE_KEY)!);
assert.equal((await recordsRequest('/api/tasks/undo',{method:'POST',body:JSON.stringify(taskChange(undoRows,afterAdd,[added.id]))})).status,200);
assert.equal(JSON.parse(memory.get(STORAGE_KEY)!).some((r:any)=>r.id===added.id),false);
const beforeDelete=JSON.parse(memory.get(STORAGE_KEY)!);
assert.equal((await recordsRequest('/api/records?id=moving',{method:'DELETE'})).status,200);
const afterDelete=JSON.parse(memory.get(STORAGE_KEY)!);
assert.equal((await recordsRequest('/api/tasks/undo',{method:'POST',body:JSON.stringify(taskChange(beforeDelete,afterDelete,['moving']))})).status,200);
assert.equal(JSON.parse(memory.get(STORAGE_KEY)!).find((r:any)=>r.id==='moving').createdAt,beforeDelete.find((r:any)=>r.id==='moving').createdAt);
const conflict=undoAfter.map((r:any)=>r.id==='moving'?{...r,name:'다른 기기에서 수정'}:r);
assert.throws(()=>revertTaskChange(conflict,transaction,new Date().toISOString()),/이후 변경/);
assert.throws(()=>revertTaskChange([{id:'company',kind:'customer',name:'회사'}],taskChange([],[{id:'company',kind:'customer',name:'회사'}],['company']),new Date().toISOString()),/업무만/);
console.log('PASS: undo date changes, completion batches, creation and deletion, preserved timestamps, conflict guard and task-only boundary');
