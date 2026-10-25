import assert from 'node:assert/strict';
import {filterResources,workResources} from '../src/resources.ts';
assert.equal(workResources.length,13);
assert.equal(new Set(workResources.map(r=>r.id)).size,13);
for(const r of workResources){
 const url=new URL(r.url);
 assert.equal(url.protocol,'https:');
 assert.ok(['docs.google.com','drive.google.com'].includes(url.hostname));
 assert.equal(url.search,'');
 assert.equal(url.hash,'');
}
assert.equal(filterResources('', '제안·영업').length,4);
for(const c of ['집행·운영','성과·분석','참고자료'])assert.equal(filterResources('',c).length,3);
assert.ok(filterResources('  블랙바  ').some(r=>r.id==='blackbar-guide'));
assert.deepEqual(filterResources('청약').map(r=>r.id),['booking-example']);
assert.equal(filterResources('퍼즐','성과·분석').length,2);
assert.ok(filterResources('ppl').some(r=>r.id==='ppl-reference'));
assert.equal(filterResources('없는자료검색').length,0);
assert.ok(workResources.find(r=>r.id==='booking-example')?.purpose.includes('빈 양식 아님'));
assert.ok(workResources.find(r=>r.id==='doodle-kit')?.purpose.includes('예정안'));
assert.equal(workResources.find(r=>r.id==='ppl-reference')?.edition,'과거 제안');
console.log('resources: canonical source links, search and classifications passed');
