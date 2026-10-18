import { ConflictException, Injectable } from '@nestjs/common';
import { TransactionService } from 'src/infrastructure/database/transaction.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { ProductResultDto } from '../dto/product.result.dto';
import { ProductEntity } from '../product.entity';
import { ProductRepository } from '../product.repository';
import { ProductVariantEntity } from '../product-variant.entity';
import { ProductVariantRepository } from '../product.variant.repository';

@Injectable()
export class CreateProductUseCase {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly productRepository: ProductRepository,
    private readonly productVariantRepository: ProductVariantRepository,
  ) {}

  async execute(dto: CreateProductDto): Promise<ProductResultDto> {
    this.ensureSkusAreUnique(dto.variants.map((variant) => variant.sku));

    return this.transactionService.run(async (manager) => {
      for (const variant of dto.variants) {
        if (await this.productVariantRepository.findBySku(variant.sku, manager)) {
          throw new ConflictException(`SKU "${variant.sku}" already exists`);
        }
      }

      const product = new ProductEntity();
      product.name = dto.name;
      product.description = dto.description ?? null;

      const savedProduct = await this.productRepository.save(product, manager);
      const savedVariants = await Promise.all(
        dto.variants.map((dtoVariant) => {
          const variant = new ProductVariantEntity();
          variant.productId = savedProduct.id;
          variant.sku = dtoVariant.sku;
          variant.size = dtoVariant.size ?? null;
          variant.color = dtoVariant.color ?? null;
          variant.price = String(dtoVariant.price);
          variant.stock = dtoVariant.stock ?? 0;
          variant.isActive = dtoVariant.isActive ?? true;

          return this.productVariantRepository.save(variant, manager);
        }),
      );

      savedProduct.variants = savedVariants;
      return ProductResultDto.fromEntity(savedProduct);
    });
  }

  private ensureSkusAreUnique(skus: string[]): void {
    if (new Set(skus).size !== skus.length) {
      throw new ConflictException('SKU values must be unique within a product');
    }
  }
}
