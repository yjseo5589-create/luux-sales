import {useEffect,useRef,useState,type PointerEvent} from 'react';
import {menuItems,moveMenu,NAVIGATION_KEY,normalizeMenuOrder} from './navigation-order';
type Props={page:string;onNavigate:(id:string)=>void};
type Drag={id:string;startX:number;startY:number;active:boolean;target:string;after:boolean};
const loadOrder=()=>{try{return normalizeMenuOrder(JSON.parse(localStorage.getItem(NAVIGATION_KEY)||'null'))}catch{return normalizeMenuOrder(null)}};
export default function Navigation({page,onNavigate}:Props){
 const [order,setOrder]=useState(loadOrder),[dragging,setDragging]=useState(''),[drop,setDrop]=useState<{id:string;after:boolean}|null>(null),[announcement,setAnnouncement]=useState('');
 const nav=useRef<HTMLElement>(null),drag=useRef<Drag|null>(null),ignoreClickUntil=useRef(0);
 useEffect(()=>{const listener=(event:StorageEvent)=>{if(event.key===NAVIGATION_KEY)setOrder(loadOrder())};window.addEventListener('storage',listener);return()=>window.removeEventListener('storage',listener)},[]);
 function persist(next:string[],id:string){
  if(next.join()===order.join())return;
  setOrder(next);
  const label=menuItems.find(item=>item.id===id)?.label||'';
  try{localStorage.setItem(NAVIGATION_KEY,JSON.stringify(next));setAnnouncement(`${label}, ${next.indexOf(id)+2}번째 메뉴로 이동했습니다.`)}catch{setAnnouncement('메뉴 순서를 저장하지 못했습니다.')}
 }
 function start(event:PointerEvent<HTMLButtonElement>,id:string){
  if(event.button!==0||event.isPrimary===false)return;
  drag.current={id,startX:event.clientX,startY:event.clientY,active:false,target:'',after:false};
  event.currentTarget.setPointerCapture(event.pointerId);
 }
 function move(event:PointerEvent<HTMLButtonElement>){
  const current=drag.current;if(!current)return;
  if(!current.active&&Math.hypot(event.clientX-current.startX,event.clientY-current.startY)<6)return;
  current.active=true;setDragging(current.id);event.preventDefault();
  const target=document.elementFromPoint(event.clientX,event.clientY)?.closest<HTMLButtonElement>('[data-nav-id]');
  if(!target||!nav.current?.contains(target)||target.dataset.navId===current.id){current.target='';setDrop(null);return}
  const rect=target.getBoundingClientRect();
  current.target=target.dataset.navId!;current.after=event.clientX>=rect.left+rect.width/2;
  setDrop({id:current.target,after:current.after});
 }
 function end(event:PointerEvent<HTMLButtonElement>,cancel=false){
  const current=drag.current;if(!current)return;
  drag.current=null;setDragging('');setDrop(null);
  if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
  if(current.active){ignoreClickUntil.current=Date.now()+300;if(!cancel&&current.target)persist(moveMenu(order,current.id,current.target,current.after),current.id)}
 }
 return <nav ref={nav} aria-label="주 메뉴" className={dragging?'navigation-dragging':''}>
 <button className={page==='dashboard'?'nav active':'nav'} aria-current={page==='dashboard'?'page':undefined} onClick={()=>onNavigate('dashboard')}>대시보드</button>
 {order.map(id=>{const item=menuItems.find(item=>item.id===id)!;return <button key={id} data-nav-id={id} className={'nav nav-reorder'+(page===id?' active':'')+(dragging===id?' nav-dragging':'')+(drop?.id===id?(drop.after?' nav-drop-after':' nav-drop-before'):'')} aria-current={page===id?'page':undefined} aria-describedby="navigation-reorder-help" title="드래그하여 순서 변경" onPointerDown={event=>start(event,id)} onPointerMove={move} onPointerUp={event=>end(event)} onPointerCancel={event=>end(event,true)} onLostPointerCapture={()=>{if(drag.current){drag.current=null;setDragging('');setDrop(null)}}} onClick={event=>{if(Date.now()<ignoreClickUntil.current){event.preventDefault();return}onNavigate(id)}} onKeyDown={event=>{
  if(event.key==='Escape'&&drag.current){drag.current=null;setDragging('');setDrop(null);ignoreClickUntil.current=Date.now()+300;return}
  if(!event.altKey||!['ArrowLeft','ArrowRight'].includes(event.key))return;
  event.preventDefault();const index=order.indexOf(id),delta=event.key==='ArrowLeft'?-1:1,target=order[index+delta];
  if(target)persist(moveMenu(order,id,target,delta>0),id);
 }}>{item.label}</button>})}
 <span className="sr-only" id="navigation-reorder-help">메뉴를 드래그해 순서를 바꿀 수 있습니다. 키보드는 Alt와 좌우 방향키를 함께 누르세요. 대시보드는 고정입니다.</span>
 <span className="sr-only" role="status">{announcement}</span>
 </nav>;
}
