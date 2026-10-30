import {historyContactName} from './history';
import type {ProjectRecord} from './projects';
import {ChevronRight} from 'lucide-react';
type Props={rows:ProjectRecord[];companies:ProjectRecord[];query:string;onLog:(r:ProjectRecord)=>void;onBack:()=>void};
export default function ActivityPage({rows,companies,query,onLog,onBack}:Props){
 const company=(r:ProjectRecord)=>companies.find(c=>c.id===r.customer)?.name||'거래처 미지정';
 const visible=rows.filter(r=>[company(r),historyContactName(r,companies),r.note,r.channel].join(' ').toLowerCase().includes(query.trim().toLowerCase()));
 return <section className="activity-section" aria-label="전체 활동 내역"><div className="list-toolbar"><button className="compact-action" onClick={onBack}>대시보드로</button><span className="muted small">{visible.length}건</span></div><div className="activity-columns" aria-hidden="true"><span>날짜</span><span>거래처 · 담당자</span><span>연락 내용</span><span/></div>{visible.map(log=><button className="activity-row" key={log.id} onClick={()=>onLog(log)}><span className="activity-date">{log.date?.replaceAll('-','.')||'날짜 미기록'}</span><span className="activity-person"><b>{company(log)}</b><small>{historyContactName(log,companies)} · {log.channel||'연락'}</small></span><span className="activity-content">{log.note}</span><ChevronRight size={14}/></button>)}{!visible.length&&<p className="dashboard-empty">{query?'검색 결과 없음':'기록 없음'}</p>}</section>
}
