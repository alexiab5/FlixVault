import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { comparePassword, generateToken } from '../../../../lib/auth';

// Use a singleton instance of PrismaClient
const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV === 'development') global.prisma = prisma;

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    console.log('Login attempt for email:', email);

    // Validate input
    if (!email || !password) {
      console.log('Missing fields:', { email: !!email, password: !!password });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    console.log('Found user:', {
      id: user?.id,
      email: user?.email,
      isActive: user?.isActive,
      hasPassword: !!user?.password
    });

    if (!user) {
      console.log('User not found');
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      console.log('User account is inactive');
      return NextResponse.json(
        { error: 'Account is inactive' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    console.log('Password validation result:', isValidPassword);
    if (!isValidPassword) {
      console.log('Password validation failed');
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Log the login action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'READ',
        entityType: 'User',
        entityId: user.id,
        details: 'User login',
        ipAddress: request.headers.get('x-forwarded-for') || request.ip,
        userAgent: request.headers.get('user-agent'),
      },
    });

    // Generate token
    try {
      const token = generateToken(user);
      console.log('Token generated successfully');

      // Return user data (excluding password) and token
      const responseData = {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      };

      console.log('Login response data:', responseData);
      return NextResponse.json(responseData);
    } catch (tokenError) {
      console.error('Token generation error:', tokenError);
      return NextResponse.json(
        { error: 'Failed to generate authentication token' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
} 