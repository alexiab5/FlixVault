import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const auditLogService = {
  async createLog({
    userId,
    action,
    entityType,
    entityId,
    details,
    ipAddress,
    userAgent,
  }) {
    try {
      return await prisma.auditLog.create({
        data: {
          userId,
          action,
          entityType,
          entityId,
          details,
          ipAddress,
          userAgent,
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // We don't throw the error to prevent disrupting the main operation
      return null;
    }
  },

  async getLogsByUser(userId, limit = 50) {
    return await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  async getLogsByEntity(entityType, entityId, limit = 50) {
    return await prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },
}; 