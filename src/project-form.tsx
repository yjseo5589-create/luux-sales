import {ChevronDown} from 'lucide-react';
import {projectRoles,projectStages,projectStage,advertiserName,companyContacts,type ProjectRecord} from './projects';
type Props={value:ProjectRecord;companies:ProjectRecord[];onChange:(r:ProjectRecord)=>void};
export default function ProjectForm({value,companies,onChange}:Props){
 const companyField=(role:typeof projectRoles[number])=><label>{role.label}{role.required?' *':''}<span className="select-control"><select aria-label={role.label} required={role.required} value={value[role.key]||''} onChange={e=>onChange({...value,[role.key]:e.target.value,[role.contactKey]:''})}><option value="">{role.required?'거래처 선택':'없음'}</option>{[role.label,...['광고주','대행사','렙사','기타'].filter(t=>t!==role.label)].map(t=>{const group=companies.filter(c=>(c.type||'기타')===t);return !!group.length&&<optgroup key={t} label={t}>{group.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</optgroup>})}</select><ChevronDown size={16} aria-hidden="true"/></span></label>;
 const contactField=(role:typeof projectRoles[number])=>{
  const company=companies.find(c=>c.id===value[role.key]);
  const owners=company?[company]:[...companies.filter(c=>c.type===role.label),...companies.filter(c=>c.type!==role.label)];
  const groups=owners.map(owner=>({owner,people:companyContacts(owner).filter((p:any)=>[p.contact,p.position,p.department,p.phone,p.officePhone,p.email].some((v:any)=>typeof v==='string'&&v.trim()))})).filter(g=>g.people.length);
  const choices=groups.flatMap(g=>g.people.map((person:any)=>({owner:g.owner,person,key:JSON.stringify([g.owner.id,person.id])})));
  return <label>{role.label} 담당자<span className="select-control"><select aria-label={role.label+' 담당자'} disabled={!choices.length} value={value[role.contactKey]?JSON.stringify([value[role.key],value[role.contactKey]]):''} onChange={e=>{const selected=choices.find(p=>p.key===e.target.value);onChange({...value,[role.key]:selected?.owner.id||value[role.key]||'',[role.contactKey]:selected?.person.id||''})}}><option value="">{choices.length?'담당자 선택':'등록된 담당자 없음'}</option>{groups.map(({owner,people})=><optgroup key={owner.id} label={owner.name}>{people.map((person:any,i:number)=><option key={person.id} value={JSON.stringify([owner.id,person.id])}>{[person.contact||`담당자 ${i+1}`,person.department,person.position].filter(Boolean).join(' · ')}</option>)}</optgroup>)}</select><ChevronDown size={16} aria-hidden="true"/></span></label>;
 };
 return <>
  <div className="form-grid"><label>프로젝트명 *<input data-autofocus required value={value.name||''} placeholder="프로젝트명" onChange={e=>onChange({...value,name:e.target.value})}/></label>
  <label>진행 단계<span className="select-control"><select value={projectStage(value)} onChange={e=>onChange({...value,stage:e.target.value,result:''})}>{projectStages.map(s=><option key={s}>{s}</option>)}</select><ChevronDown size={16} aria-hidden="true"/></span></label></div>
  <div className="form-grid">{projectRoles.slice(1).map(role=><div className="project-party-editor" key={role.key}>{companyField(role)}{contactField(role)}</div>)}</div>
  <label>광고주·브랜드<input list="project-advertisers" value={advertiserName(value,companies)} placeholder="확인된 광고주 또는 브랜드명" onChange={e=>{const linked=companies.find(c=>c.name===e.target.value);onChange({...value,advertiserName:e.target.value,customer:linked?.id||'',advertiserContactId:linked?.id===value.customer?value.advertiserContactId:''})}}/></label><datalist id="project-advertisers">{companies.filter(c=>c.type==='광고주').map(c=><option key={c.id} value={c.name}/>)}</datalist>
  <label>캠페인 메모<textarea value={value.note||''} placeholder="미팅에서 확인한 캠페인 정보·제안 방향" onChange={e=>onChange({...value,note:e.target.value})}/></label>
 </>;
}
