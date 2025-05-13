import { PrismaClient } from '@prisma/client';
import { getUserFromToken } from '../lib/auth';

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV === 'development') global.prisma = prisma;

export const withAuditLog = (handler, entityType, getEntityId) => {
  return async (request, context) => {
    // Get the action based on the HTTP method
    const getAction = (method) => {
      switch (method) {
        case 'POST':
          return 'CREATE';
        case 'PUT':
        case 'PATCH':
          return 'UPDATE';
        case 'DELETE':
          return 'DELETE';
        default:
          return null;
      }
    };

    // Execute the original handler
    const response = await handler(request, context);

    // Only log if the request was successful and it's a modification operation
    if (response.status >= 200 && response.status < 300) {
      try {
        const action = getAction(request.method);
        
        // Skip logging if it's not a modification operation
        if (!action) {
          return response;
        }

        // Get the token from cookies
        const token = request.cookies.get('token')?.value;
        if (!token) {
          return response;
        }

        // Get user from token
        const user = await getUserFromToken(token);
        if (!user) {
          return response;
        }

        // Get the entity ID from the response body for POST requests
        let entityId;
        if (request.method === 'POST') {
          const responseBody = await response.clone().json();
          entityId = responseBody.review?.movie?.id;
        } else {
          entityId = getEntityId(request, context);
        }

        if (!entityId) {
          console.error('Failed to get entity ID for audit log');
          return response;
        }

        // Create the audit log
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action,
            entityType,
            entityId: String(entityId),
            ipAddress: request.headers.get('x-forwarded-for') || request.ip,
            userAgent: request.headers.get('user-agent'),
          },
        });
      } catch (error) {
        console.error('Failed to create audit log:', error);
        // Don't throw the error to prevent disrupting the main operation
      }
    }

    return response;
  };
}; 