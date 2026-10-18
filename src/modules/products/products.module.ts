import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from 'src/infrastructure/database/database.module';
import { ProductEntity } from './product.entity';
import { ProductVariantEntity } from './product-variant.entity';
import { ProductController } from './product.controller';
import { ProductVariantController } from './product.variant.controller';
import { ProductRepository } from './product.repository';
import { ProductVariantRepository } from './product.variant.repository';
import { CreateProductUseCase } from './use-cases/create-product.use-case';
import { GetProductUseCase } from './use-cases/get-product.use-case';
import { GetProductVariantsUseCase } from './use-cases/get-product-variants.use-case';
import { CreateProductVariantUseCase } from './use-cases/create-product-variant.use-case';
import { UpdateProductVariantStockUseCase } from './use-cases/update-product-variant-stock.use-case';

@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([ProductEntity, ProductVariantEntity])],
  controllers: [ProductController, ProductVariantController],
  providers: [
    ProductRepository,
    ProductVariantRepository,
    CreateProductUseCase,
    GetProductUseCase,
    GetProductVariantsUseCase,
    CreateProductVariantUseCase,
    UpdateProductVariantStockUseCase,
  ],
})
export class ProductsModule {}
