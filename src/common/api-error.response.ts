export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  requestId: string;
  error: string;
  message: string | string[];
  path: string;
  method: string;
  timestamp: string;
}
