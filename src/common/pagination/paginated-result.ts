import { CursorPaginationMeta } from './cursor-pagination.meta';
import { OffsetPaginationMeta } from './offset-pagination.meta';

export type PaginationMeta = OffsetPaginationMeta | CursorPaginationMeta;

export class PaginatedResult<T, M extends PaginationMeta = PaginationMeta> {
  readonly items: T[];
  readonly meta: M;

  constructor(items: T[], meta: M) {
    this.items = items;
    this.meta = meta;
  }
}
