import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductVariantDto } from '../dto/create-product-variant.dto';
import { ProductVariantResultDto } from '../dto/product-variant.result.dto';
import { ProductRepository } from '../product.repository';
import { ProductVariantEntity } from '../product-variant.entity';
import { ProductVariantRepository } from '../product.variant.repository';

@Injectable()
export class CreateProductVariantUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly productVariantRepository: ProductVariantRepository,
  ) {}

  async execute(productId: string, dto: CreateProductVariantDto): Promise<ProductVariantResultDto> {
    const product = await this.productRepository.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (await this.productVariantRepository.findBySku(dto.sku)) {
      throw new ConflictException(`SKU "${dto.sku}" already exists`);
    }

    const variant = new ProductVariantEntity();
    variant.productId = product.id;
    variant.sku = dto.sku;
    variant.size = dto.size ?? null;
    variant.color = dto.color ?? null;
    variant.price = String(dto.price);
    variant.stock = dto.stock ?? 0;
    variant.isActive = dto.isActive ?? true;

    const savedVariant = await this.productVariantRepository.save(variant);
    return ProductVariantResultDto.fromEntity(savedVariant);
  }
}
