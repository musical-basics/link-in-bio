# Musical Bio — manager handoff

A new manager reads this first. Manager session: `bio-manager`. Hub key: `bio` (`cmdr inbox bio`).

## Workers

| Name | Session id | Worktree | Owns | Current task |
| --- | --- | --- | --- | --- |
| bio-site | 8e6dc829 | .claude/worktrees/bio-site | Bio pages (`app/u`), links data, A/B test (`lib/ab`) | Brief #45: Portfolio link at the bottom of musical.bio/lionelyu |
| bio-accounts | 6c7bbe8f | .claude/worktrees/bio-accounts | Auth and signup (`auth*.ts`, `app/(auth)`), User/Profile/Account schema | Brief #47: Sign in with Ultimate Pianist, part 1 |

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
