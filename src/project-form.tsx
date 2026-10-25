import {ChevronDown} from 'lucide-react';
import {projectRoles,projectStages,projectStage,projectResults,projectResult,type ProjectRecord} from './projects';
type Props={value:ProjectRecord;companies:ProjectRecord[];onChange:(r:ProjectRecord)=>void};
export default function ProjectForm({value,companies,onChange}:Props){
 const companyField=(role:typeof projectRoles[number])=><label>{role.label}{role.required?' *':''}<span className="select-control"><select aria-label={role.label} required={role.required} value={value[role.key]||''} onChange={e=>onChange({...value,[role.key]:e.target.value,[role.contactKey]:''})}><option value="">{role.required?'거래처 선택':'없음'}</option>{[role.label,...['광고주','대행사','렙사','기타'].filter(t=>t!==role.label)].map(t=>{const group=companies.filter(c=>(c.type||'기타')===t);return !!group.length&&<optgroup key={t} label={t}>{group.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</optgroup>})}</select><ChevronDown size={16} aria-hidden="true"/></span></label>;
 return <>
  <div className="form-grid"><label>프로젝트명 *<input autoFocus required value={value.name||''} placeholder="프로젝트명" onChange={e=>onChange({...value,name:e.target.value})}/></label>
  <label>진행 단계<span className="select-control"><select value={projectStage(value)} onChange={e=>onChange({...value,stage:e.target.value})}>{projectStages.map(s=><option key={s}>{s}</option>)}</select><ChevronDown size={16} aria-hidden="true"/></span></label></div>
  <div className="form-grid project-parties">{projectRoles.map(role=><div key={role.key}>{companyField(role)}</div>)}</div>
  {['결과 확정','집행 중','완료'].includes(projectStage(value))&&<label>결과<span className="select-control"><select value={projectResult(value)} onChange={e=>onChange({...value,result:e.target.value})}>{projectResults.map(s=><option key={s}>{s}</option>)}</select><ChevronDown size={16} aria-hidden="true"/></span></label>}
  <label>메모<textarea value={value.note||''} placeholder="필요한 내용만 간단히" onChange={e=>onChange({...value,note:e.target.value})}/></label>
 </>;
}
