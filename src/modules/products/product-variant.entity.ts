import { BaseEntity } from 'src/infrastructure/database/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { OrderItemEntity } from '../orders/order-item.entity';
import { ProductEntity } from './product.entity';

@Entity('product_variants')
export class ProductVariantEntity extends BaseEntity {
  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @ManyToOne(() => ProductEntity, (product) => product.variants, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'product_id' })
  product!: ProductEntity;

  @OneToMany(() => OrderItemEntity, (item) => item.variant)
  orderItems!: OrderItemEntity[];

  @Column({ type: 'varchar', length: 100, unique: true })
  sku!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  size!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  color!: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  price!: string;

  @Column({ type: 'integer', default: 0 })
  stock!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
