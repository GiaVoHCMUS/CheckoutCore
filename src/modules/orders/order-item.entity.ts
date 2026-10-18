import { BaseEntity } from 'src/infrastructure/database/base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ProductVariantEntity } from '../products/product-variant.entity';
import { OrderEntity } from './order.entity';

@Entity('order_items')
export class OrderItemEntity extends BaseEntity {
  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @ManyToOne(() => OrderEntity, (order) => order.items, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'order_id' })
  order!: OrderEntity;

  @Column({ name: 'variant_id', type: 'uuid' })
  variantId!: string;

  @ManyToOne(() => ProductVariantEntity, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'variant_id' })
  variant!: ProductVariantEntity;

  @Column({ name: 'product_name', type: 'varchar', length: 255 })
  productName!: string;

  @Column({ type: 'varchar', length: 100 })
  sku!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  size!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  color!: string | null;

  @Column({ name: 'unit_price', type: 'numeric', precision: 12, scale: 2 })
  unitPrice!: string;

  @Column({ type: 'integer' })
  quantity!: number;

  @Column({ name: 'line_total', type: 'numeric', precision: 12, scale: 2 })
  lineTotal!: string;
}
