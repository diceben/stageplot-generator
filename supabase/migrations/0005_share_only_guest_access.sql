-- Browser guests can manage explicit shares, but cannot use private account sync.
-- Restrictive policies are combined with the existing owner checks using AND.
begin;
drop policy if exists "stageplot permanent accounts only" on public.stageplot_documents;
create policy "stageplot permanent accounts only"
  on public.stageplot_documents as restrictive for all to authenticated
  using ((select auth.jwt()->>'is_anonymous') = 'false')
  with check ((select auth.jwt()->>'is_anonymous') = 'false');
notify pgrst,'reload schema';
commit;
