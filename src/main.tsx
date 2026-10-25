import {useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import CRM from './crm';
import {recordsRequest} from './records';
import './globals.css';
function App(){
 const [importing,setImporting]=useState(location.hash==='#migration');
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const file=useRef<HTMLInputElement>(null);
 async function importRecords(f:File){
  setBusy(true);setError('');setMessage('');
  try{
   const raw=JSON.parse(await f.text());const items=Array.isArray(raw)?raw:raw.items;
   if(!Array.isArray(items)||!items.length)throw Error('가져올 기록이 없습니다.');
   const current=await recordsRequest('/api/records');if(!current.ok)throw Error('기존 데이터 확인에 실패했습니다.');
   const existing=await current.json();
   // Preserve browser-only records and contacts while importing matching IDs once.
   const merged=items.map((r:any)=>{const old=existing.find((x:any)=>x.id===r.id);if(r.kind!=='customer'||!old?.contacts||!r.contacts)return r;const people=new Map(old.contacts.map((p:any)=>[p.id,p]));for(const p of r.contacts)people.set(p.id,p);return {...r,contacts:[...people.values()]};});
   const response=await recordsRequest('/api/records',{method:'POST',body:JSON.stringify({items:merged.map((r:any)=>r.kind==='log'&&!r.contactId?{...r,legacyImport:true}:r)})});
   const result=await response.json();if(!response.ok)throw Error(result.error);
   const verifiedResponse=await recordsRequest('/api/records');if(!verifiedResponse.ok)throw Error('저장 결과를 확인하지 못했습니다.');
   const verified=await verifiedResponse.json();
   if(!merged.every((r:any)=>{const target=verified.find((x:any)=>x.id===r.id);return target&&Object.entries(r).filter(([key])=>!['updated','legacyImport'].includes(key)).every(([key,value])=>JSON.stringify(target[key])===JSON.stringify(value));}))throw Error('이전 데이터 검증에 실패했습니다.');
   const companies=merged.filter((r:any)=>r.kind==='customer');
   setMessage(`회사 ${companies.length}개 · 담당자 ${companies.reduce((n:number,r:any)=>n+(r.contacts?.length||0),0)}명 · 연락 이력 ${merged.filter((r:any)=>r.kind==='log').length}건 이전 완료`);
  }catch(e:any){setError(e.message);}finally{setBusy(false);if(file.current)file.current.value='';}
 }
 if(!importing)return <CRM onImport={()=>setImporting(true)}/>;
 return <main className="auth-shell"><section className="auth-card"><img src={import.meta.env.BASE_URL+'landing-luux-logo.png'} alt="LUUX"/><h1>연락처 가져오기</h1><input className="migration-input" type="file" accept="application/json,.json" ref={file} onChange={e=>{if(e.target.files?.[0])void importRecords(e.target.files[0]);}}/><button className="btn primary" disabled={busy} onClick={()=>file.current?.click()}>{busy?'가져오는 중':'파일 선택'}</button>{message&&<p className="auth-message" role="status">{message}</p>}{error&&<p className="auth-message auth-error" role="alert">{error}</p>}<div className="auth-links"><button className="text-link" onClick={()=>setImporting(false)}>거래처 관리</button></div></section></main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
