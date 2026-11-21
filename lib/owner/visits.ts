import { excludedIpFilter, hogql } from '../ab/queries.ts';

/**
 * Visitors to the owner's own bio page for one America/New_York calendar day
 * (midnight to midnight Eastern, so 23 or 25 hours long on a DST change).
 * Powers GET /api/owner/stats/visits and Lionel's Personal Dashboard.
 */

export const VISITS_TIMEZONE = 'America/New_York';

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
/** Usernames are matched literally; anything outside this set is refused rather than escaped. */
const USERNAME_RE = /^[A-Za-z0-9._-]{1,64}$/;

const etParts = new Intl.DateTimeFormat('en-US', {
    timeZone: VISITS_TIMEZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
});

function etClock(ms: number) {
    const p: Record<string, string> = {};
    for (const part of etParts.formatToParts(new Date(ms))) p[part.type] = part.value;
    return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}:${p.second}` };
}

/** The Eastern calendar date (YYYY-MM-DD) of an instant. */
export function etDateOf(instant: Date): string {
    return etClock(instant.getTime()).date;
}

/** Calendar arithmetic on a YYYY-MM-DD string (no time zone involved). */
export function addDays(date: string, days: number): string {
    const m = DATE_RE.exec(date);
    if (!m) throw new Error(`Bad date ${date}`);
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3] + days));
    return d.toISOString().slice(0, 10);
}

/** Yesterday in Eastern time, the default day. */
export function yesterdayEt(now: Date = new Date()): string {
    return addDays(etDateOf(now), -1);
}

/** True for a real calendar date written YYYY-MM-DD (rejects 2026-02-30 and the like). */
export function isCalendarDate(date: string): boolean {
    const m = DATE_RE.exec(date);
    if (!m) return false;
    return addDays(date, 0) === date;
}

/**
 * The UTC instant at which Eastern midnight starts `date`. Midnight always
 * exists in New York (clocks change at 2am), and its offset is -4h or -5h, so
 * try both and keep the one that really reads 00:00:00 on that date.
 */
function etMidnightUtc(date: string): Date {
    const m = DATE_RE.exec(date)!;
    const base = Date.UTC(+m[1], +m[2] - 1, +m[3]);
    for (const hours of [4, 5]) {
        const ms = base + hours * 3600_000;
        const c = etClock(ms);
        if (c.date === date && c.time === '00:00:00') return new Date(ms);
    }
    throw new Error(`No Eastern midnight found for ${date}`);
}

/** [start, end) of the Eastern calendar day, as UTC instants. */
export function etDayBounds(date: string): { start: Date; end: Date } {
    if (!isCalendarDate(date)) throw new Error(`Bad date ${date}`);
    return { start: etMidnightUtc(date), end: etMidnightUtc(addDays(date, 1)) };
}

/** Why `date` can't be reported, or null if it can: well-formed, real, and already over in Eastern time. */
export function visitsDateProblem(date: string, now: Date = new Date()): string | null {
    if (!isCalendarDate(date)) return 'date must be a real calendar date written YYYY-MM-DD';
    if (date >= etDateOf(now)) return 'date must be a day that has already ended in America/New_York (not today or later)';
    return null;
}

const sqlTime = (d: Date) => d.toISOString().slice(0, 19).replace('T', ' ');
const regexEscape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * HogQL for one Eastern day on one bio page: the same counts as
 * fetchTrafficStats (uniq distinct_id over $pageview, count of $pageview) with
 * the same admin-IP scrub. The page is /<username> on musical.bio or
 * www.musical.bio, with an optional trailing slash and any query or hash.
 */
export function buildVisitsQuery(username: string, date: string): string {
    if (!USERNAME_RE.test(username)) throw new Error('Unsupported username');
    const { start, end } = etDayBounds(date);
    const urlPattern = `(?i)^https?://(www\\\\.)?musical\\\\.bio/${regexEscape(username).replace(/\\/g, '\\\\')}/?([?#].*)?$`;
    return `SELECT count() AS views,
                    uniq(distinct_id) AS visitors
             FROM events
             WHERE event = '$pageview'
               AND match(toString(properties.$current_url), '${urlPattern}')
               AND timestamp >= toDateTime('${sqlTime(start)}', 'UTC')
               AND timestamp < toDateTime('${sqlTime(end)}', 'UTC')${excludedIpFilter()}`;
}

export interface Visits {
    date: string;
    timezone: typeof VISITS_TIMEZONE;
    visitors: number;
    pageviews: number;
}

export async function fetchVisits(username: string, date: string): Promise<Visits> {
    const { results, error } = await hogql(buildVisitsQuery(username, date));
    if (error) throw new Error(`Visits query failed: ${error}`);
    const [views, visitors] = results[0] ?? [0, 0];
    return { date, timezone: VISITS_TIMEZONE, visitors: Number(visitors) || 0, pageviews: Number(views) || 0 };
}
