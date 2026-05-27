import { z } from 'zod';

export const createInquirySchema = z.object({
  propertyId: z.string().uuid('Invalid property ID'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});
