import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { ApiResponse } from '../utils/ApiResponse';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof Error) {
    message = err.message;
  }

  // Handle Prisma or Zod errors specifically if needed
  if (err.name === 'ZodError') {
    statusCode = 400;
    const formattedErrors = (err as any).errors?.map((e: any) => ({
      field: e.path.join('.'),
      message: e.message
    })) || (err as any).issues;
    return res.status(statusCode).json(ApiResponse.error('Validation Error', formattedErrors));
  }

  res.status(statusCode).json(ApiResponse.error(message));
};
