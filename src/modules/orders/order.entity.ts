import { BaseEntity } from 'src/infrastructure/database/base.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { OrderItemEntity } from './order-item.entity';
import { OrderStatus } from './enums/order-status.enum';

@Entity('orders')
export class OrderEntity extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 30,
    default: OrderStatus.PENDING,
  })
  status!: OrderStatus;

  // PostgreSQL numeric is represented as a string by pg to preserve monetary precision.
  @Column({
    name: 'total_amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
  })
  totalAmount!: string;

  @Column({
    name: 'cancelled_at',
    type: 'timestamptz',
    nullable: true,
  })
  cancelledAt!: Date | null;

  @OneToMany(() => OrderItemEntity, (item) => item.order)
  items!: OrderItemEntity[];
}
