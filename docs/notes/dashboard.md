# Lionel's Personal Dashboard: bio page visitors

Every night soon after midnight Eastern, the number of visitors to `musical.bio/lionelyu` for the day that just
ended is written to `~/.config/lionel-dashboard/bio/<YYYY-MM-DD>.json` (hub brief #1850). "The day" is midnight to
midnight `America/New_York`, never the past 24 hours; the file's date is the day the numbers cover. The PostHog
key stays in Vercel: the Mac only calls the owner API.

```
PostHog <- GET /api/owner/stats/visits (Vercel) <- scripts/dashboard-bio.mjs <- LaunchAgent, 00:20 daily
```

## The endpoint

`GET /api/owner/stats/visits?date=YYYY-MM-DD` (owner API, Basic auth, read-only; see `owner-api.md`).
`date` defaults to yesterday in `America/New_York`; a malformed date, or today or a future date, is a 400.
It answers `{date, timezone: "America/New_York", visitors, pageviews}` for the signed-in owner's own page only:
`$pageview` events whose URL is `/<username>` on `musical.bio` or `www.musical.bio` (trailing slash, any query or
hash), between the UTC instants of that Eastern midnight and the next (23 or 25 hours on a DST change).
`visitors` is `uniq(distinct_id)` and `pageviews` is `count()`, matching `fetchTrafficStats`, with the same
admin-IP scrub (`AB_EXCLUDED_IPS`). Code: `lib/owner/visits.ts`, `app/api/owner/stats/visits/route.ts`; the
query helper `hogql` is shared from `lib/ab/queries.ts`. A PostHog failure is a 500, never a zero.

## The script

```sh
node --env-file=.env.local scripts/dashboard-bio.mjs
```

For yesterday (Eastern), and for any of the 6 days before it that have no file yet, it fetches the day from
`https://www.musical.bio` (the bare domain 307s and drops the credentials) with the same Basic auth as
`scripts/owner.mjs` (`MB_OWNER_EMAIL`, `MB_OWNER_PASSWORD` / `ADMIN_PASSWORD`) and writes

```json
{"as_of": "2026-11-20T23:59:59-05:00", "date": "2026-11-20", "Bio page visitors": 0, "Bio page views": 0}
```

(real numbers, of course). Files are written atomically (temp file + rename), the folder is mode 700 and files
600, and they hold numbers and labels only. Yesterday is re-fetched on every run; older days are only filled in.
If a day's fetch fails, the error is logged, that day gets no file (never a 0), the other days are still tried, and
the script exits 1. `MB_DASHBOARD_BIO_DIR` overrides the folder (for testing); `MB_BASE_URL` overrides the host.

## Install the nightly job

The plist is `scripts/launchd/com.musicalbio.dashboard-bio.plist`. It runs in the **main checkout** (which has
`.env.local`; a worktree doesn't need its own), so the script must be on `main` there first
(`git -C "/Users/lionelyu/Documents/New Version/link-in-bio-app" pull`).

```sh
cd "/Users/lionelyu/Documents/New Version/link-in-bio-app"
node --env-file=.env.local scripts/dashboard-bio.mjs          # run once by hand, then check the files
cp scripts/launchd/com.musicalbio.dashboard-bio.plist ~/Library/LaunchAgents/
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.musicalbio.dashboard-bio.plist
launchctl kickstart gui/$(id -u)/com.musicalbio.dashboard-bio  # prove it runs under launchd
tail ~/Library/Logs/musicalbio-dashboard-bio.log
```

It runs at 00:20 on the Mac's clock, which is Eastern. If the Mac is asleep then, launchd runs the job when it
wakes, and the 6-day backfill covers longer gaps. Uses node `/Users/lionelyu/.nvm/versions/node/v22.21.1/bin/node`:
if nvm moves to another version, update the plist and reinstall.

Update or remove:

```sh
launchctl bootout gui/$(id -u)/com.musicalbio.dashboard-bio    # unload (before re-copying the plist)
rm ~/Library/LaunchAgents/com.musicalbio.dashboard-bio.plist   # remove for good
```

## Tests

`npm test` covers the Eastern day bounds (including the 23-hour spring-forward and 25-hour fall-back days), date
validation and the query with its URL, time and IP filters (`lib/owner/visits.test.ts`).
