# Introduction

Chronos-cron is a simple CRON job runner written in Typescript.

The name `chronos-cron` came from the Greek god of time `Chronos` and since this repository is about scheduled jobs based on time I found it fitting.

Chronos aims to provide a simple way to run cron jobs using a json file as a format, it provides the possibility to run jobs:

- Minutely: every minute at given seconds, for example 30 is every minute at 30 seconds so 16:00:30, 16:01:30, 16:02:30
- Hourly: every hour at given minute (and second), for example 15 is every hour at minute 15 so 16:15:00, 17:15:00, 18:15:00 or for example 20:30 is every hour at xx:20:30
- Daily: every day at given hour (and minute, and second), for example 16 is every day at 16:00:00, 16:00 is every day at 16:00:00, or 16:00:30 is every day at 16:00:30
- Weekly: every week on a given day at hour:minute, for example `Monday 16:00` or `1 16:00` (Sunday=0 … Saturday=6)
- Monthly: every month on a given day at hour:minute, for example `1 15:00` is the 1st of each month at 15:00
- Yearly: every year on a given day-month at hour:minute, for example `1-1 16:00` is January 1st at 16:00

The repository uses a basic self created way to describe jobs that can be found in `data/jobs.example/json`, the project can be started using `bun run start`