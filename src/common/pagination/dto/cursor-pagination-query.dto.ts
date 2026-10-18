import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BasePaginationQueryDto } from './base-pagination-query.dto';
import { PAGINATION_MAX_CURSOR_LENGTH } from '../pagination.constants';
import { CursorPaginationParams } from '../pagination.types';

export class CursorPaginationQueryDto extends BasePaginationQueryDto implements CursorPaginationParams {
  @ApiPropertyOptional({
    description: 'Opaque cursor returned by the previous page',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(PAGINATION_MAX_CURSOR_LENGTH)
  cursor?: string;
}
