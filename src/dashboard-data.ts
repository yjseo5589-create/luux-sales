import {filterHistory} from './history.ts';
import {projectStage,type ProjectRecord} from './projects.ts';
import {seoulDate,stageEvents} from './project-timeline.ts';
const DAY=86400000;
const validDay=(v:string)=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;
export function dashboardData(rows:ProjectRecord[],today:string,month=today.slice(0,7)){
 const projects=rows.filter(r=>r.kind==='deal');
 const logs=filterHistory(rows).filter(l=>!l.date||l.date<=today);
 const pipeline=['제안 준비','제안 완료','협의 중'].map(stage=>({stage,projects:projects.filter(p=>projectStage(p)===stage&&p.result!=='보류'&&p.stage!=='보류')}));
 const followups=projects.filter(p=>['제안 완료','협의 중'].includes(projectStage(p))&&p.result!=='보류'&&p.stage!=='보류').flatMap(project=>{
  const last=logs.find(l=>l.deal===project.id&&validDay(l.date||''));
  if(!last)return [{project,days:null as number|null,lastContact:'',reason:rows.some(r=>r.kind==='log'&&r.deal===project.id)?'연락일 확인 필요':'연락 기록 없음'}];
  const days=Math.floor((Date.parse(today+'T00:00:00Z')-Date.parse(last.date+'T00:00:00Z'))/DAY);
  return days>=14?[{project,days,lastContact:last.date,reason:`마지막 연락 ${days}일 전`}]:[];
 }).sort((a,b)=>(b.days??-1)-(a.days??-1)||a.project.name.localeCompare(b.project.name,'ko'));
 const outcomes=projects.flatMap(project=>{
  const events=stageEvents(project).filter(e=>['수주','미수주'].includes(e.to)&&seoulDate(e.at).slice(0,7)===month&&seoulDate(e.at)<=today).sort((a,b)=>a.at.localeCompare(b.at));
  const event=events.at(-1);return event?[{project,event}]:[];
 });
 const undated=projects.filter(p=>!stageEvents(p).some(e=>['수주','미수주'].includes(e.to))&&(['수주','미수주'].includes(projectStage(p))||(['집행 중','완료'].includes(projectStage(p))&&['성공','실패','수주','미수주'].includes(p.result))));
 return {month,pipeline,followups,recent:logs.slice(0,5),won:outcomes.filter(o=>o.event.to==='수주').map(o=>o.project),lost:outcomes.filter(o=>o.event.to==='미수주').map(o=>o.project),undated};
}
