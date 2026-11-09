import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

/**
 * ONE-TIME production setup, run from inside the deployed app because the
 * production database is unreachable from the Mac. Called through
 * app/api/owner/one-time-setup, which is deleted right after it has been used.
 *
 * 1. Set the owner's password (on Lionel's word, brief #61).
 * 2. Apply migration 20261109120000_add_account_links idempotently and record
 *    it in _prisma_migrations exactly as `prisma migrate deploy` would.
 */

export const OWNER_EMAIL = 'yulionel829@gmail.com';

export const ACCOUNT_LINKS_MIGRATION = '20261109120000_add_account_links';
/** sha256 of prisma/migrations/20261109120000_add_account_links/migration.sql (checked by a test). */
export const ACCOUNT_LINKS_CHECKSUM = 'ace7769dd0da3a8e5a9b55caf6fe4b5c36676bdc73c4b277367b8c3a39cef6f1';
export const EARLIER_MIGRATIONS = [
    '20251204115142_init_supabase',
    '20251204125652_add_groups_table',
    '20260122230524_add_storage_limit',
];

type Db = Pick<PrismaClient, '$queryRawUnsafe' | '$executeRawUnsafe' | '$transaction'>;

interface HistoryRow {
    migration_name: string;
    finished: boolean;
    rolled_back: boolean;
}

async function inspectWith(db: Db) {
    const [col] = await db.$queryRawUnsafe<{ is_nullable: string }[]>(
        `SELECT is_nullable FROM information_schema.columns
         WHERE table_schema = current_schema() AND table_name = 'User' AND column_name = 'password'`,
    );
    const [reg] = await db.$queryRawUnsafe<{ account: string | null; history: string | null }[]>(
        `SELECT to_regclass(quote_ident(current_schema()) || '."Account"')::text AS account,
                to_regclass(quote_ident(current_schema()) || '._prisma_migrations')::text AS history`,
    );
    const history = reg.history
        ? await db.$queryRawUnsafe<HistoryRow[]>(
              `SELECT migration_name, finished_at IS NOT NULL AS finished, rolled_back_at IS NOT NULL AS rolled_back
               FROM _prisma_migrations ORDER BY started_at`,
          )
        : null;
    const applied = (name: string) => !!history?.some((r) => r.migration_name === name && r.finished && !r.rolled_back);
    return {
        passwordNullable: col ? col.is_nullable === 'YES' : null,
        accountTable: !!reg.account,
        historyTable: !!reg.history,
        history: history?.map((r) => `${r.migration_name}${r.finished ? '' : ' (unfinished)'}${r.rolled_back ? ' (rolled back)' : ''}`) ?? [],
        earlierRecorded: EARLIER_MIGRATIONS.every(applied),
        accountLinksRecorded: applied(ACCOUNT_LINKS_MIGRATION),
    };
}

/** Read-only: what the database looks like now. */
export async function inspectDatabase(db: Db) {
    return inspectWith(db);
}

/**
 * Applies the add_account_links migration, skipping whatever is already done,
 * in one transaction. Records it in _prisma_migrations only when that table
 * exists and already lists the three earlier migrations.
 */
export async function applyAccountLinksMigration(db: Db, newId: () => string = () => crypto.randomUUID()) {
    return db.$transaction(async (tx) => {
        const before = await inspectWith(tx as unknown as Db);
        const steps: string[] = [];

        if (before.passwordNullable === null) throw new Error('User.password column not found');
        if (!before.passwordNullable) {
            await tx.$executeRawUnsafe(`ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL`);
            steps.push('User.password made nullable');
        }

        if (!before.accountTable) {
            await tx.$executeRawUnsafe(`CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
)`);
            steps.push('Account table created');
        }
        const indexes: [string, string][] = [
            ['Account_userId_idx', `CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account"("userId")`],
            ['Account_provider_providerAccountId_key', `CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId")`],
            ['Account_userId_provider_key', `CREATE UNIQUE INDEX IF NOT EXISTS "Account_userId_provider_key" ON "Account"("userId", "provider")`],
        ];
        for (const [name, sql] of indexes) {
            const [exists] = await tx.$queryRawUnsafe<{ n: number }[]>(
                `SELECT count(*)::int AS n FROM pg_indexes WHERE schemaname = current_schema() AND indexname = $1`,
                name,
            );
            if (!exists.n) {
                await tx.$executeRawUnsafe(sql);
                steps.push(`index ${name} created`);
            }
        }
        const [fk] = await tx.$queryRawUnsafe<{ n: number }[]>(
            `SELECT count(*)::int AS n FROM pg_constraint WHERE conname = 'Account_userId_fkey'`,
        );
        if (!fk.n) {
            await tx.$executeRawUnsafe(
                `ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
            );
            steps.push('foreign key Account_userId_fkey added');
        }

        let history: string;
        if (!before.historyTable) {
            history = 'no _prisma_migrations table: SQL applied, nothing recorded';
        } else if (before.accountLinksRecorded) {
            history = 'already recorded';
        } else if (!before.earlierRecorded) {
            history = 'earlier migrations not all recorded: SQL applied, nothing recorded';
        } else {
            await tx.$executeRawUnsafe(
                `INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
                 VALUES ($1, $2, now(), $3, NULL, NULL, now(), 1)`,
                newId(),
                ACCOUNT_LINKS_CHECKSUM,
                ACCOUNT_LINKS_MIGRATION,
            );
            history = 'recorded in _prisma_migrations';
        }

        return { steps: steps.length ? steps : ['nothing to apply'], history, after: await inspectWith(tx as unknown as Db) };
    });
}

/** Sets the bcrypt hash (cost 10, as signup) for exactly OWNER_EMAIL. */
export async function setOwnerPassword(
    db: Pick<PrismaClient, 'user'>,
    email: string,
    password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
    if (email.trim().toLowerCase() !== OWNER_EMAIL) return { ok: false, error: 'Only the owner account can be changed here' };
    if (password.length < 6 || password.length > 200) return { ok: false, error: 'Password must be 6 to 200 characters' };
    const users = await db.user.findMany({
        where: { email: { equals: OWNER_EMAIL, mode: 'insensitive' } },
        select: { id: true },
    });
    if (users.length !== 1) return { ok: false, error: `Expected one owner account, found ${users.length}` };
    await db.user.update({ where: { id: users[0].id }, data: { password: await bcrypt.hash(password, 10) } });
    return { ok: true };
}
