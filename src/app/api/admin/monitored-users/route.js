import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromToken } from '../../../../lib/auth';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    console.log('=== MONITORED USERS API DEBUG ===');
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

    // Get monitored users with their details
    console.log('Fetching monitored users...');
    const monitoredUsers = await prisma.monitoredUser.findMany({
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
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    console.log('Found monitored users:', monitoredUsers);
    console.log('=============================');

    return NextResponse.json({ monitoredUsers });
  } catch (error) {
    console.error('Error fetching monitored users:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 });
  }
} 