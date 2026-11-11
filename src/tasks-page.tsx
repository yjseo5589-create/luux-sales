import {useRef,useState,type PointerEvent,type ClipboardEvent} from 'react';
import {Check,ChevronRight,Plus,Pencil,Trash2,GripVertical,Undo2} from 'lucide-react';
import {groupTasks,taskValidation,reorderTasks,moveTaskToDay,taskDay,setTaskCompletion,type TaskRecord} from './tasks';
type Task=TaskRecord&{name:string;done:boolean};
type Props={onUndo?:()=>void;canUndo?:boolean;rows:TaskRecord[];query:string;busy:boolean;onSave:(items:TaskRecord[],message?:string)=>Promise<boolean>;onDelete:(r:TaskRecord)=>Promise<boolean>};
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const dateLabel=(day:string)=>day?day.replaceAll('-','.'):'';
export default function TasksPage({rows,query,busy,onSave,onDelete,onUndo,canUndo=false}:Props){
 const [name,setName]=useState(''),[selectedDate,setSelectedDate]=useState(today),[draft,setDraft]=useState<Task|null>(null),[error,setError]=useState(''),[dragging,setDragging]=useState(''),[drop,setDrop]=useState<{id:string;after:boolean;day:string}|null>(null),[announcement,setAnnouncement]=useState('');
 const input=useRef<HTMLInputElement>(null),submitting=useRef(false);
 function pasteTask(event:ClipboardEvent<HTMLInputElement>,update:(value:string)=>void){
  const text=event.clipboardData.getData('text/plain');
  if(!text||event.currentTarget.readOnly||event.currentTarget.disabled)return;
  event.preventDefault();
  const field=event.currentTarget,start=field.selectionStart??field.value.length,end=field.selectionEnd??start;
  const inserted=text.replace(/[\r\n]+/g,' ').slice(0,Math.max(0,field.maxLength-(field.value.length-(end-start))));
  // Native insertion keeps the browser's text undo stack while preventing a second default paste.
  if(document.execCommand('insertText',false,inserted))return;
  update(field.value.slice(0,start)+inserted+field.value.slice(end));
  requestAnimationFrame(()=>{if(field.isConnected&&document.activeElement===field)field.setSelectionRange(start+inserted.length,start+inserted.length)});
 }

 const groups=groupTasks(rows,query),tasks=groups.flatMap(g=>g.tasks),active=tasks.filter(t=>!t.done);
 const day=today();
 const drag=useRef<{id:string;x:number;y:number;active:boolean;target:string;after:boolean;day:string}|null>(null);
 async function reorder(source:string,target:string,after:boolean,destination?:string){
  if(busy||draft)return;const task=rows.find(r=>r.id===source);if(!task)return;const crossDay=!!destination&&taskDay(task)!==destination;const updates=crossDay?moveTaskToDay(rows,source,destination!,target,after):reorderTasks(rows,source,target,after);if(!updates.length)return;
  if(await onSave(updates,''))setAnnouncement(crossDay?'업무 날짜를 변경했습니다.':'업무 순서를 변경했습니다.');else setAnnouncement('업무 순서를 저장하지 못했습니다.');
 }
 function startDrag(event:PointerEvent<HTMLButtonElement>,id:string){
  if(busy||draft||event.button!==0||event.isPrimary===false)return;
  drag.current={id,x:event.clientX,y:event.clientY,active:false,target:'',after:false,day:''};event.currentTarget.setPointerCapture(event.pointerId);
 }
 function moveDrag(event:PointerEvent<HTMLButtonElement>){
  const current=drag.current;if(!current)return;
  if(!current.active&&Math.hypot(event.clientX-current.x,event.clientY-current.y)<6)return;
  current.active=true;setDragging(current.id);event.preventDefault();
  const hit=document.elementFromPoint(event.clientX,event.clientY);
  const element=hit?.closest<HTMLElement>('[data-task-id]'),dayElement=hit?.closest<HTMLElement>('[data-task-day]');
  const source=rows.find(r=>r.id===current.id),target=rows.find(r=>r.id===element?.dataset.taskId);
  const destination=dayElement?.dataset.taskDay||'';
  if(!source||!destination||target?.id===source.id||(!target&&taskDay(source)===destination)||(target&&taskDay(source)===destination&&!!source.done!==!!target.done)){
   current.target='';current.day='';setDrop(null);return;
  }
  current.day=destination;current.target=target&&!!source.done===!!target.done?target.id:'';
  current.after=element?event.clientY>=element.getBoundingClientRect().top+element.getBoundingClientRect().height/2:false;
  setDrop({id:current.target,after:current.after,day:destination});

 }
 function endDrag(event:PointerEvent<HTMLButtonElement>,cancel=false){
  const current=drag.current;drag.current=null;setDragging('');setDrop(null);
  if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
  if(current?.active&&!cancel&&current.day)reorder(current.id,current.target,current.after,current.day);
 }

 async function submit(task:TaskRecord,editing=false){if(busy||submitting.current)return;const error=taskValidation(task);if(error){setError(error);return}submitting.current=true;setError('');try{if(await onSave([task])){if(editing)setDraft(null);else{setName('')}}}finally{submitting.current=false}}
 const row=(task:TaskRecord)=><article data-task-id={task.id} className={'task-row'+(task.done?' task-done':'')+(draft?.id===task.id?' task-editing':'')+(dragging===task.id?' task-dragging':'')+(drop?.id===task.id?(drop.after?' task-drop-after':' task-drop-before'):'')} key={task.id}>
 <button type="button" className="icon-btn task-drag-handle" aria-label={`${task.name} 순서 변경`} aria-describedby="task-reorder-help" title="드래그하여 순서 변경" disabled={busy||!!draft} onPointerDown={e=>startDrag(e,task.id)} onPointerMove={moveDrag} onPointerUp={e=>endDrag(e)} onPointerCancel={e=>endDrag(e,true)} onLostPointerCapture={()=>{if(drag.current){drag.current=null;setDragging('');setDrop(null)}}} onKeyDown={e=>{if(e.key==='Escape'){drag.current=null;setDragging('');setDrop(null);return}if(!e.altKey||!['ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();if(e.shiftKey){const index=groups.findIndex(group=>group.day===taskDay(task)),destination=groups[index+(e.key==='ArrowUp'?-1:1)]?.day;if(destination)reorder(task.id,'',false,destination);return}const siblings=groups.find(group=>group.day===taskDay(task))?.tasks.filter(t=>!!t.done===!!task.done)||[],index=siblings.findIndex(t=>t.id===task.id),delta=e.key==='ArrowUp'?-1:1,target=siblings[index+delta];if(target)reorder(task.id,target.id,delta>0)}}><GripVertical size={14}/></button>
 <label className="task-checkbox"><input type="checkbox" aria-label={`${task.name} ${task.done?'완료 취소':'완료'}`} checked={task.done} disabled={busy||draft?.id===task.id} onChange={e=>onSave(setTaskCompletion(rows,task.id,e.target.checked),e.target.checked?'완료했습니다.':'완료를 취소했습니다.')}/><span className="sr-only">{task.name}</span></label>
 {draft?.id===task.id?<form className="task-inline-form" aria-label="업무 수정" onSubmit={e=>{e.preventDefault();submit({...draft,name:draft.name.trim()},true)}} onKeyDown={e=>{if(e.key==='Escape'){setDraft(null);setError('')}}}><input autoFocus required aria-label="업무 수정" maxLength={300} value={draft.name} onPaste={e=>pasteTask(e,value=>setDraft({...draft,name:value}))} onChange={e=>setDraft({...draft,name:e.target.value})}/>{error&&<p className="task-form-error" role="alert">{error}</p>}<div className="task-edit-actions"><button type="button" className="btn" onClick={()=>{setDraft(null);setError('')}}>취소</button><button className="btn primary" disabled={busy||!draft.name.trim()}><Check size={14}/>저장</button></div></form>:<div className="task-content"><span className="task-title">{task.name}</span></div>}
 {draft?.id!==task.id&&<><button className="icon-btn" aria-label={`${task.name} 수정`} disabled={busy} onClick={()=>{setDraft(task as Task);setError('')}}><Pencil size={14}/></button>
 <button className="icon-btn delete-action" aria-label={`${task.name} 삭제`} disabled={busy} onClick={async()=>{if(await onDelete(task))if(draft?.id===task.id)setDraft(null)}}><Trash2 size={14}/></button></>}
 </article>;
 return <section className="tasks-section" aria-label="업무 목록">
 <form className="task-create-form" aria-label="업무 추가" onSubmit={e=>{e.preventDefault();if(name.trim())submit({id:crypto.randomUUID(),kind:'task',done:false,name:name.trim(),taskDate:selectedDate})}}>
 <div className="task-entry"><label className={'task-day-picker'+(drop?.day===selectedDate&&!drop.id?' task-day-drop':'')} data-task-day={selectedDate}><span className="sr-only">날짜</span><input aria-label="날짜" required type="date" value={selectedDate} disabled={busy} onInput={e=>setSelectedDate(e.currentTarget.value)}/></label><input ref={input} aria-label="업무" placeholder="업무 입력" required readOnly={busy} maxLength={300} value={name} onPaste={e=>pasteTask(e,setName)} onChange={e=>setName(e.target.value)}/><button className="btn primary" disabled={busy||!name.trim()}><Plus size={15}/>추가</button></div>
 {error&&!draft&&<p className="task-form-error" role="alert">{error}</p>}
 </form>
 <span className="sr-only" id="task-reorder-help">손잡이를 드래그해 순서를 바꾸거나 다른 날짜에 놓으세요. 새 날짜는 위에서 선택하세요. 키보드는 Alt와 위아래 방향키로 순서, Shift를 함께 누르면 날짜를 변경합니다.</span><span className="sr-only" role="status">{announcement}</span>
 <div className="task-status">{onUndo&&<button type="button" className="compact-action task-undo-action" disabled={busy||!canUndo||!!draft} title="실행 취소 (⌘Z / Ctrl+Z)" onClick={onUndo}><Undo2 size={14}/>실행 취소</button>}<span aria-live="polite">미완료 {active.length} · 완료 {tasks.length-active.length}</span></div>
 {(dragging&&!groups.some(group=>group.day===selectedDate)?[{day:selectedDate,tasks:[]},...groups].sort((a,b)=>b.day.localeCompare(a.day)):groups).map(group=><details data-task-day={group.day} className={'task-day-group'+(drop?.day===group.day&&!drop.id?' task-day-drop':'')} key={group.day||'undated'} open><summary><ChevronRight size={14}/><h2>{group.day?(group.day===day?'오늘 · ':'')+dateLabel(group.day):'날짜 미지정'}</h2><span>{group.tasks.filter(t=>t.done).length}/{group.tasks.length}</span></summary><div className="task-list">{group.tasks.map(row)}{!group.tasks.length&&<p className="task-drop-placeholder">여기에 놓아 날짜 변경</p>}</div></details>)}
 {!tasks.length&&<p className="dashboard-empty">{query?'검색 결과 없음':'업무를 추가해 주세요'}</p>}

 </section>
}
