import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductResultDto } from '../dto/product.result.dto';
import { ProductRepository } from '../product.repository';

@Injectable()
export class GetProductUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(id: string): Promise<ProductResultDto> {
    const product = await this.productRepository.findByIdWithVariants(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return ProductResultDto.fromEntity(product);
  }
}
