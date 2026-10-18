import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BasePaginationQueryDto } from './base-pagination-query.dto';
import { PAGINATION_DEFAULT_PAGE } from '../pagination.constants';
import { OffsetPaginationParams } from '../pagination.types';

export class OffsetPaginationQueryDto extends BasePaginationQueryDto implements OffsetPaginationParams {
  @ApiPropertyOptional({
    example: PAGINATION_DEFAULT_PAGE,
    default: PAGINATION_DEFAULT_PAGE,
    minimum: 1,
    description: 'Page number, starting from 1',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = PAGINATION_DEFAULT_PAGE;
}
