-- Sharing without email: a browser gets an anonymous Supabase session only on publication.
-- A primary key and the existing per-ID transaction lock guarantee one active owner.
begin;

create or replace function public.stageplot_share_status(p_project_id text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_row public.stageplot_project_shares%rowtype;
begin
  perform set_config('response.headers','[{"Cache-Control":"no-store"}]',true);
  if p_project_id is null or length(p_project_id)>80 or p_project_id !~ '^SP-[A-Z0-9]+(-[A-Z0-9]+)*$' then raise exception 'INVALID_ID'; end if;
  select * into v_row from public.stageplot_project_shares where project_id=p_project_id;
  return jsonb_build_object('active',v_row.project_id is not null and v_row.revoked_at is null,
    'owned',coalesce(v_row.owner_id=auth.uid(),false),'available',v_row.project_id is null,'updated_at',v_row.updated_at);
end; $$;

create or replace function public.stageplot_share_revoke(p_project_id text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_row public.stageplot_project_shares%rowtype;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_project_id is null or length(p_project_id)>80 or p_project_id !~ '^SP-[A-Z0-9]+(-[A-Z0-9]+)*$' then raise exception 'INVALID_ID'; end if;
  perform pg_advisory_xact_lock(hashtextextended('stageplot-share-owner:'||v_user::text,0));
  perform pg_advisory_xact_lock(hashtextextended('stageplot-share-id:'||p_project_id,0));
  select * into v_row from public.stageplot_project_shares where project_id=p_project_id for update;
  if found and v_row.owner_id<>v_user then raise exception 'NOT_OWNER'; end if;
  -- Removal releases the unique ID. The next successful publisher becomes its owner.
  -- If another browser reuses it, the previous owner's token cannot change/delete it.
  delete from public.stageplot_project_shares where project_id=p_project_id and owner_id=v_user;
  return jsonb_build_object('active',false,'available',true);
end; $$;

-- Retired IDs from the earlier reservation model become available as well.
delete from public.stageplot_project_shares where revoked_at is not null;
revoke all on function public.stageplot_share_status(text) from public,anon,authenticated;
grant execute on function public.stageplot_share_status(text) to anon,authenticated;
revoke all on function public.stageplot_share_revoke(text) from public,anon,authenticated;
grant execute on function public.stageplot_share_revoke(text) to authenticated;
notify pgrst,'reload schema';
commit;
