# Privacy scope (V1)

StatWise applies data minimisation. See `/[locale]/privacy` for the user-facing
version.

## Used

- chosen city
- selected areas (IRIS / commune ids)
- approximate budget
- child age group (not a birth date)
- household type and priorities
- favourite areas, email and minimal account data

## Never collected in V1

- precise home address
- a child's name or date of birth
- medical, school, payslip or banking data
- identifying data about third parties
- persistent geolocation history

## Sensitive user point

If the user provides a work/station/relative point: do not persist coordinates
to the account by default, use them only in the current browser session, ask for
explicit consent before saving, never log it to analytics, and prefer storing a
rounded zone id rather than an exact coordinate.

## DVF

Publish only aggregated analytics. Never publish raw transaction records or
per-address pages, and prevent search engines from indexing transaction data.

## Secrets

All secrets via environment variables; `.env.local` is never committed
(`.env.example` documents the variables). The service-role key is available to
the server runtime/jobs only and never reaches the client bundle.

## Analytics

Product events exclude precise addresses, target-point coordinates, free-text
notes, and any child data finer than the aggregated age group.
