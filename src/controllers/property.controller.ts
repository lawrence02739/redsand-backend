import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { asyncHandler, AppError } from '../utils/AppError';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  createPropertySchema,
  updatePropertySchema,
  propertyQuerySchema,
  myPropertyQuerySchema
} from '../validators/property.validator';

const prisma = new PrismaClient();

const formatProperty = (property: any) => ({
  ...property,
  images: property.images?.map((img: any) => img.imageUrl) || [],
});

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
    properties: properties.map(formatProperty),
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

  res.json(ApiResponse.success(formatProperty(property), 'Property retrieved successfully'));
});

export const getMyProperties = asyncHandler(async (req: AuthRequest, res: Response) => {
  const ownerId = req.user!.userId;
  const query = myPropertyQuerySchema.parse(req.query);
  const { page, limit, search, minPrice, maxPrice, propertyType, bedrooms, bathrooms, areaSqft } = query;

  const skip = (page - 1) * limit;

  const where: Prisma.PropertyWhereInput = {
    ownerId,
    ...(propertyType && { propertyType: { equals: propertyType } }),
    ...(bedrooms !== undefined && { bedrooms: { gte: bedrooms } }),
    ...(bathrooms !== undefined && { bathrooms: { gte: bathrooms } }),
    ...(areaSqft !== undefined && { areaSqft: { gte: areaSqft } }),
    ...((minPrice || maxPrice) && {
      price: {
        ...(minPrice && { gte: minPrice }),
        ...(maxPrice && { lte: maxPrice }),
      },
    }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      include: { images: true, ownerName: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.property.count({ where }),
  ]);

  res.json(ApiResponse.success({
    properties: properties.map(formatProperty),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }, 'My properties retrieved successfully'));
});

export const createProperty = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validatedData = createPropertySchema.parse(req.body);
  const ownerId = req.user!.userId;

  const { images, ...propertyData } = validatedData;

  let imageUrls: string[] = [];
  if (images && images.length > 0) {
    imageUrls = images;
  }

  const property = await prisma.property.create({
    data: {
      ...propertyData,
      ownerId,
      images: {
        create: imageUrls.map((url) => ({ imageUrl: url })),
      },
    },
    include: { images: true },
  });

  res.status(201).json(ApiResponse.success(formatProperty(property), 'Property created successfully'));
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

  let imageUrls: string[] | undefined;
  if (images !== undefined) {
    imageUrls = images;
  }

  const updatedProperty = await prisma.property.update({
    where: { id: id as string },
    data: {
      ...propertyData,
      ...(imageUrls && {
        images: {
          deleteMany: {},
          create: imageUrls.map((url) => ({ imageUrl: url })),
        },
      }),
    },
    include: { images: true },
  });

  res.json(ApiResponse.success(formatProperty(updatedProperty), 'Property updated successfully'));
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

export const uploadImages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    throw new AppError('No images uploaded', 400);
  }

  // Construct static URLs for the uploaded files for demo
  const count = files.length;
  const staticUrl = 'https://tse3.mm.bing.net/th/id/OIP.Rd52_nQg_kZopACpmNvAYQHaEK?rs=1&pid=ImgDetMain&o=7&rm=3';
  const responseData = Array(count).fill(staticUrl);

  res.status(200).json(ApiResponse.success(responseData, 'Images uploaded successfully'));
});

