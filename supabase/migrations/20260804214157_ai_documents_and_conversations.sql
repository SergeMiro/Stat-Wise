/*
  Retrieval over our own documents, and the conversations that use it.

  Full-text search rather than embeddings, and the reason is the corpus, not
  laziness. There are about ten documents: the methodology, the sources, the notes,
  the privacy policy. At that size the thing that decides answer quality is whether
  the text is indexed at all, not whether the index is semantic. Postgres has a
  French dictionary with stemming and stop words built in, it needs no model, no GPU
  and no second datastore, and it is exact — a question about "SISPEA" finds SISPEA.

  pgvector is available in this project and the retriever is written behind an
  interface, so switching is a new implementation and not a rewrite. The condition
  for switching is written down in NOTES/07: a corpus past a few hundred chunks, or
  evidence that paraphrased questions are missing their answer.
*/

create table public.ai_documents (
  id uuid primary key default gen_random_uuid(),
  -- Stable path, so re-indexing updates rather than duplicates.
  source_path text not null,
  title text not null,
  /** Heading this chunk sits under, which is what a citation should name. */
  heading text,
  /** Anchor the UI can link to: /fr/methodology#ponderation */
  anchor text,
  locale text not null default 'fr' check (locale in ('fr', 'en')),
  content text not null,
  /*
    Generated, not maintained. A trigger would drift the day someone updates
    content without it; a generated column cannot.
  */
  search tsvector generated always as (
    setweight(to_tsvector('french', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(heading, '')), 'B') ||
    setweight(to_tsvector('french', coalesce(content, '')), 'C')
  ) stored,
  updated_at timestamptz not null default now(),
  unique (source_path, heading, locale)
);

create index ai_documents_search on public.ai_documents using gin (search);

comment on table public.ai_documents is
  'Chunks of the project''s own documents, for the assistant to quote from. Public reading: everything here is already published on the site.';

alter table public.ai_documents enable row level security;

-- Readable by anyone, including anonymous: every word of it is already on a page.
-- Writing is service-role only, which is what the indexing script uses.
create policy "documents are readable by everyone"
  on public.ai_documents for select using (true);

/* ------------------------------------------------------- conversations ---- */

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ai_conversations_by_owner
  on public.ai_conversations (user_id, updated_at desc);

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  /*
    The UIMessage parts array, verbatim. Storing the rendered text would lose which
    tools ran, and the tool trace is what lets someone check an answer later.
  */
  parts jsonb not null,
  created_at timestamptz not null default now()
);

create index ai_messages_by_conversation
  on public.ai_messages (conversation_id, created_at);

alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;

create policy "conversations are readable by their owner"
  on public.ai_conversations for select using ((select auth.uid()) = user_id);
create policy "conversations are created by their owner"
  on public.ai_conversations for insert with check ((select auth.uid()) = user_id);
create policy "conversations are updated by their owner"
  on public.ai_conversations for update using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "conversations are deleted by their owner"
  on public.ai_conversations for delete using ((select auth.uid()) = user_id);

/*
  Messages are reached through their conversation. The owner check is a subquery on
  ai_conversations rather than a user_id copied onto every row: one source of truth
  for who owns a thread, so moving or merging threads cannot orphan permissions.
*/
create policy "messages are readable through their conversation"
  on public.ai_messages for select using (
    exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.user_id = (select auth.uid())
    )
  );
create policy "messages are written through their conversation"
  on public.ai_messages for insert with check (
    exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.user_id = (select auth.uid())
    )
  );
create policy "messages are deleted through their conversation"
  on public.ai_messages for delete using (
    exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.user_id = (select auth.uid())
    )
  );

create trigger ai_conversations_touch_updated_at
  before update on public.ai_conversations
  for each row execute function public.touch_updated_at();
