import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductVariantResultDto } from '../dto/product-variant.result.dto';
import { ProductRepository } from '../product.repository';
import { ProductVariantRepository } from '../product.variant.repository';

@Injectable()
export class GetProductVariantsUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly productVariantRepository: ProductVariantRepository,
  ) {}

  async execute(productId: string): Promise<ProductVariantResultDto[]> {
    const product = await this.productRepository.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const variants = await this.productVariantRepository.findByProductId(productId);
    return variants.map((variant) => ProductVariantResultDto.fromEntity(variant));
  }
}
