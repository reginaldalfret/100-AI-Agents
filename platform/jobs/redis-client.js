import { Redis } from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

class SafeRedisClient {
  constructor() {
    this.isAvailable = false;
    this.client = null;
    this.initAttempted = false;
  }

  getClient() {
    if (!this.initAttempted) {
      this.initAttempted = true;
      try {
        this.client = new Redis(REDIS_URL, {
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          retryStrategy: (times) => {
            if (times > 3) {
              this.isAvailable = false;
              return null; // Stop reconnecting in offline environments
            }
            return Math.min(times * 200, 2000);
          },
          lazyConnect: true
        });

        this.client.connect().then(() => {
          this.isAvailable = true;
        }).catch(() => {
          this.isAvailable = false;
        });

        this.client.on('error', () => {
          this.isAvailable = false;
        });
      } catch {
        this.isAvailable = false;
      }
    }
    return this.client;
  }

  async ping() {
    if (!this.isAvailable || !this.client) return false;
    try {
      const res = await this.client.ping();
      return res === 'PONG';
    } catch {
      return false;
    }
  }
}

export const safeRedis = new SafeRedisClient();
