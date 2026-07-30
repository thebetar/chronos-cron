import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getJobs, JobType, resetJobsCache } from '../jobs';
import { getLogger } from '../logger';

const FIXTURE_JOBS = [
    {
        type: JobType.MINUTELY,
        at: '30',
        command: 'echo minutely',
        enabled: true,
    },
    {
        type: JobType.MINUTELY,
        at: '45',
        command: 'echo disabled',
        enabled: false,
    },
    {
        type: JobType.HOURLY,
        at: '30',
        command: 'echo hourly',
        enabled: true,
    },
    {
        type: JobType.DAILY,
        at: '16:00',
        command: 'echo daily',
        enabled: true,
    },
    {
        type: JobType.WEEKLY,
        at: 'Monday 16:00',
        command: 'echo weekly',
        enabled: true,
    },
    {
        type: JobType.MONTHLY,
        at: '1 15:00',
        command: 'echo monthly',
        enabled: true,
    },
    {
        type: JobType.YEARLY,
        at: '1-1 16:00',
        command: 'echo yearly',
        enabled: true,
    },
];

describe('getJobs', () => {
    let errorSpy: ReturnType<typeof spyOn>;
    let tempDir: string;
    let jobsFilePath: string;
    let previousJobsFile: string | undefined;

    beforeEach(async () => {
        errorSpy = spyOn(getLogger(), 'error').mockImplementation(() => {});
        resetJobsCache();

        tempDir = await mkdtemp(join(tmpdir(), 'chronos-jobs-'));
        jobsFilePath = join(tempDir, 'jobs.json');
        await writeFile(jobsFilePath, JSON.stringify(FIXTURE_JOBS));

        previousJobsFile = process.env.JOBS_FILE;
        process.env.JOBS_FILE = jobsFilePath;
    });

    afterEach(async () => {
        errorSpy.mockRestore();
        resetJobsCache();

        if (previousJobsFile === undefined) {
            delete process.env.JOBS_FILE;
        } else {
            process.env.JOBS_FILE = previousJobsFile;
        }

        await rm(tempDir, { recursive: true, force: true });
    });

    test('loads enabled jobs with hash', async () => {
        const jobs = await getJobs();

        expect(jobs).toHaveLength(6);
        expect(jobs[0]).toMatchObject({
            type: JobType.MINUTELY,
            at: '30',
            command: 'echo minutely',
            enabled: true,
        });
        expect(jobs[0].hash).toBeString();
        expect(jobs[0].hash.length).toBe(32);
    });

    test('only returns enabled jobs', async () => {
        const jobs = await getJobs();

        expect(jobs.every((job) => job.enabled)).toBe(true);
        expect(jobs.some((job) => job.command === 'echo disabled')).toBe(false);
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

        expect(monthly).toHaveLength(1);
        expect(monthly[0].at).toMatch(/^\d+ \d{2}:\d{2}$/);
        expect(monthly[0]).not.toHaveProperty('day');
    });

    test('returns the same cached jobs when the file has not changed', async () => {
        const first = await getJobs();
        const second = await getJobs();

        expect(second).toBe(first);
    });

    test('reloads jobs when the file contents change', async () => {
        const first = await getJobs();

        const updatedJobs = [
            {
                type: JobType.DAILY,
                at: '09:00',
                command: 'echo updated',
                enabled: true,
            },
        ];
        await writeFile(jobsFilePath, JSON.stringify(updatedJobs));

        const second = await getJobs();

        expect(second).not.toBe(first);
        expect(second).toHaveLength(1);
        expect(second[0].command).toBe('echo updated');
    });

    test('each job gets a unique hash', async () => {
        const jobs = await getJobs();
        const hashes = jobs.map((job) => job.hash);

        expect(new Set(hashes).size).toBe(hashes.length);
    });

    test('logs error and rethrows when jobs file cannot be read', async () => {
        process.env.JOBS_FILE = join(tempDir, 'missing.json');

        await expect(getJobs()).rejects.toThrow();
        expect(errorSpy).toHaveBeenCalledWith(
            'Error reading jobs file:',
            expect.any(Error),
        );
    });
});
