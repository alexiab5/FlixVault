import { parentPort } from 'worker_threads';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Thresholds for suspicious activity (within 3 seconds)
const THRESHOLDS = {
  CREATE: { count: 2, timeWindow: 3 * 1000 }, // 2 creates in 3 seconds
  UPDATE: { count: 2, timeWindow: 3 * 1000 }, // 2 updates in 3 seconds
  DELETE: { count: 2, timeWindow: 3 * 1000 }, // 2 deletes in 3 seconds
};

async function checkSuspiciousActivity() {
  try {
    const now = new Date();
    
    // Get all users who have performed actions in the last 3 seconds
    const recentUsers = await prisma.auditLog.groupBy({
      by: ['userId'],
      where: {
        createdAt: {
          gte: new Date(now.getTime() - 3 * 1000)
        }
      }
    });

    for (const { userId } of recentUsers) {
      // Get all actions for this user in the last 3 seconds
      const userActions = await prisma.auditLog.findMany({
        where: {
          userId,
          createdAt: {
            gte: new Date(now.getTime() - 3 * 1000)
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      // Group actions by type
      const actionCounts = userActions.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {});

      // Check for suspicious patterns
      const suspiciousActions = [];
      
      for (const [action, threshold] of Object.entries(THRESHOLDS)) {
        if (actionCounts[action] >= threshold.count) {
          suspiciousActions.push({
            action,
            count: actionCounts[action],
            threshold: threshold.count,
            timeWindow: '3 seconds'
          });
        }
      }

      // If suspicious activity is detected, add or update the monitored user
      if (suspiciousActions.length > 0) {
        const reason = `Suspicious activity detected: ${suspiciousActions
          .map(a => `${a.count} ${a.action} operations in ${a.timeWindow}`)
          .join(', ')}`;

        await prisma.monitoredUser.upsert({
          where: { userId },
          update: {
            reason,
            suspiciousActions,
            updatedAt: now
          },
          create: {
            userId,
            reason,
            suspiciousActions
          }
        });

        // Notify the main thread about the suspicious activity
        parentPort.postMessage({
          type: 'SUSPICIOUS_ACTIVITY',
          data: {
            userId,
            reason,
            suspiciousActions
          }
        });
      }
    }
  } catch (error) {
    console.error('Error in monitoring worker:', error);
    parentPort.postMessage({
      type: 'ERROR',
      error: error.message
    });
  }
}

// Start monitoring
console.log('Monitoring worker started');
checkSuspiciousActivity();

// Run monitoring every 3 seconds
setInterval(checkSuspiciousActivity, 3000);

// Handle messages from the main thread
parentPort.on('message', (message) => {
  if (message.type === 'STOP') {
    process.exit(0);
  }
}); 