import { Worker } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let worker = null;
let isStarting = false;

export function startMonitoringService() {
  // Prevent multiple simultaneous start attempts
  if (isStarting) {
    console.log('Monitoring service is already starting...');
    return;
  }

  // Prevent multiple instances
  if (worker) {
    console.log('Monitoring service is already running');
    return;
  }

  isStarting = true;
  console.log('Starting monitoring service...');
  
  try {
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
      isStarting = false;
    });
  } catch (error) {
    console.error('Failed to start monitoring service:', error);
    worker = null;
    isStarting = false;
  }
}

export function stopMonitoringService() {
  if (worker) {
    worker.postMessage({ type: 'STOP' });
    worker = null;
  }
  isStarting = false;
} 