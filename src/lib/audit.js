import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createAuditLog({
  userId,
  action,
  entityType,
  entityId,
  details = null,
  ipAddress = null,
  userAgent = null
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
        userAgent
      }
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw the error to prevent disrupting the main operation
    return null;
  }
}

// Helper functions for common audit log actions
export const auditLog = {
  create: (userId, entityType, entityId, details = null, req = null) => 
    createAuditLog({
      userId,
      action: 'CREATE',
      entityType,
      entityId,
      details,
      ipAddress: req?.headers?.get('x-forwarded-for') || null,
      userAgent: req?.headers?.get('user-agent') || null
    }),

  read: (userId, entityType, entityId, details = null, req = null) =>
    createAuditLog({
      userId,
      action: 'READ',
      entityType,
      entityId,
      details,
      ipAddress: req?.headers?.get('x-forwarded-for') || null,
      userAgent: req?.headers?.get('user-agent') || null
    }),

  update: (userId, entityType, entityId, details = null, req = null) =>
    createAuditLog({
      userId,
      action: 'UPDATE',
      entityType,
      entityId,
      details,
      ipAddress: req?.headers?.get('x-forwarded-for') || null,
      userAgent: req?.headers?.get('user-agent') || null
    }),

  delete: (userId, entityType, entityId, details = null, req = null) =>
    createAuditLog({
      userId,
      action: 'DELETE',
      entityType,
      entityId,
      details,
      ipAddress: req?.headers?.get('x-forwarded-for') || null,
      userAgent: req?.headers?.get('user-agent') || null
    })
}; 