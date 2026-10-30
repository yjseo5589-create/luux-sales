import {useEffect,useState} from 'react';
import {Cloud,LoaderCircle} from 'lucide-react';
import {getSyncState,subscribeSync,signIn,signOut} from './sync-state';

const labels={connecting:'연결 중',live:'실시간 연동',offline:'오프라인',error:'연동 오류'} as const;

export default function SyncButton(){
 const [s,setS]=useState(getSyncState());
 useEffect(()=>subscribeSync(setS),[]);
 if(s.status==='loading')return null;
 if(s.status==='signed-out')return <button className="compact-action sync-action" title="Google로 로그인하면 PC·휴대폰이 실시간으로 맞춰집니다" onClick={()=>signIn()}><Cloud/>기기 연동</button>;
 const title=s.status==='offline'?'인터넷이 연결되면 자동으로 맞춰집니다':s.status==='error'?s.message||'':s.email||'';
 function click(){
  if(s.status==='error'&&!s.email){signIn();return}
  if(confirm(`${s.email||''}\n\n로그아웃할까요? 이 기기의 데이터는 남지만 다른 기기와의 실시간 연동이 멈춥니다.`))signOut();
 }
 return <button className={'compact-action sync-action sync-'+s.status} title={title} onClick={click}>{s.status==='connecting'?<LoaderCircle className="spin"/>:<i className="sync-dot" aria-hidden="true"/>}{labels[s.status]}</button>;
}
