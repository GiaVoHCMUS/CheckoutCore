import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from './product.entity';
import { ProductVariantEntity } from './product-variant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductEntity, ProductVariantEntity])],
})
export class ProductsModule {}
