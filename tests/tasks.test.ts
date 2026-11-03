import assert from 'node:assert/strict';
import {groupTasks,taskDay,taskValidation,withTaskMetadata,reorderTasks} from '../src/tasks.ts';
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
assert.deepEqual(reorderTasks(ordered,'a','b',true).map(r=>r.id),['b','a','c']);
assert.equal((await save(ordered)).status,200);
assert.equal((await save(reordered)).status,200);
let ranked=JSON.parse(memory.get(STORAGE_KEY)!);
assert.deepEqual(groupTasks(ranked).find(g=>g.day==='2026-11-03')?.tasks.map(r=>r.id),['c','a','b']);
const changed=ranked.find((r:any)=>r.id==='a');
assert.equal((await save([{...changed,done:true,name:'수정한 첫 업무'}])).status,200);
ranked=JSON.parse(memory.get(STORAGE_KEY)!);
assert.deepEqual(groupTasks(ranked).find(g=>g.day==='2026-11-03')?.tasks.map(r=>r.id),['c','a','b']);
assert.equal((await save([{...changed,sortOrder:-1}])).status,400);
assert.equal((await save([{...changed,sortOrder:NaN}])).status,400);
const fresh={id:'fresh-task',kind:'task',name:'새 업무',done:false,taskDate:'2026-11-03',createdAt:'2026-11-03T04:00:00Z'};
assert.equal(groupTasks([...ranked,fresh]).find(g=>g.day==='2026-11-03')?.tasks[0].id,'fresh-task');
console.log('PASS: persisted task order, hidden tasks preserved, cross-date moves blocked, completion/edit dates retained and new tasks added first');
