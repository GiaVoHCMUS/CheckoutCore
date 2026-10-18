import { ApiProperty } from '@nestjs/swagger';
import { OffsetPaginationParams } from './pagination.types';

export class OffsetPaginationMeta {
  @ApiProperty({ example: 1 })
  readonly currentPage: number;

  @ApiProperty({ example: 10 })
  readonly limit: number;

  @ApiProperty({ example: 45 })
  readonly totalItems: number;

  @ApiProperty({ example: 5 })
  readonly totalPages: number;

  private constructor(currentPage: number, limit: number, totalItems: number, totalPages: number) {
    this.currentPage = currentPage;
    this.limit = limit;
    this.totalItems = totalItems;
    this.totalPages = totalPages;
  }

  static create(pagination: OffsetPaginationParams, totalItems: number): OffsetPaginationMeta {
    return new OffsetPaginationMeta(
      pagination.page,
      pagination.limit,
      totalItems,
      Math.ceil(totalItems / pagination.limit),
    );
  }
}
