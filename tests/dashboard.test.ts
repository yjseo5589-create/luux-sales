import assert from 'node:assert/strict';
import {withProjectTimeline,seoulDate} from '../src/project-timeline.ts';
import {dashboardData} from '../src/dashboard-data.ts';
import {recordsRequest,STORAGE_KEY,SEED_KEY} from '../src/records.ts';
const base={id:'p',kind:'deal',name:'검증 캠페인',agency:'agency',stage:'제안 준비'};
const first=withProjectTimeline(undefined,base,'2026-10-01T00:00:00Z');
const edited=withProjectTimeline(first,{...first,note:'메모 수정',stageChangedAt:'2000-01-01',stageHistory:[]},'2026-10-02T00:00:00Z');
assert.equal(edited.stageChangedAt,first.stageChangedAt);
assert.equal(edited.stageHistory.length,1);
const won=withProjectTimeline(edited,{...edited,stage:'수주'},'2026-10-24T15:01:00Z');
assert.equal(seoulDate(won.stageChangedAt),'2026-10-25');
assert.deepEqual(won.stageHistory.at(-1),{from:'제안 준비',to:'수주',at:'2026-10-24T15:01:00Z'});
const live=withProjectTimeline(won,{...won,stage:'집행 중'},'2026-10-25T01:00:00Z');
assert.equal(live.stageHistory.filter((e:any)=>e.to==='수주').length,1);
const legacy={...base,stage:'결과 확정',result:'성공',updated:'2026-09-10'};
const legacyEdit=withProjectTimeline(legacy,{...legacy,stage:'수주',note:'기존 기록 수정'},'2026-10-25T01:00:00Z');
assert.equal(legacyEdit.stageChangedAt,undefined);
assert.deepEqual(legacyEdit.stageHistory,[]);
const event=(to:string,at:string)=>({from:'협의 중',to,at});
const projects=[
 {...base,id:'ready'},
 {...base,id:'overdue',stage:'제안 완료'},
 {...base,id:'fresh',stage:'협의 중'},
 {...base,id:'no-log',stage:'제안 완료'},
 {...base,id:'legacy',stage:'수주'},
 {...live,id:'live'},
 {...base,id:'flip-won',stage:'수주',stageHistory:[event('미수주','2026-10-01T00:00:00Z'),event('수주','2026-10-02T00:00:00Z')]},
 {...base,id:'flip-lost',stage:'미수주',stageHistory:[event('수주','2026-10-01T00:00:00Z'),event('미수주','2026-10-02T00:00:00Z')]},
 {...base,id:'future',stage:'수주',stageHistory:[event('수주','2026-10-26T00:00:00Z')]},
 {...base,id:'boundary',stage:'집행 중',stageHistory:[event('수주','2026-09-30T15:00:00Z')]},
 {...base,id:'previous-month',stage:'수주',stageHistory:[event('수주','2026-09-30T14:59:59Z')]},
];
const logs=[
 {id:'lo',kind:'log',deal:'overdue',customer:'agency',date:'2026-10-11',note:'14일 전'},
 {id:'lf',kind:'log',deal:'fresh',customer:'agency',date:'2026-10-12',note:'13일 전'},
 ...Array.from({length:6},(_,i)=>({id:'recent'+i,kind:'log',customer:'agency',date:'2026-10-25',updated:`2026-10-25T0${i}:00:00Z`,note:'최근 기록'})),
 {id:'tomorrow',kind:'log',customer:'agency',date:'2026-10-26',note:'미래 날짜'},
];
const summary=dashboardData([...projects,...logs],'2026-10-25');
assert.deepEqual(summary.pipeline.map(p=>p.projects.length),[1,2,1]);
assert.deepEqual(summary.followups.map(f=>[f.project.id,f.days]),[['overdue',14],['no-log',null]]);
assert.deepEqual(summary.won.map(p=>p.id),['legacy','live','flip-won','future','boundary','previous-month']);
assert.deepEqual(summary.lost.map(p=>p.id),['flip-lost']);
assert.equal(summary.recent.length,5);
assert.equal(summary.recent[0].id,'recent5');
assert.equal(dashboardData(projects,'2026-11-25').won.length,summary.won.length);
assert.equal(dashboardData([],'2026-10-25').won.length,0);
// Real save path generates dates, preserves them on edits and ignores supplied audit fields.
const memory=new Map<string,string>([[SEED_KEY,'1']]);
Object.defineProperty(globalThis,'localStorage',{value:{getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>memory.set(k,v)}});
const request=(items:unknown)=>recordsRequest('/api/records',{method:'POST',body:JSON.stringify({items})});
const company={id:'agency',kind:'customer',name:'검증 대행사'};
assert.equal((await request([company,{...base,stage:'수주',stageHistory:[event('미수주','1999-01-01')]}])).status,200);
let saved=JSON.parse(memory.get(STORAGE_KEY)!).find((r:any)=>r.id==='p');
assert.equal(saved.stageHistory.length,1);
assert.equal(saved.stageHistory[0].to,'수주');
assert.equal(seoulDate(saved.stageChangedAt),seoulDate(new Date().toISOString()));
const originalAt=saved.stageChangedAt;
assert.equal((await request([{...saved,note:'연락처 메모 수정',stageChangedAt:'1999-01-01',stageHistory:[]}])).status,200);
saved=JSON.parse(memory.get(STORAGE_KEY)!).find((r:any)=>r.id==='p');
assert.equal(saved.stageChangedAt,originalAt);
assert.equal(saved.stageHistory.length,1);
assert.equal((await request([{...saved,stage:'미수주'}])).status,200);
saved=JSON.parse(memory.get(STORAGE_KEY)!).find((r:any)=>r.id==='p');
assert.equal(saved.stageHistory.length,2);
assert.equal(saved.stageHistory.at(-1).to,'미수주');
console.log('PASS: automatic stage dates, no legacy backfill, audit-field integrity, KST/month boundaries, overall stage outcomes, follow-up thresholds and recent five');
const dateUnknown=dashboardData([{...base,stage:'제안 완료'},{id:'invalid',kind:'log',deal:'p',date:'2026-00-01',note:'날짜 확인 필요'}],'2026-10-25');
assert.equal(dateUnknown.followups[0].reason,'연락일 확인 필요');
console.log('PASS: invalid/unknown contact dates remain distinguishable from no contact records');

assert.equal(dashboardData([{...base,stage:'완료'}],'2026-10-25').won.length,1);
assert.equal(dashboardData([{...base,stage:'미수주'}],'2026-10-25').lost.length,1);
console.log('PASS: all-time stage counts include undated, executing and completed projects without double counting');
