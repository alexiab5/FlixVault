import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromToken } from '../../../../../lib/auth';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    console.log('=== SEED DEBUG ===');
    // Get user from token
    const token = request.cookies.get('token')?.value;
    console.log('Token:', token);
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    console.log('Current user:', user);
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Create a test monitored user
    const testUser = await prisma.user.findFirst({
      where: {
        role: 'USER'
      }
    });
    console.log('Test user found:', testUser);

    if (!testUser) {
      return NextResponse.json({ error: 'No test user found' }, { status: 404 });
    }

    // Check if user is already monitored
    const existingMonitored = await prisma.monitoredUser.findUnique({
      where: {
        userId: testUser.id
      }
    });
    console.log('Existing monitored user:', existingMonitored);

    if (existingMonitored) {
      return NextResponse.json({ error: 'User is already being monitored' }, { status: 400 });
    }

    const monitoredUser = await prisma.monitoredUser.create({
      data: {
        userId: testUser.id,
        reason: 'Test monitoring entry',
        suspiciousActions: {
          actions: [
            {
              action: 'Multiple failed login attempts',
              count: 5,
              timeWindow: '5 minutes',
              threshold: 3
            }
          ]
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            lastLoginAt: true
          }
        }
      }
    });
    console.log('Created monitored user:', monitoredUser);
    console.log('===================');

    return NextResponse.json({ monitoredUser });
  } catch (error) {
    console.error('Error creating test monitored user:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 });
  }
} 