import {useRef,useState} from 'react';
import {Check,ChevronDown,Plus,Pencil,Trash2} from 'lucide-react';
import {companyContacts} from './projects';
import {meetingGroups,meetingParties,meetingStatuses,meetingValidation,type MeetingRecord} from './meetings';
type Props={rows:MeetingRecord[];query:string;busy:boolean;onSave:(items:MeetingRecord[],message?:string)=>Promise<boolean>;onDelete:(r:MeetingRecord)=>Promise<boolean>};
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export default function MeetingsPage({rows,query,busy,onSave,onDelete}:Props){
 const [filter,setFilter]=useState('예정'),[draft,setDraft]=useState<MeetingRecord|null>(null),[error,setError]=useState('');
 const saving=useRef(false),companies=rows.filter(r=>r.kind==='customer');
 const groups=meetingGroups(rows,query,filter,today()),count=groups.reduce((n,g)=>n+g.items.length,0);
 const existing=!!draft&&rows.some(r=>r.id===draft.id);
 const newMeeting=()=>{setError('');setDraft({id:crypto.randomUUID(),kind:'meeting',name:'',date:today(),time:'',endTime:'',customer:'',contactId:'',location:'',note:'',status:'예정'})};
 const edit=(meeting:MeetingRecord)=>{setError('');setDraft({...meeting})};
 return <section className="meetings-section" aria-label="미팅 일정">
 <div className="page-heading"><h1>미팅 일정</h1><button className="btn primary" onClick={newMeeting} disabled={busy||!!draft}><Plus size={17}/>미팅 등록</button></div>
 {query.trim()&&<div className="search-note">“{query.trim()}” 검색 결과</div>}
 {draft&&<form className="meeting-form" aria-label={existing?'미팅 수정':'미팅 등록'} onSubmit={async e=>{e.preventDefault();if(busy||saving.current)return;const issue=meetingValidation(draft,rows);if(issue){setError(issue);return}saving.current=true;try{if(await onSave([{...draft,name:draft.name.trim()}])){setDraft(null);setError('')}}finally{saving.current=false}}}>
 <h2>{existing?'미팅 수정':'미팅 등록'}</h2>
 <label>미팅명 *<input autoFocus required maxLength={200} value={draft.name} placeholder="미팅명" onChange={e=>setDraft({...draft,name:e.target.value})}/></label>
 <div className="meeting-dates"><label>날짜 *<input type="date" required value={draft.date} onInput={e=>setDraft({...draft,date:e.currentTarget.value})}/></label><label>시작 시간 *<input type="time" required value={draft.time} onInput={e=>setDraft({...draft,time:e.currentTarget.value})}/></label><label>종료 시간<input type="time" value={draft.endTime||''} min={draft.time||undefined} onInput={e=>setDraft({...draft,endTime:e.currentTarget.value})}/></label></div>
 <div className="form-grid"><label>거래처<span className="select-control"><select value={draft.customer||''} onChange={e=>setDraft({...draft,customer:e.target.value,contactId:''})}><option value="">선택 안 함</option>{companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><ChevronDown size={16}/></span></label><label>담당자<span className="select-control"><select value={draft.contactId||''} onChange={e=>{const company=companies.find(c=>companyContacts(c).some((p:any)=>p.id===e.target.value));setDraft({...draft,contactId:e.target.value,customer:company?.id||draft.customer})}}><option value="">선택 안 함</option>{companies.filter(c=>!draft.customer||c.id===draft.customer).map(c=><optgroup key={c.id} label={c.name}>{companyContacts(c).filter((p:any)=>p.contact).map((p:any)=><option key={p.id} value={p.id}>{[p.contact,p.position].filter(Boolean).join(' · ')}</option>)}</optgroup>)}</select><ChevronDown size={16}/></span></label></div>
 <label>장소<input value={draft.location||''} maxLength={300} placeholder="장소 또는 온라인 미팅 링크" onChange={e=>setDraft({...draft,location:e.target.value})}/></label>
 <details className="meeting-notes-editor"><summary>메모</summary><label><span className="sr-only">메모</span><textarea value={draft.note||''} maxLength={3000} onChange={e=>setDraft({...draft,note:e.target.value})}/></label></details>
 {existing&&<label className="meeting-status-field">상태<span className="select-control"><select value={draft.status||'예정'} onChange={e=>setDraft({...draft,status:e.target.value})}>{meetingStatuses.map(s=><option key={s}>{s}</option>)}</select><ChevronDown size={16}/></span></label>}
 {error&&<p className="task-form-error" role="alert">{error}</p>}
 <div className="meeting-form-actions"><button className="btn" type="button" disabled={busy} onClick={()=>{setDraft(null);setError('')}}>취소</button><button className="btn primary" disabled={busy||!draft.name?.trim()}><Check size={15}/>저장</button></div>
 </form>}
 <div className="list-toolbar"><div className="tabs inline">{['예정','지난','전체'].map(t=><button key={t} className={filter===t?'active':''} aria-pressed={filter===t} onClick={()=>setFilter(t)}>{t}</button>)}</div><span className="muted small" aria-live="polite">{count}건</span></div>
 {groups.map(group=><section className="meeting-day" key={group.date}><h2>{group.date===today()?'오늘 · ':''}{group.date.replaceAll('-','.')}</h2>{group.items.map(meeting=><article className={'meeting-row'+(meeting.status==='취소'?' meeting-canceled':'')} key={meeting.id}>
 <div className="meeting-time"><b>{meeting.time}</b>{meeting.endTime&&<small>– {meeting.endTime}</small>}</div><div className="meeting-copy"><div className="meeting-title"><h3>{meeting.name}</h3>{meeting.status&&meeting.status!=='예정'&&<span>{meeting.status}</span>}</div>{meetingParties(meeting,rows)&&<p>{meetingParties(meeting,rows)}</p>}{meeting.location&&<p>{/^https?:\/\//i.test(meeting.location)?<a href={meeting.location} target="_blank" rel="noreferrer">온라인 미팅 ↗</a>:meeting.location}</p>}{meeting.note&&<details className="meeting-note"><summary>메모</summary><p>{meeting.note}</p></details>}</div><div className="meeting-actions">{(meeting.status||'예정')==='예정'&&<button className="compact-action" disabled={busy||!!draft} aria-label={`${meeting.name} 완료`} onClick={()=>onSave([{...meeting,status:'완료'}],'완료했습니다.')}><Check size={13}/>완료</button>}<button className="icon-btn" disabled={busy||!!draft} aria-label={`${meeting.name} 수정`} onClick={()=>edit(meeting)}><Pencil size={14}/></button><button className="icon-btn delete-action" disabled={busy||!!draft} aria-label={`${meeting.name} 삭제`} onClick={()=>onDelete(meeting)}><Trash2 size={14}/></button></div>
 </article>)}</section>)}
 {!count&&<p className="dashboard-empty">{query?'검색 결과 없음':filter==='예정'?'예정된 미팅 없음':'미팅 기록 없음'}</p>}
 </section>
}
