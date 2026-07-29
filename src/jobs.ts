import path from 'path';
import crypto from 'crypto';

export enum JobType {
    MINUTELY = 'minutely',
    HOURLY = 'hourly',
    DAILY = 'daily',
    WEEKLY = 'weekly',
    MONTHLY = 'monthly',
    YEARLY = 'yearly',
}

export interface Job {
    type: JobType;
    at: string;
    command: string;
    enabled: boolean;
    hash: string;
}

let jobsCacheFileHash = '';
let jobsCache: Job[] = [];

export async function getJobs() {
    try {
        const jobsPath = process.env.JOBS_FILE || path.join(import.meta.dirname, '..', 'data', 'jobs.json');
        const jobsFile = await Bun.file(jobsPath).text();
        const jobsFileHash = crypto.createHash('md5').update(jobsFile).digest('hex');

        // Check if the jobs file has changed
        if (jobsFileHash === jobsCacheFileHash) {
            return jobsCache;
        }

        const jobs = JSON.parse(jobsFile) as Job[];

        // Save the jobs file hash and the jobs cache
        jobsCacheFileHash = jobsFileHash;
        jobsCache = jobs
            .filter(job => job.enabled)
            .map((job) => ({
                ...job,
                hash: crypto.createHash('md5').update(JSON.stringify(job)).digest('hex'),
            })) as Job[];

        return jobsCache;
    } catch (error) {
        console.error('Error reading jobs file:', error);
        throw error;
    }
}