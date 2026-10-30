// 실시간 연동 상태. Firebase 코드는 cloud-sync.ts에 두고 앱이 뜬 뒤에 불러와 첫 화면을 가볍게 유지한다.
export type SyncStatus='loading'|'signed-out'|'connecting'|'live'|'offline'|'error';
export type SyncState={status:SyncStatus;email?:string;message?:string};

let state:SyncState={status:'loading'};
const listeners=new Set<(s:SyncState)=>void>();
export const getSyncState=()=>state;
export function setSyncState(next:SyncState){state=next;for(const f of listeners)f(state)}
export function subscribeSync(f:(s:SyncState)=>void){listeners.add(f);return()=>{listeners.delete(f)}}

export const REMOTE_EVENT='luux-records-remote';
type CloudModule=typeof import('./cloud-sync');
let cloud:Promise<CloudModule>|null=null;
let loaded:CloudModule|null=null;
export function startSync(){
 cloud??=import('./cloud-sync').then(m=>{loaded=m;m.startCloudSync();return m}).catch(e=>{setSyncState({status:'error',message:'연동 기능을 불러오지 못했습니다.'});throw e});
 return cloud;
}
// 팝업은 클릭 직후 바로 열어야 차단되지 않으므로 이미 불러온 모듈을 동기로 호출한다.
export function signIn(){if(loaded)return loaded.signInCloud();return startSync().then(m=>m.signInCloud())}
export function signOut(){return startSync().then(m=>m.signOutCloud())}
