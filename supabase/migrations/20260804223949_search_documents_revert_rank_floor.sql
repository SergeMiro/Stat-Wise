-- Revert the rank floor added in 0006. It rejected correct answers.
--
-- 0006 read the ranks of a handful of questions, saw relevant hits at 0.1064+ and
-- off-topic ones at 0.0730 and below, and put a floor at 0.09 between them. Measured
-- against more questions, the bands overlap:
--
--   "Quand une donnée manque pour une ville, que fait WhereWise ?"
--       → "Données manquantes"  rank 0.08612   ← correct, and below the floor
--   "combien coûte un vélo à Tokyo"
--       → "5. Combien de temps nous les gardons"  rank 0.07295   ← noise
--
-- 0.086 against 0.073 is not a gap you can put a constant in. A floor that silently
-- drops the right passage is worse than no floor: the assistant then says our own
-- documentation has no answer, which is a false statement about us, and it is invisible
-- because it looks exactly like a question we genuinely do not cover.
--
-- Why no constant will work here, so the next attempt does not repeat it: the French
-- stemmer maps "données" and the imperative "donne-moi" to the same stem, `don`. That
-- stem is in 10 of the 24 French chunks, so "donne-moi une recette de gâteau" matches
-- ten passages about data protection, at ranks indistinguishable from a real but
-- weakly-worded question. Prefix matching is not the cause — matching those lexemes
-- exactly returns the same ten rows. It is the dictionary, and query syntax cannot
-- undo it.
--
-- So recall stays, and precision is enforced where it can actually be judged: the tool
-- returns passages with their links, and the instructions require the model to answer
-- only from what a passage says and to state plainly when none of them answers. That
-- was verified live: asked about the price of a bicycle in Tokyo, it declined and said
-- the city is not covered rather than quoting a paragraph about log retention.
--
-- The real fix is an informativeness test — ignore a match carried only by a stem that
-- occurs in a large share of the corpus (document frequency, i.e. the IDF half of the
-- ranking Postgres does not do for us), or embeddings via pgvector, which is already
-- available on this project. Either is a change to make deliberately and measure, not
-- a constant to nudge.

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
begin
  -- OR, not AND: `websearch_to_tsquery` requires every term, and "prix de l'eau
  -- millésime" then found nothing because the passage says "tarif", not "prix".
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
    where d.locale = wanted_locale
      and d.search @@ ts
    order by rank desc
    limit least(greatest(max_rows, 1), 20);
end;
$$;

revoke execute on function public.search_ai_documents(text, text, integer) from public;
grant execute on function public.search_ai_documents(text, text, integer)
  to anon, authenticated, service_role;
