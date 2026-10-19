import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { TransactionService } from 'src/infrastructure/database/transaction.service';
import { ProductVariantRepository } from '../../products/product.variant.repository';
import { CheckoutDto } from '../dto/checkout.dto';
import { OrderResultDto } from '../dto/order.result.dto';
import { OrderStatus } from '../enums/order-status.enum';
import { OrderItemEntity } from '../order-item.entity';
import { OrderItemRepository } from '../order-item.repository';
import { OrderEntity } from '../order.entity';
import { OrderRepository } from '../order.repository';
import { centsToDecimal, decimalToCents } from '../utils/money.util';

@Injectable()
export class CheckoutUseCase {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly productVariantRepository: ProductVariantRepository,
    private readonly orderRepository: OrderRepository,
    private readonly orderItemRepository: OrderItemRepository,
  ) {}

  async execute(dto: CheckoutDto): Promise<OrderResultDto> {
    const requestedQuantities = this.mergeRequestedQuantities(dto);
    const variantIds = [...requestedQuantities.keys()].sort();

    return this.transactionService.run(async (manager) => {
      const variants = await this.productVariantRepository.findByIdsWithProduct(variantIds, manager);

      if (variants.length !== variantIds.length) {
        throw new NotFoundException('One or more product variants were not found');
      }

      const variantsById = new Map(variants.map((variant) => [variant.id, variant]));
      let totalCents = 0n;

      for (const variantId of variantIds) {
        const variant = variantsById.get(variantId);
        const quantity = requestedQuantities.get(variantId);

        if (!variant || !quantity) {
          throw new NotFoundException('One or more product variants were not found');
        }

        const stockWasDecremented = await this.productVariantRepository.decrementStock(variant.id, quantity, manager);

        if (!stockWasDecremented) {
          throw new ConflictException(`Insufficient stock for SKU "${variant.sku}"`);
        }

        totalCents += decimalToCents(variant.price) * BigInt(quantity);
      }

      const order = new OrderEntity();
      order.status = OrderStatus.PENDING;
      order.totalAmount = centsToDecimal(totalCents);
      order.cancelledAt = null;

      const savedOrder = await this.orderRepository.save(order, manager);
      const savedItems: OrderItemEntity[] = [];

      for (const variantId of variantIds) {
        const variant = variantsById.get(variantId)!;
        const quantity = requestedQuantities.get(variantId)!;
        const unitPrice = centsToDecimal(decimalToCents(variant.price));

        const item = new OrderItemEntity();
        item.orderId = savedOrder.id;
        item.variantId = variant.id;
        item.productName = variant.product.name;
        item.sku = variant.sku;
        item.size = variant.size;
        item.color = variant.color;
        item.unitPrice = unitPrice;
        item.quantity = quantity;
        item.lineTotal = centsToDecimal(decimalToCents(variant.price) * BigInt(quantity));

        savedItems.push(await this.orderItemRepository.save(item, manager));
      }

      savedOrder.items = savedItems;
      return OrderResultDto.fromEntity(savedOrder);
    });
  }

  private mergeRequestedQuantities(dto: CheckoutDto): Map<string, number> {
    const quantities = new Map<string, number>();

    for (const item of dto.items) {
      quantities.set(item.variantId, (quantities.get(item.variantId) ?? 0) + item.quantity);
    }

    return quantities;
  }
}
