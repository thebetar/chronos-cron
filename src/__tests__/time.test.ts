import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import { JobType, type Job } from '../jobs';
import { getLogger } from '../logger';
import { checkJobTime } from '../time';

function job(type: JobType, at: string): Job {
    return {
        type,
        at,
        command: 'echo test',
        enabled: true,
        hash: 'test-hash',
    };
}

describe('checkJobTime', () => {
    let errorSpy: ReturnType<typeof spyOn>;

    beforeEach(() => {
        errorSpy = spyOn(getLogger(), 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        errorSpy.mockRestore();
    });

    test('minutely matches on the given second', () => {
        const date = new Date(2026, 0, 1, 12, 0, 30);

        expect(checkJobTime(job(JobType.MINUTELY, '30'), date)).toBe(true);
        expect(checkJobTime(job(JobType.MINUTELY, '29'), date)).toBe(false);
    });

    test('hourly matches minutes, and minutes:seconds', () => {
        const date = new Date(2026, 0, 1, 12, 30, 0);

        expect(checkJobTime(job(JobType.HOURLY, '30'), date)).toBe(true);
        expect(checkJobTime(job(JobType.HOURLY, '30:00'), date)).toBe(true);
        expect(checkJobTime(job(JobType.HOURLY, '31'), date)).toBe(false);
    });

    test('hourly pads single-digit minutes and seconds', () => {
        const date = new Date(2026, 0, 1, 12, 5, 3);

        expect(checkJobTime(job(JobType.HOURLY, '05:03'), date)).toBe(true);
        expect(checkJobTime(job(JobType.HOURLY, '05:04'), date)).toBe(false);
    });

    test('daily matches hour:minute and hour:minute:second', () => {
        const date = new Date(2026, 0, 1, 16, 0, 0);

        expect(checkJobTime(job(JobType.DAILY, '16:00'), date)).toBe(true);
        expect(checkJobTime(job(JobType.DAILY, '16:00:00'), date)).toBe(true);
        expect(checkJobTime(job(JobType.DAILY, '16:01'), date)).toBe(false);
    });

    test('weekly matches day name and numeric day', () => {
        // Monday
        const date = new Date(2026, 0, 5, 16, 0, 0);

        expect(checkJobTime(job(JobType.WEEKLY, 'Monday 16:00'), date)).toBe(true);
        expect(checkJobTime(job(JobType.WEEKLY, '1 16:00'), date)).toBe(true);
        expect(checkJobTime(job(JobType.WEEKLY, 'Tuesday 16:00'), date)).toBe(false);
        expect(checkJobTime(job(JobType.WEEKLY, '2 16:00'), date)).toBe(false);
    });

    test('monthly matches day and time', () => {
        const date = new Date(2026, 0, 1, 15, 0, 0);

        expect(checkJobTime(job(JobType.MONTHLY, '1 15:00'), date)).toBe(true);
        expect(checkJobTime(job(JobType.MONTHLY, '2 15:00'), date)).toBe(false);
        expect(checkJobTime(job(JobType.MONTHLY, '1 16:00'), date)).toBe(false);
    });

    test('yearly matches day-month and time', () => {
        const date = new Date(2026, 0, 1, 16, 0, 0);

        expect(checkJobTime(job(JobType.YEARLY, '1-1 16:00'), date)).toBe(true);
        expect(checkJobTime(job(JobType.YEARLY, '2-1 16:00'), date)).toBe(false);
        expect(checkJobTime(job(JobType.YEARLY, '1-2 16:00'), date)).toBe(false);
    });

    test('returns false for invalid hourly format', () => {
        const date = new Date(2026, 0, 1, 12, 30, 0);

        expect(checkJobTime(job(JobType.HOURLY, 'invalid'), date)).toBe(false);
    });

    test('returns false for invalid daily format', () => {
        const date = new Date(2026, 0, 1, 16, 0, 0);

        expect(checkJobTime(job(JobType.DAILY, '16:0'), date)).toBe(false);
    });

    test('logs error when time check throws', () => {
        const date = new Date(2026, 0, 1, 12, 30, 0);

        expect(checkJobTime(job(JobType.HOURLY, 'invalid'), date)).toBe(false);
        expect(errorSpy).toHaveBeenCalledWith(
            'Error checking job time:',
            expect.any(Error),
        );
    });
});
