import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateUserResultDto } from './dto/create-user.result.dto';
import { UserEntity } from './user.entity';
import { GetUserResultDto } from './dto/get-user.result.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserResultDto } from './dto/update-user.result.dto';
import { CacheService } from 'src/infrastructure/cache/cache.service';
import { PaginatedResult } from 'src/common/pagination/paginated-result';
import { OffsetPaginationMeta } from 'src/common/pagination/offset-pagination.meta';
import { CursorPaginationParams, OffsetPaginationParams } from 'src/common/pagination/pagination.types';
import { CursorPaginationMeta } from 'src/common/pagination/cursor-pagination.meta';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly cacheService: CacheService,
  ) {}

  async create(dto: CreateUserDto): Promise<CreateUserResultDto> {
    const existingUser = await this.userRepository.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const user = new UserEntity();

    user.name = dto.name;
    user.email = dto.email;

    const savedUser = await this.userRepository.save(user);

    await this.cacheService.invalidate('users:list:*');

    return CreateUserResultDto.fromEntity(savedUser);
  }

  async getById(id: string): Promise<GetUserResultDto> {
    // const user = await this.getUserOrThrow(id);

    // return GetUserResultDto.fromEntity(user);

    return this.cacheService.getOrSet(
      this.userCacheKey(id),
      async () => {
        Logger.debug(`Loading user ${id} from database`);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const user = await this.getUserOrThrow(id);

        return GetUserResultDto.fromEntity(user);
      },
      { ttl: 300 },
    );
  }

  // async getById(id: string): Promise<GetUserResultDto> {
  //   return this.cacheService.getOrSetSingleFligt(
  //     this.userCacheKey(id),
  //     async () => {
  //       Logger.debug(`Loading user ${id} from database`);

  //       // await new Promise((resolve) => setTimeout(resolve, 1000));

  //       const user = await this.getUserOrThrow(id);

  //       return GetUserResultDto.fromEntity(user);
  //     },
  //     {
  //       ttl: 300,
  //       lockTtl: 5,
  //       lockWaitMs: 3000,
  //       lockPollMs: 50,
  //     },
  //   );
  // }

  // async getAll(): Promise<GetUserResultDto[]> {
  //   const users = await this.userRepository.findMany();

  //   return users.map((user) => GetUserResultDto.fromEntity(user));
  // }

  // async getAll(): Promise<GetUserResultDto[]> {
  //   return this.cacheService.getOrSet(
  //     'users:list:all',
  //     async () => {
  //       Logger.debug('Loading users list from database');
  //       const users = await this.userRepository.findMany();

  //       return users.map((user) => GetUserResultDto.fromEntity(user));
  //     },
  //     { ttl: 300 },
  //   );
  // }

  // // Offset Pagination
  // async getAll(pagination: OffsetPaginationParams): Promise<PaginatedResult<GetUserResultDto, OffsetPaginationMeta>> {
  //   const cacheKey = `users:list:offset:${pagination.page}:${pagination.limit}`;
  //   Logger.debug('Hoi cham');
  //   return this.cacheService.getOrSet(
  //     cacheKey,
  //     async () => {
  //       Logger.debug(`Loading users page ${pagination.page} from database`);

  //       const result = await this.userRepository.findManyByOffset(pagination);

  //       return new PaginatedResult(
  //         result.items.map((user) => GetUserResultDto.fromEntity(user)),
  //         result.meta,
  //       );
  //     },
  //     { ttl: 300 },
  //   );
  // }

  // Cursor Pagination
  async getAll(pagination: CursorPaginationParams): Promise<PaginatedResult<GetUserResultDto, CursorPaginationMeta>> {
    const cursor = pagination.cursor ?? 'first';

    const cacheKey = `users:list:cursor:${pagination.limit}:${cursor}`;

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        Logger.debug('Loading users cursor page from database');

        const result = await this.userRepository.findManyByCursor(pagination);

        return new PaginatedResult(
          result.items.map((user) => GetUserResultDto.fromEntity(user)),
          result.meta,
        );
      },
      {
        ttl: 300,
      },
    );
  }

  async update(id: string, dto: UpdateUserDto): Promise<UpdateUserResultDto> {
    const user = await this.getUserOrThrow(id);

    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(dto.email);

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    if (dto.name) {
      user.name = dto.name;
    }

    if (dto.email) {
      user.email = dto.email;
    }

    const updatedUser = await this.userRepository.save(user);

    await Promise.all([this.cacheService.delete(`users:by-id:${id}`), this.cacheService.invalidate('users:list:*')]);

    return UpdateUserResultDto.fromEntity(updatedUser);
  }

  async delete(id: string): Promise<void> {
    await this.getUserOrThrow(id);

    await Promise.all([this.cacheService.delete(`users:by-id:${id}`), this.cacheService.invalidate('users:list:*')]);

    await this.userRepository.deleteById(id);
  }

  private async getUserOrThrow(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private userCacheKey(id: string): string {
    return `users:by-id:${id}`;
  }
}
