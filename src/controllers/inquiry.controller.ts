import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, AppError } from '../utils/AppError';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../middleware/auth.middleware';
import { createInquirySchema } from '../validators/inquiry.validator';

const prisma = new PrismaClient();

export const createInquiry = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validatedData = createInquirySchema.parse(req.body);
  const senderId = req.user!.userId;

  const property = await prisma.property.findUnique({
    where: { id: validatedData.propertyId },
    select: { ownerId: true },
  });

  if (!property) throw new AppError('Property not found', 404);
  if (property.ownerId === senderId) {
    throw new AppError('You cannot inquire on your own property', 400);
  }

  const inquiry = await prisma.inquiry.create({
    data: {
      propertyId: validatedData.propertyId,
      senderId,
      receiverId: property.ownerId,
      message: validatedData.message,
    },
    include: {
      property: { select: { title: true } },
    },
  });

  res.status(201).json(ApiResponse.success(inquiry, 'Inquiry sent successfully'));
});

export const getReceivedInquiries = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;

  const inquiries = await prisma.inquiry.findMany({
    where: { receiverId: userId },
    include: {
      sender: { select: { id: true, name: true, email: true } },
      property: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(ApiResponse.success(inquiries));
});

export const getSentInquiries = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;

  const inquiries = await prisma.inquiry.findMany({
    where: { senderId: userId },
    include: {
      receiver: { select: { id: true, name: true, email: true } },
      property: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(ApiResponse.success(inquiries));
});
