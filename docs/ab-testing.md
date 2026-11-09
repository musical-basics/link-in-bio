# musical.bio A/B testing system — operator guide

## Status: closed on 2026-11-09

The bio-page test ran from 2026-08-04 to 2026-11-09 (Lionel's instruction #61, brief #85).
`lib/ab/registry.ts` has `closedOn: "2026-11-09"`, which switches the system off without deleting it.

**What is live now:** every bio page shows its owner's own theme and link order, with no variants.
For musical.bio/lionelyu that is the Cinematic theme (his own setting, and the winning format) in his own order.
Nothing is assigned, no `mb_ab` cookie is set (a returning visitor's cookie is deleted), no `ab_*` events are
sent, and the tracker unregisters the `ab_variant` / `ab_format` / `ab_order` super properties.
`?ab=<key>` still previews a variant, for admin viewers only (logged in or `AB_EXCLUDED_IPS`), for that request,
via the `x-mb-ab-preview` request header the middleware sets; normal visitors' `?ab=` is ignored.

**Final result** (report's own scoring, complete PostHog pull, bootstrap 95% CI on avg points, two-proportion
z-tests on CTR and bounce):

| period | sessions | format 2 Cinematic vs 3 Classic light | order b vs c |
|---|---|---|---|
| whole test (08-04 →) | 899 | 5.40 vs 4.65 pts, +0.75 [+0.09, +1.39]; bounce 32.5% vs 39.3% (p = 0.04); CTR 40.6% vs 38.1% (noise) | 4.89 vs 5.18 pts, CTR 39.8% vs 39.0%: noise on every metric |
| 2×2 (08-14 →) | 798 | 5.36 vs 4.62 pts, +0.74 [+0.07, +1.42]; bounce 32.8% vs 40.2% (p = 0.03); CTR 40.4% vs 37.2% (noise) | 4.84 vs 5.15 pts, CTR 39.0% vs 38.7%: noise |

Per variant since 08-14: 2c 5.48 pts (n 234), 2b 5.21 (187), 3c 4.77 (194), 3b 4.46 (182).

- **Formatting:** Cinematic beat Classic light, a modest but clear win (avg points and bounce; CTR was level).
- **Link order:** no measurable difference. Order b ("Masterclass first") never pinned anything: no link's title
  or URL ever matched its keywords (`masterclass`, `master class`, `course`, `class`) — checked against every
  current link and every link clicked since 08-01. So b was really the owner's own order, and the order
  comparison was "own order vs YouTube first". That comparison is still valid; it just isn't the one the name
  says. The retired format 1 and order a (08-14) had only 31 and 36 sessions; their gaps were within noise.
- **Data caveat (fixed):** the dashboard's PostHog query had no `LIMIT`, and HogQL then returns only 100 rows, so
  ranges with more than 100 sessions (e.g. 30 days) were scored on a truncated sample. The 7-day email windows
  stayed under 100. The query now sets `LIMIT 50000`; the numbers above are from a complete pull.

The dashboard (`/admin/ab-tests`) opens on the whole test once closed. The 12-hour email keeps site traffic and
replaces the A/B leaderboards with one line ("A/B test closed on 11-09; final results on the dashboard").
To run a new test: set `closedOn: null`, give it new format/order ids (never reuse old ones), and move
`startedOn`. Everything below describes the system as it ran.

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

## Email report (every 12 hours)

A Vercel cron (`vercel.json`, 07:00 + 19:00 UTC) hits `/api/cron/ab-report`,
which builds a PDF — site traffic (pageviews, visitors, clicks, CTR, top
links, referrers) plus the A/B leaderboards (last 24h + 7-day) — and emails
it via Resend. Recipient is `AB_REPORT_TO` (target: support@musicalbasics.com;
requires a verified Resend domain — until then Resend only delivers to the
account owner's address).

Required Vercel env vars (see `.env.example`): `RESEND_API_KEY`,
`CRON_SECRET`, optionally `AB_REPORT_TO` / `AB_REPORT_FROM` (the from-address
domain must be verified in Resend). Preview the PDF without emailing:
`/api/cron/ab-report?preview=pdf` (dev, or with the cron bearer token).
