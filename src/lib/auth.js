import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Use a singleton instance of PrismaClient
const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV === 'development') global.prisma = prisma;

// Hash password
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Compare password
export async function comparePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id,
      email: user.email,
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// Verify JWT token
export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Get user from token
export async function getUserFromToken(token) {
  const decoded = verifyToken(token);
  if (!decoded) return null;

  return prisma.user.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true
    }
  });
}

// Middleware to check if user is authenticated
export async function requireAuth(req) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  if (!token) throw new Error('No token provided');

  const user = await getUserFromToken(token);
  if (!user) throw new Error('Invalid token');
  if (!user.isActive) throw new Error('User account is inactive');

  return user;
}

// Middleware to check if user is admin
export async function requireAdmin(req) {
  const user = await requireAuth(req);
  if (user.role !== 'ADMIN') throw new Error('Admin access required');
  return user;
} 