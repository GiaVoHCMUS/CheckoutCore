import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from 'src/infrastructure/database/database.module';
import { ProductsModule } from '../products/products.module';
import { CheckoutController } from './checkout.controller';
import { OrderEntity } from './order.entity';
import { OrderItemEntity } from './order-item.entity';
import { OrdersController } from './orders.controller';
import { OrderItemRepository } from './order-item.repository';
import { OrderRepository } from './order.repository';
import { CancelOrderUseCase } from './use-cases/cancel-order.use-case';
import { CheckoutUseCase } from './use-cases/checkout.use-case';
import { GetOrderUseCase } from './use-cases/get-order.use-case';
import { GetOrdersUseCase } from './use-cases/get-orders.use-case';

@Module({
  imports: [DatabaseModule, ProductsModule, TypeOrmModule.forFeature([OrderEntity, OrderItemEntity])],
  controllers: [CheckoutController, OrdersController],
  providers: [
    OrderRepository,
    OrderItemRepository,
    CheckoutUseCase,
    GetOrderUseCase,
    GetOrdersUseCase,
    CancelOrderUseCase,
  ],
})
export class OrdersModule {}
