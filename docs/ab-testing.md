# musical.bio A/B testing system — operator guide

Simplified port of the DreamPlay funnel blueprint (`AB-TESTING-SYSTEM.md`).
No purchases here, so we optimize for **CTR, time on page, and low bounce
rate**. Unlike DreamPlay there is no `/main` split — **every visitor** to the
bio page is assigned a variant.

## The model

A variant key is `<number><letter>`, e.g. `2b`:

- **Number = formatting family** (`lib/ab/registry.ts` → `formats`): theme
  and/or a CSS style preset. `1` = owner default, `2` = cinematic theme,
  `3` = classic light.
- **Letter = link ordering** (`registry.ts` → `orders`): which link gets
  pinned to the top. `a` = owner order, `b` = masterclass first,
  `c` = YouTube first.

The assignable pool is active formats × active orders, minus `disabledKeys`.
Assignment is CSPRNG-weighted in `middleware.ts`, stored in the `mb_ab`
cookie (30 days, sticky, readable by client JS — deliberate, the tracker
tags analytics events with it). Force any variant with `?ab=2b`.

## Operating the test

Everything lives in **`lib/ab/registry.ts`** — it is validated at build time,
so a bad edit breaks the build instead of mis-routing traffic.

- **Add a formatting variant**: add a format with a new number. Either force a
  theme, or set a `styleKey` and add `[data-ab-style="<key>"]` CSS overrides in
  `app/globals.css`.
- **Add an ordering variant**: add an order with a new letter and
  `pinKeywords` (matched against link title + URL; the matching link moves to
  the top and its group becomes the first group).
- **Deactivate**: set `active: false` on a format (kills the whole number) or
  an order (kills the whole letter), or add a single key to `disabledKeys`.
  Visitors holding a deactivated variant are re-bucketed on their next visit;
  historical data stays on the dashboard.
- **Never reuse a retired id** — old analytics would pollute the new test.

## Admin exclusion

Admin traffic never enters the experiment:

- **Logged-in sessions** are excluded automatically (any browser where you're
  signed into /admin).
- **`AB_EXCLUDED_IPS`** (Vercel env var, comma-separated) excludes devices
  where you're not logged in — exact IPs (`73.92.14.5`) or prefixes ending in
  `.` / `:` (`73.92.14.`, `2601:1c0:`).

Excluded viewers get no random assignment, the middleware sets an `mb_ab_x`
flag cookie, and the client tracker sends no A/B events (and unregisters any
previously registered variant tags). The same IP list is also applied inside
the PostHog scoring query, so past admin events are scrubbed retroactively.
`?ab=2b` previews still render for excluded viewers — they're just never
counted.

## Scoring (lib/ab/scoring.ts)

Per session, capped so one hyperactive visitor can't buy the leaderboard:

| signal | points |
|---|---|
| link click | 5 each, cap 15 |
| time on page | 1 per 15s, cap 5 |
| non-bounce (≥1 click or ≥10s) | 3 |

Variants rank by **average points per session**. The dashboard also shows raw
CTR (share of sessions with ≥1 click), avg time, and bounce rate, plus
roll-ups by number (formatting) and by letter (ordering).

## Data flow

`middleware.ts` assigns the cookie → `app/u/[username]/page.tsx` renders the
variant server-side (theme/style + reordered links) → `AbTracker`
(`components/ab/ab-tracker.tsx`) registers `ab_variant` as a PostHog super
property, fires `ab_page_view`, and fires `ab_page_leave` (duration + click
count) on hide/close. The existing `link_clicked` event picks up the variant
tag automatically. `lib/ab/queries.ts` pulls per-session aggregates back out
of PostHog with HogQL.

## Dashboard

`/admin/ab-tests` (linked from the admin sidebar) — Today / 7 / 30 day
ranges, full leaderboard including inactive ("off") and retired keys.

## Daily email report

A Vercel cron (`vercel.json`, 07:00 UTC ≈ end of day US) hits
`/api/cron/ab-report`, which builds a PDF (last 24h + 7-day leaderboards) and
emails it to **support@musicalbasics.com** via Resend.

Required Vercel env vars (see `.env.example`): `RESEND_API_KEY`,
`CRON_SECRET`, optionally `AB_REPORT_TO` / `AB_REPORT_FROM` (the from-address
domain must be verified in Resend). Preview the PDF without emailing:
`/api/cron/ab-report?preview=pdf` (dev, or with the cron bearer token).
