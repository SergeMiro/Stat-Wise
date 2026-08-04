/*
  Recall over precision, because the first version had neither.

  `websearch_to_tsquery` joins terms with AND. Asked "prix de l'eau millésime", it
  required all three, and the passage about the water price says "tarif" and
  "millésime" but never "prix" — so the right answer scored nothing and the reader got
  "nothing matched". Tested, not assumed: that is how it was found.

  Now the query's own lexemes are OR-ed and `ts_rank` does the ordering. A passage
  matching three terms still outranks one matching a single term, so precision comes
  from the ranking rather than from refusing to look. Normalisation and stop words are
  Postgres's: `to_tsvector` already drops "de" and "la" and stems the rest, so the
  lexemes fed back in are exactly the ones the index holds.
*/
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
security invoker
set search_path = ''
as $$
declare
  lexemes text;
  ts tsquery;
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
    select d.id, d.source_path, d.title, d.heading, d.anchor, d.content,
           ts_rank(d.search, ts) as rank
    from public.ai_documents d
    where d.locale = wanted_locale and d.search @@ ts
    order by rank desc
    limit least(greatest(max_rows, 1), 20);
end;
$$;
