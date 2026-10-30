import {useRef,useState} from 'react';
import {Check,ChevronRight,Plus,Pencil,Trash2} from 'lucide-react';
import {groupTasks,taskValidation,type TaskRecord} from './tasks';
type Task=TaskRecord&{name:string;done:boolean};
type Props={rows:TaskRecord[];query:string;busy:boolean;onSave:(items:TaskRecord[],message?:string)=>Promise<boolean>;onDelete:(r:TaskRecord)=>Promise<boolean>};
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const dateLabel=(day:string)=>day?day.replaceAll('-','.'):'';
export default function TasksPage({rows,query,busy,onSave,onDelete}:Props){
 const [name,setName]=useState(''),[selectedDate,setSelectedDate]=useState(today),[draft,setDraft]=useState<Task|null>(null),[error,setError]=useState('');
 const input=useRef<HTMLInputElement>(null),submitting=useRef(false);
 const groups=groupTasks(rows,query),tasks=groups.flatMap(g=>g.tasks),active=tasks.filter(t=>!t.done);
 const day=today();
 async function submit(task:TaskRecord,editing=false){if(busy||submitting.current)return;const error=taskValidation(task);if(error){setError(error);return}submitting.current=true;setError('');try{if(await onSave([task])){if(editing)setDraft(null);else{setName('')}}}finally{submitting.current=false}}
 const row=(task:TaskRecord)=><article className={'task-row'+(task.done?' task-done':'')} key={task.id}>
 <label className="task-checkbox"><input type="checkbox" aria-label={`${task.name} ${task.done?'완료 취소':'완료'}`} checked={task.done} disabled={busy} onChange={e=>onSave([{...task,done:e.target.checked}],e.target.checked?'완료했습니다.':'완료를 취소했습니다.')}/><span className="sr-only">{task.name}</span></label>
 {draft?.id===task.id?<form className="task-inline-form" aria-label="할 일 수정" onSubmit={e=>{e.preventDefault();submit({...draft,name:draft.name.trim()},true)}} onKeyDown={e=>{if(e.key==='Escape'){setDraft(null);setError('')}}}><input autoFocus required aria-label="할 일 수정" maxLength={300} value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/>{error&&<p className="task-form-error" role="alert">{error}</p>}<div className="task-edit-actions"><button type="button" className="btn" onClick={()=>{setDraft(null);setError('')}}>취소</button><button className="btn primary" disabled={busy||!draft.name.trim()}><Check size={14}/>저장</button></div></form>:<div className="task-content"><span className="task-title">{task.name}</span></div>}
 <button className="icon-btn" aria-label={`${task.name} 수정`} disabled={busy} onClick={()=>{setDraft(task as Task);setError('')}}><Pencil size={14}/></button>
 <button className="icon-btn delete-action" aria-label={`${task.name} 삭제`} disabled={busy} onClick={async()=>{if(await onDelete(task))if(draft?.id===task.id)setDraft(null)}}><Trash2 size={14}/></button>
 </article>;
 return <section className="tasks-section" aria-label="할 일 목록">
 <form className="task-create-form" aria-label="할 일 추가" onSubmit={e=>{e.preventDefault();if(name.trim())submit({id:crypto.randomUUID(),kind:'task',done:false,name:name.trim(),taskDate:selectedDate})}}>
 <div className="task-entry"><label className="task-day-picker"><span className="sr-only">날짜</span><input aria-label="날짜" required type="date" value={selectedDate} disabled={busy} onInput={e=>setSelectedDate(e.currentTarget.value)}/></label><input ref={input} aria-label="할 일" placeholder="할 일 입력" required readOnly={busy} maxLength={300} value={name} onChange={e=>setName(e.target.value)}/><button className="btn primary" disabled={busy||!name.trim()}><Plus size={15}/>추가</button></div>
 {error&&!draft&&<p className="task-form-error" role="alert">{error}</p>}
 </form>
 <div className="task-status"><span aria-live="polite">미완료 {active.length} · 완료 {tasks.length-active.length}</span></div>
 {groups.map(group=><details className="task-day-group" key={group.day||'undated'} open><summary><ChevronRight size={14}/><h2>{group.day?(group.day===day?'오늘 · ':'')+dateLabel(group.day):'날짜 미지정'}</h2><span>{group.tasks.filter(t=>t.done).length}/{group.tasks.length}</span></summary><div className="task-list">{group.tasks.map(row)}</div></details>)}
 {!tasks.length&&<p className="dashboard-empty">{query?'검색 결과 없음':'할 일을 추가해 주세요'}</p>}

 </section>
}
