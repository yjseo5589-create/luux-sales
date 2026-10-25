import {ChevronDown} from 'lucide-react';
import {companyContacts,projectRoles,projectStages,projectResults,projectStage,projectResult,type ProjectRecord} from './projects';
type Props={value:ProjectRecord;companies:ProjectRecord[];onChange:(r:ProjectRecord)=>void};
export default function ProjectForm({value,companies,onChange}:Props){
 const companyField=(role:typeof projectRoles[number])=><label>{role.label}{role.required?' *':''}<span className="select-control"><select aria-label={role.label} required={role.required} value={value[role.key]||''} onChange={e=>onChange({...value,[role.key]:e.target.value,[role.contactKey]:''})}><option value="">{role.required?'거래처 선택':'없음'}</option>{[role.label,...['광고주','대행사','렙사','기타'].filter(t=>t!==role.label)].map(t=>{const group=companies.filter(c=>(c.type||'기타')===t);return !!group.length&&<optgroup key={t} label={t}>{group.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</optgroup>})}</select><ChevronDown size={16} aria-hidden="true"/></span></label>;
 const contactField=(role:typeof projectRoles[number])=>{const company=companies.find(c=>c.id===value[role.key]);const people=companyContacts(company).filter((p:any)=>[p.contact,p.phone,p.officePhone,p.email].some(Boolean));return <label>{role.label} 담당자<span className="select-control"><select aria-label={role.label+' 담당자'} value={value[role.contactKey]||''} disabled={!company||!people.length} onChange={e=>onChange({...value,[role.contactKey]:e.target.value})}><option value="">선택 안 함</option>{people.map((p:any,i:number)=><option value={p.id} key={p.id}>{[p.contact||`담당자 ${i+1}`,p.department,p.position].filter(Boolean).join(' · ')}</option>)}</select><ChevronDown size={16} aria-hidden="true"/></span></label>};
 return <>
  <label>프로젝트명 *<input autoFocus required value={value.name||''} placeholder="프로젝트명" onChange={e=>onChange({...value,name:e.target.value})}/></label>
  <div className="form-grid">{companyField(projectRoles[0])}<label>진행 단계<span className="select-control"><select value={projectStage(value)} onChange={e=>onChange({...value,stage:e.target.value})}>{projectStages.map(s=><option key={s}>{s}</option>)}</select><ChevronDown size={16} aria-hidden="true"/></span></label></div>
  <div className="project-options">
   <details className="project-option"><summary>거래처·담당자<ChevronDown size={14} aria-hidden="true"/></summary><div className="project-option-fields">
    {contactField(projectRoles[0])}
    {projectRoles.slice(1).map(role=><div className="form-grid" key={role.key}>{companyField(role)}{contactField(role)}</div>)}
   </div></details>
   <details className="project-option"><summary>후속 업무<ChevronDown size={14} aria-hidden="true"/></summary><div className="project-option-fields form-grid"><label>후속 업무<input value={value.next||''} placeholder="예: 수정 견적서 전달" onChange={e=>onChange({...value,next:e.target.value})}/></label><label>업무 기한<span className="date-control"><input type="date" value={value.due||''} onInput={e=>onChange({...value,due:e.currentTarget.value})}/></span></label></div></details>
   <details className="project-option"><summary>제안·집행·결과<ChevronDown size={14} aria-hidden="true"/></summary><div className="project-option-fields">
    <div className="form-grid"><label>제안일<span className="date-control"><input type="date" value={value.proposalDate||''} onInput={e=>onChange({...value,proposalDate:e.currentTarget.value})}/></span></label><label>제안 금액 (원)<input type="number" min="0" step="1" inputMode="numeric" value={value.quotedAmount||''} onChange={e=>onChange({...value,quotedAmount:e.target.value})}/></label></div>
    <label>제안 내용<textarea value={value.note||''} onChange={e=>onChange({...value,note:e.target.value})}/></label>
    <div className="form-grid"><label>집행 시작일<span className="date-control"><input type="date" value={value.start||''} onInput={e=>onChange({...value,start:e.currentTarget.value})}/></span></label><label>집행 종료일<span className="date-control"><input type="date" min={value.start||undefined} value={value.end||''} onInput={e=>onChange({...value,end:e.currentTarget.value})}/></span></label></div>
    <div className="form-grid"><label>결과<span className="select-control"><select value={projectResult(value)} onChange={e=>onChange({...value,result:e.target.value})}>{projectResults.map(s=><option key={s}>{s}</option>)}</select><ChevronDown size={16} aria-hidden="true"/></span></label><label>확정 금액 (원)<input type="number" min="0" step="1" inputMode="numeric" value={value.wonAmount||value.amount||''} onChange={e=>onChange({...value,wonAmount:e.target.value,amount:e.target.value})}/></label></div>
    <label>결과 사유<textarea value={value.resultReason||''} onChange={e=>onChange({...value,resultReason:e.target.value})}/></label>
   </div></details>
  </div>
 </>;
}
