export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface ApiError {
  error: string;
  code: string;
  details?: Record<string, string[]>;
}

export type PaginationQuery = {
  page?: number;
  limit?: number;
  search?: string;
};
