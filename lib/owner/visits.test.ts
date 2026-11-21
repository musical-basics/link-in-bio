import { afterEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays, buildVisitsQuery, etDateOf, etDayBounds, isCalendarDate, visitsDateProblem, yesterdayEt } from './visits.ts';

const iso = (d: Date) => d.toISOString();

describe('etDayBounds', () => {
    test('a winter day (EST, UTC-5) is 24 hours', () => {
        const { start, end } = etDayBounds('2026-11-20');
        assert.equal(iso(start), '2026-11-20T05:00:00.000Z');
        assert.equal(iso(end), '2026-11-21T05:00:00.000Z');
    });

    test('a summer day (EDT, UTC-4) is 24 hours', () => {
        const { start, end } = etDayBounds('2026-07-04');
        assert.equal(iso(start), '2026-07-04T04:00:00.000Z');
        assert.equal(iso(end), '2026-07-05T04:00:00.000Z');
    });

    test('spring-forward day (2026-03-08) is 23 hours: starts at -5, ends at -4', () => {
        const { start, end } = etDayBounds('2026-03-08');
        assert.equal(iso(start), '2026-03-08T05:00:00.000Z');
        assert.equal(iso(end), '2026-03-09T04:00:00.000Z');
        assert.equal((end.getTime() - start.getTime()) / 3600_000, 23);
    });

    test('fall-back day (2026-11-01) is 25 hours: starts at -4, ends at -5', () => {
        const { start, end } = etDayBounds('2026-11-01');
        assert.equal(iso(start), '2026-11-01T04:00:00.000Z');
        assert.equal(iso(end), '2026-11-02T05:00:00.000Z');
        assert.equal((end.getTime() - start.getTime()) / 3600_000, 25);
    });

    test('consecutive days tile with no gap or overlap, across a year', () => {
        let date = '2026-01-01';
        let prevEnd = etDayBounds(date).start;
        for (let i = 0; i < 365; i++) {
            const { start, end } = etDayBounds(date);
            assert.equal(start.getTime(), prevEnd.getTime(), date);
            assert.ok(end > start);
            prevEnd = end;
            date = addDays(date, 1);
        }
    });

    test('rejects dates that are not real', () => {
        assert.throws(() => etDayBounds('2026-02-30'));
        assert.throws(() => etDayBounds('nope'));
    });
});

describe('dates', () => {
    test('isCalendarDate', () => {
        assert.ok(isCalendarDate('2026-11-20'));
        assert.ok(isCalendarDate('2028-02-29'));
        for (const bad of ['2026-02-29', '2026-13-01', '2026-11-31', '2026-1-1', '20261120', '', '2026-11-20T00:00', ' 2026-11-20']) {
            assert.ok(!isCalendarDate(bad), bad);
        }
    });

    test('etDateOf uses the Eastern date, not the UTC one', () => {
        assert.equal(etDateOf(new Date('2026-11-21T04:59:59Z')), '2026-11-20'); // 23:59:59 EST
        assert.equal(etDateOf(new Date('2026-11-21T05:00:00Z')), '2026-11-21'); // midnight EST
        assert.equal(etDateOf(new Date('2026-07-05T03:59:59Z')), '2026-07-04'); // 23:59:59 EDT
    });

    test('yesterdayEt is the day before the Eastern date', () => {
        assert.equal(yesterdayEt(new Date('2026-11-21T05:20:00Z')), '2026-11-20'); // 00:20 EST on the 21st
        assert.equal(yesterdayEt(new Date('2026-11-21T03:00:00Z')), '2026-11-19'); // still the 20th in New York
        assert.equal(yesterdayEt(new Date('2026-03-01T12:00:00Z')), '2026-02-28');
    });

    test('visitsDateProblem: only finished days are allowed', () => {
        const now = new Date('2026-11-21T05:20:00Z'); // 2026-11-21 in New York
        assert.equal(visitsDateProblem('2026-11-20', now), null);
        assert.equal(visitsDateProblem('2020-01-01', now), null);
        assert.match(visitsDateProblem('2026-11-21', now) ?? '', /already ended/); // today
        assert.match(visitsDateProblem('2026-11-22', now) ?? '', /already ended/); // future
        // Late evening on the 20th in New York is still 'today' even though UTC is already the 21st.
        assert.match(visitsDateProblem('2026-11-20', new Date('2026-11-21T03:00:00Z')) ?? '', /already ended/);
        for (const bad of ['', 'abc', '2026-02-30', '2026-11-2', '2026-11-20 ']) {
            assert.match(visitsDateProblem(bad, now) ?? '', /YYYY-MM-DD/, bad);
        }
    });
});

describe('buildVisitsQuery', () => {
    const saved = process.env.AB_EXCLUDED_IPS;
    afterEach(() => {
        if (saved === undefined) delete process.env.AB_EXCLUDED_IPS;
        else process.env.AB_EXCLUDED_IPS = saved;
    });

    test('counts $pageview only, bounded to the Eastern day in UTC', () => {
        delete process.env.AB_EXCLUDED_IPS;
        const q = buildVisitsQuery('lionelyu', '2026-11-20');
        assert.match(q, /count\(\) AS views/);
        assert.match(q, /uniq\(distinct_id\) AS visitors/);
        assert.match(q, /event = '\$pageview'/);
        assert.ok(q.includes("timestamp >= toDateTime('2026-11-20 05:00:00', 'UTC')"));
        assert.ok(q.includes("timestamp < toDateTime('2026-11-21 05:00:00', 'UTC')"));
    });

    test('DST day uses the 23-hour bounds', () => {
        const q = buildVisitsQuery('lionelyu', '2026-03-08');
        assert.ok(q.includes("'2026-03-08 05:00:00'"));
        assert.ok(q.includes("'2026-03-09 04:00:00'"));
    });

    test('URL filter is the one username, either host, optional slash, query or hash', () => {
        const q = buildVisitsQuery('lionelyu', '2026-11-20');
        const m = /match\(toString\(properties\.\$current_url\), '([^']*)'\)/.exec(q);
        assert.ok(m, 'match() clause present');
        // The SQL literal unescapes \\ to \, giving the RE2 pattern HogQL runs.
        const re2 = m[1].replace(/\\\\/g, '\\');
        const re = new RegExp(re2.replace(/^\(\?i\)/, ''), 'i');
        for (const yes of [
            'https://www.musical.bio/lionelyu',
            'https://musical.bio/lionelyu',
            'https://www.musical.bio/lionelyu/',
            'https://www.musical.bio/lionelyu?ab=2b&utm_source=ig',
            'https://musical.bio/LionelYu#top',
        ]) {
            assert.ok(re.test(yes), yes);
        }
        for (const no of [
            'https://www.musical.bio/lionelyu/story',
            'https://www.musical.bio/lionelyu2',
            'https://www.musical.bio/someoneelse',
            'https://www.musical.bio/u/lionelyu',
            'https://www.musical.bio/',
            'https://evil.example/lionelyu',
            'https://www.musical.bio.evil.example/lionelyu',
            'https://wwwxmusical.bio/lionelyu',
            'http://localhost:3000/lionelyu',
        ]) {
            assert.ok(!re.test(no), no);
        }
    });

    test('dots in a username are literal, and unsafe usernames are refused', () => {
        const q = buildVisitsQuery('a.b', '2026-11-20');
        assert.ok(q.includes('/a\\\\.b/?'));
        for (const bad of ["x'; DROP", 'a b', '', 'a/b', 'a\\b', 'x'.repeat(65)]) {
            assert.throws(() => buildVisitsQuery(bad, '2026-11-20'), /username/, bad);
        }
    });

    test('applies the admin-IP scrub from AB_EXCLUDED_IPS, like fetchTrafficStats', () => {
        process.env.AB_EXCLUDED_IPS = '73.92.14.5, 2601:1c0:';
        const q = buildVisitsQuery('lionelyu', '2026-11-20');
        assert.ok(q.includes("AND NOT (toString(properties.$ip) = '73.92.14.5' OR startsWith(toString(properties.$ip), '2601:1c0:'))"));
        delete process.env.AB_EXCLUDED_IPS;
        assert.ok(!buildVisitsQuery('lionelyu', '2026-11-20').includes('$ip'));
    });

    test('rejects a bad date', () => {
        assert.throws(() => buildVisitsQuery('lionelyu', '2026-02-30'));
    });
});
