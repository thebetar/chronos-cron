import { describe, expect, mock, test } from 'bun:test';
import { createLogger } from '../logger';

describe('createLogger', () => {
    test('prefixes log messages with [LOG]', () => {
        const log = mock(() => {});
        const logger = createLogger({
            log,
            info: mock(() => {}),
            warn: mock(() => {}),
            error: mock(() => {}),
        });

        logger.log('hello', 42);

        expect(log).toHaveBeenCalledTimes(1);
        expect(log).toHaveBeenCalledWith('[LOG]', 'hello', 42);
    });

    test('prefixes info messages with [INFO]', () => {
        const info = mock(() => {});
        const logger = createLogger({
            log: mock(() => {}),
            info,
            warn: mock(() => {}),
            error: mock(() => {}),
        });

        logger.info('started');

        expect(info).toHaveBeenCalledWith('[INFO]', 'started');
    });

    test('prefixes warn messages with [WARN]', () => {
        const warn = mock(() => {});
        const logger = createLogger({
            log: mock(() => {}),
            info: mock(() => {}),
            warn,
            error: mock(() => {}),
        });

        logger.warn('slow job');

        expect(warn).toHaveBeenCalledWith('[WARN]', 'slow job');
    });

    test('prefixes error messages with [ERROR]', () => {
        const error = mock(() => {});
        const logger = createLogger({
            log: mock(() => {}),
            info: mock(() => {}),
            warn: mock(() => {}),
            error,
        });

        const err = new Error('boom');
        logger.error('failed', err);

        expect(error).toHaveBeenCalledWith('[ERROR]', 'failed', err);
    });
});
