import { getJobs, type Job } from './jobs';
import { checkJobTime } from './time';
import { getLogger } from './logger';

const logger = getLogger();

async function main() {
    logger.log('Starting jobs checker');

    const jobs = await getJobs();
    logger.log(`Found ${jobs.length} jobs in the configuration file`);

    let lastSecond = -1;

    while (true) {
        const second = new Date().getSeconds();

        if (second !== lastSecond) {
            lastSecond = second;
            await checkJobs();
        }

        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

async function checkJobs() {
    const jobs = await getJobs();

    // Get all jobs that match the current time
    const jobsToRun = jobs.filter((job) => checkJobTime(job));

    if (jobsToRun.length === 0) {
        return;
    }

    logger.log(`Running ${jobsToRun.length} jobs`);

    jobsToRun.forEach((job: Job) => {
        Bun.spawn(['sh', '-c', job.command], {
            stdout: 'inherit',
            stderr: 'inherit',
        });
    });
}

main();
