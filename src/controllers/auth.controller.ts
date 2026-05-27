import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, AppError } from '../utils/AppError';
import { ApiResponse } from '../utils/ApiResponse';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export const register = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = registerSchema.parse(req.body);

  const existingUser = await prisma.user.findUnique({
    where: { email: validatedData.email },
  });

  if (existingUser) {
    throw new AppError('Email already in use', 400);
  }

  const hashedPassword = await bcrypt.hash(validatedData.password, 12);

  const user = await prisma.user.create({
    data: {
      name: validatedData.name,
      email: validatedData.email,
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  res.status(201).json(ApiResponse.success(user, 'User registered successfully'));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: validatedData.email },
  });

  if (!user || !(await bcrypt.compare(validatedData.password, user.password))) {
    throw new AppError('Invalid email or password', 401);
  }

  const accessToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '15m' } as jwt.SignOptions
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET || 'refresh_secret',
    { expiresIn: '7d' } as jwt.SignOptions
  );

  res.json(ApiResponse.success({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    token: accessToken,
    refreshToken,
  }, 'Login successful'));
});

export const refreshUserToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token is required', 400);
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh_secret') as any;
    
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) throw new AppError('User no longer exists', 401);

    const newAccessToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '15m' } as jwt.SignOptions
    );

    res.json(ApiResponse.success({
      token: newAccessToken,
    }, 'Token refreshed successfully'));
  } catch (error) {
    throw new AppError('Invalid or expired refresh token', 401);
  }
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json(ApiResponse.success(user, 'Profile retrieved successfully'));
});
