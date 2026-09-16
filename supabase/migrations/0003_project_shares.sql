-- Dedicated Stageplot project only. Opt-in plan/routing snapshots, without contact fields.
begin;
create table if not exists public.stageplot_project_shares (
  project_id text primary key check (project_id ~ '^SP-[A-Z0-9]+(-[A-Z0-9]+)*$' and length(project_id)<=80),
  owner_id uuid not null references auth.users(id) on delete cascade,
  document jsonb not null check (jsonb_typeof(document)='object' and octet_length(document::text)<=2000000),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz
);
create index if not exists stageplot_project_shares_owner_idx on public.stageplot_project_shares(owner_id);
alter table public.stageplot_project_shares enable row level security;
revoke all on public.stageplot_project_shares from public, anon, authenticated;

-- Whitelist recursively, including objects inside arrays. Never trust client sanitization.
create or replace function public.stageplot_share_clean(p_value jsonb,p_shape jsonb,p_depth integer default 0)
returns jsonb language plpgsql immutable set search_path='' as $$
declare v_result jsonb; v_key text; v_shape jsonb; v_item jsonb;
begin
  if p_depth>24 then raise exception 'INVALID_DOCUMENT'; end if;
  if p_shape='true'::jsonb then
    if jsonb_typeof(p_value)='string' then return to_jsonb(left(p_value #>> '{}',240)); end if;
    if jsonb_typeof(p_value) in ('null','number','boolean') then return p_value; end if;
    return 'null'::jsonb;
  end if;
  if jsonb_typeof(p_shape)='array' then
    v_result:='[]'::jsonb;
    if jsonb_typeof(p_value)='array' then
      for v_item in select value from jsonb_array_elements(p_value) limit 4096 loop
        v_result:=v_result||jsonb_build_array(public.stageplot_share_clean(v_item,p_shape->0,p_depth+1));
      end loop;
    end if;
    return v_result;
  end if;
  v_result:='{}'::jsonb;
  if jsonb_typeof(p_value)='object' then
    for v_key,v_shape in select key,value from jsonb_each(p_shape) loop
      if p_value ? v_key then v_result:=v_result||jsonb_build_object(v_key,public.stageplot_share_clean(p_value->v_key,v_shape,p_depth+1)); end if;
    end loop;
  end if;
  return v_result;
end; $$;

create or replace function public.stageplot_share_document(p_value jsonb)
returns jsonb language sql immutable set search_path='' as $$
  select public.stageplot_share_clean(p_value,
  -- share-schema:start (generated from StageplotShare.schema)
  '{"stage":{"title":true,"projectId":true,"w":true,"d":true,"estimated":true,"surface":true,"complex":true,"stairs":true,"stairsOffset":true,"stairsAlong":true,"stairsWidth":true,"stairsDepth":true,"iem":true,"iemLength":true,"iemDepth":true,"iemX":true,"iemY":true,"project":{"name":true,"unit":true},"extraStairs":[{"id":true,"stairs":true,"stairsOffset":true,"stairsAlong":true,"stairsWidth":true,"stairsDepth":true}],"routing":{"version":true,"disabledSources":[true],"inputs":[{"id":true,"adoptedSource":true,"edited":true,"pickup":true,"outputKind":true,"iemName":true,"iemMode":true,"iemTransport":true,"iemGroup":true,"frequencyBand":true,"sourceKey":true,"number":true,"instrument":true,"generatedInstrument":true,"mode":true,"signalType":true,"connector":true,"portIndex":true,"stereoGroup":true,"microphone":true,"phantom":true,"stagebox":true,"stageboxPort":true,"manual":true,"linkedSources":[{"id":true,"adoptedSource":true,"edited":true,"pickup":true,"outputKind":true,"iemName":true,"iemMode":true,"iemTransport":true,"iemGroup":true,"frequencyBand":true,"sourceKey":true,"number":true,"instrument":true,"generatedInstrument":true,"mode":true,"signalType":true,"connector":true,"portIndex":true,"stereoGroup":true,"microphone":true,"phantom":true,"stagebox":true,"stageboxPort":true,"manual":true}]}],"outputs":[{"id":true,"adoptedSource":true,"edited":true,"pickup":true,"outputKind":true,"iemName":true,"iemMode":true,"iemTransport":true,"iemGroup":true,"frequencyBand":true,"sourceKey":true,"number":true,"instrument":true,"generatedInstrument":true,"mode":true,"signalType":true,"connector":true,"portIndex":true,"stereoGroup":true,"microphone":true,"phantom":true,"stagebox":true,"stageboxPort":true,"manual":true,"linkedSources":[{"id":true,"adoptedSource":true,"edited":true,"pickup":true,"outputKind":true,"iemName":true,"iemMode":true,"iemTransport":true,"iemGroup":true,"frequencyBand":true,"sourceKey":true,"number":true,"instrument":true,"generatedInstrument":true,"mode":true,"signalType":true,"connector":true,"portIndex":true,"stereoGroup":true,"microphone":true,"phantom":true,"stagebox":true,"stageboxPort":true,"manual":true}]}],"generatedAt":true},"cables":[{"id":true,"direction":true,"sourceKey":true,"sourceId":true,"targetId":true,"targetPort":true,"length":true,"bundleId":true,"route":[{"x":true,"y":true}]}],"geometry":{"version":true,"height":true,"clearance":true,"showModules":true,"name":true,"measured":true,"revision":true,"parts":[{"id":true,"name":true,"kind":true,"shape":true,"x":true,"y":true,"w":true,"d":true,"angle":true,"height":true,"role":true,"locked":true,"rise":true,"target":true,"points":[[true]],"anchor":{"partId":true,"edge":true,"t":true}}]}},"objects":[{"id":true,"type":true,"x":true,"y":true,"angle":true,"label":true,"showLabel":true,"power":true,"wireless":true,"outs":true,"showOuts":true,"locked":true,"house":true,"drumPresetId":true,"comboJacks":true,"stand":true,"purpose":true,"boomDirection":true,"micHeadDirection":true,"micFrameVersion":true,"width":true,"depth":true,"height":true,"dimensions":{"w":true,"d":true},"foh":{"table":true,"barrier":true,"sun":true,"rain":true},"iem":{"id":true,"name":true,"mode":true,"transport":true,"frequencyBand":true,"ports":[true]},"iemMixes":[{"id":true,"name":true,"mode":true,"transport":true,"frequencyBand":true,"ports":[true]}],"playback":{"version":true,"mode":true,"target":true},"io":{"inputs":{"count":true,"connector":true},"outputs":{"count":true,"connector":true},"stereoPairs":[true],"aliases":{"inputs":[true],"outputs":[true]},"outputKeyStyle":true},"drumInputs":[{"id":true,"name":true,"microphone":true,"phantom":true}],"drums":{"kickCount":true,"kickDiameter":true,"kickDepth":true,"pedal":true,"snare":true,"snareModel":true,"snareDiameter":true,"snareDepth":true,"snareMaterial":true,"side":true,"sideModel":true,"sideDiameter":true,"sideDepth":true,"riserPreset":true,"throne":true,"hihat":true,"hatSize":true,"ride":true,"rideSize":true,"splash":true,"china":true,"clapstack":true,"clapSize":true,"pad":true,"bongos":true,"table":true,"leftHanded":true,"showMics":true,"overheads":true,"overheadMount":true,"room":true,"rackToms":[{"diameter":true,"depth":true,"mount":true}],"floorToms":[{"diameter":true,"depth":true}],"crashes":[true],"positions":{"throne":{"x":true,"y":true},"kick1":{"x":true,"y":true},"kick2":{"x":true,"y":true},"snare":{"x":true,"y":true},"side":{"x":true,"y":true},"rack1":{"x":true,"y":true},"rack2":{"x":true,"y":true},"rack3":{"x":true,"y":true},"rack4":{"x":true,"y":true},"floor1":{"x":true,"y":true},"floor2":{"x":true,"y":true},"floor3":{"x":true,"y":true},"hihat":{"x":true,"y":true},"ride":{"x":true,"y":true},"crash1":{"x":true,"y":true},"crash2":{"x":true,"y":true},"crash3":{"x":true,"y":true},"crash4":{"x":true,"y":true},"splash1":{"x":true,"y":true},"splash2":{"x":true,"y":true},"splash3":{"x":true,"y":true},"splash4":{"x":true,"y":true},"china1":{"x":true,"y":true},"china2":{"x":true,"y":true},"clapstack":{"x":true,"y":true},"pad":{"x":true,"y":true},"bongos":{"x":true,"y":true},"table":{"x":true,"y":true}},"rotations":{"throne":true,"kick1":true,"kick2":true,"snare":true,"side":true,"rack1":true,"rack2":true,"rack3":true,"rack4":true,"floor1":true,"floor2":true,"floor3":true,"hihat":true,"ride":true,"crash1":true,"crash2":true,"crash3":true,"crash4":true,"splash1":true,"splash2":true,"splash3":true,"splash4":true,"china1":true,"china2":true,"clapstack":true,"pad":true,"bongos":true,"table":true},"overheadPickup":{"throne":true,"kick1":true,"kick2":true,"snare":true,"side":true,"rack1":true,"rack2":true,"rack3":true,"rack4":true,"floor1":true,"floor2":true,"floor3":true,"hihat":true,"ride":true,"crash1":true,"crash2":true,"crash3":true,"crash4":true,"splash1":true,"splash2":true,"splash3":true,"splash4":true,"china1":true,"china2":true,"clapstack":true,"pad":true,"bongos":true,"table":true},"mics":{"kick1-in":{"enabled":true,"model":true,"phantom":true},"kick1-out":{"enabled":true,"model":true,"phantom":true},"kick2-in":{"enabled":true,"model":true,"phantom":true},"kick2-out":{"enabled":true,"model":true,"phantom":true},"snare-up":{"enabled":true,"model":true,"phantom":true},"snare-down":{"enabled":true,"model":true,"phantom":true},"side-up":{"enabled":true,"model":true,"phantom":true},"side-down":{"enabled":true,"model":true,"phantom":true},"rack1":{"enabled":true,"model":true,"phantom":true},"rack2":{"enabled":true,"model":true,"phantom":true},"rack3":{"enabled":true,"model":true,"phantom":true},"rack4":{"enabled":true,"model":true,"phantom":true},"floor1":{"enabled":true,"model":true,"phantom":true},"floor2":{"enabled":true,"model":true,"phantom":true},"floor3":{"enabled":true,"model":true,"phantom":true},"hihat":{"enabled":true,"model":true,"phantom":true},"ride":{"enabled":true,"model":true,"phantom":true},"crash1":{"enabled":true,"model":true,"phantom":true},"crash2":{"enabled":true,"model":true,"phantom":true},"crash3":{"enabled":true,"model":true,"phantom":true},"crash4":{"enabled":true,"model":true,"phantom":true},"splash1":{"enabled":true,"model":true,"phantom":true},"splash2":{"enabled":true,"model":true,"phantom":true},"splash3":{"enabled":true,"model":true,"phantom":true},"splash4":{"enabled":true,"model":true,"phantom":true},"china1":{"enabled":true,"model":true,"phantom":true},"china2":{"enabled":true,"model":true,"phantom":true},"clapstack":{"enabled":true,"model":true,"phantom":true},"oh-mono":{"enabled":true,"model":true,"phantom":true},"oh-l":{"enabled":true,"model":true,"phantom":true},"oh-r":{"enabled":true,"model":true,"phantom":true},"room-mono":{"enabled":true,"model":true,"phantom":true},"room-l":{"enabled":true,"model":true,"phantom":true},"room-r":{"enabled":true,"model":true,"phantom":true},"pad-l":{"enabled":true,"model":true,"phantom":true},"pad-r":{"enabled":true,"model":true,"phantom":true},"bongos":{"enabled":true,"model":true,"phantom":true}},"zOrder":[true]},"percussion":{"version":true,"nextId":true,"parts":[{"id":true,"type":true,"section":true,"x":true,"y":true,"angle":true,"scale":true,"label":true,"enabled":true,"pickup":true,"width":true,"depth":true}]},"orchestra":{"version":true,"mode":true,"seating":true,"labels":true,"nextId":true,"groups":{"violin1":true,"violin2":true,"violas":true,"cellos":true,"basses":true,"flutes":true,"oboes":true,"clarinets":true,"bassoons":true,"horns":true,"trumpets":true,"trombones":true,"tubas":true,"harps":true,"timpani":true,"percussion":true},"parts":[{"id":true,"type":true,"section":true,"x":true,"y":true,"angle":true,"scale":true,"label":true,"enabled":true,"pickup":true,"width":true,"depth":true}]}}]}'::jsonb
  -- share-schema:end
  );
$$;

create or replace function public.stageplot_share_get(p_project_id text)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
  perform set_config('response.headers','[{"Cache-Control":"no-store"}]',true);
  if p_project_id is null or length(p_project_id)>80 or p_project_id !~ '^SP-[A-Z0-9]+(-[A-Z0-9]+)*$' then return null; end if;
  return (select jsonb_build_object('project_id',project_id,'document',document,'updated_at',updated_at)
    from public.stageplot_project_shares where project_id=p_project_id and revoked_at is null);
end; $$;

create or replace function public.stageplot_share_status(p_project_id text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_row public.stageplot_project_shares%rowtype;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_row from public.stageplot_project_shares where project_id=p_project_id;
  if found and v_row.owner_id<>auth.uid() then raise exception 'NOT_OWNER'; end if;
  return jsonb_build_object('active',v_row.project_id is not null and v_row.revoked_at is null,'updated_at',v_row.updated_at);
end; $$;

create or replace function public.stageplot_share_publish(p_project_id text,p_document jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_row public.stageplot_project_shares%rowtype; v_clean jsonb; v_time timestamptz;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_project_id is null or length(p_project_id)>80 or p_project_id !~ '^SP-[A-Z0-9]+(-[A-Z0-9]+)*$' then raise exception 'INVALID_ID'; end if;
  if p_document is null or octet_length(p_document::text)>2000000 or jsonb_typeof(p_document->'stage') is distinct from 'object' or jsonb_typeof(p_document->'objects') is distinct from 'array' or (p_document#>>'{stage,projectId}') is distinct from p_project_id then raise exception 'INVALID_DOCUMENT'; end if;
  v_clean:=public.stageplot_share_document(p_document);
  -- Lock each account for quota checks, then each ID to protect first publication.
  perform pg_advisory_xact_lock(hashtextextended('stageplot-share-owner:'||v_user::text,0));
  perform pg_advisory_xact_lock(hashtextextended('stageplot-share-id:'||p_project_id,0));
  select * into v_row from public.stageplot_project_shares where project_id=p_project_id for update;
  if found and v_row.owner_id<>v_user then raise exception 'NOT_OWNER'; end if;
  if (v_row.project_id is null or v_row.revoked_at is not null) and (select count(*) from public.stageplot_project_shares where owner_id=v_user and revoked_at is null)>=100 then raise exception 'SHARE_LIMIT'; end if;
  insert into public.stageplot_project_shares(project_id,owner_id,document) values(p_project_id,v_user,v_clean)
  on conflict(project_id) do update set document=excluded.document,updated_at=clock_timestamp(),revoked_at=null
  returning updated_at into v_time;
  return jsonb_build_object('active',true,'updated_at',v_time);
end; $$;

create or replace function public.stageplot_share_revoke(p_project_id text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_row public.stageplot_project_shares%rowtype;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  perform pg_advisory_xact_lock(hashtextextended('stageplot-share-owner:'||v_user::text,0));
  perform pg_advisory_xact_lock(hashtextextended('stageplot-share-id:'||p_project_id,0));
  select * into v_row from public.stageplot_project_shares where project_id=p_project_id for update;
  if found and v_row.owner_id<>v_user then raise exception 'NOT_OWNER'; end if;
  -- Erase the snapshot, reserve the ID for its owner so old links cannot be hijacked.
  update public.stageplot_project_shares set document='{}',revoked_at=clock_timestamp(),updated_at=clock_timestamp() where project_id=p_project_id and owner_id=v_user;
  return jsonb_build_object('active',false);
end; $$;

revoke all on function public.stageplot_share_clean(jsonb,jsonb,integer) from public,anon,authenticated;
revoke all on function public.stageplot_share_document(jsonb) from public,anon,authenticated;
revoke all on function public.stageplot_share_get(text) from public,anon,authenticated;
revoke all on function public.stageplot_share_status(text) from public,anon,authenticated;
revoke all on function public.stageplot_share_publish(text,jsonb) from public,anon,authenticated;
revoke all on function public.stageplot_share_revoke(text) from public,anon,authenticated;
grant execute on function public.stageplot_share_get(text) to anon,authenticated;
grant execute on function public.stageplot_share_status(text) to authenticated;
grant execute on function public.stageplot_share_publish(text,jsonb) to authenticated;
grant execute on function public.stageplot_share_revoke(text) to authenticated;
notify pgrst,'reload schema';
commit;
