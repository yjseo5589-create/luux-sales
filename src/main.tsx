import {useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import type {Session} from '@supabase/supabase-js';
import CRM from './crm';
import {recordsRequest,supabase} from './records';
import './globals.css';

function App(){
 const [session,setSession]=useState<Session|null>(null),[loading,setLoading]=useState(!!supabase),[email,setEmail]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState(''),[allowed,setAllowed]=useState(false);
 const file=useRef<HTMLInputElement>(null);
 useEffect(()=>{
  if(!supabase)return;
  const apply=async(s:Session|null)=>{setSession(s);setAllowed(false);if(s){const {data,error}=await supabase!.rpc('luux_is_allowed');if(error)setError('DB 설정을 확인해 주세요.');else setAllowed(data===true);}setLoading(false);};
  supabase.auth.getSession().then(({data})=>apply(data.session));
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,s)=>{setTimeout(()=>void apply(s),0);});
  return()=>subscription.unsubscribe();
 },[]);
 async function signOut(){await supabase?.auth.signOut();setSession(null);setAllowed(false);}
 async function importRecords(f:File){
  setBusy(true);setError('');setMessage('');
  try{
   const raw=JSON.parse(await f.text());const items=Array.isArray(raw)?raw:raw.items;
   if(!Array.isArray(items)||!items.length)throw Error('가져올 기록이 없습니다.');
   const existingResponse=await recordsRequest('/api/records');if(!existingResponse.ok)throw Error('기존 데이터 확인에 실패했습니다.');
   const existing:any[]=await existingResponse.json();
   // Migration only accepts an empty destination, preventing accidental overwrites.
   if(existing.length)throw Error('이미 저장된 데이터가 있습니다. 중복 등록을 막기 위해 가져오기를 중단했습니다.');
   const response=await recordsRequest('/api/records',{method:'POST',body:JSON.stringify({items:items.map((r:any)=>r.kind==='log'&&!r.contactId?{...r,legacyImport:true}:r)})});
   const result=await response.json();if(!response.ok)throw Error(result.error);
   const check=await recordsRequest('/api/records');const saved=await check.json();
   if(!check.ok||saved.length!==items.length)throw Error('저장 결과 확인이 필요합니다.');
   setMessage(`${items.length}개 기록을 가져왔습니다.`);
  }catch(e:any){setError(e.message);}finally{setBusy(false);if(file.current)file.current.value='';}
 }
 if(session&&allowed&&!loading&&location.hash!=='#migration')return <CRM onSignOut={signOut}/>;
 return <main className="auth-shell"><section className="auth-card"><img src={import.meta.env.BASE_URL+'landing-luux-logo.png'} alt="LUUX"/><h1>{session&&allowed?'데이터 이전':'영업 관리'}</h1>
  {!supabase?<><p className="auth-message">DB·로그인 서버 연결을 준비 중입니다.</p><div className="auth-links"><a href="https://luux-personal-sales-jayden.yj-seo-5589.chatgpt.site/">기존 사이트 열기 ↗</a></div></>:loading?<p className="auth-message">확인 중</p>:session&&allowed?<><p className="auth-message">기존 사이트에서 준비한 이전 파일을 선택하세요.</p><input className="migration-input" type="file" accept="application/json,.json" ref={file} onChange={e=>{if(e.target.files?.[0])void importRecords(e.target.files[0]);}}/><button className="btn primary" disabled={busy} onClick={()=>file.current?.click()}>{busy?'가져오는 중':'이전 파일 선택'}</button><div className="auth-links"><a href={import.meta.env.BASE_URL}>거래처 관리</a></div></>:session?<><p className="auth-message">등록된 계정만 사용할 수 있습니다.</p><button className="btn" onClick={signOut}>로그아웃</button></>:<form onSubmit={async e=>{e.preventDefault();if(!supabase)return;setBusy(true);setError('');setMessage('');const {error}=await supabase.auth.signInWithOtp({email:email.trim(),options:{emailRedirectTo:location.origin+import.meta.env.BASE_URL}});setBusy(false);if(error)setError(error.message);else setMessage('이메일로 보낸 로그인 링크를 열어주세요.');}}><label>이메일<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><button className="btn primary" disabled={busy}>{busy?'보내는 중':'로그인 링크 받기'}</button></form>}
  {message&&<p className="auth-message" role="status">{message}</p>}{error&&<p className="auth-message auth-error" role="alert">{error}</p>}
 </section></main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
