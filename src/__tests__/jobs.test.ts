import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import { getJobs, JobType } from '../jobs';
import { getLogger } from '../logger';

describe('getJobs', () => {
    let errorSpy: ReturnType<typeof spyOn>;

    beforeEach(() => {
        errorSpy = spyOn(getLogger(), 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        errorSpy.mockRestore();
    });

    test('loads enabled jobs from data/jobs.json with hash', async () => {
        const jobs = await getJobs();

        expect(jobs.length).toBeGreaterThan(0);
        expect(jobs[0]).toHaveProperty('type');
        expect(jobs[0]).toHaveProperty('at');
        expect(jobs[0]).toHaveProperty('command');
        expect(jobs[0].enabled).toBe(true);
        expect(jobs[0].hash).toBeString();
        expect(jobs[0].hash.length).toBe(32);
    });

    test('only returns enabled jobs', async () => {
        const jobs = await getJobs();

        for (const job of jobs) {
            expect(job.enabled).toBe(true);
        }
    });

    test('jobs use valid types and at formats', async () => {
        const jobs = await getJobs();

        for (const job of jobs) {
            expect(Object.values(JobType)).toContain(job.type);

            expect(typeof job.at).toBe('string');
            expect(job.at.length).toBeGreaterThan(0);
            expect(typeof job.command).toBe('string');
            expect(typeof job.enabled).toBe('boolean');

            expect(job.hash).toBeString();
            expect(job.hash.length).toBe(32);
        }
    });

    test('monthly jobs put day in at, not a separate field', async () => {
        const jobs = await getJobs();
        const monthly = jobs.filter((job) => job.type === JobType.MONTHLY);

        expect(monthly.length).toBeGreaterThan(0);

        for (const job of monthly) {
            expect(job.at).toMatch(/^\d+ \d{2}:\d{2}$/);
            expect(job).not.toHaveProperty('day');
        }
    });

    test('returns the same cached jobs when the file has not changed', async () => {
        const first = await getJobs();
        const second = await getJobs();

        expect(second).toBe(first);
    });

    test('each job gets a unique hash', async () => {
        const jobs = await getJobs();
        const hashes = jobs.map((job) => job.hash);

        expect(new Set(hashes).size).toBe(hashes.length);
    });

    test('logs error and rethrows when jobs file cannot be read', async () => {
        const previousJobsFile = process.env.JOBS_FILE;
        process.env.JOBS_FILE = '/nonexistent/jobs.json';

        try {
            await expect(getJobs()).rejects.toThrow();
            expect(errorSpy).toHaveBeenCalledWith(
                'Error reading jobs file:',
                expect.any(Error),
            );
        } finally {
            if (previousJobsFile === undefined) {
                delete process.env.JOBS_FILE;
            } else {
                process.env.JOBS_FILE = previousJobsFile;
            }
        }
    });
});
