begin;

create table if not exists public.luux_allowed_users (
  email text primary key check (email = lower(email))
);
alter table public.luux_allowed_users enable row level security;
revoke all on public.luux_allowed_users from public, anon, authenticated;

-- Replace owner@example.com with your verified login email before running.
insert into public.luux_allowed_users(email) values ('owner@example.com') on conflict do nothing;

create or replace function public.luux_is_allowed() returns boolean
language sql stable security definer set search_path = pg_catalog
as $$ select auth.uid() is not null and exists (
 select 1 from public.luux_allowed_users where email=lower(auth.jwt()->>'email')
) $$;
revoke all on function public.luux_is_allowed() from public;
grant execute on function public.luux_is_allowed() to authenticated;

create table if not exists public.luux_records (
 owner uuid not null references auth.users(id) on delete cascade,
 id text not null check (length(id) between 1 and 100),
 kind text not null check (kind in ('customer','deal','log')),
 data jsonb not null check (jsonb_typeof(data)='object'),
 updated_at timestamptz not null default now(),
 primary key(owner,id)
);
alter table public.luux_records enable row level security;
revoke all on public.luux_records from public,anon,authenticated;
grant select on public.luux_records to authenticated;
drop policy if exists luux_read_own on public.luux_records;
create policy luux_read_own on public.luux_records for select to authenticated
using (owner=(select auth.uid()) and (select public.luux_is_allowed()));

create or replace function public.luux_save_records(items jsonb) returns void
language plpgsql security definer set search_path = pg_catalog
as $$
declare
 item jsonb; peer jsonb; person jsonb; old_record jsonb; company jsonb; linked jsonb;
 user_id uuid:=auth.uid(); field_name text;
begin
 if not public.luux_is_allowed() then raise exception '등록된 계정만 사용할 수 있습니다.'; end if;
 if jsonb_typeof(items) is distinct from 'array' or jsonb_array_length(items)<1 or jsonb_array_length(items)>3000 then raise exception '입력 형식을 확인해 주세요.'; end if;
 if (select count(distinct v->>'id') from jsonb_array_elements(items) v)<>jsonb_array_length(items) then raise exception '중복된 기록입니다.'; end if;
 -- Lock all writes for one user, preserving reference checks during concurrent edits.
 perform pg_advisory_xact_lock(hashtextextended(user_id::text,0));
 for item in select value from jsonb_array_elements(items) loop
  if jsonb_typeof(item)<>'object' or coalesce(length(item->>'id'),0) not between 1 and 100 or coalesce(item->>'kind','') not in ('customer','deal','log') then raise exception '입력 형식을 확인해 주세요.'; end if;
  foreach field_name in array array['id','kind','name','type','contact','contactId','email','phone','officePhone','position','department','note','customer','partner','stage','amount','period','start','end','channel','date','next','due','deal','url'] loop
   if item?field_name and (jsonb_typeof(item->field_name)<>'string' or length(item->>field_name)>10000) then raise exception '입력 형식을 확인해 주세요.'; end if;
  end loop;
  if item?'done' and jsonb_typeof(item->'done')<>'boolean' then raise exception '입력 형식을 확인해 주세요.'; end if;
  if length(btrim(coalesce(case when item->>'kind'='log' then item->>'note' else item->>'name' end,'')))=0 then raise exception '이름 또는 연락 내용을 입력해 주세요.'; end if;
  select data into old_record from public.luux_records where owner=user_id and id=item->>'id';
  if old_record is not null and old_record->>'kind'<>item->>'kind' then raise exception '기록 유형을 바꿀 수 없습니다.'; end if;
  if coalesce(item->>'url','')<>'' and item->>'url'!~* '^https?://' then raise exception '자료 링크를 확인해 주세요.'; end if;
  if item->>'kind'='customer' then
   if item?'contacts' then
    if jsonb_typeof(item->'contacts')<>'array' or jsonb_array_length(item->'contacts') not between 1 and 100 then raise exception '담당자 정보를 확인해 주세요.'; end if;
    if (select count(distinct p->>'id') from jsonb_array_elements(item->'contacts') p)<>jsonb_array_length(item->'contacts') then raise exception '담당자 정보가 중복되었습니다.'; end if;
    for person in select value from jsonb_array_elements(item->'contacts') loop
     if coalesce(length(person->>'id'),0) not between 1 and 100 then raise exception '담당자 ID를 확인해 주세요.'; end if;
     foreach field_name in array array['id','contact','position','department','phone','officePhone','email'] loop
      if jsonb_typeof(person->field_name) is distinct from 'string' or length(person->>field_name)>10000 then raise exception '담당자 입력 형식을 확인해 주세요.'; end if;
     end loop;
    end loop;
   end if;
  else
   select v into company from jsonb_array_elements(items) v where v->>'id'=item->>'customer';
   if company is null then select data into company from public.luux_records where owner=user_id and id=item->>'customer'; end if;
   if company is null or company->>'kind'<>'customer' then raise exception '연결할 회사를 선택해 주세요.'; end if;
   if item->>'kind'='log' then
    if coalesce(item->>'contactId','')<>'' then
     if not exists(select 1 from jsonb_array_elements(coalesce(company->'contacts',jsonb_build_array(jsonb_build_object('id',(company->>'id')||'-contact')))) p where p->>'id'=item->>'contactId') then raise exception '해당 회사의 담당자를 선택해 주세요.'; end if;
    elsif old_record is null then
     -- Old company-level records may be migrated without inventing a contact association.
     if not coalesce((item->>'legacyImport')::boolean,false) then raise exception '담당자를 선택해 주세요.'; end if;
    end if;
    if coalesce(item->>'next','')<>'' and coalesce(item->>'due','')!~ '^\d{4}-\d{2}-\d{2}$' then raise exception '다음 행동의 예정일을 선택해 주세요.'; end if;
   elsif coalesce(item->>'start','')<>'' and coalesce(item->>'end','')<>'' and item->>'end'<item->>'start' then raise exception '종료일을 확인해 주세요.'; end if;
   if coalesce(item->>'deal','')<>'' then
    select v into linked from jsonb_array_elements(items) v where v->>'id'=item->>'deal';
    if linked is null then select data into linked from public.luux_records where owner=user_id and id=item->>'deal'; end if;
    if linked is null or linked->>'kind'<>'deal' or linked->>'customer'<>item->>'customer' then raise exception '연결된 프로젝트를 확인해 주세요.'; end if;
   end if;
  end if;
 end loop;
 for item in select value from jsonb_array_elements(items) loop
  insert into public.luux_records(owner,id,kind,data,updated_at) values(user_id,item->>'id',item->>'kind',item-'legacyImport'-'updated',now())
  on conflict(owner,id) do update set kind=excluded.kind,data=excluded.data,updated_at=excluded.updated_at;
 end loop;
 if exists(select 1 from public.luux_records l join public.luux_records c on c.owner=l.owner and c.id=l.data->>'customer' where l.owner=user_id and l.kind='log' and coalesce(l.data->>'contactId','')<>'' and not exists(select 1 from jsonb_array_elements(coalesce(c.data->'contacts',jsonb_build_array(jsonb_build_object('id',c.id||'-contact')))) p where p->>'id'=l.data->>'contactId')) then raise exception '연락 이력이 있는 담당자는 제거할 수 없습니다.'; end if;
end $$;
revoke all on function public.luux_save_records(jsonb) from public;
grant execute on function public.luux_save_records(jsonb) to authenticated;

create or replace function public.luux_delete_record(record_id text) returns void
language plpgsql security definer set search_path = pg_catalog
as $$
declare user_id uuid:=auth.uid();
begin
 if not public.luux_is_allowed() then raise exception '등록된 계정만 사용할 수 있습니다.'; end if;
 perform pg_advisory_xact_lock(hashtextextended(user_id::text,0));
 if exists(select 1 from public.luux_records where owner=user_id and (data->>'customer'=record_id or data->>'deal'=record_id)) then raise exception '연결된 연락 이력을 먼저 정리해 주세요.'; end if;
 delete from public.luux_records where owner=user_id and id=record_id;
end $$;
revoke all on function public.luux_delete_record(text) from public;
grant execute on function public.luux_delete_record(text) to authenticated;

commit;
