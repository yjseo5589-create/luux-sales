import {useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import CRM from './crm';
import {recordsRequest} from './records';
import './globals.css';
function App(){
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
   setMessage('연락처를 가져왔습니다.');
  }catch(e:any){setError(e.message);}finally{setBusy(false);if(file.current)file.current.value='';}
 }
 if(location.hash!=='#migration')return <CRM/>;
 return <main className="auth-shell"><section className="auth-card"><img src={import.meta.env.BASE_URL+'landing-luux-logo.png'} alt="LUUX"/><h1>연락처 가져오기</h1><p className="auth-message">이 브라우저에 저장됩니다.</p><input className="migration-input" type="file" accept="application/json,.json" ref={file} onChange={e=>{if(e.target.files?.[0])void importRecords(e.target.files[0]);}}/><button className="btn primary" disabled={busy} onClick={()=>file.current?.click()}>{busy?'가져오는 중':'파일 선택'}</button>{message&&<p className="auth-message" role="status">{message}</p>}{error&&<p className="auth-message auth-error" role="alert">{error}</p>}<div className="auth-links"><a href={import.meta.env.BASE_URL}>거래처 관리</a></div></section></main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
