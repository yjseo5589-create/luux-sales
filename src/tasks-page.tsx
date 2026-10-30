import {useState} from 'react';
import {Check,Plus,Pencil,Trash2,X} from 'lucide-react';
type Task={id:string;kind:string;[key:string]:any};
type Props={rows:Task[];query:string;busy:boolean;today:string;onSave:(items:Task[],message?:string)=>Promise<boolean>;onDelete:(r:Task)=>Promise<boolean>};
export default function TasksPage({rows,query,busy,today,onSave,onDelete}:Props){
 const [filter,setFilter]=useState('진행 중'),[draft,setDraft]=useState<Task|null>(null),[name,setName]=useState(''),[due,setDue]=useState('');
 const tasks=rows.filter(r=>r.kind==='task'&&r.name.toLowerCase().includes(query.trim().toLowerCase()));
 const visible=tasks.filter(r=>filter==='전체'||(filter==='완료'?r.done:!r.done)).sort((a,b)=>Number(a.done)-Number(b.done)||(a.due||'9999').localeCompare(b.due||'9999')||(b.updated||'').localeCompare(a.updated||''));
 const clear=()=>{setDraft(null);setName('');setDue('')};
 return <section className="tasks-section" aria-label="할 일 목록">
 <form className="task-entry" onSubmit={async e=>{e.preventDefault();if(!name.trim()||busy)return;if(await onSave([{...(draft||{id:crypto.randomUUID(),kind:'task',done:false}),name:name.trim(),due}],draft?'수정했습니다.':'추가했습니다.'))clear()}}>
 <input aria-label="할 일" placeholder="할 일 입력" required disabled={busy} maxLength={300} value={name} onChange={e=>setName(e.target.value)}/>
 <label className="task-date"><span className="sr-only">기한</span><input aria-label="기한" type="date" disabled={busy} title="기한 (선택)" value={due} onChange={e=>setDue(e.target.value)}/></label>
 {draft&&<button type="button" className="icon-btn" aria-label="수정 취소" onClick={clear}><X size={16}/></button>}
 <button className="btn primary" disabled={busy||!name.trim()}>{draft?<Check size={15}/>:<Plus size={15}/>} {draft?'저장':'추가'}</button>
 </form>
 <div className="list-toolbar"><div className="tabs inline">{['진행 중','완료','전체'].map(t=><button key={t} className={filter===t?'active':''} aria-pressed={filter===t} onClick={()=>setFilter(t)}>{t}</button>)}</div><span className="muted small" aria-live="polite">{visible.length}건</span></div>
 {visible.map(task=><article className={'task-row'+(task.done?' task-done':'')} key={task.id}>
 <button className={'check '+(task.done?'checked':'')} aria-label={`${task.name} ${task.done?'완료 취소':'완료'}`} aria-pressed={task.done} disabled={busy} onClick={()=>onSave([{...task,done:!task.done,completedAt:task.done?'':new Date().toISOString()}],task.done?'완료를 취소했습니다.':'완료했습니다.')}><Check size={12}/></button>
 <div className="task-copy"><span>{task.name}</span>{task.due&&<small>{task.due.replaceAll('-','.')} {!task.done&&task.due<today?'· 기한 경과':''}</small>}</div>
 <button className="icon-btn" aria-label={`${task.name} 수정`} disabled={busy} onClick={()=>{setDraft(task);setName(task.name);setDue(task.due||'')}}><Pencil size={14}/></button>
 <button className="icon-btn delete-action" aria-label={`${task.name} 삭제`} disabled={busy} onClick={async()=>{if(await onDelete(task))if(draft?.id===task.id)clear()}}><Trash2 size={14}/></button>
 </article>)}
 {!visible.length&&<p className="dashboard-empty">{query?'검색 결과 없음':filter==='완료'?'완료한 항목 없음':'등록된 할 일 없음'}</p>}
 </section>
}
