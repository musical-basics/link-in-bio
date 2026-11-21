import { ownerRoute } from '@/lib/owner/http';
import { OwnerError } from '@/lib/owner/store';
import { fetchVisits, visitsDateProblem, yesterdayEt } from '@/lib/owner/visits';

export const dynamic = 'force-dynamic';

/**
 * GET /api/owner/stats/visits?date=YYYY-MM-DD: visitors and pageviews on the
 * signed-in owner's own bio page (/<username>, either host, any query string)
 * over that America/New_York calendar day, midnight to midnight. The date
 * defaults to yesterday and must be a day that has already ended (400
 * otherwise). Read-only; the PostHog key stays on the server.
 * Responds {date, timezone, visitors, pageviews}.
 */
export const GET = ownerRoute(
    async ({ owner, req }) => {
        const date = new URL(req.url).searchParams.get('date') ?? yesterdayEt();
        const problem = visitsDateProblem(date);
        if (problem) throw new OwnerError(400, problem);
        return fetchVisits(owner.username, date);
    },
    { mutates: false },
);
