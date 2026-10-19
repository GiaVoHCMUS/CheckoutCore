import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CursorPaginationMeta } from 'src/common/pagination/cursor-pagination.meta';
import { PaginatedResult } from 'src/common/pagination/paginated-result';
import { CursorPaginationParams, PaginationSortDirection } from 'src/common/pagination/pagination.types';
import { BaseRepository } from 'src/infrastructure/database/base.repository';
import { EntityManager, Repository } from 'typeorm';
import { OrderStatus } from './enums/order-status.enum';
import { OrderEntity } from './order.entity';

@Injectable()
export class OrderRepository extends BaseRepository<OrderEntity> {
  constructor(@InjectRepository(OrderEntity) repository: Repository<OrderEntity>) {
    super(repository);
  }

  findByIdWithItems(id: string, manager?: EntityManager): Promise<OrderEntity | null> {
    return this.getRepository(manager).findOne({
      where: { id },
      relations: { items: true },
      order: { items: { createdAt: 'ASC' } },
    });
  }

  findManyByCursor(pagination: CursorPaginationParams): Promise<PaginatedResult<OrderEntity, CursorPaginationMeta>> {
    return this.paginateCursor(this.createQueryBuilder('order'), pagination, {
      sortField: 'createdAt',
      sortDirection: PaginationSortDirection.DESC,
    });
  }

  async cancelIfPending(id: string, manager: EntityManager): Promise<boolean> {
    const result = await this.getRepository(manager)
      .createQueryBuilder()
      .update(OrderEntity)
      .set({
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
      })
      .where('id = :id', { id })
      .andWhere('status = :status', { status: OrderStatus.PENDING })
      .execute();

    return result.affected === 1;
  }
}
