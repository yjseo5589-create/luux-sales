import {useState} from 'react';
import {ArrowUpRight} from 'lucide-react';
import {filterResources,resourceCategories} from './resources';
export default function ResourcesPage({query}:{query:string}){
 const [category,setCategory]=useState('전체');
 const visible=filterResources(query,category);
 return <section className="resources-section" aria-label="업무 자료 목록"><div className="list-toolbar"><div className="tabs inline">{resourceCategories.map(c=><button key={c} className={category===c?'active':''} aria-pressed={category===c} onClick={()=>setCategory(c)}>{c}</button>)}</div><div className="list-result"><span className="muted small" aria-live="polite">{visible.length}개</span></div></div><div className="resource-columns" aria-hidden="true"><span>자료명</span><span/></div><div>{visible.map(r=><a className="resource-row" key={r.id} href={r.url} target="_blank" rel="noreferrer" aria-label={`${r.title} 원본 열기`} title={r.note||r.purpose}><span className="resource-title"><b>{r.title}</b></span><ArrowUpRight size={14} aria-hidden="true"/></a>)}</div>{!visible.length&&<div className="empty"><h3>조건에 맞는 자료 없음</h3></div>}</section>;
}
