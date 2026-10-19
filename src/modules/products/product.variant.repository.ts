import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from 'src/infrastructure/database/base.repository';
import { EntityManager, Repository } from 'typeorm';
import { ProductVariantEntity } from './product-variant.entity';

@Injectable()
export class ProductVariantRepository extends BaseRepository<ProductVariantEntity> {
  constructor(@InjectRepository(ProductVariantEntity) repository: Repository<ProductVariantEntity>) {
    super(repository);
  }

  findBySku(sku: string, manager?: EntityManager): Promise<ProductVariantEntity | null> {
    return this.findOne({ sku }, manager);
  }

  findByProductId(productId: string): Promise<ProductVariantEntity[]> {
    return this.findMany({ productId });
  }

  findByIdsWithProduct(ids: string[], manager?: EntityManager): Promise<ProductVariantEntity[]> {
    return this.createQueryBuilder('variant', manager)
      .innerJoinAndSelect('variant.product', 'product')
      .where('variant.id IN (:...ids)', { ids })
      .getMany();
  }

  async decrementStock(id: string, quantity: number, manager: EntityManager): Promise<boolean> {
    const result = await this.getRepository(manager)
      .createQueryBuilder()
      .update(ProductVariantEntity)
      .set({ stock: () => 'stock - :quantity' })
      .where('id = :id', { id })
      .andWhere('is_active = true')
      .andWhere('stock >= :quantity')
      .setParameters({ quantity })
      .execute();

    return result.affected === 1;
  }

  async incrementStock(id: string, quantity: number, manager: EntityManager): Promise<void> {
    await this.getRepository(manager)
      .createQueryBuilder()
      .update(ProductVariantEntity)
      .set({ stock: () => 'stock + :quantity' })
      .where('id = :id', { id })
      .setParameters({ quantity })
      .execute();
  }
}
