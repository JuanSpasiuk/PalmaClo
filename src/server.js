import { createServer } from 'node:http';
import app from './app.js';
import { env } from './config/env.js';
import { pool, verifyDatabaseConnection } from './config/database.js';

app.set('trust proxy', env.trustProxy);

const server = createServer(app);

async function start() {
  try {
    await verifyDatabaseConnection();
    server.listen(env.port, () => {
      console.info(JSON.stringify({ level: 'info', event: 'server_started', port: env.port, environment: env.nodeEnv }));
    });
  } catch (error) {
    console.error(JSON.stringify({ level: 'fatal', event: 'startup_failed', code: error.code, message: error.message }));
    await pool.end().catch(() => {});
    process.exitCode = 1;
  }
}

async function shutdown(signal) {
  console.info(JSON.stringify({ level: 'info', event: 'shutdown_started', signal }));
  server.close(async (error) => {
    await pool.end().catch((closeError) => {
      console.error(JSON.stringify({ level: 'error', event: 'database_pool_close_failed', code: closeError.code }));
    });
    if (error) {
      console.error(JSON.stringify({ level: 'error', event: 'server_close_failed', message: error.message }));
      process.exitCode = 1;
    }
  });
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

await start();
