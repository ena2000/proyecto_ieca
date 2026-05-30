declare module 'helmet' {
  import { RequestHandler } from 'express';
  function helmet(options?: unknown): RequestHandler;
  export = helmet;
}

declare module 'express-rate-limit' {
  import { RequestHandler } from 'express';

  interface RateLimitOptions {
    windowMs?: number;
    max?: number;
    standardHeaders?: boolean;
    legacyHeaders?: boolean;
    handler?: RequestHandler;
    skipSuccessfulRequests?: boolean;
  }

  function rateLimit(options: RateLimitOptions): RequestHandler;
  export = rateLimit;
}
