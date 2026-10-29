import { spawn } from 'node:child_process';
import dotenv from 'dotenv';
dotenv.config();

const api = spawn(process.execPath, ['src/server.js'], { stdio: 'inherit', env: process.env });
let worker = null;
let stopping = false;
let workerRestartDelay = 1000;
let restartTimer;

function shutdown(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = exitCode;
  clearTimeout(restartTimer);
  if (api.exitCode === null) api.kill('SIGTERM');
  if (worker && worker.exitCode === null) worker.kill('SIGTERM');
  const forceStop = setTimeout(() => {
    if (api.exitCode === null) api.kill('SIGKILL');
    if (worker && worker.exitCode === null) worker.kill('SIGKILL');
  }, 20000);
  forceStop.unref();
}

process.once('SIGINT', () => shutdown(0));
process.once('SIGTERM', () => shutdown(0));
api.once('error', (error) => { console.error('Could not start the API:', error.message); shutdown(1); });
api.once('exit', (code, signal) => {
  if (!stopping) {
    console.error(`API exited (${signal || code}); stopping the service.`);
    shutdown(code || 1);
  }
});

async function waitForApi() {
  const port = Number(process.env.PORT || 4000);
  const deadline = Date.now() + 120000;
  while (!stopping && Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error('API did not become healthy in time.');
}

function startWorker() {
  if (stopping) return;
  worker = spawn(process.execPath, ['src/workers/email.worker.js'], { stdio: 'inherit', env: process.env });
  worker.once('error', (error) => console.error('Could not start the email worker:', error.message));
  worker.once('exit', (code, signal) => {
    if (stopping) return;
    console.error(`Email worker exited (${signal || code}); restarting in ${workerRestartDelay / 1000}s.`);
    restartTimer = setTimeout(startWorker, workerRestartDelay);
    workerRestartDelay = Math.min(workerRestartDelay * 2, 30000);
  });
}

try {
  await waitForApi();
  console.log('API is healthy; starting the email worker.');
  startWorker();
} catch (error) {
  console.error(error.message);
  shutdown(1);
}
