import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationParams } from '../pagination.types';
import { PAGINATION_DEFAULT_LIMIT, PAGINATION_MAX_LIMIT } from '../pagination.constants';
import { IsInt, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export abstract class BasePaginationQueryDto implements PaginationParams {
  @ApiPropertyOptional({
    example: PAGINATION_DEFAULT_LIMIT,
    default: PAGINATION_DEFAULT_LIMIT,
    minimum: 1,
    maximum: PAGINATION_MAX_LIMIT,
    description: 'Maximum number of items returned per page',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PAGINATION_MAX_LIMIT)
  limit: number = PAGINATION_DEFAULT_LIMIT;
}
