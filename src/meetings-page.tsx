import {useLayoutEffect,useRef,useState} from 'react';
import {Check,ChevronDown,Plus,Pencil,Trash2,X} from 'lucide-react';
import {companyContacts} from './projects';
import {meetingGroups,meetingParties,meetingValidation,type MeetingRecord} from './meetings';
type Props={rows:MeetingRecord[];query:string;busy:boolean;onSave:(items:MeetingRecord[],message?:string)=>Promise<boolean>;onDelete:(r:MeetingRecord)=>Promise<boolean>};
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export default function MeetingsPage({rows,query,busy,onSave,onDelete}:Props){
 const [filter,setFilter]=useState('예정'),[draft,setDraft]=useState<MeetingRecord|null>(null),[error,setError]=useState('');
 const saving=useRef(false),dialog=useRef<HTMLElement>(null),busyRef=useRef(busy);busyRef.current=busy;
 const companies=rows.filter(r=>r.kind==='customer');
 const groups=meetingGroups(rows,query,filter,today()),count=groups.reduce((n,g)=>n+g.items.length,0);
 const existing=!!draft&&rows.some(r=>r.id===draft.id);
 const newMeeting=()=>{setError('');setDraft({id:crypto.randomUUID(),kind:'meeting',name:'',date:today(),time:'',customer:'',contactId:'',location:'',status:'예정'})};
 useLayoutEffect(()=>{
  if(!draft)return;
  const previous=document.activeElement as HTMLElement|null;
  const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
  dialog.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus({preventScroll:true});
  const keydown=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();event.stopPropagation();if(!busyRef.current){setDraft(null);setError('')}return;}
   if(event.key!=='Tab')return;
   const nodes=Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]')||[]).filter(node=>node.getClientRects().length);
   const first=nodes[0],last=nodes.at(-1);
   if(!dialog.current?.contains(document.activeElement)){event.preventDefault();(event.shiftKey?last:first)?.focus({preventScroll:true})}
   else if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus({preventScroll:true})}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus({preventScroll:true})}
  };
  document.addEventListener('keydown',keydown);
  return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',keydown);if(previous?.isConnected)previous.focus({preventScroll:true})};
 },[draft?.id]);
 const edit=(meeting:MeetingRecord)=>{setError('');setDraft({...meeting})};
 return <section className="meetings-section" aria-label="미팅 일정">
 <div className="page-heading"><h1>미팅 일정</h1><button className="btn primary" onClick={newMeeting} disabled={busy}><Plus size={17}/>미팅 등록</button></div>
 {query.trim()&&<div className="search-note">“{query.trim()}” 검색 결과</div>}
 {draft&&<div className="overlay modal-overlay"><section ref={dialog} className="modal meeting-modal" role="dialog" aria-modal="true" aria-label={existing?'미팅 수정':'미팅 등록'}>
 <div className="modal-head"><h2>{existing?'미팅 수정':'미팅 등록'}</h2><button className="icon-btn" aria-label="닫기" disabled={busy} onClick={()=>{setDraft(null);setError('')}}><X size={21}/></button></div>
 <form onSubmit={async e=>{e.preventDefault();if(busy||saving.current)return;const issue=meetingValidation(draft,rows);if(issue){setError(issue);return}saving.current=true;try{if(await onSave([{...draft,name:draft.name.trim()}])){setDraft(null);setError('')}else setError('저장하지 못했습니다. 입력 내용을 확인하고 다시 시도해 주세요.')}finally{saving.current=false}}}>
 <div className="modal-fields">
 <label>미팅명 *<input data-autofocus required maxLength={200} value={draft.name} placeholder="미팅명" onChange={e=>setDraft({...draft,name:e.target.value})}/></label>
 <div className="meeting-dates"><label>날짜 *<input type="date" required value={draft.date} onInput={e=>setDraft({...draft,date:e.currentTarget.value})}/></label><label>시작 시간 *<input type="time" required value={draft.time} onInput={e=>setDraft({...draft,time:e.currentTarget.value})}/></label></div>
 <div className="form-grid"><label>거래처<span className="select-control"><select value={draft.customer||''} onChange={e=>setDraft({...draft,customer:e.target.value,contactId:''})}><option value="">선택 안 함</option>{companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><ChevronDown size={16}/></span></label><label>담당자<span className="select-control"><select value={draft.contactId||''} onChange={e=>{const company=companies.find(c=>companyContacts(c).some((p:any)=>p.id===e.target.value));setDraft({...draft,contactId:e.target.value,customer:company?.id||draft.customer})}}><option value="">선택 안 함</option>{companies.filter(c=>!draft.customer||c.id===draft.customer).map(c=><optgroup key={c.id} label={c.name}>{companyContacts(c).filter((p:any)=>p.contact).map((p:any)=><option key={p.id} value={p.id}>{[p.contact,p.position].filter(Boolean).join(' · ')}</option>)}</optgroup>)}</select><ChevronDown size={16}/></span></label></div>
 <label>장소<input value={draft.location||''} maxLength={300} placeholder="장소" onChange={e=>setDraft({...draft,location:e.target.value})}/></label>
 <label>메모<textarea value={draft.memo||''} maxLength={2000} rows={3} placeholder="간단한 메모" onChange={e=>setDraft({...draft,memo:e.target.value})}/></label>
 {error&&<p className="task-form-error" role="alert">{error}</p>}
 </div>
 <div className="modal-footer"><span className="push"/><button className="btn" type="button" disabled={busy} onClick={()=>{setDraft(null);setError('')}}>취소</button><button className="btn primary" disabled={busy||!draft.name?.trim()}><Check size={15}/>저장</button></div>
 </form></section></div>}
 <div className="list-toolbar"><div className="tabs inline">{['예정','지난','전체'].map(t=><button key={t} className={filter===t?'active':''} aria-pressed={filter===t} onClick={()=>setFilter(t)}>{t}</button>)}</div><span className="muted small" aria-live="polite">{count}건</span></div>
 {groups.map(group=><section className="meeting-day" key={group.date}><h2>{group.date===today()?'오늘 · ':''}{group.date.replaceAll('-','.')}</h2>{group.items.map(meeting=><article className={'meeting-row'+(meeting.status==='취소'?' meeting-canceled':'')} key={meeting.id}>
 <div className="meeting-time"><b>{meeting.time}</b></div><div className="meeting-copy"><div className="meeting-title"><h3>{meeting.name}</h3></div>{meetingParties(meeting,rows)&&<p>{meetingParties(meeting,rows)}</p>}{meeting.location&&!/^https?:\/\//i.test(meeting.location)&&<p>{meeting.location}</p>}{meeting.memo&&<p style={{whiteSpace:'pre-wrap'}}>{meeting.memo}</p>}</div><div className="meeting-actions"><button className="icon-btn" disabled={busy} aria-label={`${meeting.name} 수정`} onClick={()=>edit(meeting)}><Pencil size={14}/></button><button className="icon-btn delete-action" disabled={busy} aria-label={`${meeting.name} 삭제`} onClick={()=>onDelete(meeting)}><Trash2 size={14}/></button></div>
 </article>)}</section>)}
 {!count&&<p className="dashboard-empty">{query?'검색 결과 없음':filter==='예정'?'예정된 미팅 없음':'미팅 기록 없음'}</p>}
 </section>
}
