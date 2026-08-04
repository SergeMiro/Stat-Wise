-- Drop weak matches from document search, so an off-topic question finds nothing.
--
-- The previous version joined the question's lexemes with OR, which was the right fix
-- for a real bug: `websearch_to_tsquery` ANDs terms, so "prix de l'eau millésime" found
-- nothing because the passage says "tarif". OR restored recall and `ts_rank` did the
-- ordering.
--
-- What OR also does is match on one common word. Measured against the real 48-chunk
-- corpus, once it was actually populated:
--
--   relevant questions, best hit     0.1064 .. 0.2736
--   off-topic questions, best hit    0.0547 .. 0.0730
--     ("combien coûte un vélo à Tokyo" hit "Combien de temps nous les gardons")
--
-- The two bands do not overlap, so a floor of 0.09 sits between them with room on both
-- sides. It matters because a passage handed to the model is an invitation to cite it:
-- "nothing matched" is a good answer to a question about bicycles in Tokyo, and a
-- paragraph about log retention is not.
--
-- The trailing filter is the second half. For a question that does match, hits 2 and 3
-- often score near the noise floor; they pad the prompt and offer a plausible wrong
-- citation. Keeping only what is within half of the best hit's score drops them without
-- a second constant to tune.

create or replace function public.search_ai_documents(
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
language plpgsql
stable
set search_path to ''
as $$
declare
  lexemes text;
  ts tsquery;
  -- Between the two measured bands. See the note above before changing it.
  floor_rank constant real := 0.09;
begin
  select string_agg(quote_literal(lexeme) || ':*', ' | ')
    into lexemes
    from unnest(tsvector_to_array(to_tsvector('french', coalesce(query, '')))) as lexeme;

  -- Nothing but stop words: return no rows rather than raise.
  if lexemes is null then return; end if;

  begin
    ts := to_tsquery('french', lexemes);
  exception when others then
    return;
  end;

  return query
    with hits as (
      select d.id, d.source_path, d.title, d.heading, d.anchor, d.content,
             ts_rank(d.search, ts) as rank
      from public.ai_documents d
      where d.locale = wanted_locale
        and d.search @@ ts
    ),
    scored as (
      select h.*, max(h.rank) over () as best
      from hits h
      where h.rank >= floor_rank
    )
    select s.id, s.source_path, s.title, s.heading, s.anchor, s.content, s.rank
    from scored s
    where s.rank >= s.best * 0.5
    order by s.rank desc
    limit least(greatest(max_rows, 1), 20);
end;
$$;

-- Same grants as before: readable by anyone, because the corpus is our published copy.
revoke execute on function public.search_ai_documents(text, text, integer) from public;
grant execute on function public.search_ai_documents(text, text, integer)
  to anon, authenticated, service_role;
