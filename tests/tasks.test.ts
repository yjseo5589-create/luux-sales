import assert from 'node:assert/strict';
import {groupTasks,taskDay,taskValidation,withTaskMetadata} from '../src/tasks.ts';
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
assert.deepEqual(groups[0].tasks.map(t=>t.id),['high','normal']);
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
console.log('PASS: daily task archive, priority ordering, legacy dates, KST boundaries, date validation and automatic creation/completion dates');
