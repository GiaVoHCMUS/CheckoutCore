import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductVariantResultDto } from '../dto/product-variant.result.dto';
import { UpdateProductVariantStockDto } from '../dto/update-product-variant-stock.dto';
import { ProductVariantRepository } from '../product.variant.repository';

@Injectable()
export class UpdateProductVariantStockUseCase {
  constructor(private readonly productVariantRepository: ProductVariantRepository) {}

  async execute(id: string, dto: UpdateProductVariantStockDto): Promise<ProductVariantResultDto> {
    const variant = await this.productVariantRepository.findById(id);

    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }

    variant.stock = dto.stock;
    const savedVariant = await this.productVariantRepository.save(variant);

    return ProductVariantResultDto.fromEntity(savedVariant);
  }
}
