import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderResultDto } from '../dto/order.result.dto';
import { OrderRepository } from '../order.repository';

@Injectable()
export class GetOrderUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(id: string): Promise<OrderResultDto> {
    const order = await this.orderRepository.findByIdWithItems(id);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return OrderResultDto.fromEntity(order);
  }
}
