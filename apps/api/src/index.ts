import { createApp } from './app';
import { config } from './config';
import { logger } from './logger';
import { pool } from './db';

const server = createApp().listen(config.port, () => logger.info(`Helpdesk API listening on :${config.port}`));

const shutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down`);
  server.close(() => pool.end().then(() => process.exit(0)));
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
