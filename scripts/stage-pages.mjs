import {mkdir,rm,writeFile,rename} from 'node:fs/promises';
import {loadSiteKey} from './site-key.mjs';
import {bundleHtml,protectHtml} from './protect-pages.mjs';
const key=await loadSiteKey();
const {html,logoData}=await bundleHtml();
const protectedPage=await protectHtml(html,key,logoData);
// Prepare everything before replacing the deployed directory. Never copy plain dist assets to docs.
await rm('dist/protected-pages',{recursive:true,force:true});
await mkdir('dist/protected-pages',{recursive:true});
await writeFile('dist/protected-pages/index.html',protectedPage);
await writeFile('dist/protected-pages/.nojekyll','');
await rm('docs',{recursive:true,force:true});
await rename('dist/protected-pages','docs');
console.log('Pages prepared: encrypted app only; no plain app bundles.');
