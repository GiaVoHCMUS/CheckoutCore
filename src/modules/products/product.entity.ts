import { BaseEntity } from 'src/infrastructure/database/base.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { ProductVariantEntity } from './product-variant.entity';

@Entity('products')
export class ProductEntity extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 255,
  })
  name!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description!: string | null;

  @OneToMany(() => ProductVariantEntity, (variant) => variant.product)
  variants!: ProductVariantEntity[];
}
