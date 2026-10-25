import {createClient} from '@supabase/supabase-js';

const url=import.meta.env.VITE_SUPABASE_URL;
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase=url&&key?createClient(url,key,{auth:{flowType:'pkce',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;

export async function recordsRequest(path:string,options:RequestInit={}):Promise<Response>{
 if(!supabase)return Response.json({error:'서버 연결이 필요합니다.'},{status:503});
 const {data:{session},error:sessionError}=await supabase.auth.getSession();
 if(sessionError||!session)return Response.json({error:'다시 로그인해 주세요.'},{status:401});
 try{
  if(options.method==='POST'){
   const {items}=JSON.parse(String(options.body));
   const {error}=await supabase.rpc('luux_save_records',{items});
   if(error)throw error;
   return Response.json({ok:true});
  }
  if(options.method==='DELETE'){
   const id=new URL(path,location.origin).searchParams.get('id');
   const {error}=await supabase.rpc('luux_delete_record',{record_id:id});
   if(error)throw error;
   return Response.json({ok:true});
  }
  const {data,error}=await supabase.from('luux_records').select('data,updated_at').order('updated_at',{ascending:true});
  if(error)throw error;
  return Response.json(data.map(r=>({...r.data,updated:r.updated_at})));
 }catch(e:any){return Response.json({error:e.message||'저장하지 못했습니다.'},{status:400});}
}
