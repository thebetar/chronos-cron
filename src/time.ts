import { type Job, JobType } from "./jobs";


export function checkJobTime(job: Job, date = new Date()) {
    try {
        switch (job.type) {
            case JobType.MINUTELY:
                return checkMinutely(job, date);
            case JobType.HOURLY:
                return checkHourly(job, date);
            case JobType.DAILY:
                return checkDaily(job, date);
            case JobType.WEEKLY:
                return checkWeekly(job, date);
            case JobType.MONTHLY:
                return checkMonthly(job, date);
            case JobType.YEARLY:
                return checkYearly(job, date);
            default:
                return false;
        }
    } catch (error) {
        console.error('Error checking job time:', error);
        return false;
    }
}

function pad(n: number) {
    return n.toString().padStart(2, '0');
}

enum TimeFormat {
    MINUTES = 'minutes',
    HOURS = "hours"
}

function normaliseJobTime(time: string, format: TimeFormat = TimeFormat.HOURS) {
    const paddedTime = time.split(':').map(n => pad(parseInt(n))).join(':');

    if (format === TimeFormat.MINUTES) {
        if (time.length === 2) {
            return `${paddedTime}:00`;
        } else if (time.length === 5) {
            return paddedTime;
        } else {
            throw new Error('Invalid job time format');
        }
    }

    if (format === TimeFormat.HOURS) {
        if (time.length === 2) {
            return `${paddedTime}:00:00`;
        } else if (time.length === 5) {
            return `${paddedTime}:00`;
        } else if (time.length === 8) {
            return paddedTime;
        } else {
            throw new Error('Invalid job time format');
        }
    }

    throw new Error('Invalid job time format');
}

function getTimeString(date: Date, format: TimeFormat = TimeFormat.HOURS) {
    if (format === TimeFormat.MINUTES) {
        return `${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    } else if (format === TimeFormat.HOURS) {
        return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    }
    throw new Error('Invalid time format');
}

function getJobDatetime(jobAt: string): string {
    const jobDay = jobAt.split(' ')[0];

    let jobTime = jobAt.split(' ')[1];
    jobTime = normaliseJobTime(jobTime, TimeFormat.HOURS);

    return `${jobDay} ${jobTime}`;
}


function checkMinutely(job: Job, date: Date) {
    const currentSeconds = date.getSeconds();
    const jobTime = parseInt(job.at);

    return currentSeconds === jobTime;
}

function checkHourly(job: Job, date: Date) {
    const currentTime = getTimeString(date, TimeFormat.MINUTES);

    const jobTime = normaliseJobTime(job.at, TimeFormat.MINUTES);

    return currentTime === jobTime;
}

function checkDaily(job: Job, date: Date) {
    const currentTime = getTimeString(date, TimeFormat.HOURS);

    const jobTime = normaliseJobTime(job.at, TimeFormat.HOURS);

    return currentTime === jobTime;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function checkWeekly(job: Job, date: Date) {
    const jobAt = job.at;

    const jobDay = jobAt.split(' ')[0];

    let jobTime = jobAt.split(' ')[1];
    jobTime = normaliseJobTime(jobTime, TimeFormat.HOURS);

    const currentDay = DAYS_OF_WEEK.includes(jobDay) ? DAYS_OF_WEEK[date.getDay()] : date.getDay();
    const currentTime = `${currentDay} ${getTimeString(date, TimeFormat.HOURS)}`;

    return currentTime === jobAt;
}

function checkMonthly(job: Job, date: Date) {
    const currentTime = getTimeString(date, TimeFormat.HOURS);

    const jobAt = getJobDatetime(job.at);

    return currentTime === jobAt;
}

function checkYearly(job: Job, date: Date) {
    const currentTime = `${date.getDate()}-${date.getMonth() + 1} ${getTimeString(date, TimeFormat.HOURS)}`;

    const jobAt = getJobDatetime(job.at);

    return currentTime === jobAt;
}
