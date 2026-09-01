-- Stageplot Studio v1 cloud document store.
-- Run in a dedicated Supabase project. Authentication is provided by Supabase Auth.

create sequence if not exists public.stageplot_change_seq;

create table if not exists public.stageplot_documents (
  owner_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('project', 'drum_template', 'stage_template')),
  id text not null check (id ~ '^(setup|drum|stage-template)-[a-z0-9-]+$'),
  name text not null check (char_length(name) between 1 and 80),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 5000000),
  revision bigint not null default 1 check (revision > 0),
  client_updated_at bigint not null check (client_updated_at >= 0),
  change_seq bigint not null default nextval('public.stageplot_change_seq'),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, kind, id)
);

create index if not exists stageplot_documents_owner_change_idx
  on public.stageplot_documents (owner_id, change_seq);

alter table public.stageplot_documents enable row level security;

drop policy if exists "stageplot owners read" on public.stageplot_documents;
create policy "stageplot owners read" on public.stageplot_documents
  for select to authenticated using (owner_id = (select auth.uid()));

drop policy if exists "stageplot owners insert" on public.stageplot_documents;
create policy "stageplot owners insert" on public.stageplot_documents
  for insert to authenticated with check (owner_id = (select auth.uid()));

drop policy if exists "stageplot owners update" on public.stageplot_documents;
create policy "stageplot owners update" on public.stageplot_documents
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

revoke all on public.stageplot_documents from anon;
grant select, insert, update on public.stageplot_documents to authenticated;
grant usage, select on sequence public.stageplot_change_seq to authenticated;

create or replace function public.stageplot_sync_push(
  p_kind text,
  p_id text,
  p_base_revision bigint,
  p_name text,
  p_client_updated_at bigint,
  p_payload jsonb,
  p_deleted boolean default false
) returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_current public.stageplot_documents%rowtype;
  v_saved public.stageplot_documents%rowtype;
begin
  if v_user is null then raise insufficient_privilege using message = 'AUTH_REQUIRED'; end if;
  if p_kind not in ('project', 'drum_template', 'stage_template') then raise exception 'INVALID_KIND'; end if;
  if p_id !~ '^(setup|drum|stage-template)-[a-z0-9-]+$' then raise exception 'INVALID_ID'; end if;
  if p_base_revision < 0 then raise exception 'INVALID_REVISION'; end if;

  -- Serialize even the first insert for this user/document. Without this lock,
  -- two offline devices could both observe "missing" and silently upsert.
  perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':' || p_kind || ':' || p_id, 0));

  select * into v_current from public.stageplot_documents
    where owner_id=v_user and kind=p_kind and id=p_id for update;

  if found and v_current.revision <> p_base_revision then
    return jsonb_build_object('status','conflict','revision',v_current.revision,'change_seq',v_current.change_seq,'record',jsonb_build_object(
      'id',v_current.id,'kind',v_current.kind,'name',v_current.name,'payload',v_current.payload,
      'revision',v_current.revision,'client_updated_at',v_current.client_updated_at,'deleted',v_current.deleted_at is not null));
  end if;
  if not found and p_base_revision <> 0 then
    return jsonb_build_object('status','conflict','revision',0,'change_seq',0,'record',null);
  end if;

  insert into public.stageplot_documents(owner_id,kind,id,name,payload,revision,client_updated_at,change_seq,deleted_at,updated_at)
  values(v_user,p_kind,p_id,coalesce(nullif(trim(p_name),''),'Ohne Titel'),coalesce(p_payload,'{}'::jsonb),1,greatest(0,p_client_updated_at),nextval('public.stageplot_change_seq'),case when p_deleted then now() end,now())
  on conflict(owner_id,kind,id) do update set
    name=excluded.name,payload=excluded.payload,revision=public.stageplot_documents.revision+1,
    client_updated_at=excluded.client_updated_at,change_seq=nextval('public.stageplot_change_seq'),
    deleted_at=excluded.deleted_at,updated_at=now()
  returning * into v_saved;

  return jsonb_build_object('status',case when p_deleted then 'deleted' else 'saved' end,'revision',v_saved.revision,'change_seq',v_saved.change_seq);
end;
$$;

create or replace function public.stageplot_sync_pull(
  p_kind text default null,
  p_cursor bigint default 0,
  p_limit integer default 200
) returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_result jsonb;
begin
  if v_user is null then raise insufficient_privilege using message = 'AUTH_REQUIRED'; end if;
  if p_kind is not null and p_kind not in ('project', 'drum_template', 'stage_template') then raise exception 'INVALID_KIND'; end if;
  if p_cursor < 0 or p_limit < 1 or p_limit > 1000 then raise exception 'INVALID_CURSOR_OR_LIMIT'; end if;

  with page as (
    select * from public.stageplot_documents
    where owner_id=v_user and change_seq>p_cursor and (p_kind is null or kind=p_kind)
    order by change_seq asc limit p_limit
  )
  select jsonb_build_object(
    'cursor',coalesce(max(change_seq),p_cursor),
    'records',coalesce(jsonb_agg(jsonb_build_object(
      'id',id,'kind',kind,'name',name,'payload',payload,'revision',revision,
      'client_updated_at',client_updated_at,'change_seq',change_seq,'deleted',deleted_at is not null
    ) order by change_seq),'[]'::jsonb)
  ) into v_result from page;
  return v_result;
end;
$$;

revoke all on function public.stageplot_sync_push(text,text,bigint,text,bigint,jsonb,boolean) from public, anon;
revoke all on function public.stageplot_sync_pull(text,bigint,integer) from public, anon;
grant execute on function public.stageplot_sync_push(text,text,bigint,text,bigint,jsonb,boolean) to authenticated;
grant execute on function public.stageplot_sync_pull(text,bigint,integer) to authenticated;
