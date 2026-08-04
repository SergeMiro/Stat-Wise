/*
  Retrieval as one function, so the ranking lives next to the index rather than in
  application code that would have to be kept in step with it.

  `websearch_to_tsquery` and not `plainto_tsquery`: a person types a question, and
  websearch syntax tolerates quotes and "or" without erroring on punctuation the way
  `to_tsquery` does. A malformed query returns nothing instead of raising, which for
  a chat box is the difference between a poor answer and a 500.
*/
create function public.search_ai_documents(
  query text,
  wanted_locale text default 'fr',
  max_rows integer default 6
)
returns table (
  id uuid,
  source_path text,
  title text,
  heading text,
  anchor text,
  content text,
  rank real
)
language sql
stable
security invoker
set search_path = ''
as $$
  select d.id, d.source_path, d.title, d.heading, d.anchor, d.content,
         ts_rank(d.search, websearch_to_tsquery('french', query)) as rank
  from public.ai_documents d
  where d.locale = wanted_locale
    and d.search @@ websearch_to_tsquery('french', query)
  order by rank desc
  limit least(greatest(max_rows, 1), 20);
$$;

comment on function public.search_ai_documents is
  'Ranked chunks for a natural-language query. security invoker, so the reader''s own policies still apply.';
