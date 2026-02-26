import Redis from 'ioredis';
import { logger } from '../utils/logger.js';
import { env } from './env.js';

let redis = null;

if (env.REDIS_HOST) {
  try {
    const redisConfig = {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      ...(env.REDIS_PASSWORD && { password: env.REDIS_PASSWORD })
    };

    logger.info(`Connecting to Redis at ${redisConfig.host}:${redisConfig.port}`);
    
    redis = new Redis(redisConfig, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.warn('Redis connection failed after 3 retries. Continuing without Redis.');
          return null;
        }
        return Math.min(times * 200, 2000);
      },
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
      connectTimeout: 10000,
      lazyConnect: true
    });

    redis.connect().catch(err => {
      logger.warn('Redis initial connection failed:', err.message);
    });

    redis.on('connect', () => {
      logger.success('Redis Connected');
    });

    redis.on('ready', () => {
      logger.success('Redis Ready');
    });

    redis.on('error', (err) => {
      logger.warn('Redis connection error (continuing without Redis):', err.message);
    });

    redis.on('close', () => {
      logger.warn('Redis connection closed');
    });
  } catch (error) {
    logger.error('Failed to initialize Redis:', error.message);
    redis = null;
  }
} else {
  logger.warn('Redis host not configured. Running without Redis.');
}

export { redis };
