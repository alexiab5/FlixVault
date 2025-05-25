import { Worker } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let worker = null;

export function startMonitoringService() {
  if (worker) {
    console.log('Monitoring service is already running');
    return;
  }

  console.log('Starting monitoring service...');
  
  // Create a new worker thread with the correct path resolution
  const workerPath = path.resolve(__dirname, '../workers/monitoringWorker.js');
  worker = new Worker(workerPath);

  // Handle messages from the worker
  worker.on('message', (message) => {
    switch (message.type) {
      case 'SUSPICIOUS_ACTIVITY':
        console.log('Suspicious activity detected:', message.data);
        break;
      case 'ERROR':
        console.error('Monitoring worker error:', message.error);
        break;
    }
  });

  // Handle worker errors
  worker.on('error', (error) => {
    console.error('Monitoring worker error:', error);
    stopMonitoringService();
  });

  // Handle worker exit
  worker.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Monitoring worker stopped with exit code ${code}`);
    }
    worker = null;
  });
}

export function stopMonitoringService() {
  if (worker) {
    worker.postMessage({ type: 'STOP' });
    worker = null;
  }
} 