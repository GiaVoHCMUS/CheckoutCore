import { Body, Controller, Post } from '@nestjs/common';
import { ApiConflictResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiTags } from '@nestjs/swagger';
import { CheckoutDto } from './dto/checkout.dto';
import { OrderResultDto } from './dto/order.result.dto';
import { CheckoutUseCase } from './use-cases/checkout.use-case';

@ApiTags('Checkout')
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutUseCase: CheckoutUseCase) {}

  @Post()
  @ApiCreatedResponse({ type: OrderResultDto })
  @ApiNotFoundResponse()
  @ApiConflictResponse({ description: 'A product variant is inactive or has insufficient stock.' })
  checkout(@Body() dto: CheckoutDto): Promise<OrderResultDto> {
    return this.checkoutUseCase.execute(dto);
  }
}
