import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateProductVariantDto {
  @ApiProperty({ example: 'TSHIRT-BLACK-M' })
  @IsString()
  @MaxLength(100)
  sku!: string;

  @ApiPropertyOptional({ example: 'M', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  size?: string;

  @ApiPropertyOptional({ example: 'Black', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @ApiProperty({ example: 199000, description: 'Giá tại thời điểm tạo variant.' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ example: 10, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
