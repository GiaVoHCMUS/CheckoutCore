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
}
