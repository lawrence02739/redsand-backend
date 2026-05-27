export interface IApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
}

export class ApiResponse {
  static success<T>(data: T, message: string = 'Success'): IApiResponse<T> {
    return {
      success: true,
      message,
      data,
    };
  }

  static error(message: string = 'Error', errors: any[] = []): IApiResponse {
    return {
      success: false,
      message,
      errors,
    };
  }
}
