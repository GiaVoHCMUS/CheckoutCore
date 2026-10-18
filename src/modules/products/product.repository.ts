import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from 'src/infrastructure/database/base.repository';
import { EntityManager, Repository } from 'typeorm';
import { ProductEntity } from './product.entity';

@Injectable()
export class ProductRepository extends BaseRepository<ProductEntity> {
  constructor(@InjectRepository(ProductEntity) repository: Repository<ProductEntity>) {
    super(repository);
  }

  findByIdWithVariants(id: string, manager?: EntityManager): Promise<ProductEntity | null> {
    return this.getRepository(manager).findOne({
      where: { id },
      relations: { variants: true },
    });
  }
}
