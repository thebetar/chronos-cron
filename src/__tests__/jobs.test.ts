import { describe, expect, test } from 'bun:test';
import { getJobs, setJobRunFlags, JobType } from '../jobs';

describe('getJobs', () => {
    test('loads jobs from data/jobs.json with hash and runFlag', async () => {
        const jobs = await getJobs();

        expect(jobs.length).toBeGreaterThan(0);
        expect(jobs[0]).toHaveProperty('type');
        expect(jobs[0]).toHaveProperty('at');
        expect(jobs[0]).toHaveProperty('command');
        expect(jobs[0].hash).toBeString();
        expect(jobs[0].hash.length).toBe(32);
        expect(jobs[0].runFlag).toBe(true);
    });

    test('jobs use valid types and at formats', async () => {
        const jobs = await getJobs();

        for (const job of jobs) {
            // Check if the job type is valid
            expect(Object.values(JobType)).toContain(job.type);

            expect(typeof job.at).toBe('string');
            expect(job.at.length).toBeGreaterThan(0);
            expect(typeof job.command).toBe('string');
            expect(typeof job.enabled).toBe('boolean');

            // Create a hash of the job and check if it is a string
            expect(job.hash).toBeString();
            expect(typeof job.runFlag).toBe('boolean');
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
});

describe('setJobRunFlags', () => {
    test('sets runFlag false for jobs that ran and true for the rest', async () => {
        const jobs = await getJobs();
        const [first, ...rest] = jobs;

        await setJobRunFlags([first]);

        expect(first.runFlag).toBe(false);
        for (const job of rest) {
            expect(job.runFlag).toBe(true);
        }
    });

    test('resets all runFlags to true when no jobs ran', async () => {
        const jobs = await getJobs();

        await setJobRunFlags([jobs[0]]);
        expect(jobs[0].runFlag).toBe(false);

        await setJobRunFlags([]);

        for (const job of jobs) {
            expect(job.runFlag).toBe(true);
        }
    });
});
