# Owner API

Lets the bio manager's workers edit an account's own links, groups and profile text without logging in to
`/admin` (brief #61, Lionel's instruction #39). It runs the same rules as the admin, which share
`lib/owner/store.ts`, and revalidates the same pages after every change.

## Calling it

```sh
node --env-file=.env.local scripts/owner.mjs GET /
node --env-file=.env.local scripts/owner.mjs POST /links '{"title":"Portfolio","url":"https://…","group":"Work"}'
```

The credentials come from the environment, by name: `MB_OWNER_EMAIL` (default `yulionel829@gmail.com`) and
`MB_OWNER_PASSWORD`, which falls back to `ADMIN_PASSWORD` from `.env.local`. `MB_BASE_URL` defaults to
`https://www.musical.bio`: the bare `musical.bio` redirects to `www`, and credentials don't survive a redirect to
another host, so the CLI refuses redirects. Never pass the password as an argument or print it.

Authentication is HTTP Basic (email:password) over HTTPS. It is checked with bcrypt like login, and the error
for an unknown email looks the same as for a wrong password. An account without a password (Ultimate Pianist
sign-in) can't use the API.

## Endpoints (all under `/api/owner`)

| | |
|---|---|
| `GET /` | Your profile text, then your groups and links in order, with their ids |
| `POST /links` | Add a link: `title`, `url` (https/http/mailto/tel), `group` (must exist), optional `subtitle`, `icon` (lucide name, default `Link`), `layout` (`classic`/`featured`), `isActive`, `order`. Without `order` the link goes after every existing one, and nothing else moves |
| `PATCH /links/:id` | Change any of those fields. `{"isActive": false}` deactivates the link (there is no delete) |
| `PUT /links/order` | `{"ids": [...]}`: all your link ids, in the new order |
| `POST /groups` | `name`, optional `description` and `order` (default: last) |
| `PATCH /groups/:id` | `name` (renaming moves the group's links with it), `description`, `order` |
| `PUT /groups/order` | `{"ids": [...]}`: all your group ids, in the new order |
| `PATCH /profile` | `name`, `bio`, `heroHeadline`, `heroSubtitle`, `showHero` |

Links are ordered by `order` across the whole page and grouped by group name. Every query is scoped to the
authenticated user, so another user's id simply returns 404. Errors return JSON: 400 for invalid input (with
`issues`), 401, 404, 409 for duplicate group names, and 500 for anything else.

## Tests

`npm test` runs the unit tests. `TEST_DATABASE_URL=… npm test` adds `lib/owner/owner.db.test.ts`, which covers
auth (wrong password, missing auth, unknown email, a passwordless account), other users' ids, ordering, groups
and profile. Use only a throwaway Postgres, because the tests delete rows.
