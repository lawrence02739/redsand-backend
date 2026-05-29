import { z } from 'zod';

export const createInquirySchema = z.object({
  propertyId: z.string().uuid('Invalid property ID'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export const inquiryQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  type: z.enum(['sent', 'received', 'all']).default('all'),
});
