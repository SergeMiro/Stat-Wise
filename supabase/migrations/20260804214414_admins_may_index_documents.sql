/*
  Indexing without a service-role key.

  The table is readable by everyone because it holds only text already published on
  the site. Writing was left to the service role, which meant re-indexing required
  moving a secret around. An admin can do it instead — the role column is not
  self-assignable, so this grants nothing an account can grant itself.

  Deliberately *not* indexed: the NOTES directory. Those are internal engineering
  notes — decisions, traps found, security holes closed, work still owed. This table
  is world-readable, so putting them here would publish them. What goes in is the
  copy that is already on a page.
*/
create policy "admins may add documents"
  on public.ai_documents for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

create policy "admins may update documents"
  on public.ai_documents for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

create policy "admins may remove documents"
  on public.ai_documents for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );
