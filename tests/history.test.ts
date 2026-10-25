import assert from 'node:assert/strict';
import {filterHistory,historyContactName} from '../src/history.ts';
const rows=[
 {id:'c1',kind:'customer',name:'가나다',contacts:[{id:'p1',contact:'변경된 이름'}]},
 {id:'c2',kind:'customer',name:'다른 회사',contacts:[{id:'p2',contact:'두번째 담당자'}]},
 {id:'l1',kind:'log',customer:'c1',contactId:'p1',contact:'이전 이름',date:'2026-10-24',updated:'2026-10-24T01:00:00Z',channel:'전화',note:'소개서 전달'},
 {id:'l2',kind:'log',customer:'c2',contactId:'p2',date:'2026-10-25',updated:'2026-10-25T01:00:00Z',channel:'메일',note:'집행 일정'},
 {id:'l3',kind:'log',customer:'c1',date:'2026-10-25',updated:'2026-10-25T02:00:00Z',channel:'전화',note:'기존 기록'},
];
assert.deepEqual(filterHistory(rows).map(r=>r.id),['l3','l2','l1']);
assert.deepEqual(filterHistory(rows,{from:'2026-10-24',to:'2026-10-24'}).map(r=>r.id),['l1']);
assert.deepEqual(filterHistory(rows,{from:'2026-10-25',to:'2026-10-24'}),[]);
assert.deepEqual(filterHistory(rows,{query:'변경된 이름',channel:'전화'}).map(r=>r.id),['l1']);
assert.deepEqual(filterHistory(rows,{query:'소개서',from:'2026-10-25'}),[]);
assert.deepEqual(filterHistory(rows,{query:'다른 회사',channel:'메일',from:'2026-10-25',to:'2026-10-25'}).map(r=>r.id),['l2']);
assert.equal(historyContactName(rows[4],rows),'담당자 미지정');
console.log('PASS: newest order, inclusive date ranges, invalid range, current contact names, combined search/channel/date filters, legacy records');
