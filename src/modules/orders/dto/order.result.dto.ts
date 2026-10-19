import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '../enums/order-status.enum';
import { OrderEntity } from '../order.entity';
import { OrderItemResultDto } from './order-item.result.dto';

export class OrderResultDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: OrderStatus })
  status!: OrderStatus;

  @ApiProperty({ example: '398000.00' })
  totalAmount!: string;

  @ApiPropertyOptional({ nullable: true })
  cancelledAt!: Date | null;

  @ApiProperty({ type: () => [OrderItemResultDto] })
  items!: OrderItemResultDto[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  static fromEntity(entity: OrderEntity): OrderResultDto {
    return {
      id: entity.id,
      status: entity.status,
      totalAmount: entity.totalAmount,
      cancelledAt: entity.cancelledAt,
      items: (entity.items ?? []).map((item) => OrderItemResultDto.fromEntity(item)),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
