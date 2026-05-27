import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { asyncHandler, AppError } from '../utils/AppError';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  createPropertySchema,
  updatePropertySchema,
  propertyQuerySchema
} from '../validators/property.validator';

const prisma = new PrismaClient();

export const getProperties = asyncHandler(async (req: Request, res: Response) => {
  const query = propertyQuerySchema.parse(req.query);
  const { city, minPrice, maxPrice, propertyType, bedrooms, page, limit, sortBy, sortOrder } = query;

  const skip = (page - 1) * limit;

  const where: Prisma.PropertyWhereInput = {
    ...(city && { city: { contains: city, mode: 'insensitive' } }),
    ...(propertyType && { propertyType: { equals: propertyType } }),
    ...(bedrooms !== undefined && { bedrooms: { gte: bedrooms } }),
    ...((minPrice || maxPrice) && {
      price: {
        ...(minPrice && { gte: minPrice }),
        ...(maxPrice && { lte: maxPrice }),
      },
    }),
  };

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      include: { images: true, ownerName: { select: { id: true, name: true } } },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.property.count({ where }),
  ]);

  res.json(ApiResponse.success({
    properties,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }, 'Properties retrieved successfully'));
});

export const getProperty = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const property = await prisma.property.findUnique({
    where: { id: id as string },
    include: { images: true, ownerName: { select: { id: true, name: true, email: true } } },
  });

  if (!property) {
    throw new AppError('Property not found', 404);
  }

  res.json(ApiResponse.success(property, 'Property retrieved successfully'));
});

export const getMyProperties = asyncHandler(async (req: AuthRequest, res: Response) => {
  const ownerId = req.user!.userId;
  const properties = await prisma.property.findMany({
    where: { ownerId },
    include: { images: true, ownerName: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });

  res.json(ApiResponse.success(properties, 'My properties retrieved successfully'));
});

export const createProperty = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validatedData = createPropertySchema.parse(req.body);
  const ownerId = req.user!.userId;

  const { images, ...propertyData } = validatedData;

  const property = await prisma.property.create({
    data: {
      ...propertyData,
      ownerId,
      images: {
        create: images?.map((url) => ({ imageUrl: url })) || [],
      },
    },
    include: { images: true },
  });

  res.status(201).json(ApiResponse.success(property, 'Property created successfully'));
});

export const updateProperty = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const property = await prisma.property.findUnique({
    where: { id: id as string },
  });

  if (!property) throw new AppError('Property not found', 404);
  if (property.ownerId !== req.user!.userId) {
    throw new AppError('You do not have permission to update this property', 403);
  }

  const validatedData = updatePropertySchema.parse(req.body);
  const { images, ...propertyData } = validatedData;

  const updatedProperty = await prisma.property.update({
    where: { id: id as string },
    data: {
      ...propertyData,
      ...(images && {
        images: {
          deleteMany: {},
          create: images.map((url) => ({ imageUrl: url })),
        },
      }),
    },
    include: { images: true },
  });

  res.json(ApiResponse.success(updatedProperty, 'Property updated successfully'));
});

export const deleteProperty = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const property = await prisma.property.findUnique({
    where: { id: id as string },
  });

  if (!property) throw new AppError('Property not found', 404);
  if (property.ownerId !== req.user!.userId) {
    throw new AppError('You do not have permission to delete this property', 403);
  }

  await prisma.property.delete({
    where: { id: id as string },
  });

  res.json(ApiResponse.success(null, 'Property deleted successfully'));
});
