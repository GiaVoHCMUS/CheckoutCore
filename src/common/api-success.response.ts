export interface ApiSuccessResponse<T, M = never> {
  success: true;
  statusCode: number;
  requestId: string;
  data: T;
  meta?: M;
  timestamp: string;
}
