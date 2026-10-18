import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductEntity } from '../product.entity';
import { ProductVariantResultDto } from './product-variant.result.dto';

export class ProductResultDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty({ type: () => [ProductVariantResultDto] })
  variants!: ProductVariantResultDto[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  static fromEntity(entity: ProductEntity): ProductResultDto {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      variants: (entity.variants ?? []).map((variant) => ProductVariantResultDto.fromEntity(variant)),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
