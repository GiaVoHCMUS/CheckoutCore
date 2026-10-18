import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/infrastructure/database/base.repository';
import { UserEntity } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CursorPaginationParams,
  OffsetPaginationParams,
  PaginationSortDirection,
} from 'src/common/pagination/pagination.types';
import { PaginatedResult } from 'src/common/pagination/paginated-result';
import { OffsetPaginationMeta } from 'src/common/pagination/offset-pagination.meta';
import { CursorPaginationMeta } from 'src/common/pagination/cursor-pagination.meta';

@Injectable()
export class UserRepository extends BaseRepository<UserEntity> {
  constructor(
    @InjectRepository(UserEntity)
    repository: Repository<UserEntity>,
  ) {
    super(repository);
  }

  findByEmail(email: string): Promise<UserEntity | null> {
    return this.findOne({ email });
  }

  findManyByOffset(pagination: OffsetPaginationParams): Promise<PaginatedResult<UserEntity, OffsetPaginationMeta>> {
    const queryBuilder = this.createQueryBuilder('user');

    return this.paginateOffset(queryBuilder, pagination, {
      sortField: 'createdAt',
      sortDirection: PaginationSortDirection.DESC,
    });
  }

  findManyByCursor(pagination: CursorPaginationParams): Promise<PaginatedResult<UserEntity, CursorPaginationMeta>> {
    const queryBuilder = this.createQueryBuilder('user');

    return this.paginateCursor(queryBuilder, pagination, {
      sortField: 'createdAt',
      sortDirection: PaginationSortDirection.DESC,
    });
  }
}
