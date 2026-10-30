import {ArrowUpRight,ChevronRight} from 'lucide-react';
import {dashboardData} from './dashboard-data';
import {historyContactName} from './history';
import {projectStage,projectDisplayRoles,advertiserName,type ProjectRecord} from './projects';
export type DashboardScope='followups'|'won'|'lost';
type Props={rows:ProjectRecord[];today:string;onProject:(id:string)=>void;onLog:(r:ProjectRecord)=>void;onStage:(stage:string)=>void;onProjects:(kind:DashboardScope,label:string)=>void;onActivities:()=>void};
export default function Dashboard({rows,today,onProject,onLog,onStage,onProjects,onActivities}:Props){
 const data=dashboardData(rows,today);
 const company=(id:string)=>rows.find(r=>r.kind==='customer'&&r.id===id)?.name||'거래처 미지정';
 const parties=(p:ProjectRecord)=>[...projectDisplayRoles.slice(0,2).filter(r=>p[r.key]).map(r=>company(p[r.key])),advertiserName(p,rows)].filter(Boolean).join(' · ');
 const metric=(label:string,projects:ProjectRecord[],scope:string,action:()=>void)=><button className="dashboard-metric" key={label} aria-label={`${scope} ${projects.length}건 보기`} onClick={action}><span>{label}<ArrowUpRight size={14}/></span><strong>{projects.length}<small>건</small></strong></button>;
 return <div className="dashboard">
   <section className="dashboard-pipeline" aria-label="진행 현황"><div className="dashboard-section-heading"><h2>진행 현황</h2></div><div className="dashboard-metrics">{data.pipeline.map(p=>metric(p.stage,p.projects,p.stage,()=>onStage(p.stage)))}</div></section>
   <section className="dashboard-outcome" aria-label="전체 수주 현황"><div className="dashboard-section-heading"><h2 title="전체 프로젝트의 현재 단계 기준입니다. 수주는 집행 중·완료를 포함합니다.">수주 현황</h2></div><div className="dashboard-metrics">{metric('수주',data.won,'전체 수주',()=>onProjects('won','전체 수주'))}{metric('미수주',data.lost,'전체 미수주',()=>onProjects('lost','전체 미수주'))}</div></section>
   <section className="dashboard-followups" aria-label="연락 확인 필요"><div className="dashboard-section-heading"><h2 title="제안 완료·협의 중 프로젝트 중 마지막 연락이 14일 이상 지났거나 연락일을 확인할 수 없는 건입니다.">연락 확인 필요 <small>{data.followups.length}</small></h2>{data.followups.length>5&&<button className="compact-action" onClick={()=>onProjects('followups','연락 확인 필요')}>전체 보기<ArrowUpRight size={13}/></button>}</div><div className="dashboard-list">{data.followups.slice(0,5).map(({project,reason})=><button className="dashboard-followup" key={project.id} onClick={()=>onProject(project.id)}><span className="dashboard-row-heading"><b>{project.name}</b><small>{projectStage(project)}</small></span>{parties(project)&&<span className="dashboard-parties">{parties(project)}</span>}<span className="dashboard-row-meta">{reason}<ChevronRight size={14}/></span></button>)}{!data.followups.length&&<p className="dashboard-empty">확인할 항목 없음</p>}</div></section>
   <section className="dashboard-recent" aria-label="최근 활동"><div className="dashboard-section-heading"><h2>최근 활동</h2>{data.activities.length>=4&&<button className="compact-action" onClick={onActivities}>더보기<ArrowUpRight size={13}/></button>}</div><div className="dashboard-list">{data.recent.map(log=><button className="dashboard-activity" key={log.id} onClick={()=>onLog(log)}><span className="dashboard-row-heading"><b>{company(log.customer)}</b><small>{log.date?.replaceAll('-','.')||'날짜 미기록'}</small></span><span className="dashboard-parties">{historyContactName(log,rows)} · {log.channel||'연락'}</span><span className="dashboard-activity-note">{log.note}</span></button>)}{!data.recent.length&&<p className="dashboard-empty">기록 없음</p>}</div></section>
 </div>;
}
