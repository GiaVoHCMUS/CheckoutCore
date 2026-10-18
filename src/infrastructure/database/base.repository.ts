import {
  Brackets,
  EntityManager,
  FindManyOptions,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import {
  CursorPaginationParams,
  CursorSortValue,
  OffsetPaginationParams,
  PaginationOrder,
  PaginationSortDirection,
  PaginationSortField,
} from 'src/common/pagination/pagination.types';
import { PaginatedResult } from 'src/common/pagination/paginated-result';
import { OffsetPaginationMeta } from 'src/common/pagination/offset-pagination.meta';
import { CursorPaginationMeta } from 'src/common/pagination/cursor-pagination.meta';
import { CursorCodec } from 'src/common/pagination/cursor-codec.util';
import { BadRequestException } from '@nestjs/common';

export abstract class BaseRepository<E extends BaseEntity & ObjectLiteral> {
  constructor(protected readonly repository: Repository<E>) {}

  protected getRepository(manager?: EntityManager): Repository<E> {
    if (!manager) return this.repository;

    return manager.getRepository(this.repository.target);
  }

  findById(id: string, manager?: EntityManager): Promise<E | null> {
    return this.getRepository(manager).findOne({
      where: { id } as FindOptionsWhere<E>,
    });
  }

  findOne(where: FindOptionsWhere<E>, manager?: EntityManager): Promise<E | null> {
    return this.getRepository(manager).findOne({ where });
  }

  findMany(where?: FindOptionsWhere<E>, manager?: EntityManager): Promise<E[]> {
    return this.getRepository(manager).find({ where });
  }

  findAndCount(options: FindManyOptions<E> = {}, manager?: EntityManager): Promise<[E[], number]> {
    return this.getRepository(manager).findAndCount(options);
  }

  count(where?: FindOptionsWhere<E> | FindOptionsWhere<E>[], manager?: EntityManager): Promise<number> {
    return this.getRepository(manager).count({ where });
  }

  save(entity: E, manager?: EntityManager): Promise<E> {
    return this.getRepository(manager).save(entity);
  }

  async deleteById(id: string, manager?: EntityManager): Promise<void> {
    await this.getRepository(manager).delete(id);
  }

  createQueryBuilder(alias = 'entity', manager?: EntityManager): SelectQueryBuilder<E> {
    return this.getRepository(manager).createQueryBuilder(alias);
  }

  async paginateOffset(
    queryBuilder: SelectQueryBuilder<E>,
    pagination: OffsetPaginationParams,
    order: PaginationOrder<E>,
  ): Promise<PaginatedResult<E, OffsetPaginationMeta>> {
    const { sortField, sortDirection } = this.resolvePaginationOrder(order);

    this.applyStableOrder(queryBuilder, sortField, sortDirection);

    const skip = (pagination.page - 1) * pagination.limit;
    const [items, totalItems] = await queryBuilder.skip(skip).take(pagination.limit).getManyAndCount();

    const meta = OffsetPaginationMeta.create(pagination, totalItems);

    return new PaginatedResult(items, meta);
  }

  async paginateCursor(
    queryBuilder: SelectQueryBuilder<E>,
    pagination: CursorPaginationParams,
    order: PaginationOrder<E>,
  ): Promise<PaginatedResult<E, CursorPaginationMeta>> {
    const { sortField, sortDirection } = this.resolvePaginationOrder(order);

    if (pagination.cursor) {
      const cursor = CursorCodec.decode(pagination.cursor);
      this.validateCursorOrder(cursor.sortField, cursor.sortDirection, sortField, sortDirection);
      this.applyCursorCondition(queryBuilder, sortField, sortDirection, cursor.sortValue, cursor.id);
    }

    this.applyStableOrder(queryBuilder, sortField, sortDirection);

    const results = await queryBuilder.take(pagination.limit + 1).getMany();
    const hasNext = results.length > pagination.limit;
    const items = hasNext ? results.slice(0, pagination.limit) : results;

    const nextCursor = this.createNextCursor(items, hasNext, sortField, sortDirection);

    const meta = CursorPaginationMeta.create(pagination, hasNext, nextCursor);

    return new PaginatedResult(items, meta);
  }

  private resolvePaginationOrder(order: PaginationOrder<E>): {
    sortField: PaginationSortField<E>;
    sortDirection: PaginationSortDirection;
  } {
    const sortField = order.sortField;
    const sortDirection = order.sortDirection ?? PaginationSortDirection.DESC;

    const column = this.repository.metadata.findColumnWithPropertyPath(sortField);

    if (!column) {
      throw new Error(`Pagination sort field "${sortField}" is not a database column`);
    }

    return {
      sortField,
      sortDirection,
    };
  }

  private applyStableOrder(
    queryBuilder: SelectQueryBuilder<E>,
    sortField: PaginationSortField<E>,
    sortDirection: PaginationSortDirection,
  ): void {
    const alias = queryBuilder.alias;
    const sortColumn = `${alias}.${sortField}`;

    queryBuilder.orderBy(sortColumn, sortDirection);

    if (sortField !== 'id') {
      queryBuilder.addOrderBy(`${alias}.id`, sortDirection);
    }
  }

  private applyCursorCondition(
    queryBuilder: SelectQueryBuilder<E>,
    sortField: PaginationSortField<E>,
    sortDirection: PaginationSortDirection,
    sortValue: CursorSortValue,
    id: string,
  ): void {
    const alias = queryBuilder.alias;
    const sortColumn = `${alias}.${sortField}`;
    const idColumn = `${alias}.id`;

    const comparisonOperator = sortDirection === PaginationSortDirection.ASC ? '>' : '<';

    if (sortField === 'id') {
      queryBuilder.andWhere(`${idColumn} ${comparisonOperator} :paginationCursorId`, { paginationCursorId: id });

      return;
    }

    queryBuilder.andWhere(
      new Brackets((cursorQueryBuilder) => {
        cursorQueryBuilder
          .where(`${sortColumn} ${comparisonOperator} :paginationCursorValue`, { paginationCursorValue: sortValue })
          .orWhere(
            [`${sortColumn} = :paginationCursorValue`, `${idColumn} ${comparisonOperator} :paginationCursorId`].join(
              ' AND ',
            ),
            {
              paginationCursorValue: sortValue,
              paginationCursorId: id,
            },
          );
      }),
    );
  }

  private createNextCursor(
    items: E[],
    hasNext: boolean,
    sortField: PaginationSortField<E>,
    sortDirection: PaginationSortDirection,
  ): string | null {
    if (!hasNext || items.length === 0) {
      return null;
    }

    const lastItem = items[items.length - 1];

    return CursorCodec.encode({
      sortField,
      sortDirection,
      sortValue: this.serializeCursorValue(lastItem[sortField]),
      id: lastItem.id,
    });
  }

  private serializeCursorValue(value: unknown): CursorSortValue {
    if (value instanceof Date) {
      return value.toISOString();
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'bigint') {
      return value.toString();
    }

    throw new Error('Cursor sort field must contain a non-null string, number, bigint, or Date');
  }

  private validateCursorOrder(
    cursorSortField: string,
    cursorSortDirection: PaginationSortDirection,
    expectedSortField: PaginationSortField<E>,
    expectedSortDirection: PaginationSortDirection,
  ): void {
    if (cursorSortField !== expectedSortField || cursorSortDirection !== expectedSortDirection) {
      throw new BadRequestException('Cursor does not match the current pagination order');
    }
  }
}
