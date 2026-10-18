import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class UpdateProductVariantStockDto {
  @ApiProperty({ example: 25, description: 'Tồn kho mới của variant.' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock!: number;
}
