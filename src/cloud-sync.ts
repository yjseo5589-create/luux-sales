// Google 로그인 사용자의 기록을 Firestore users/{uid}/items에 두고 모든 기기에서 실시간으로 맞춘다.
// 이 브라우저의 localStorage는 그대로 화면 데이터와 오프라인 사본으로 쓴다.
import {app} from './firebase-app';
import {getAuth,GoogleAuthProvider,onAuthStateChanged,signInWithPopup,signInWithRedirect,getRedirectResult,signOut,type User} from 'firebase/auth';
import {initializeFirestore,persistentLocalCache,persistentMultipleTabManager,collection,doc,getDoc,getDocsFromServer,onSnapshot,writeBatch,serverTimestamp,type Unsubscribe} from 'firebase/firestore';
import {onRecordsChanged,readRecords,replaceRecords,isUntouchedDefault} from './records';
import {setSyncState,REMOTE_EVENT} from './sync-state';

type Row={id:string;kind:string;updated?:string;contacts?:any[];[key:string]:any};

const auth=getAuth(app);
const db=initializeFirestore(app,{localCache:persistentLocalCache({tabManager:persistentMultipleTabManager()})});

let user:User|null=null,ready=false,stopSnapshot:Unsubscribe|null=null,serverSeen=false;
let pending:{upserts:Row[];deletes:string[]}={upserts:[],deletes:[]};

const recordsOf=(uid:string)=>collection(db,'users',uid,'items');
const packed=(r:Row)=>({kind:r.kind,updated:r.updated||'',json:JSON.stringify(r),savedAt:serverTimestamp()});
const mergedKey=(uid:string)=>'luux-sales-cloud-items-merged:'+uid;

async function commit(uid:string,upserts:Row[],deletes:string[]){
 const ops=[...upserts.map(r=>({r})),...deletes.map(id=>({id}))];
 for(let i=0;i<ops.length;i+=400){
  const batch=writeBatch(db);
  for(const op of ops.slice(i,i+400)){
   if('r' in op)batch.set(doc(recordsOf(uid),op.r.id),packed(op.r));
   else batch.delete(doc(recordsOf(uid),op.id));
  }
  await batch.commit();
 }
}

// 같은 회사를 두 기기에서 따로 고쳤을 때 담당자가 사라지지 않도록 담당자는 합친다.
function mergeRow(local:Row,remote:Row):Row{
 const newer=(local.updated||'')>(remote.updated||'')?local:remote;
 if(local.kind!=='customer'||!local.contacts||!remote.contacts)return newer;
 const older=newer===local?remote:local;
 const people=new Map<string,any>(older.contacts!.map(p=>[p.id,p]));
 for(const p of newer.contacts!)people.set(p.id,p);
 return {...newer,contacts:[...people.values()]};
}

// 이 기기에서 처음 로그인할 때 한 번만, 기기에 있던 기록을 클라우드에 합친다.
async function mergeThisDevice(uid:string){
 if(localStorage.getItem(mergedKey(uid))==='1')return;
 const meta=doc(db,'users',uid,'meta','items');
 const [snap,metaSnap]=await Promise.all([getDocsFromServer(recordsOf(uid)),getDoc(meta)]);
 const cloud=new Map<string,Row>(snap.docs.map(d=>{const r=JSON.parse(d.data().json);return [r.id,r]}));
 const initialized=metaSnap.exists();
 const uploads:Row[]=[];
 for(const row of readRecords() as Row[]){
  const remote=cloud.get(row.id);
  if(!remote){if(!(initialized&&isUntouchedDefault(row)))uploads.push(row);continue;}
  const merged=mergeRow(row,remote);
  if(JSON.stringify(merged)!==JSON.stringify(remote))uploads.push(merged);
 }
 await commit(uid,uploads,[]);
 if(!initialized){const batch=writeBatch(db);batch.set(meta,{initialized:true,createdAt:serverTimestamp()});await batch.commit();}
 localStorage.setItem(mergedKey(uid),'1');
}

function applySnapshot(rows:Row[]){
 // 화면 순서는 기존 순서를 유지하고 새 기록만 뒤에 붙인다.
 let current:Row[]=[];try{current=readRecords() as Row[]}catch{}
 const byId=new Map(rows.map(r=>[r.id,r]));
 const next=[...current.filter(r=>byId.has(r.id)).map(r=>byId.get(r.id)!),...rows.filter(r=>!current.some(c=>c.id===r.id))];
 if(JSON.stringify(next)===JSON.stringify(current))return;
 replaceRecords(next);
 window.dispatchEvent(new Event(REMOTE_EVENT));
}

function liveStatus(){
 if(!user)return;
 setSyncState({status:navigator.onLine?(serverSeen?'live':'connecting'):'offline',email:user.email||''});
}

async function attach(u:User){
 user=u;ready=false;serverSeen=false;liveStatus();
 try{
  await mergeThisDevice(u.uid);
  ready=true;
  const queued=pending;pending={upserts:[],deletes:[]};
  if(queued.upserts.length||queued.deletes.length)await commit(u.uid,queued.upserts,queued.deletes);
  stopSnapshot=onSnapshot(recordsOf(u.uid),{includeMetadataChanges:true},snap=>{
   // 서버 응답 전 빈 캐시로 이 기기 기록을 지우지 않도록 첫 서버 스냅샷부터 반영한다.
   if(!snap.metadata.fromCache)serverSeen=true;
   if(serverSeen)applySnapshot(snap.docs.map(d=>JSON.parse(d.data().json)));
   liveStatus();
  },e=>setSyncState({status:'error',email:u.email||'',message:e.message}));
 }catch(e:any){
  setSyncState({status:'error',email:u.email||'',message:navigator.onLine?e.message:'인터넷 연결 후 다시 시도합니다.'});
 }
}

function detach(){stopSnapshot?.();stopSnapshot=null;user=null;ready=false;serverSeen=false;pending={upserts:[],deletes:[]};}

export function startCloudSync(){
 onRecordsChanged(change=>{
  if(!user)return;
  const upserts=change.upserts as Row[],deletes=change.deletes;
  if(!ready){pending.upserts.push(...upserts);pending.deletes.push(...deletes);return;}
  // 오프라인이면 Firestore가 기기에 쌓아 두었다가 연결되면 보낸다.
  commit(user.uid,upserts,deletes).catch(e=>setSyncState({status:'error',email:user?.email||'',message:e.message}));
 });
 for(const type of ['online','offline'])window.addEventListener(type,liveStatus);
 getRedirectResult(auth).catch(e=>setSyncState({status:'error',message:e.message}));
 onAuthStateChanged(auth,u=>{
  detach();
  if(u)attach(u);else setSyncState({status:'signed-out'});
 });
}

export async function signInCloud(){
 const provider=new GoogleAuthProvider();
 provider.setCustomParameters({prompt:'select_account'});
 try{await signInWithPopup(auth,provider)}
 catch(e:any){
  // github.io와 로그인 도메인이 달라 리디렉션 로그인은 최신 브라우저에서 완료되지 않으므로 팝업 허용을 안내한다.
  if(e.code==='auth/popup-blocked'){setSyncState({status:'error',message:'팝업이 차단되었습니다. 이 사이트의 팝업을 허용한 뒤 다시 눌러 주세요.'});return;}
  if(e.code==='auth/operation-not-supported-in-this-environment')return signInWithRedirect(auth,provider);
  if(e.code==='auth/popup-closed-by-user'||e.code==='auth/cancelled-popup-request')return;
  setSyncState({status:'error',message:e.message});
 }
}

// 로그아웃한 동안 고친 내용이 다음 로그인 때 다시 합쳐지도록 이 기기의 합치기 기록을 지운다.
export function signOutCloud(){if(user)localStorage.removeItem(mergedKey(user.uid));return signOut(auth)}
