# Musical Bio — manager handoff

A new manager reads this first. Manager session: `link-in-bio-app-6d` (since 11-11; before that `bio-manager`). Hub key: `bio` (`cmdr inbox bio`).

## Workers

| Name | Session id | Worktree | Owns | Current task |
| --- | --- | --- | --- | --- |
| bio-site | 8e6dc829 | .claude/worktrees/bio-site | Bio pages (`app/u`), links data, A/B test (`lib/ab`) | None (not running since 11-09; last work, the A/B close, landed) |
| bio-accounts | 8607e460 (fresh 11-12; older: e651243f) | .claude/worktrees/bio-accounts | Auth and signup (`auth*.ts`, `app/(auth)`), User/Profile/Account schema, owner API | Owner API password change, landed 11-12; idle |

Start a worker: `claude --bg -w <name> -n <name> --permission-mode bypassPermissions --model claude-opus-5-5 --effort high "<brief>"`.
`ListAgents` before any resume; a listed worker is alive, so SendMessage it.

## Rules and rulings

- `main` deploys production (Vercel). musical.bio/lionelyu is Lionel's social landing page: it must not break.
- Workers push branches; only the manager merges to main. No production migrations without a report first.
- New decisions/todos go only into the hub (`cmdr ask` / `cmdr todo`); reports name them by number, not contents (Lionel, 11-09).
- 11-09: Portfolio link goes at the bottom of his bio (need #24).
- 11-09: Ultimate Pianist users get both: the existing signup stays, "Sign in with Ultimate Pianist" is added, and
  people arriving from Ultimate Pianist are offered an auto-created bio (need #25). Depends on Ultimate Pianist's
  sign-in, which its manager is designing; anything needed from that side goes through the commander.

## Facts that cost time

- The checkout's `.env` DATABASE_URL is a local Postgres (localhost:5432), not production. The production Supabase
  pooler is unreachable from this Mac (outbound Postgres blocked). Production data changes go through the admin
  (Lionel signs in) or a deployed route, never a local script. Workers don't sign in with his password.

## Log

- 11-09: Onboarded (briefs #6, #18, #40). Briefed bio-site (#45) and bio-accounts (#47).
- 11-09: UP sign-in contract received (#49); callback https://musical.bio/api/auth/callback/ultimatepianist, env
  `AUTH_ULTIMATEPIANIST_ID` / `_SECRET`. Portfolio link blocked on DB access → Lionel todo #51; bio-site waits to
  verify. Variant b pins nothing → decision #52.
- 11-09: Landed bio-accounts c74c553 as 67cada0 (UP sign-in part 1, off until env set). Migration
  20261109120000_add_account_links to be applied by Lionel in the Supabase SQL editor (todo #53); afterwards it is
  NOT recorded in `_prisma_migrations`, so before any future `prisma migrate deploy` run
  `prisma migrate resolve --applied 20261109120000_add_account_links`. Keys go in only after #53.
  Ruling (worker default, kept): "No thanks" on the UP arrival prompt → email signup form.
  bio-site briefed on the /:username lookahead bug (usernames starting with u/api/admin… 404).
- 11-09: Landed bio-site 095246b as 50eba1f (username rewrite fix); verified in production. Measured: "/" (marketing
  page, always was, app/page.tsx wins over the rewrite) adds no A/B scores — tracker renders on bio pages only. No change.
  UP registered Musical Bio (brief #57): client id uWUklvRwAm8PRjNV, secret-basic, PKCE S256, username claim
  preferred_username (code already falls back to it). Keys go in after todo #53; then bio-accounts runs the real test.
  Waiting: Lionel todos #51, #53; decision #52. Both workers on hold.
- 11-09: Brief #61 (Lionel: "the link-in-bio manager needs to be able to make changes to my profile without me"):
  owner API landed (f4c2c40, 5c2712b); one-time route (own temp secret ONE_TIME_SETUP_SECRET, since CRON_SECRET is
  unreadable) applied add_account_links (recorded in _prisma_migrations) and set his password = .env.local
  ADMIN_PASSWORD; route + secret removed (aede039). Todos #51/#53 obsolete. Use `node --env-file=.env.local
  scripts/owner.mjs` against https://www.musical.bio (bare domain 307s and drops auth).
- 11-09: Portfolio link added via owner API (order 12, last in Let's Connect!), verified in 2b/2c/3b/3c.
- 11-09: UP keys in production (brief #72). Tested through Clerk's authorize; www hop keeps state cookies; AUTH_URL is
  bare https://musical.bio/ and must stay so (UP registered only the bare callback). Full sign-in needs a human
  (inbox + Cloudflare check) → Lionel todo #61. Test user stays (no delete path for passwordless users yet).
- 11-09: Landed 247332e (friendly /login errors; pages.error=/login) and b64bb94 (TikTok icon black in light style).
  Obsolete branch feat/portfolio-link-script left in place (deletion needs Lionel's OK).
- 11-09: Brief #85 (Lionel: close the A/B test; are results invalid?). Measured: order b never pinned anything;
  format 2 (Cinematic) beat 3 (+0.74 pts, CI excludes 0; bounce −7.4 pts); order b vs c = noise. Closed in 22a96df:
  no assignment/tagging, owner's own theme+order (Lionel's = Cinematic), admin-only ?ab= previews, dashboard keeps
  history, 12-hour email keeps traffic. Also fixed HogQL 100-row cap (30-day dashboard had been truncated).
- 11-09: Brief #121: Lionel's real UP test created one bio (`djsputty`; account email is a real person's — keep out of
  git). Name + starter page OK; photo empty (ID token lacked a usable picture?). bio-accounts resumed to fix
  (userinfo fallback + backfill empty image on sign-in). Then one todo: Lionel signs in again → proves photo + reuse.
- 11-11: Manager handed to `link-in-bio-app-6d` (todo #197, brief #310). Found the photo fix (927fa6a, branch
  up-photo) pushed but never landed; neither worker alive. Reviewed; 94/94 incl. DB tests on a throwaway Postgres;
  landed as 7c8b1bb, production Ready, smoke-tested (bio, /login, /signup, the ?from= door, provider list).
  The backfill only runs on the next sign-in, so: Lionel todo #210 (sign in again; adds a UP photo first, because a
  Clerk initials avatar is deliberately not copied). After #210: check musical.bio/djsputty has an image and the Vercel
  log line "Ultimate Pianist sign-in:" says outcome linked, photoBackfilled true; then close briefs #49 #57 #72 #121.
  Note: the local checkout's Prisma client must be regenerated (`npx prisma generate`) after pulling schema changes,
  or tsc reports a missing `account` model.
- 11-11: Brief #333 (Lionel did todo #210; UP has no photo upload). Vercel log for his 12:16 sign-in: outcome linked
  (no second account), userinfo fetched, neither the ID token nor userinfo carries `picture`. Our side is done: a photo
  fills in at the next sign-in once UP sends one (UP's manager told by the commander). Closed briefs #49 #57 #72 #121
  #333. His "all access tier" line in #333 is Ultimate Pianist's; Musical Bio has no tiers. Nothing running.
  Check sign-ins: `vercel logs --environment production --no-branch --since 6h -q "Ultimate Pianist" -x`.
- 11-12: Brief #404: UP shipped photo upload; it sets the Clerk user's image (their STATE.md: `has_image`,
  `avatar_url` = Clerk `image_url`), so Clerk's userinfo should carry `picture`. Lionel todo #274: sign in once more
  as the test account. After: the log line should say photo true, photoBackfilled true, and musical.bio/djsputty
  should show an img.clerk.com image; then report #404 done.
- 11-12: Brief #416 (leaked shared password, DreamPlay todo #277). Prod DATABASE_URL/DIRECT_URL (project
  flpbvurtkdnluyoqqtgn, one password in both) live only in Vercel and are pullable; .env/.env.local DB URLs are local.
  The bio page is force-dynamic, so it errors from the DB reset until Vercel has the new password. Lionel todo #284:
  he resets it and appends `NEW_DB_PASSWORD=` to .env.local; a watcher in this manager's session runs a script that
  `vercel env update`s both URLs (stdin + target production keeps all three environments), re-pulls to compare,
  redeploys, checks /lionelyu, then deletes the line. If this session is gone: do those steps by hand.
  His musical.bio login password: no change-password page existed, so bio-accounts added POST /api/owner/password +
  `owner.mjs set-password` (MB_NEW_PASSWORD from env), landed 6946de7; I set a random 24-char password and wrote it to
  .env.local ADMIN_PASSWORD (old one now rejected). Decision #285: rotate AUTH_SECRET to sign everyone out (JWT
  sessions from the leaked password last up to 30 days). AUTH_SECRET also signs the 15-minute UP link token only.
