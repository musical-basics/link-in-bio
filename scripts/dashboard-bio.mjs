#!/usr/bin/env node
/**
 * Nightly feed for Lionel's Personal Dashboard: visitors to musical.bio/lionelyu.
 *
 *   node --env-file=.env.local scripts/dashboard-bio.mjs
 *
 * For yesterday (America/New_York) and any of the 6 days before it that have no
 * file yet, asks the owner API (GET /api/owner/stats/visits, which holds the
 * PostHog key) and writes ~/.config/lionel-dashboard/bio/<YYYY-MM-DD>.json:
 *
 *   {"as_of": "<date>T23:59:59-05:00", "date": "<date>", "Bio page visitors": N, "Bio page views": N}
 *
 * The file's date is the day the numbers cover. Files are written atomically
 * (temp file + rename), folder mode 700, file mode 600, numbers and labels only.
 * A day whose fetch fails is logged and gets no file (never a 0); the script
 * then exits non-zero, after trying the other days.
 *
 * Credentials are the same as scripts/owner.mjs: MB_OWNER_EMAIL and MB_OWNER_PASSWORD
 * (or ADMIN_PASSWORD), both required (no defaults). MB_BASE_URL defaults to
 * https://www.musical.bio (the bare domain 307s and drops the credentials). MB_DASHBOARD_BIO_DIR overrides the folder.
 */
import { chmod, mkdir, readdir, rename, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

const TZ = 'America/New_York';
const BACKFILL_DAYS = 6;
const dir = process.env.MB_DASHBOARD_BIO_DIR || join(homedir(), '.config', 'lionel-dashboard', 'bio');

const log = (msg) => console.log(`${new Date().toISOString()} dashboard-bio: ${msg}`);
const fail = (msg) => {
    console.error(`${new Date().toISOString()} dashboard-bio: ERROR ${msg}`);
};

const etFormat = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const offsetFormat = new Intl.DateTimeFormat('en-US', { timeZone: TZ, timeZoneName: 'longOffset' });

const etDate = (instant) => etFormat.format(instant); // YYYY-MM-DD
const addDays = (date, n) => new Date(Date.parse(`${date}T00:00:00Z`) + n * 86400_000).toISOString().slice(0, 10);

/** "-05:00" / "-04:00": the Eastern offset at 23:59:59 on `date`. Clocks change at 2am, so 07:00 ET that day (12:00 UTC) has the same offset as the day's last second. */
function offsetAtEndOfDay(date) {
    const probe = new Date(Date.parse(`${date}T12:00:00Z`));
    const part = offsetFormat.formatToParts(probe).find((p) => p.type === 'timeZoneName')?.value ?? '';
    const match = /^GMT([+-]\d{2}):(\d{2})$/.exec(part);
    if (!match) throw new Error(`Cannot read the Eastern offset for ${date} (${part})`);
    return `${match[1]}:${match[2]}`;
}

async function existingDates() {
    try {
        return new Set((await readdir(dir)).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).map((f) => f.slice(0, 10)));
    } catch (e) {
        if (e.code === 'ENOENT') return new Set();
        throw e;
    }
}

const email = process.env.MB_OWNER_EMAIL;
if (!email) {
    fail('Set MB_OWNER_EMAIL (the account email) in the environment, e.g. node --env-file=.env.local scripts/dashboard-bio.mjs');
    process.exit(2);
}
const password = process.env.MB_OWNER_PASSWORD || process.env.ADMIN_PASSWORD;
if (!password) {
    fail('Set MB_OWNER_PASSWORD (or ADMIN_PASSWORD) in the environment, e.g. node --env-file=.env.local scripts/dashboard-bio.mjs');
    process.exit(2);
}
const base = (process.env.MB_BASE_URL || 'https://www.musical.bio').replace(/\/+$/, '');

async function fetchDay(date) {
    const url = `${base}/api/owner/stats/visits?date=${date}`;
    const res = await fetch(url, {
        headers: { authorization: 'Basic ' + Buffer.from(`${email}:${password}`).toString('base64') },
        redirect: 'manual',
        signal: AbortSignal.timeout(60_000),
    });
    if (res.status >= 300 && res.status < 400) {
        throw new Error(`${url} redirects to ${res.headers.get('location')}; set MB_BASE_URL to the final host`);
    }
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${date}: ${text.slice(0, 200)}`);
    let data;
    try {
        data = JSON.parse(text);
    } catch {
        throw new Error(`Response for ${date} is not JSON`);
    }
    const count = (v) => Number.isSafeInteger(v) && v >= 0;
    if (data.date !== date || data.timezone !== TZ || !count(data.visitors) || !count(data.pageviews)) {
        throw new Error(`Unexpected response shape for ${date}`);
    }
    return { visitors: data.visitors, pageviews: data.pageviews };
}

async function writeDay(date, { visitors, pageviews }) {
    const body = {
        as_of: `${date}T23:59:59${offsetAtEndOfDay(date)}`,
        date,
        'Bio page visitors': visitors,
        'Bio page views': pageviews,
    };
    const file = join(dir, `${date}.json`);
    const tmp = join(dir, `.${date}.json.${process.pid}.tmp`);
    await writeFile(tmp, JSON.stringify(body, null, 2) + '\n', { mode: 0o600 });
    await chmod(tmp, 0o600);
    await rename(tmp, file);
}

await mkdir(dir, { recursive: true, mode: 0o700 });
await chmod(dir, 0o700);

const yesterday = addDays(etDate(new Date()), -1);
const have = await existingDates();
// Yesterday is always refreshed; earlier days only if missing (the Mac may have been asleep or offline).
const wanted = [yesterday];
for (let i = 1; i <= BACKFILL_DAYS; i++) {
    const d = addDays(yesterday, -i);
    if (!have.has(d)) wanted.push(d);
}

let failures = 0;
for (const date of wanted.reverse()) {
    try {
        await writeDay(date, await fetchDay(date));
        log(`wrote ${date}.json`);
    } catch (e) {
        failures++;
        fail(`${date}: ${e instanceof Error ? e.message : e} (no file written)`);
    }
}
if (failures) process.exit(1);
