export type VCardContact={contact?:string;position?:string;department?:string;phone?:string;officePhone?:string;email?:string};
const clean=(value:string|undefined)=>(value||'').trim();
const escapeText=(value:string)=>value.replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
export const contactDisplayName=(company:string,person:VCardContact)=>[company,person.contact,person.position].map(clean).filter(Boolean).join(' ')||'연락처';
// Fold at UTF-8 code point boundaries; continuation spaces count toward 75 octets.
function fold(line:string){
 const encoder=new TextEncoder();let out='',part='',bytes=0;
 for(const char of line){const length=encoder.encode(char).length;if(bytes+length>75){out+=part+'\r\n';part=' ';bytes=1}part+=char;bytes+=length}
 return out+part;
}
export function createVCard(company:string,person:VCardContact){
 const name=contactDisplayName(company,person);
 const lines=['BEGIN:VCARD','VERSION:3.0',`N:;${escapeText(name)};;;`,`FN:${escapeText(name)}`];
 if(clean(company)||clean(person.department))lines.push(`ORG:${escapeText(clean(company))};${escapeText(clean(person.department))}`);
 if(clean(person.position))lines.push(`TITLE:${escapeText(clean(person.position))}`);
 if(clean(person.phone))lines.push(`TEL;TYPE=CELL:${escapeText(clean(person.phone))}`);
 if(clean(person.officePhone))lines.push(`TEL;TYPE=WORK,VOICE:${escapeText(clean(person.officePhone))}`);
 if(clean(person.email))lines.push(`EMAIL;TYPE=INTERNET,WORK:${escapeText(clean(person.email))}`);
 lines.push('END:VCARD');
 const filename=name.replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,100)||'연락처';
 return {name,filename:filename+'.vcf',content:lines.map(fold).join('\r\n')+'\r\n'};
}
export function downloadVCard(company:string,person:VCardContact){
 const card=createVCard(company,person),url=URL.createObjectURL(new Blob([card.content],{type:'text/vcard;charset=utf-8'}));
 const link=document.createElement('a');link.href=url;link.download=card.filename;document.body.appendChild(link);link.click();link.remove();
 window.setTimeout(()=>URL.revokeObjectURL(url),60_000);
}
