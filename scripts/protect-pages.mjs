import {readFile,readdir} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const cryptoEngine=require('staticrypt/lib/cryptoEngine.js');
const codec=require('staticrypt/lib/codec.js').init(cryptoEngine);
const {buildStaticryptJS}=require('staticrypt/cli/helpers.js');
const {renderTemplate}=require('staticrypt/lib/formater.js');
export async function bundleHtml(dist='dist'){
 const root=resolve(dist);let html=await readFile(resolve(root,'index.html'),'utf8');
 const readAsset=async url=>{const asset=resolve(root,url.replace(/^.*\/assets\//,'assets/'));if(relative(root,asset).startsWith('..'))throw Error('Asset outside build directory.');return await readFile(asset,'utf8')};
 const scripts=[...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)];
 if(!scripts.length)throw Error('No built app script to encrypt.');
 const referenced=new Set([...scripts.map(m=>m[1].split('/').pop()),...[...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)].map(m=>m[1].split('/').pop())]);
 const builtAssets=await readdir(resolve(root,'assets'));
 if(builtAssets.some(name=>!referenced.has(name)))throw Error('Unbundled build chunks found. Do not publish until all assets are encrypted.');
 const logo=await readFile(resolve(root,'landing-luux-logo.png'));
 const logoData='data:image/png;base64,'+logo.toString('base64');
 for(const m of scripts){let js=await readAsset(m[1]);js=js.replace(/\/[^"'`]*landing-luux-logo\.png/g,logoData).replace(/<\/script/gi,'<\\/script');html=html.replace(m[0],()=>'<script type="module">'+js+'</script>')}
 for(const m of [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)]){const css=(await readAsset(m[1])).replace(/<\/style/gi,'<\\/style');html=html.replace(m[0],()=>'<style>'+css+'</style>')}
 html=html.replace(/<link\b[^>]*rel="modulepreload"[^>]*>/g,'');
 if(/(?:src|href)="[^"\s]*\/assets\//.test(html))throw Error('Unbundled executable asset in encrypted page.');
 return {html,logoData};
}
export async function protectHtml(html,key,logoData){
 const encryptedMsg=await codec.encodeWithHashedPassword(html,key.hashedPassword);
 const template=await readFile(new URL('./password-template.html',import.meta.url),'utf8');
 return renderTemplate(template,{js_staticrypt:buildStaticryptJS(),staticrypt_config:{staticryptEncryptedMsgUniqueVariableName:encryptedMsg,staticryptSaltUniqueVariableName:key.salt,isRememberEnabled:false,rememberDurationInDays:0},logo_data:logoData});
}
