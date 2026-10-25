import {cp,mkdir,rm,writeFile} from 'node:fs/promises';
await rm('docs',{recursive:true,force:true});
await mkdir('docs',{recursive:true});
await cp('dist','docs',{recursive:true,force:true});
await writeFile('docs/.nojekyll','');
