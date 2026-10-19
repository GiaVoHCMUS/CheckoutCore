import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderItemEntity } from '../order-item.entity';

export class OrderItemResultDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  variantId!: string;

  @ApiProperty()
  productName!: string;

  @ApiProperty()
  sku!: string;

  @ApiPropertyOptional({ nullable: true })
  size!: string | null;

  @ApiPropertyOptional({ nullable: true })
  color!: string | null;

  @ApiProperty({ example: '199000.00' })
  unitPrice!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty({ example: '398000.00' })
  lineTotal!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  static fromEntity(entity: OrderItemEntity): OrderItemResultDto {
    return {
      id: entity.id,
      variantId: entity.variantId,
      productName: entity.productName,
      sku: entity.sku,
      size: entity.size,
      color: entity.color,
      unitPrice: entity.unitPrice,
      quantity: entity.quantity,
      lineTotal: entity.lineTotal,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
