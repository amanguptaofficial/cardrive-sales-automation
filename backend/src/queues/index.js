import { Queue } from 'bullmq';
import { redis } from '../config/redis.js';

const queueOptions = redis ? { connection: redis } : {};

export const scoreQueue = redis ? new Queue('score', queueOptions) : null;
export const respondQueue = redis ? new Queue('respond', queueOptions) : null;
export const dripQueue = redis ? new Queue('drip', queueOptions) : null;
export const escalationQueue = redis ? new Queue('escalation', queueOptions) : null;
