import {readFile,mkdir,writeFile,chmod} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url);
const cryptoEngine=require('staticrypt/lib/cryptoEngine.js');
const secretPath=new URL('../.security/build-key.json',import.meta.url);
export async function loadSiteKey(path=secretPath){
 let key;
 try{key=JSON.parse(await readFile(path,'utf8'))}catch{throw Error('Site encryption key missing. Run npm run set-password before building. Unprotected publication is disabled.')}
 if(!/^[a-f0-9]{32,}$/.test(key.salt)||!/^[a-f0-9]{64}$/.test(key.hashedPassword))throw Error('Invalid site encryption key.');
 return key;
}
async function readPassword(){
 if(!process.stdin.isTTY)return (await readFile(0,'utf8')).replace(/[\r\n]+$/,'');
 process.stdout.write('Site password: ');
 process.stdin.setRawMode(true);process.stdin.resume();process.stdin.setEncoding('utf8');
 return await new Promise((resolve,reject)=>{let value='';const done=()=>{process.stdin.setRawMode(false);process.stdin.pause();process.stdin.off('data',receive);process.stdout.write('\n')};function receive(chunk){for(const ch of chunk){if(ch==='\u0003'){done();reject(Error('Cancelled'));return}if(ch==='\r'||ch==='\n'){done();resolve(value);return}if(ch==='\u007f'){value=value.slice(0,-1)}else value+=ch}}process.stdin.on('data',receive)});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if(process.argv.includes('--check')){await loadSiteKey()}
 else{const password=await readPassword();if(password.length<10)throw Error('Use at least 10 characters.');const salt=cryptoEngine.generateRandomSalt();const hashedPassword=await cryptoEngine.hashPassword(password,salt);await mkdir(new URL('../.security/',import.meta.url),{recursive:true,mode:0o700});await writeFile(secretPath,JSON.stringify({salt,hashedPassword})+'\n',{mode:0o600});await chmod(secretPath,0o600);console.log('Local encryption key configured. The password was not saved.');}
}
