# Sign in with Ultimate Pianist

Need #25, brief #47. Lionel (instruction #28): Musical Bio gets a sign-up option, "sign in with your Ultimate
Pianist account". Anyone who arrives from Ultimate Pianist is asked whether to auto-create a Musical Bio from that
account. The contract with Ultimate Pianist is in their `docs/plan/DECISIONS.md`, 2026-11-09.

## Shape

Ultimate Pianist is a sign-in provider, the way Google is. Musical Bio keeps its own accounts. Email and password
signup and login are unchanged. Ultimate Pianist's production Clerk is the OpenID Connect issuer
(`https://clerk.ultimatepianist.com`), and Musical Bio adds it as an Auth.js provider with the id `ultimatepianist`.

**Off by default.** Nothing renders and no provider is registered until `AUTH_ULTIMATEPIANIST_ID` and
`AUTH_ULTIMATEPIANIST_SECRET` are both set. `AUTH_ULTIMATEPIANIST_ISSUER` is an optional override, for example
Ultimate Pianist's development Clerk.

## Flows

1. **Sign-in button.** "Sign in with your Ultimate Pianist account" appears above the forms on `/signup` and
   `/login`. After Ultimate Pianist approves, there are four cases:
   - **Already linked** (we have this Ultimate Pianist account id): sign in as that user. Go to `/admin`.
   - **New, and the email is not on Musical Bio:** create the account and go to `/admin` (the editor) to review it.
   - **The email already has a Musical Bio account:** no session yet. Go to `/login?link=…`, where a note asks for
     the Musical Bio password once. A correct password links the two accounts, and from then on either sign-in
     works. No account changes hands on email alone. The link token is signed, lasts 15 minutes, and is bound to
     that one user.
   - **No email, or the email is marked unverified:** don't create anything. Return to `/signup` with an explanation.
2. **Arriving from Ultimate Pianist.** `https://musical.bio/?from=ultimatepianist`, the contract's door, redirects
   to `/signup?from=ultimatepianist`. The redirect is in `next.config.mjs`, runs before middleware and only exists
   while the env vars are set. Plain `/` (Lionel's bio page and its A/B test) is untouched. `/signup` also shows the
   prompt to visitors whose referrer is ultimatepianist.com or a subdomain. The prompt asks "Create your Musical
   Bio from your Ultimate Pianist account?" **Yes** runs flow 1. **No thanks** shows the normal email signup.
   **Sign in** goes to login.
3. **Auto-create.** This step works from a normalized profile (`lib/up/profile.ts`) built from the OIDC claims:
   `sub`, `email`, `email_verified`, `name`, `username` (or `preferred_username`), and `picture` (https only).
   - **Username:** the first free one among the Ultimate Pianist username, then the name with spaces removed, then
     the email's local part, all reduced to `[a-z0-9_-]` with 3 to 30 characters. App paths are skipped. If all are
     taken, a number is added (`ada2`, `ada3`, …). If the insert still races, the pick is retried.
   - **Profile:** display name = name, photo = picture, plus the same starter bio and groups as email signup.
   - The user has no password (`password` is null). That account signs in through Ultimate Pianist only.

## Data changes

Migration `prisma/migrations/20261109120000_add_account_links` is additive and changes no existing rows:

- `User.password` becomes nullable. Accounts created through Ultimate Pianist have no password. Credentials login
  refuses a null password.
- A new `Account` table (`userId`, `provider`, `providerAccountId`), unique on `(provider, providerAccountId)` and
  on `(userId, provider)`, with cascade on user delete.

Order: apply the migration, then set the env vars. Deploying the code first is safe, because the `Account` table is
only read when the provider is configured.

## What Musical Bio needs from Ultimate Pianist

1. **An OAuth application on production Clerk.** Redirect URI:
   `https://musical.bio/api/auth/callback/ultimatepianist`. Scopes: `openid profile email`. It must be a
   confidential client with a secret. We send PKCE (S256), `state` and `nonce`.
2. **The keys in Musical Bio's Vercel env**, for Production: `AUTH_ULTIMATEPIANIST_ID` and
   `AUTH_ULTIMATEPIANIST_SECRET`. A redeploy is needed after setting them, because the `/?from=` redirect is read at
   build time.
3. **Token endpoint auth: `client_secret_basic`** (the Auth.js default). If Clerk only accepts
   `client_secret_post`, tell us and we change one line.
4. **Claims:** a stable `sub`, `email` with `email_verified: true`, `name`, `username`, and `picture` (https), in
   the ID token or userinfo.
5. **Previews and local testing:** Vercel preview URLs change on every deploy, so register them on a development
   Clerk instance instead. Either http://localhost:3000/api/auth/callback/ultimatepianist on a dev OAuth app (we set
   `AUTH_ULTIMATEPIANIST_ISSUER` to that instance locally), or one fixed preview alias if they want preview testing.
6. **The door:** link to `https://musical.bio/?from=ultimatepianist`. `https://musical.bio/signup?from=ultimatepianist`
   is equivalent and skips one redirect.
7. **Tell us when the app is registered,** so we can run a real end-to-end sign-in.

## Later (not in v1)

- Copy the Ultimate Pianist photo into our own storage. For now we hotlink Clerk's image URL.
- A "connect Ultimate Pianist" button in the editor for users who are already signed in.
- Richer Ultimate Pianist data (pieces, level), which would be a separate read with its own permission (contract).

## Tests

- `npm test` runs the unit tests: claim normalization, username building and de-duplication, the link token,
  env gating, and arrival detection.
- `TEST_DATABASE_URL=postgresql://…throwaway… npm test` also runs `lib/up/accounts.db.test.ts` against a real
  Postgres with the migrations applied. It covers create, the second sign-in, username clashes, no takeover by
  email, and unverified email. That test deletes rows, so never point it at production.
