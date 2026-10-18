import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { CreateProductVariantDto } from './create-product-variant.dto';

export class CreateProductDto {
  @ApiProperty({ example: 'Áo thun basic' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ example: 'Áo thun cotton form regular.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: () => [CreateProductVariantDto], minItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  variants!: CreateProductVariantDto[];
}
