import {useRef,useState} from 'react';
import {Check,ChevronRight,Plus,Trash2,Undo2,X} from 'lucide-react';
type Task={id:string;kind:string;[key:string]:any};
type Props={rows:Task[];query:string;busy:boolean;onSave:(items:Task[],message?:string)=>Promise<boolean>;onDelete:(r:Task)=>Promise<boolean>};
export default function TasksPage({rows,query,busy,onSave,onDelete}:Props){
 const [name,setName]=useState(''),[editing,setEditing]=useState(''),[draft,setDraft]=useState(''),[deleted,setDeleted]=useState<Task|null>(null);
 const input=useRef<HTMLInputElement>(null),submitting=useRef(false),editingValue=useRef('');
 const tasks=rows.filter(r=>r.kind==='task'&&r.name.toLowerCase().includes(query.trim().toLowerCase())).reverse();
 const active=tasks.filter(t=>!t.done),completed=tasks.filter(t=>t.done);
 async function finish(task:Task){
  if(editingValue.current!==task.id||submitting.current)return;
  const value=draft.trim();
  if(!value||value===task.name){editingValue.current='';setEditing('');return}
  submitting.current=true;
  try{if(await onSave([{...task,name:value}],'')){editingValue.current='';setEditing('')}}finally{submitting.current=false}
 }
 function edit(task:Task){editingValue.current=task.id;setEditing(task.id);setDraft(task.name)}
 function cancel(){editingValue.current='';setEditing('')}
 const row=(task:Task)=><article className={'task-row'+(task.done?' task-done':'')} key={task.id}>
 <label className="task-checkbox"><input type="checkbox" aria-label={`${task.name} ${task.done?'완료 취소':'완료'}`} checked={task.done} disabled={busy} onChange={e=>onSave([{...task,done:e.target.checked,completedAt:e.target.checked?new Date().toISOString():''}],'')}/><span className="sr-only">{task.name}</span></label>
 {editing===task.id?<div className="task-edit"><input aria-label="할 일 수정" autoFocus maxLength={300} value={draft} onFocus={e=>e.target.select()} onChange={e=>setDraft(e.target.value)} onBlur={()=>finish(task)} onKeyDown={e=>{if(e.nativeEvent.isComposing)return;if(e.key==='Enter'){e.preventDefault();finish(task)}if(e.key==='Escape'){e.preventDefault();cancel()}}}/><button className="icon-btn" aria-label="수정 저장" disabled={busy||!draft.trim()} onMouseDown={e=>e.preventDefault()} onClick={()=>finish(task)}><Check size={14}/></button><button className="icon-btn" aria-label="수정 취소" onMouseDown={e=>e.preventDefault()} onClick={cancel}><X size={14}/></button></div>:<button className="task-title" aria-label={`${task.name} 수정`} title="클릭하여 수정" disabled={busy} onClick={()=>edit(task)}>{task.name}</button>}
 <button className="icon-btn delete-action" aria-label={`${task.name} 삭제`} disabled={busy} onMouseDown={e=>e.preventDefault()} onClick={async()=>{if(await onDelete(task)){setDeleted(task);if(editing===task.id)cancel()}}}><Trash2 size={14}/></button>
 </article>;
 return <section className="tasks-section" aria-label="할 일 목록">
 <form className="task-entry" onSubmit={async e=>{e.preventDefault();if(!name.trim()||busy||submitting.current)return;submitting.current=true;const value=name.trim();try{if(await onSave([{id:crypto.randomUUID(),kind:'task',done:false,name:value}],'')){setName('');input.current?.focus({preventScroll:true})}}finally{submitting.current=false}}}>
 <input ref={input} aria-label="할 일" placeholder="할 일 입력 후 Enter" required readOnly={busy} maxLength={300} value={name} onChange={e=>setName(e.target.value)}/>
 <button className="btn primary" disabled={busy||!name.trim()}><Plus size={15}/>추가</button>
 </form>
 <div className="task-status"><span aria-live="polite">할 일 {active.length}</span><span>내용을 누르면 수정</span></div>
 <div className="task-list">{active.map(row)}</div>
 {!active.length&&<p className="dashboard-empty">{query?'검색 결과 없음':completed.length?'할 일을 모두 마쳤습니다':'할 일을 추가해 주세요'}</p>}
 {!!completed.length&&<details className="task-completed"><summary><ChevronRight size={14}/>완료 <span>{completed.length}</span></summary><div className="task-list">{completed.map(row)}</div></details>}
 {deleted&&<div className="task-undo" role="status"><span>삭제했습니다.</span><button className="compact-action" disabled={busy} onClick={async()=>{if(await onSave([deleted],''))setDeleted(null)}}><Undo2 size={13}/>되돌리기</button><button className="icon-btn" aria-label="안내 닫기" onClick={()=>setDeleted(null)}><X size={14}/></button></div>}
 </section>
}
