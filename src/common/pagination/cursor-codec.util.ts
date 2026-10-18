import { BadRequestException } from '@nestjs/common';
import { PAGINATION_MAX_CURSOR_LENGTH } from './pagination.constants';
import { CursorPayload, PaginationSortDirection } from './pagination.types';

export class CursorCodec {
  private constructor() {}

  static encode(payload: CursorPayload): string {
    this.assertValidPayload(payload);

    return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  }

  static decode(cursor: string): CursorPayload {
    try {
      if (!cursor || cursor.length > PAGINATION_MAX_CURSOR_LENGTH) {
        throw new Error('Invalid cursor length');
      }

      const decoded = Buffer.from(cursor, 'base64url').toString('utf8');

      const payload: unknown = JSON.parse(decoded);

      this.assertValidPayload(payload);

      return payload;
    } catch {
      throw new BadRequestException('Invalid cursor');
    }
  }

  private static assertValidPayload(payload: unknown): asserts payload is CursorPayload {
    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
      throw new Error('Cursor payload must be an object');
    }

    const candidate = payload as Partial<CursorPayload>;

    if (typeof candidate.sortField !== 'string' || candidate.sortField.length === 0) {
      throw new Error('Invalid cursor sort field');
    }

    if (
      candidate.sortDirection !== PaginationSortDirection.ASC &&
      candidate.sortDirection !== PaginationSortDirection.DESC
    ) {
      throw new Error('Invalid cursor sort direction');
    }

    const hasValidSortValue =
      typeof candidate.sortValue === 'string' ||
      (typeof candidate.sortValue === 'number' && Number.isFinite(candidate.sortValue));

    if (!hasValidSortValue) {
      throw new Error('Invalid cursor sort value');
    }

    if (typeof candidate.id !== 'string' || candidate.id.length === 0) {
      throw new Error('Invalid cursor entity ID');
    }
  }
}
