import fs from 'node:fs';
import { Console } from 'node:console';

export type Logger = {
    log: (...args: unknown[]) => void;
    info: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
};

type ConsoleLike = Pick<Console, 'log' | 'info' | 'warn' | 'error'>;

let logger: Logger | null = null;

export function createLogger(console: ConsoleLike): Logger {
    return {
        log: (...args: unknown[]) => console.log('[LOG]', ...args),
        info: (...args: unknown[]) => console.info('[INFO]', ...args),
        warn: (...args: unknown[]) => console.warn('[WARN]', ...args),
        error: (...args: unknown[]) => console.error('[ERROR]', ...args),
    };
}

export function getLogger(): Logger {
    if (logger) {
        return logger;
    }

    const logStream = fs.createWriteStream('cron.log', { flags: 'a' });
    const console = new Console({
        stdout: logStream,
        stderr: logStream,
    });

    logger = createLogger(console);

    return logger;
}
