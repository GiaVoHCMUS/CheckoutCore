import { ApiProperty } from '@nestjs/swagger';
import { CursorPaginationParams } from './pagination.types';

export class CursorPaginationMeta {
  @ApiProperty({ example: 10 })
  readonly limit: number;

  @ApiProperty({ example: true })
  readonly hasNext: boolean;

  @ApiProperty({
    type: String,
    nullable: true,
  })
  readonly nextCursor: string | null;

  private constructor(limit: number, hasNext: boolean, nextCursor: string | null) {
    this.limit = limit;
    this.hasNext = hasNext;
    this.nextCursor = nextCursor;
  }

  static create(pagination: CursorPaginationParams, hasNext: boolean, nextCursor: string | null): CursorPaginationMeta {
    return new CursorPaginationMeta(pagination.limit, hasNext, nextCursor);
  }
}
