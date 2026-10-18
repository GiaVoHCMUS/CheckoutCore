import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductVariantEntity } from '../product-variant.entity';

export class ProductVariantResultDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty()
  sku!: string;

  @ApiPropertyOptional({ nullable: true })
  size!: string | null;

  @ApiPropertyOptional({ nullable: true })
  color!: string | null;

  @ApiProperty({ example: '199000.00', description: 'Chuỗi để giữ chính xác numeric(12,2).' })
  price!: string;

  @ApiProperty()
  stock!: number;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  static fromEntity(entity: ProductVariantEntity): ProductVariantResultDto {
    return {
      id: entity.id,
      productId: entity.productId,
      sku: entity.sku,
      size: entity.size,
      color: entity.color,
      price: entity.price,
      stock: entity.stock,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
