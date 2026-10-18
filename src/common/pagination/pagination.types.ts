export enum PaginationSortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export interface PaginationParams {
  limit: number;
}

export interface OffsetPaginationParams extends PaginationParams {
  page: number;
}

export interface CursorPaginationParams extends PaginationParams {
  cursor?: string;
}

export type PaginationSortField<E> = Extract<keyof E, string>;

export interface PaginationOrder<E> {
  sortField: PaginationSortField<E>;
  sortDirection?: PaginationSortDirection;
}

export type CursorSortValue = string | number;

export interface CursorPayload {
  sortField: string;
  sortDirection: PaginationSortDirection;
  sortValue: CursorSortValue;
  id: string;
}
