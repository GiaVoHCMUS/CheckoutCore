import { Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiConflictResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CursorPaginationMeta } from 'src/common/pagination/cursor-pagination.meta';
import { CursorPaginationQueryDto } from 'src/common/pagination/dto/cursor-pagination-query.dto';
import { PaginatedResult } from 'src/common/pagination/paginated-result';
import { OrderResultDto } from './dto/order.result.dto';
import { OrderSummaryResultDto } from './dto/order-summary.result.dto';
import { CancelOrderUseCase } from './use-cases/cancel-order.use-case';
import { GetOrderUseCase } from './use-cases/get-order.use-case';
import { GetOrdersUseCase } from './use-cases/get-orders.use-case';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly getOrdersUseCase: GetOrdersUseCase,
    private readonly getOrderUseCase: GetOrderUseCase,
    private readonly cancelOrderUseCase: CancelOrderUseCase,
  ) {}

  @Get()
  @ApiOkResponse({ type: OrderSummaryResultDto, isArray: true })
  getAll(
    @Query() query: CursorPaginationQueryDto,
  ): Promise<PaginatedResult<OrderSummaryResultDto, CursorPaginationMeta>> {
    return this.getOrdersUseCase.execute(query);
  }

  @Get(':id')
  @ApiOkResponse({ type: OrderResultDto })
  @ApiNotFoundResponse()
  getById(@Param('id', ParseUUIDPipe) id: string): Promise<OrderResultDto> {
    return this.getOrderUseCase.execute(id);
  }

  @Post(':id/cancel')
  @ApiOkResponse({ type: OrderResultDto })
  @ApiNotFoundResponse()
  @ApiConflictResponse({ description: 'The order is no longer pending and cannot be cancelled.' })
  cancel(@Param('id', ParseUUIDPipe) id: string): Promise<OrderResultDto> {
    return this.cancelOrderUseCase.execute(id);
  }
}
