import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { TransactionService } from 'src/infrastructure/database/transaction.service';
import { ProductVariantRepository } from '../../products/product.variant.repository';
import { OrderResultDto } from '../dto/order.result.dto';
import { OrderStatus } from '../enums/order-status.enum';
import { OrderRepository } from '../order.repository';

@Injectable()
export class CancelOrderUseCase {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly orderRepository: OrderRepository,
    private readonly productVariantRepository: ProductVariantRepository,
  ) {}

  async execute(id: string): Promise<OrderResultDto> {
    return this.transactionService.run(async (manager) => {
      const order = await this.orderRepository.findByIdWithItems(id, manager);

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (order.status !== OrderStatus.PENDING) {
        throw new ConflictException('Only pending orders can be cancelled');
      }

      const wasCancelled = await this.orderRepository.cancelIfPending(id, manager);

      if (!wasCancelled) {
        throw new ConflictException('Order was already cancelled or updated');
      }

      for (const item of [...order.items].sort((left, right) => left.variantId.localeCompare(right.variantId))) {
        await this.productVariantRepository.incrementStock(item.variantId, item.quantity, manager);
      }

      const cancelledOrder = await this.orderRepository.findByIdWithItems(id, manager);

      if (!cancelledOrder) {
        throw new NotFoundException('Order not found');
      }

      return OrderResultDto.fromEntity(cancelledOrder);
    });
  }
}
