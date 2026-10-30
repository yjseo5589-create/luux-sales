import {useRef,useState} from 'react';
import {Plus,Trash2} from 'lucide-react';
type Task={id:string;kind:string;[key:string]:any};
type Props={rows:Task[];query:string;busy:boolean;onSave:(items:Task[],message?:string)=>Promise<boolean>;onDelete:(r:Task)=>Promise<boolean>};
export default function TasksPage({rows,query,busy,onSave,onDelete}:Props){
 const [name,setName]=useState('');
 const input=useRef<HTMLInputElement>(null);
 const tasks=rows.filter(r=>r.kind==='task'&&r.name.toLowerCase().includes(query.trim().toLowerCase())).reverse();
 return <section className="tasks-section" aria-label="할 일 목록">
 <form className="task-entry" onSubmit={async e=>{e.preventDefault();if(!name.trim()||busy)return;if(await onSave([{id:crypto.randomUUID(),kind:'task',done:false,name:name.trim()}],'추가했습니다.')){setName('');requestAnimationFrame(()=>input.current?.focus({preventScroll:true}))}}}>
 <input ref={input} aria-label="할 일" placeholder="할 일 입력" required disabled={busy} maxLength={300} value={name} onChange={e=>setName(e.target.value)}/>
 <button className="btn primary" disabled={busy||!name.trim()}><Plus size={15}/>추가</button>
 </form>
 <div className="task-list">{tasks.map(task=><article className={'task-row'+(task.done?' task-done':'')} key={task.id}>
 <label className="task-check"><input type="checkbox" checked={task.done} disabled={busy} onChange={e=>onSave([{...task,done:e.target.checked,completedAt:e.target.checked?new Date().toISOString():''}],e.target.checked?'완료했습니다.':'완료를 취소했습니다.')}/><span>{task.name}</span></label>
 <button className="icon-btn delete-action" aria-label={`${task.name} 삭제`} disabled={busy} onClick={()=>onDelete(task)}><Trash2 size={14}/></button>
 </article>)}</div>
 {!tasks.length&&<p className="dashboard-empty">{query?'검색 결과 없음':'등록된 할 일 없음'}</p>}
 </section>
}
