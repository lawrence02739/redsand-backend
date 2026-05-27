import { z } from 'zod';

export const createPropertySchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().positive('Price must be a positive number'),
  city: z.string().min(2, 'City is required'),
  address: z.string().min(5, 'Address is required'),
  propertyType: z.enum(['Apartment', 'House', 'Villa', 'Condo']),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  areaSqft: z.number().positive('Area must be positive'),
  images: z.array(z.string().url('Invalid image URL')).optional(),
});

export const updatePropertySchema = createPropertySchema.partial();

export const propertyQuerySchema = z.object({
  city: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  propertyType: z.enum(['Apartment', 'House', 'Villa', 'Condo']).optional(),
  bedrooms: z.coerce.number().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  sortBy: z.enum(['price', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
