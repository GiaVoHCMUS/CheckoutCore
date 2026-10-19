import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from 'src/infrastructure/database/base.repository';
import { Repository } from 'typeorm';
import { OrderItemEntity } from './order-item.entity';

@Injectable()
export class OrderItemRepository extends BaseRepository<OrderItemEntity> {
  constructor(@InjectRepository(OrderItemEntity) repository: Repository<OrderItemEntity>) {
    super(repository);
  }
}
