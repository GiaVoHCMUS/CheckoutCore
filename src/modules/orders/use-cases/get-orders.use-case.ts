import { Injectable } from '@nestjs/common';
import { CursorPaginationMeta } from 'src/common/pagination/cursor-pagination.meta';
import { PaginatedResult } from 'src/common/pagination/paginated-result';
import { CursorPaginationParams } from 'src/common/pagination/pagination.types';
import { OrderSummaryResultDto } from '../dto/order-summary.result.dto';
import { OrderRepository } from '../order.repository';

@Injectable()
export class GetOrdersUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(
    pagination: CursorPaginationParams,
  ): Promise<PaginatedResult<OrderSummaryResultDto, CursorPaginationMeta>> {
    const result = await this.orderRepository.findManyByCursor(pagination);

    return new PaginatedResult(
      result.items.map((order) => OrderSummaryResultDto.fromEntity(order)),
      result.meta,
    );
  }
}
