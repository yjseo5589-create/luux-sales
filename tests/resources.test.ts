import assert from 'node:assert/strict';
import {filterResources,workResources,resourceSourceRoot} from '../src/resources.ts';
// IDs observed under the designated shared drive; prevent unrelated personal-Drive links from returning.
const allowed=new Set(['1OXaFwd8WUzv_RvHDWNeNsxTka_UUvxN0','1DfTaqRJnyEk_QqE5DItU8e9HOWup6Z-p','1cG003P0STknYDegKjjHYRxibkLmc3puQ','1RKacgeIM5krGnZKxQQ2YLL384HDrHlL0','1zMAleJ-9xO9rPXG7UuUbCfLdgxLK7cKd','1hUG6OZJ47iTKGF0gnRJbEdeJ3e-GPUVp','18XkBgWpN9n0Vyr6vyWqHBCptzo0YWotk','1iwVFHfKZE6sJ6XBxgmPIqMLNoLnbG8sI']);
assert.ok(resourceSourceRoot.endsWith('/0ANWx4VkNnl-OUk9PVA'));
assert.equal(workResources.length,8);
assert.equal(new Set(workResources.map(r=>r.id)).size,8);
for(const r of workResources){
 const url=new URL(r.url);
 assert.equal(url.origin,'https://drive.google.com');
 assert.equal(url.search,'');
 assert.ok(allowed.has(url.pathname.split('/').pop()!));
}
assert.equal(filterResources('', '제안').length,2);
assert.equal(filterResources('', '계약·집행').length,4);
assert.equal(filterResources('', '보고').length,2);
assert.deepEqual(filterResources(' 편성 ').map(r=>r.id),['schedule']);
assert.deepEqual(filterResources('청약').map(r=>r.id),['contracts']);
assert.equal(filterResources('촬영','보고').length,0);
assert.equal(filterResources('없는자료검색').length,0);
assert.equal(filterResources('퍼즐').length,0);
console.log('resources: shared-drive scope, operating resources and filters passed');
