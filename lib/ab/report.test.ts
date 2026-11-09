/**
 * The 12-hour report once the A/B test is closed: site traffic stays, the A/B
 * leaderboards become one line. While running, the leaderboards are unchanged.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { abClosedLine, abSection, buildAbReportPdf, reportEmail, type AbReportData } from './report.ts';
import type { VariantStats } from './scoring.ts';

const traffic = {
    pageviews: 120, visitors: 80, clicks: 40, ctr: 1 / 3,
    topLinks: [{ name: 'YouTube', clicks: 9 }], referrers: [{ name: 'Direct', views: 50 }], errors: [],
};
const stat = (key: string, sessions: number, avgPoints: number): VariantStats => ({
    key, sessions, pageviews: sessions, clicks: sessions, ctr: 0.4, clicksPerSession: 1,
    avgDurationSeconds: 30, bounceRate: 0.3, totalPoints: avgPoints * sessions, avgPoints,
});
const base: AbReportData = {
    generatedAt: new Date('2026-11-10T07:00:00Z'),
    abClosedOn: null,
    daily: [stat('2c', 10, 5.5), stat('3b', 8, 4.4)],
    weekly: [stat('2c', 60, 5.4)],
    weeklyFormats: [stat('2', 60, 5.4)],
    weeklyOrders: [stat('c', 60, 5.4)],
    dailyTraffic: traffic,
    weeklyTraffic: traffic,
};
const closed: AbReportData = { ...base, abClosedOn: '2026-11-09', daily: [], weekly: [], weeklyFormats: [], weeklyOrders: [] };

describe('report after the A/B test is closed', () => {
    test('the A/B part is one line, no leaderboards', () => {
        const ab = abSection(closed);
        assert.equal(ab.kind, 'closed');
        assert.equal(abClosedLine('2026-11-09'), 'A/B test closed on 11-09; final results on the dashboard (/admin/ab-tests).');
        assert.deepEqual(ab, { kind: 'closed', line: abClosedLine('2026-11-09') });
    });

    test('the email keeps traffic, adds the closed line, and names no leader', () => {
        const { subject, text } = reportEmail(closed);
        assert.equal(subject, 'musical.bio report 2026-11-10');
        assert.match(text, /Traffic last 24h: 120 pageviews, 80 visitors, 40 link clicks/);
        assert.match(text, /Traffic last 7d: 120 pageviews/);
        assert.ok(text.includes(abClosedLine('2026-11-09')));
        assert.doesNotMatch(text, /leader|Best performing variant|No A\/B sessions/i);
    });

    test('closed wins even if stale A/B rows are passed in', () => {
        assert.equal(abSection({ ...base, abClosedOn: '2026-11-09' }).kind, 'closed');
        assert.doesNotMatch(reportEmail({ ...base, abClosedOn: '2026-11-09' }).subject, /leader/);
    });

    test('the PDF still builds', async () => {
        const pdf = await buildAbReportPdf(closed);
        assert.ok(pdf.length > 500);
        assert.equal(Buffer.from(pdf.slice(0, 5)).toString(), '%PDF-');
    });
});

describe('report while the test runs (unchanged)', () => {
    test('leaderboards and leader', () => {
        const ab = abSection(base);
        assert.equal(ab.kind, 'leaderboards');
        if (ab.kind !== 'leaderboards') return;
        assert.equal(ab.leader?.key, '2c');
        assert.deepEqual(ab.tables.map((t) => t.title), [
            'Last 24 hours — variant leaderboard',
            'Last 7 days — variant leaderboard',
            'Last 7 days — by formatting (number)',
            'Last 7 days — by link order (letter)',
        ]);
        assert.match(reportEmail(base).subject, /A\/B leader: 2c$/);
        assert.match(reportEmail(base).text, /Best performing variant: 2c/);
    });
});
